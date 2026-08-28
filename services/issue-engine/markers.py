"""Bilingual (中文 / English) marker lexicons for heuristic detection.

These drive the zero-token, zero-egress detection floor. They are deliberately
conservative: a missed marker degrades to "ask a human / keep it open", never to
a false closure. Tune from the review-queue reject/merge corpus over time.

Matching is substring-based on a normalized (lowercased, whitespace-collapsed)
message body. Chinese needs no word boundaries; English markers are checked as
substrings too, which is fine for these short fixed phrases.
"""
from __future__ import annotations

import re

# A customer is raising a problem / asking something.
PROBLEM_MARKERS = (
    # zh
    "请问", "怎么", "为什么", "为何", "不能", "不行", "无法", "报错", "错误",
    "失败", "问题", "故障", "卡住", "打不开", "登录不了", "登不上", "求助",
    "帮忙", "帮我", "能不能", "可以吗", "如何", "咋", "怎么办", "支持吗",
    "有没有", "异常", "崩溃", "闪退", "没反应", "收不到", "发不出",
    # en
    "how do", "how to", "how can", "why is", "why does", "can you", "could you",
    "can't", "cannot", "doesn't work", "not working", "isn't working", "error",
    "failed", "failing", "issue", "problem", "broken", "bug", "help", "stuck",
    "unable to", "won't", "crash", "not able to", "any way to",
)

# An agent has proposed a fix / given a substantive answer (ARMS closure, does
# not itself close).
RESOLUTION_MARKERS = (
    # zh
    "已修复", "已处理", "已解决", "修复了", "处理好了", "搞定了", "已上线",
    "已发布", "已部署", "已发您", "已发给您", "试试", "试一下", "再试", "现在可以了",
    "应该可以了", "应该好了", "已经好了", "重新登录", "刷新一下", "清下缓存",
    # en
    "fixed", "resolved", "deployed", "should work now", "should be working",
    "try again", "please try", "give it a try", "it's live", "pushed a fix",
    "rolled out", "let me know if", "this should", "now working",
)

# Customer explicitly acknowledges resolution — the ONLY signal that may lead to
# auto-confirmed closure (per the locked decision).
THANKS_MARKERS = (
    # zh
    "谢谢", "多谢", "感谢", "搞定了", "解决了", "好了", "可以了", "没问题了",
    "成功了", "正常了", "ok了", "好的谢谢", "辛苦了", "麻烦你了",
    # en
    "thanks", "thank you", "thx", "it works now", "works now", "that worked",
    "that fixed it", "solved", "all good", "perfect", "great, that", "appreciate",
)

# Customer signals the problem came back / wasn't actually solved (reopen).
REOPEN_MARKERS = (
    # zh
    "还是不行", "还是不能", "还是报错", "又出现", "又不行", "又报错", "依然",
    "仍然", "没解决", "没好", "不管用", "没用", "更严重", "又来了", "重新出现",
    # en
    "still not", "still broken", "still doesn't", "didn't work", "doesn't help",
    "came back", "again", "not fixed", "worse now", "no luck", "same issue",
)

# Agent is asking the customer for more info (=> awaiting_customer, softer SLA).
AGENT_QUESTION_MARKERS = (
    # zh
    "请提供", "麻烦提供", "麻烦发", "能否提供", "方便发", "截图", "发一下",
    "是哪", "什么时候", "哪个", "确认一下", "麻烦确认", "请问是",
    # en
    "could you provide", "can you send", "please send", "screenshot", "which",
    "when did", "what is the", "can you confirm", "please confirm", "do you have",
)

_WS_RE = re.compile(r"\s+")


def normalize(text: str | None) -> str:
    """Lowercase + collapse whitespace. Cheap and language-agnostic."""
    if not text:
        return ""
    return _WS_RE.sub(" ", text.strip().lower())


def _hit(norm: str, markers: tuple[str, ...]) -> list[str]:
    return [m for m in markers if m in norm]


def scan(text: str | None) -> dict[str, list[str]]:
    """Return every marker category that fired for this message body.

    The detector reads which lists are non-empty; storing the actual matched
    phrases gives the dashboard its explainability ("why flagged?").
    """
    norm = normalize(text)
    if not norm:
        return {}
    out: dict[str, list[str]] = {}
    for name, markers in (
        ("problem", PROBLEM_MARKERS),
        ("resolution", RESOLUTION_MARKERS),
        ("thanks", THANKS_MARKERS),
        ("reopen", REOPEN_MARKERS),
        ("agent_question", AGENT_QUESTION_MARKERS),
    ):
        h = _hit(norm, markers)
        if h:
            out[name] = h
    # A trailing question mark (either script) is a weak problem/question signal.
    if norm.endswith("?") or norm.endswith("？"):
        out.setdefault("question_mark", []).append("?")
    return out
