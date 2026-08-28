---
name: pixdesk-memory
description: PixDesk 客服记忆库。查历史客户问题与当时的解法、以及某个客户的画像（涉及产品/规模/反复出现的问题/关键诉求/敏感点/当前未闭环）。当用户问"这个客户以前遇到过什么/什么情况"、"这类问题以前是怎么解决的"、"X 客户对什么敏感"、"帮我看下 X 客户"时使用。
read_when:
  - 需要某个客户的历史问题、画像、当前未闭环情况
  - 需要复现/参考以前类似问题的解法
  - 用户问某客户的产品、规模、痛点、敏感点
  - 用户问某类技术问题我方以前是怎么处理/答复的
  - 回答客户问题前想先看看历史上是否处理过同类问题
metadata: {"clawdbot":{"emoji":"🧠","requires":{"bins":["python3"]}}}
allowed-tools: Bash(python3:*)
---

# pixdesk-memory：客服记忆库

PixDesk 引擎把 Slack/Discord 上所有客户问题蒸馏成结构化 issue（标题、中文摘要、解法、产品标签、闭环状态），并为每个客户维护了一份画像。这个 skill 让你在飞书里回答前先查这份记忆，做到「复现历史解法」和「记住客户画像」。

## 脚本路径

```
/root/.openclaw/workspace-feishu/skills/pixdesk-memory/query.py
```

## 用法

### 1. 查相似的历史问题 + 当时的解法（复现历史解法）

```bash
# 按问题描述检索（跨所有客户）
python3 /root/.openclaw/workspace-feishu/skills/pixdesk-memory/query.py search -q "sandbox 启动失败 退出码 243"

# 限定某个客户的历史
python3 /root/.openclaw/workspace-feishu/skills/pixdesk-memory/query.py search -q "控制台用量页加载失败" --customer starsling -k 5
```

返回若干条最相似的历史 issue：编号、客户、状态、中文摘要、以及当时的解法/结论。**用它来判断「这个问题我们以前是不是遇到过、怎么解的」,而不是凭空回答。**

### 2. 查某个客户的画像 + 当前未闭环（客户画像记忆）

```bash
python3 /root/.openclaw/workspace-feishu/skills/pixdesk-memory/query.py profile -c "nous"
```

返回该客户的画像（产品/规模/反复出现的问题/关键诉求/敏感点）+ 当前仍未闭环的问题清单。**用户问「X 客户是什么情况」时先查这个。**

### 3. 不确定客户名时，先列出已知客户（消歧）

```bash
python3 /root/.openclaw/workspace-feishu/skills/pixdesk-memory/query.py customers -q nova
```

## 使用建议

- 回答客户技术问题前，先 `search` 一下同类历史问题，参考当时的解法，避免重复踩坑、口径不一致。
- 被问到某个具体客户时，先 `profile` 拿画像，再结合当前未闭环情况回答。
- 检索是「候选 + 相似度排序」，结果可能有噪声——你要自己判断哪条真正相关，再用于回答，不要把不相关的硬塞给用户。
- 加 `--json` 可拿到结构化结果。
