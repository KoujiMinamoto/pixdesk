(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.mxwidgets = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ClientWidgetApi = void 0;
var _events = require("events");
var _PostmessageTransport = require("./transport/PostmessageTransport");
var _WidgetApiDirection = require("./interfaces/WidgetApiDirection");
var _WidgetApiAction = require("./interfaces/WidgetApiAction");
var _Capabilities = require("./interfaces/Capabilities");
var _ApiVersion = require("./interfaces/ApiVersion");
var _WidgetEventCapability = require("./models/WidgetEventCapability");
var _GetOpenIDAction = require("./interfaces/GetOpenIDAction");
var _SimpleObservable = require("./util/SimpleObservable");
var _Symbols = require("./Symbols");
var _UpdateDelayedEventAction = require("./interfaces/UpdateDelayedEventAction");
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == _typeof(value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var methodName = context.method, method = delegate.iterator[methodName]; if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel; var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) keys.push(key); return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }
function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }
function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }
function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function _asyncIterator(iterable) { var method, async, sync, retry = 2; for ("undefined" != typeof Symbol && (async = Symbol.asyncIterator, sync = Symbol.iterator); retry--;) { if (async && null != (method = iterable[async])) return method.call(iterable); if (sync && null != (method = iterable[sync])) return new AsyncFromSyncIterator(method.call(iterable)); async = "@@asyncIterator", sync = "@@iterator"; } throw new TypeError("Object is not async iterable"); }
function AsyncFromSyncIterator(s) { function AsyncFromSyncIteratorContinuation(r) { if (Object(r) !== r) return Promise.reject(new TypeError(r + " is not an object.")); var done = r.done; return Promise.resolve(r.value).then(function (value) { return { value: value, done: done }; }); } return AsyncFromSyncIterator = function AsyncFromSyncIterator(s) { this.s = s, this.n = s.next; }, AsyncFromSyncIterator.prototype = { s: null, n: null, next: function next() { return AsyncFromSyncIteratorContinuation(this.n.apply(this.s, arguments)); }, "return": function _return(value) { var ret = this.s["return"]; return void 0 === ret ? Promise.resolve({ value: value, done: !0 }) : AsyncFromSyncIteratorContinuation(ret.apply(this.s, arguments)); }, "throw": function _throw(value) { var thr = this.s["return"]; return void 0 === thr ? Promise.reject(value) : AsyncFromSyncIteratorContinuation(thr.apply(this.s, arguments)); } }, new AsyncFromSyncIterator(s); } /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             * Copyright 2020 - 2024 The Matrix.org Foundation C.I.C.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             * Licensed under the Apache License, Version 2.0 (the "License");
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             * you may not use this file except in compliance with the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             * You may obtain a copy of the License at
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             *         http://www.apache.org/licenses/LICENSE-2.0
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             * Unless required by applicable law or agreed to in writing, software
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             * distributed under the License is distributed on an "AS IS" BASIS,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             * See the License for the specific language governing permissions and
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             * limitations under the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             */
/**
 * API handler for the client side of widgets. This raises events
 * for each action received as `action:${action}` (eg: "action:screenshot").
 * Default handling can be prevented by using preventDefault() on the
 * raised event. The default handling varies for each action: ones
 * which the SDK can handle safely are acknowledged appropriately and
 * ones which are unhandled (custom or require the client to do something)
 * are rejected with an error.
 *
 * Events which are preventDefault()ed must reply using the transport.
 * The events raised will have a default of an IWidgetApiRequest
 * interface.
 *
 * When the ClientWidgetApi is ready to start sending requests, it will
 * raise a "ready" CustomEvent. After the ready event fires, actions can
 * be sent and the transport will be ready.
 *
 * When the widget has indicated it has loaded, this class raises a
 * "preparing" CustomEvent. The preparing event does not indicate that
 * the widget is ready to receive communications - that is signified by
 * the ready event exclusively.
 *
 * This class only handles one widget at a time.
 */
var ClientWidgetApi = /*#__PURE__*/function (_EventEmitter) {
  _inherits(ClientWidgetApi, _EventEmitter);
  var _super = _createSuper(ClientWidgetApi);
  /**
   * Creates a new client widget API. This will instantiate the transport
   * and start everything. When the iframe is loaded under the widget's
   * conditions, a "ready" event will be raised.
   * @param {Widget} widget The widget to communicate with.
   * @param {HTMLIFrameElement} iframe The iframe the widget is in.
   * @param {WidgetDriver} driver The driver for this widget/client.
   */
  function ClientWidgetApi(widget, iframe, driver) {
    var _this;
    _classCallCheck(this, ClientWidgetApi);
    _this = _super.call(this);
    _this.widget = widget;
    _this.iframe = iframe;
    _this.driver = driver;
    _defineProperty(_assertThisInitialized(_this), "transport", void 0);
    // contentLoadedActionSent is used to check that only one ContentLoaded request is send.
    _defineProperty(_assertThisInitialized(_this), "contentLoadedActionSent", false);
    _defineProperty(_assertThisInitialized(_this), "allowedCapabilities", new Set());
    _defineProperty(_assertThisInitialized(_this), "allowedEvents", []);
    _defineProperty(_assertThisInitialized(_this), "isStopped", false);
    _defineProperty(_assertThisInitialized(_this), "turnServers", null);
    _defineProperty(_assertThisInitialized(_this), "contentLoadedWaitTimer", void 0);
    if (!(iframe !== null && iframe !== void 0 && iframe.contentWindow)) {
      throw new Error("No iframe supplied");
    }
    if (!widget) {
      throw new Error("Invalid widget");
    }
    if (!driver) {
      throw new Error("Invalid driver");
    }
    _this.transport = new _PostmessageTransport.PostmessageTransport(_WidgetApiDirection.WidgetApiDirection.ToWidget, widget.id, iframe.contentWindow, window);
    _this.transport.targetOrigin = widget.origin;
    _this.transport.on("message", _this.handleMessage.bind(_assertThisInitialized(_this)));
    iframe.addEventListener("load", _this.onIframeLoad.bind(_assertThisInitialized(_this)));
    _this.transport.start();
    return _this;
  }
  _createClass(ClientWidgetApi, [{
    key: "hasCapability",
    value: function hasCapability(capability) {
      return this.allowedCapabilities.has(capability);
    }
  }, {
    key: "canUseRoomTimeline",
    value: function canUseRoomTimeline(roomId) {
      return this.hasCapability("org.matrix.msc2762.timeline:".concat(_Symbols.Symbols.AnyRoom)) || this.hasCapability("org.matrix.msc2762.timeline:".concat(roomId));
    }
  }, {
    key: "canSendRoomEvent",
    value: function canSendRoomEvent(eventType) {
      var msgtype = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      return this.allowedEvents.some(function (e) {
        return e.matchesAsRoomEvent(_WidgetEventCapability.EventDirection.Send, eventType, msgtype);
      });
    }
  }, {
    key: "canSendStateEvent",
    value: function canSendStateEvent(eventType, stateKey) {
      return this.allowedEvents.some(function (e) {
        return e.matchesAsStateEvent(_WidgetEventCapability.EventDirection.Send, eventType, stateKey);
      });
    }
  }, {
    key: "canSendToDeviceEvent",
    value: function canSendToDeviceEvent(eventType) {
      return this.allowedEvents.some(function (e) {
        return e.matchesAsToDeviceEvent(_WidgetEventCapability.EventDirection.Send, eventType);
      });
    }
  }, {
    key: "canReceiveRoomEvent",
    value: function canReceiveRoomEvent(eventType) {
      var msgtype = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      return this.allowedEvents.some(function (e) {
        return e.matchesAsRoomEvent(_WidgetEventCapability.EventDirection.Receive, eventType, msgtype);
      });
    }
  }, {
    key: "canReceiveStateEvent",
    value: function canReceiveStateEvent(eventType, stateKey) {
      return this.allowedEvents.some(function (e) {
        return e.matchesAsStateEvent(_WidgetEventCapability.EventDirection.Receive, eventType, stateKey);
      });
    }
  }, {
    key: "canReceiveToDeviceEvent",
    value: function canReceiveToDeviceEvent(eventType) {
      return this.allowedEvents.some(function (e) {
        return e.matchesAsToDeviceEvent(_WidgetEventCapability.EventDirection.Receive, eventType);
      });
    }
  }, {
    key: "canReceiveRoomAccountData",
    value: function canReceiveRoomAccountData(eventType) {
      return this.allowedEvents.some(function (e) {
        return e.matchesAsRoomAccountData(_WidgetEventCapability.EventDirection.Receive, eventType);
      });
    }
  }, {
    key: "stop",
    value: function stop() {
      this.isStopped = true;
      this.transport.stop();
    }
  }, {
    key: "beginCapabilities",
    value: function beginCapabilities() {
      var _this2 = this;
      // widget has loaded - tell all the listeners that
      this.emit("preparing");
      var requestedCaps;
      this.transport.send(_WidgetApiAction.WidgetApiToWidgetAction.Capabilities, {}).then(function (caps) {
        requestedCaps = caps.capabilities;
        return _this2.driver.validateCapabilities(new Set(caps.capabilities));
      }).then(function (allowedCaps) {
        console.log("Widget ".concat(_this2.widget.id, " is allowed capabilities:"), Array.from(allowedCaps));
        _this2.allowedCapabilities = allowedCaps;
        _this2.allowedEvents = _WidgetEventCapability.WidgetEventCapability.findEventCapabilities(allowedCaps);
        _this2.notifyCapabilities(requestedCaps);
        _this2.emit("ready");
      })["catch"](function (e) {
        _this2.emit("error:preparing", e);
      });
    }
  }, {
    key: "notifyCapabilities",
    value: function notifyCapabilities(requested) {
      var _this3 = this;
      this.transport.send(_WidgetApiAction.WidgetApiToWidgetAction.NotifyCapabilities, {
        requested: requested,
        approved: Array.from(this.allowedCapabilities)
      })["catch"](function (e) {
        console.warn("non-fatal error notifying widget of approved capabilities:", e);
      }).then(function () {
        _this3.emit("capabilitiesNotified");
      });
    }
  }, {
    key: "onIframeLoad",
    value: function onIframeLoad(ev) {
      if (this.widget.waitForIframeLoad) {
        // If the widget is set to waitForIframeLoad the capabilities immediatly get setup after load.
        // The client does not wait for the ContentLoaded action.
        this.beginCapabilities();
      } else {
        // Reaching this means, that the Iframe got reloaded/loaded and
        // the clientApi is awaiting the FIRST ContentLoaded action.
        console.log("waitForIframeLoad is false: waiting for widget to send contentLoaded");
        this.contentLoadedWaitTimer = setTimeout(function () {
          console.error("Widget specified waitForIframeLoad=false but timed out waiting for contentLoaded event!");
        }, 10000);
        this.contentLoadedActionSent = false;
      }
    }
  }, {
    key: "handleContentLoadedAction",
    value: function handleContentLoadedAction(action) {
      if (this.contentLoadedWaitTimer !== undefined) {
        clearTimeout(this.contentLoadedWaitTimer);
        this.contentLoadedWaitTimer = undefined;
      }
      if (this.contentLoadedActionSent) {
        throw new Error("Improper sequence: ContentLoaded Action can only be sent once after the widget loaded " + "and should only be used if waitForIframeLoad is false (default=true)");
      }
      if (this.widget.waitForIframeLoad) {
        this.transport.reply(action, {
          error: {
            message: "Improper sequence: not expecting ContentLoaded event if " + "waitForIframeLoad is true (default=true)"
          }
        });
      } else {
        this.transport.reply(action, {});
        this.beginCapabilities();
      }
      this.contentLoadedActionSent = true;
    }
  }, {
    key: "replyVersions",
    value: function replyVersions(request) {
      this.transport.reply(request, {
        supported_versions: _ApiVersion.CurrentApiVersions
      });
    }
  }, {
    key: "handleCapabilitiesRenegotiate",
    value: function handleCapabilitiesRenegotiate(request) {
      var _request$data,
        _this4 = this;
      // acknowledge first
      this.transport.reply(request, {});
      var requested = ((_request$data = request.data) === null || _request$data === void 0 ? void 0 : _request$data.capabilities) || [];
      var newlyRequested = new Set(requested.filter(function (r) {
        return !_this4.hasCapability(r);
      }));
      if (newlyRequested.size === 0) {
        // Nothing to do - notify capabilities
        return this.notifyCapabilities([]);
      }
      this.driver.validateCapabilities(newlyRequested).then(function (allowed) {
        allowed.forEach(function (c) {
          return _this4.allowedCapabilities.add(c);
        });
        var allowedEvents = _WidgetEventCapability.WidgetEventCapability.findEventCapabilities(allowed);
        allowedEvents.forEach(function (c) {
          return _this4.allowedEvents.push(c);
        });
        return _this4.notifyCapabilities(Array.from(newlyRequested));
      });
    }
  }, {
    key: "handleNavigate",
    value: function handleNavigate(request) {
      var _request$data2,
        _request$data3,
        _this5 = this;
      if (!this.hasCapability(_Capabilities.MatrixCapabilities.MSC2931Navigate)) {
        return this.transport.reply(request, {
          error: {
            message: "Missing capability"
          }
        });
      }
      if (!((_request$data2 = request.data) !== null && _request$data2 !== void 0 && _request$data2.uri) || !((_request$data3 = request.data) !== null && _request$data3 !== void 0 && _request$data3.uri.toString().startsWith("https://matrix.to/#"))) {
        return this.transport.reply(request, {
          error: {
            message: "Invalid matrix.to URI"
          }
        });
      }
      var onErr = function onErr(e) {
        console.error("[ClientWidgetApi] Failed to handle navigation: ", e);
        _this5.handleDriverError(e, request, "Error handling navigation");
      };
      try {
        this.driver.navigate(request.data.uri.toString())["catch"](function (e) {
          return onErr(e);
        }).then(function () {
          return _this5.transport.reply(request, {});
        });
      } catch (e) {
        return onErr(e);
      }
    }
  }, {
    key: "handleOIDC",
    value: function handleOIDC(request) {
      var _this6 = this;
      var phase = 1; // 1 = initial request, 2 = after user manual confirmation

      var replyState = function replyState(state, credential) {
        credential = credential || {};
        if (phase > 1) {
          return _this6.transport.send(_WidgetApiAction.WidgetApiToWidgetAction.OpenIDCredentials, _objectSpread({
            state: state,
            original_request_id: request.requestId
          }, credential));
        } else {
          return _this6.transport.reply(request, _objectSpread({
            state: state
          }, credential));
        }
      };
      var replyError = function replyError(msg) {
        console.error("[ClientWidgetApi] Failed to handle OIDC: ", msg);
        if (phase > 1) {
          // We don't have a way to indicate that a random error happened in this flow, so
          // just block the attempt.
          return replyState(_GetOpenIDAction.OpenIDRequestState.Blocked);
        } else {
          return _this6.transport.reply(request, {
            error: {
              message: msg
            }
          });
        }
      };
      var observer = new _SimpleObservable.SimpleObservable(function (update) {
        if (update.state === _GetOpenIDAction.OpenIDRequestState.PendingUserConfirmation && phase > 1) {
          observer.close();
          return replyError("client provided out-of-phase response to OIDC flow");
        }
        if (update.state === _GetOpenIDAction.OpenIDRequestState.PendingUserConfirmation) {
          replyState(update.state);
          phase++;
          return;
        }
        if (update.state === _GetOpenIDAction.OpenIDRequestState.Allowed && !update.token) {
          return replyError("client provided invalid OIDC token for an allowed request");
        }
        if (update.state === _GetOpenIDAction.OpenIDRequestState.Blocked) {
          update.token = undefined; // just in case the client did something weird
        }

        observer.close();
        return replyState(update.state, update.token);
      });
      this.driver.askOpenID(observer);
    }
  }, {
    key: "handleReadRoomAccountData",
    value: function handleReadRoomAccountData(request) {
      var _this7 = this;
      var events = Promise.resolve([]);
      events = this.driver.readRoomAccountData(request.data.type);
      if (!this.canReceiveRoomAccountData(request.data.type)) {
        return this.transport.reply(request, {
          error: {
            message: "Cannot read room account data of this type"
          }
        });
      }
      return events.then(function (evs) {
        _this7.transport.reply(request, {
          events: evs
        });
      });
    }
  }, {
    key: "handleReadEvents",
    value: function handleReadEvents(request) {
      var _this8 = this;
      if (!request.data.type) {
        return this.transport.reply(request, {
          error: {
            message: "Invalid request - missing event type"
          }
        });
      }
      if (request.data.limit !== undefined && (!request.data.limit || request.data.limit < 0)) {
        return this.transport.reply(request, {
          error: {
            message: "Invalid request - limit out of range"
          }
        });
      }
      var askRoomIds = null; // null denotes current room only
      if (request.data.room_ids) {
        askRoomIds = request.data.room_ids;
        if (!Array.isArray(askRoomIds)) {
          askRoomIds = [askRoomIds];
        }
        var _iterator2 = _createForOfIteratorHelper(askRoomIds),
          _step2;
        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var roomId = _step2.value;
            if (!this.canUseRoomTimeline(roomId)) {
              return this.transport.reply(request, {
                error: {
                  message: "Unable to access room timeline: ".concat(roomId)
                }
              });
            }
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }
      }
      var limit = request.data.limit || 0;
      var since = request.data.since;
      var events = Promise.resolve([]);
      if (request.data.state_key !== undefined) {
        var stateKey = request.data.state_key === true ? undefined : request.data.state_key.toString();
        if (!this.canReceiveStateEvent(request.data.type, stateKey !== null && stateKey !== void 0 ? stateKey : null)) {
          return this.transport.reply(request, {
            error: {
              message: "Cannot read state events of this type"
            }
          });
        }
        events = this.driver.readStateEvents(request.data.type, stateKey, limit, askRoomIds);
      } else {
        if (!this.canReceiveRoomEvent(request.data.type, request.data.msgtype)) {
          return this.transport.reply(request, {
            error: {
              message: "Cannot read room events of this type"
            }
          });
        }
        events = this.driver.readRoomEvents(request.data.type, request.data.msgtype, limit, askRoomIds, since);
      }
      return events.then(function (evs) {
        return _this8.transport.reply(request, {
          events: evs
        });
      });
    }
  }, {
    key: "handleSendEvent",
    value: function handleSendEvent(request) {
      var _this9 = this;
      if (!request.data.type) {
        return this.transport.reply(request, {
          error: {
            message: "Invalid request - missing event type"
          }
        });
      }
      if (!!request.data.room_id && !this.canUseRoomTimeline(request.data.room_id)) {
        return this.transport.reply(request, {
          error: {
            message: "Unable to access room timeline: ".concat(request.data.room_id)
          }
        });
      }
      var isDelayedEvent = request.data.delay !== undefined || request.data.parent_delay_id !== undefined;
      if (isDelayedEvent && !this.hasCapability(_Capabilities.MatrixCapabilities.MSC4157SendDelayedEvent)) {
        return this.transport.reply(request, {
          error: {
            message: "Missing capability"
          }
        });
      }
      var sendEventPromise;
      if (request.data.state_key !== undefined) {
        if (!this.canSendStateEvent(request.data.type, request.data.state_key)) {
          return this.transport.reply(request, {
            error: {
              message: "Cannot send state events of this type"
            }
          });
        }
        if (!isDelayedEvent) {
          sendEventPromise = this.driver.sendEvent(request.data.type, request.data.content || {}, request.data.state_key, request.data.room_id);
        } else {
          var _request$data$delay, _request$data$parent_;
          sendEventPromise = this.driver.sendDelayedEvent((_request$data$delay = request.data.delay) !== null && _request$data$delay !== void 0 ? _request$data$delay : null, (_request$data$parent_ = request.data.parent_delay_id) !== null && _request$data$parent_ !== void 0 ? _request$data$parent_ : null, request.data.type, request.data.content || {}, request.data.state_key, request.data.room_id);
        }
      } else {
        var content = request.data.content || {};
        var msgtype = content['msgtype'];
        if (!this.canSendRoomEvent(request.data.type, msgtype)) {
          return this.transport.reply(request, {
            error: {
              message: "Cannot send room events of this type"
            }
          });
        }
        if (!isDelayedEvent) {
          sendEventPromise = this.driver.sendEvent(request.data.type, content, null,
          // not sending a state event
          request.data.room_id);
        } else {
          var _request$data$delay2, _request$data$parent_2;
          sendEventPromise = this.driver.sendDelayedEvent((_request$data$delay2 = request.data.delay) !== null && _request$data$delay2 !== void 0 ? _request$data$delay2 : null, (_request$data$parent_2 = request.data.parent_delay_id) !== null && _request$data$parent_2 !== void 0 ? _request$data$parent_2 : null, request.data.type, content, null,
          // not sending a state event
          request.data.room_id);
        }
      }
      sendEventPromise.then(function (sentEvent) {
        return _this9.transport.reply(request, _objectSpread({
          room_id: sentEvent.roomId
        }, "eventId" in sentEvent ? {
          event_id: sentEvent.eventId
        } : {
          delay_id: sentEvent.delayId
        }));
      })["catch"](function (e) {
        console.error("error sending event: ", e);
        _this9.handleDriverError(e, request, "Error sending event");
      });
    }
  }, {
    key: "handleUpdateDelayedEvent",
    value: function handleUpdateDelayedEvent(request) {
      var _this10 = this;
      if (!request.data.delay_id) {
        return this.transport.reply(request, {
          error: {
            message: "Invalid request - missing delay_id"
          }
        });
      }
      if (!this.hasCapability(_Capabilities.MatrixCapabilities.MSC4157UpdateDelayedEvent)) {
        return this.transport.reply(request, {
          error: {
            message: "Missing capability"
          }
        });
      }
      switch (request.data.action) {
        case _UpdateDelayedEventAction.UpdateDelayedEventAction.Cancel:
        case _UpdateDelayedEventAction.UpdateDelayedEventAction.Restart:
        case _UpdateDelayedEventAction.UpdateDelayedEventAction.Send:
          this.driver.updateDelayedEvent(request.data.delay_id, request.data.action).then(function () {
            return _this10.transport.reply(request, {});
          })["catch"](function (e) {
            console.error("error updating delayed event: ", e);
            _this10.handleDriverError(e, request, "Error updating delayed event");
          });
          break;
        default:
          return this.transport.reply(request, {
            error: {
              message: "Invalid request - unsupported action"
            }
          });
      }
    }
  }, {
    key: "handleSendToDevice",
    value: function () {
      var _handleSendToDevice = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(request) {
        return _regeneratorRuntime().wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              if (request.data.type) {
                _context.next = 5;
                break;
              }
              _context.next = 3;
              return this.transport.reply(request, {
                error: {
                  message: "Invalid request - missing event type"
                }
              });
            case 3:
              _context.next = 31;
              break;
            case 5:
              if (request.data.messages) {
                _context.next = 10;
                break;
              }
              _context.next = 8;
              return this.transport.reply(request, {
                error: {
                  message: "Invalid request - missing event contents"
                }
              });
            case 8:
              _context.next = 31;
              break;
            case 10:
              if (!(typeof request.data.encrypted !== "boolean")) {
                _context.next = 15;
                break;
              }
              _context.next = 13;
              return this.transport.reply(request, {
                error: {
                  message: "Invalid request - missing encryption flag"
                }
              });
            case 13:
              _context.next = 31;
              break;
            case 15:
              if (this.canSendToDeviceEvent(request.data.type)) {
                _context.next = 20;
                break;
              }
              _context.next = 18;
              return this.transport.reply(request, {
                error: {
                  message: "Cannot send to-device events of this type"
                }
              });
            case 18:
              _context.next = 31;
              break;
            case 20:
              _context.prev = 20;
              _context.next = 23;
              return this.driver.sendToDevice(request.data.type, request.data.encrypted, request.data.messages);
            case 23:
              _context.next = 25;
              return this.transport.reply(request, {});
            case 25:
              _context.next = 31;
              break;
            case 27:
              _context.prev = 27;
              _context.t0 = _context["catch"](20);
              console.error("error sending to-device event", _context.t0);
              this.handleDriverError(_context.t0, request, "Error sending event");
            case 31:
            case "end":
              return _context.stop();
          }
        }, _callee, this, [[20, 27]]);
      }));
      function handleSendToDevice(_x) {
        return _handleSendToDevice.apply(this, arguments);
      }
      return handleSendToDevice;
    }()
  }, {
    key: "pollTurnServers",
    value: function () {
      var _pollTurnServers = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(turnServers, initialServer) {
        var _iteratorAbruptCompletion, _didIteratorError, _iteratorError, _iterator, _step, server;
        return _regeneratorRuntime().wrap(function _callee2$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              _context2.prev = 0;
              _context2.next = 3;
              return this.transport.send(_WidgetApiAction.WidgetApiToWidgetAction.UpdateTurnServers, initialServer // it's compatible, but missing the index signature
              );
            case 3:
              // Pick the generator up where we left off
              _iteratorAbruptCompletion = false;
              _didIteratorError = false;
              _context2.prev = 5;
              _iterator = _asyncIterator(turnServers);
            case 7:
              _context2.next = 9;
              return _iterator.next();
            case 9:
              if (!(_iteratorAbruptCompletion = !(_step = _context2.sent).done)) {
                _context2.next = 16;
                break;
              }
              server = _step.value;
              _context2.next = 13;
              return this.transport.send(_WidgetApiAction.WidgetApiToWidgetAction.UpdateTurnServers, server // it's compatible, but missing the index signature
              );
            case 13:
              _iteratorAbruptCompletion = false;
              _context2.next = 7;
              break;
            case 16:
              _context2.next = 22;
              break;
            case 18:
              _context2.prev = 18;
              _context2.t0 = _context2["catch"](5);
              _didIteratorError = true;
              _iteratorError = _context2.t0;
            case 22:
              _context2.prev = 22;
              _context2.prev = 23;
              if (!(_iteratorAbruptCompletion && _iterator["return"] != null)) {
                _context2.next = 27;
                break;
              }
              _context2.next = 27;
              return _iterator["return"]();
            case 27:
              _context2.prev = 27;
              if (!_didIteratorError) {
                _context2.next = 30;
                break;
              }
              throw _iteratorError;
            case 30:
              return _context2.finish(27);
            case 31:
              return _context2.finish(22);
            case 32:
              _context2.next = 37;
              break;
            case 34:
              _context2.prev = 34;
              _context2.t1 = _context2["catch"](0);
              console.error("error polling for TURN servers", _context2.t1);
            case 37:
            case "end":
              return _context2.stop();
          }
        }, _callee2, this, [[0, 34], [5, 18, 22, 32], [23,, 27, 31]]);
      }));
      function pollTurnServers(_x2, _x3) {
        return _pollTurnServers.apply(this, arguments);
      }
      return pollTurnServers;
    }()
  }, {
    key: "handleWatchTurnServers",
    value: function () {
      var _handleWatchTurnServers = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3(request) {
        var turnServers, _yield$turnServers$ne, done, value;
        return _regeneratorRuntime().wrap(function _callee3$(_context3) {
          while (1) switch (_context3.prev = _context3.next) {
            case 0:
              if (this.hasCapability(_Capabilities.MatrixCapabilities.MSC3846TurnServers)) {
                _context3.next = 5;
                break;
              }
              _context3.next = 3;
              return this.transport.reply(request, {
                error: {
                  message: "Missing capability"
                }
              });
            case 3:
              _context3.next = 30;
              break;
            case 5:
              if (!this.turnServers) {
                _context3.next = 10;
                break;
              }
              _context3.next = 8;
              return this.transport.reply(request, {});
            case 8:
              _context3.next = 30;
              break;
            case 10:
              _context3.prev = 10;
              turnServers = this.driver.getTurnServers(); // Peek at the first result, so we can at least verify that the
              // client isn't banned from getting TURN servers entirely
              _context3.next = 14;
              return turnServers.next();
            case 14:
              _yield$turnServers$ne = _context3.sent;
              done = _yield$turnServers$ne.done;
              value = _yield$turnServers$ne.value;
              if (!done) {
                _context3.next = 19;
                break;
              }
              throw new Error("Client refuses to provide any TURN servers");
            case 19:
              _context3.next = 21;
              return this.transport.reply(request, {});
            case 21:
              // Start the poll loop, sending the widget the initial result
              this.pollTurnServers(turnServers, value);
              this.turnServers = turnServers;
              _context3.next = 30;
              break;
            case 25:
              _context3.prev = 25;
              _context3.t0 = _context3["catch"](10);
              console.error("error getting first TURN server results", _context3.t0);
              _context3.next = 30;
              return this.transport.reply(request, {
                error: {
                  message: "TURN servers not available"
                }
              });
            case 30:
            case "end":
              return _context3.stop();
          }
        }, _callee3, this, [[10, 25]]);
      }));
      function handleWatchTurnServers(_x4) {
        return _handleWatchTurnServers.apply(this, arguments);
      }
      return handleWatchTurnServers;
    }()
  }, {
    key: "handleUnwatchTurnServers",
    value: function () {
      var _handleUnwatchTurnServers = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4(request) {
        return _regeneratorRuntime().wrap(function _callee4$(_context4) {
          while (1) switch (_context4.prev = _context4.next) {
            case 0:
              if (this.hasCapability(_Capabilities.MatrixCapabilities.MSC3846TurnServers)) {
                _context4.next = 5;
                break;
              }
              _context4.next = 3;
              return this.transport.reply(request, {
                error: {
                  message: "Missing capability"
                }
              });
            case 3:
              _context4.next = 15;
              break;
            case 5:
              if (this.turnServers) {
                _context4.next = 10;
                break;
              }
              _context4.next = 8;
              return this.transport.reply(request, {});
            case 8:
              _context4.next = 15;
              break;
            case 10:
              _context4.next = 12;
              return this.turnServers["return"](undefined);
            case 12:
              this.turnServers = null;
              _context4.next = 15;
              return this.transport.reply(request, {});
            case 15:
            case "end":
              return _context4.stop();
          }
        }, _callee4, this);
      }));
      function handleUnwatchTurnServers(_x5) {
        return _handleUnwatchTurnServers.apply(this, arguments);
      }
      return handleUnwatchTurnServers;
    }()
  }, {
    key: "handleReadRelations",
    value: function () {
      var _handleReadRelations = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5(request) {
        var _this11 = this;
        var result, chunk;
        return _regeneratorRuntime().wrap(function _callee5$(_context5) {
          while (1) switch (_context5.prev = _context5.next) {
            case 0:
              if (request.data.event_id) {
                _context5.next = 2;
                break;
              }
              return _context5.abrupt("return", this.transport.reply(request, {
                error: {
                  message: "Invalid request - missing event ID"
                }
              }));
            case 2:
              if (!(request.data.limit !== undefined && request.data.limit < 0)) {
                _context5.next = 4;
                break;
              }
              return _context5.abrupt("return", this.transport.reply(request, {
                error: {
                  message: "Invalid request - limit out of range"
                }
              }));
            case 4:
              if (!(request.data.room_id !== undefined && !this.canUseRoomTimeline(request.data.room_id))) {
                _context5.next = 6;
                break;
              }
              return _context5.abrupt("return", this.transport.reply(request, {
                error: {
                  message: "Unable to access room timeline: ".concat(request.data.room_id)
                }
              }));
            case 6:
              _context5.prev = 6;
              _context5.next = 9;
              return this.driver.readEventRelations(request.data.event_id, request.data.room_id, request.data.rel_type, request.data.event_type, request.data.from, request.data.to, request.data.limit, request.data.direction);
            case 9:
              result = _context5.sent;
              // only return events that the user has the permission to receive
              chunk = result.chunk.filter(function (e) {
                if (e.state_key !== undefined) {
                  return _this11.canReceiveStateEvent(e.type, e.state_key);
                } else {
                  return _this11.canReceiveRoomEvent(e.type, e.content['msgtype']);
                }
              });
              return _context5.abrupt("return", this.transport.reply(request, {
                chunk: chunk,
                prev_batch: result.prevBatch,
                next_batch: result.nextBatch
              }));
            case 14:
              _context5.prev = 14;
              _context5.t0 = _context5["catch"](6);
              console.error("error getting the relations", _context5.t0);
              this.handleDriverError(_context5.t0, request, "Unexpected error while reading relations");
            case 18:
            case "end":
              return _context5.stop();
          }
        }, _callee5, this, [[6, 14]]);
      }));
      function handleReadRelations(_x6) {
        return _handleReadRelations.apply(this, arguments);
      }
      return handleReadRelations;
    }()
  }, {
    key: "handleUserDirectorySearch",
    value: function () {
      var _handleUserDirectorySearch = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee6(request) {
        var result;
        return _regeneratorRuntime().wrap(function _callee6$(_context6) {
          while (1) switch (_context6.prev = _context6.next) {
            case 0:
              if (this.hasCapability(_Capabilities.MatrixCapabilities.MSC3973UserDirectorySearch)) {
                _context6.next = 2;
                break;
              }
              return _context6.abrupt("return", this.transport.reply(request, {
                error: {
                  message: "Missing capability"
                }
              }));
            case 2:
              if (!(typeof request.data.search_term !== 'string')) {
                _context6.next = 4;
                break;
              }
              return _context6.abrupt("return", this.transport.reply(request, {
                error: {
                  message: "Invalid request - missing search term"
                }
              }));
            case 4:
              if (!(request.data.limit !== undefined && request.data.limit < 0)) {
                _context6.next = 6;
                break;
              }
              return _context6.abrupt("return", this.transport.reply(request, {
                error: {
                  message: "Invalid request - limit out of range"
                }
              }));
            case 6:
              _context6.prev = 6;
              _context6.next = 9;
              return this.driver.searchUserDirectory(request.data.search_term, request.data.limit);
            case 9:
              result = _context6.sent;
              return _context6.abrupt("return", this.transport.reply(request, {
                limited: result.limited,
                results: result.results.map(function (r) {
                  return {
                    user_id: r.userId,
                    display_name: r.displayName,
                    avatar_url: r.avatarUrl
                  };
                })
              }));
            case 13:
              _context6.prev = 13;
              _context6.t0 = _context6["catch"](6);
              console.error("error searching in the user directory", _context6.t0);
              this.handleDriverError(_context6.t0, request, "Unexpected error while searching in the user directory");
            case 17:
            case "end":
              return _context6.stop();
          }
        }, _callee6, this, [[6, 13]]);
      }));
      function handleUserDirectorySearch(_x7) {
        return _handleUserDirectorySearch.apply(this, arguments);
      }
      return handleUserDirectorySearch;
    }()
  }, {
    key: "handleGetMediaConfig",
    value: function () {
      var _handleGetMediaConfig = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee7(request) {
        var result;
        return _regeneratorRuntime().wrap(function _callee7$(_context7) {
          while (1) switch (_context7.prev = _context7.next) {
            case 0:
              if (this.hasCapability(_Capabilities.MatrixCapabilities.MSC4039UploadFile)) {
                _context7.next = 2;
                break;
              }
              return _context7.abrupt("return", this.transport.reply(request, {
                error: {
                  message: "Missing capability"
                }
              }));
            case 2:
              _context7.prev = 2;
              _context7.next = 5;
              return this.driver.getMediaConfig();
            case 5:
              result = _context7.sent;
              return _context7.abrupt("return", this.transport.reply(request, result));
            case 9:
              _context7.prev = 9;
              _context7.t0 = _context7["catch"](2);
              console.error("error while getting the media configuration", _context7.t0);
              this.handleDriverError(_context7.t0, request, "Unexpected error while getting the media configuration");
            case 13:
            case "end":
              return _context7.stop();
          }
        }, _callee7, this, [[2, 9]]);
      }));
      function handleGetMediaConfig(_x8) {
        return _handleGetMediaConfig.apply(this, arguments);
      }
      return handleGetMediaConfig;
    }()
  }, {
    key: "handleUploadFile",
    value: function () {
      var _handleUploadFile = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee8(request) {
        var result;
        return _regeneratorRuntime().wrap(function _callee8$(_context8) {
          while (1) switch (_context8.prev = _context8.next) {
            case 0:
              if (this.hasCapability(_Capabilities.MatrixCapabilities.MSC4039UploadFile)) {
                _context8.next = 2;
                break;
              }
              return _context8.abrupt("return", this.transport.reply(request, {
                error: {
                  message: "Missing capability"
                }
              }));
            case 2:
              _context8.prev = 2;
              _context8.next = 5;
              return this.driver.uploadFile(request.data.file);
            case 5:
              result = _context8.sent;
              return _context8.abrupt("return", this.transport.reply(request, {
                content_uri: result.contentUri
              }));
            case 9:
              _context8.prev = 9;
              _context8.t0 = _context8["catch"](2);
              console.error("error while uploading a file", _context8.t0);
              this.handleDriverError(_context8.t0, request, "Unexpected error while uploading a file");
            case 13:
            case "end":
              return _context8.stop();
          }
        }, _callee8, this, [[2, 9]]);
      }));
      function handleUploadFile(_x9) {
        return _handleUploadFile.apply(this, arguments);
      }
      return handleUploadFile;
    }()
  }, {
    key: "handleDownloadFile",
    value: function () {
      var _handleDownloadFile = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee9(request) {
        var result;
        return _regeneratorRuntime().wrap(function _callee9$(_context9) {
          while (1) switch (_context9.prev = _context9.next) {
            case 0:
              if (this.hasCapability(_Capabilities.MatrixCapabilities.MSC4039DownloadFile)) {
                _context9.next = 2;
                break;
              }
              return _context9.abrupt("return", this.transport.reply(request, {
                error: {
                  message: "Missing capability"
                }
              }));
            case 2:
              _context9.prev = 2;
              _context9.next = 5;
              return this.driver.downloadFile(request.data.content_uri);
            case 5:
              result = _context9.sent;
              return _context9.abrupt("return", this.transport.reply(request, {
                file: result.file
              }));
            case 9:
              _context9.prev = 9;
              _context9.t0 = _context9["catch"](2);
              console.error("error while downloading a file", _context9.t0);
              this.handleDriverError(_context9.t0, request, "Unexpected error while downloading a file");
            case 13:
            case "end":
              return _context9.stop();
          }
        }, _callee9, this, [[2, 9]]);
      }));
      function handleDownloadFile(_x10) {
        return _handleDownloadFile.apply(this, arguments);
      }
      return handleDownloadFile;
    }()
  }, {
    key: "handleDriverError",
    value: function handleDriverError(e, request, message) {
      var data = this.driver.processError(e);
      this.transport.reply(request, {
        error: _objectSpread({
          message: message
        }, data)
      });
    }
  }, {
    key: "handleMessage",
    value: function handleMessage(ev) {
      if (this.isStopped) return;
      var actionEv = new CustomEvent("action:".concat(ev.detail.action), {
        detail: ev.detail,
        cancelable: true
      });
      this.emit("action:".concat(ev.detail.action), actionEv);
      if (!actionEv.defaultPrevented) {
        switch (ev.detail.action) {
          case _WidgetApiAction.WidgetApiFromWidgetAction.ContentLoaded:
            return this.handleContentLoadedAction(ev.detail);
          case _WidgetApiAction.WidgetApiFromWidgetAction.SupportedApiVersions:
            return this.replyVersions(ev.detail);
          case _WidgetApiAction.WidgetApiFromWidgetAction.SendEvent:
            return this.handleSendEvent(ev.detail);
          case _WidgetApiAction.WidgetApiFromWidgetAction.SendToDevice:
            return this.handleSendToDevice(ev.detail);
          case _WidgetApiAction.WidgetApiFromWidgetAction.GetOpenIDCredentials:
            return this.handleOIDC(ev.detail);
          case _WidgetApiAction.WidgetApiFromWidgetAction.MSC2931Navigate:
            return this.handleNavigate(ev.detail);
          case _WidgetApiAction.WidgetApiFromWidgetAction.MSC2974RenegotiateCapabilities:
            return this.handleCapabilitiesRenegotiate(ev.detail);
          case _WidgetApiAction.WidgetApiFromWidgetAction.MSC2876ReadEvents:
            return this.handleReadEvents(ev.detail);
          case _WidgetApiAction.WidgetApiFromWidgetAction.WatchTurnServers:
            return this.handleWatchTurnServers(ev.detail);
          case _WidgetApiAction.WidgetApiFromWidgetAction.UnwatchTurnServers:
            return this.handleUnwatchTurnServers(ev.detail);
          case _WidgetApiAction.WidgetApiFromWidgetAction.MSC3869ReadRelations:
            return this.handleReadRelations(ev.detail);
          case _WidgetApiAction.WidgetApiFromWidgetAction.MSC3973UserDirectorySearch:
            return this.handleUserDirectorySearch(ev.detail);
          case _WidgetApiAction.WidgetApiFromWidgetAction.BeeperReadRoomAccountData:
            return this.handleReadRoomAccountData(ev.detail);
          case _WidgetApiAction.WidgetApiFromWidgetAction.MSC4039GetMediaConfigAction:
            return this.handleGetMediaConfig(ev.detail);
          case _WidgetApiAction.WidgetApiFromWidgetAction.MSC4039UploadFileAction:
            return this.handleUploadFile(ev.detail);
          case _WidgetApiAction.WidgetApiFromWidgetAction.MSC4039DownloadFileAction:
            return this.handleDownloadFile(ev.detail);
          case _WidgetApiAction.WidgetApiFromWidgetAction.MSC4157UpdateDelayedEvent:
            return this.handleUpdateDelayedEvent(ev.detail);
          default:
            return this.transport.reply(ev.detail, {
              error: {
                message: "Unknown or unsupported action: " + ev.detail.action
              }
            });
        }
      }
    }

    /**
     * Takes a screenshot of the widget.
     * @returns Resolves to the widget's screenshot.
     * @throws Throws if there is a problem.
     */
  }, {
    key: "takeScreenshot",
    value: function takeScreenshot() {
      return this.transport.send(_WidgetApiAction.WidgetApiToWidgetAction.TakeScreenshot, {});
    }

    /**
     * Alerts the widget to whether or not it is currently visible.
     * @param {boolean} isVisible Whether the widget is visible or not.
     * @returns {Promise<IWidgetApiResponseData>} Resolves when the widget acknowledges the update.
     */
  }, {
    key: "updateVisibility",
    value: function updateVisibility(isVisible) {
      return this.transport.send(_WidgetApiAction.WidgetApiToWidgetAction.UpdateVisibility, {
        visible: isVisible
      });
    }
  }, {
    key: "sendWidgetConfig",
    value: function sendWidgetConfig(data) {
      return this.transport.send(_WidgetApiAction.WidgetApiToWidgetAction.WidgetConfig, data).then();
    }
  }, {
    key: "notifyModalWidgetButtonClicked",
    value: function notifyModalWidgetButtonClicked(id) {
      return this.transport.send(_WidgetApiAction.WidgetApiToWidgetAction.ButtonClicked, {
        id: id
      }).then();
    }
  }, {
    key: "notifyModalWidgetClose",
    value: function notifyModalWidgetClose(data) {
      return this.transport.send(_WidgetApiAction.WidgetApiToWidgetAction.CloseModalWidget, data).then();
    }

    /**
     * Feeds an event to the widget. If the widget is not able to accept the event due to
     * permissions, this will no-op and return calmly. If the widget failed to handle the
     * event, this will raise an error.
     * @param {IRoomEvent} rawEvent The event to (try to) send to the widget.
     * @param {string} currentViewedRoomId The room ID the user is currently interacting with.
     * Not the room ID of the event.
     * @returns {Promise<void>} Resolves when complete, rejects if there was an error sending.
     */
  }, {
    key: "feedEvent",
    value: function () {
      var _feedEvent = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee10(rawEvent, currentViewedRoomId) {
        var _rawEvent$content;
        return _regeneratorRuntime().wrap(function _callee10$(_context10) {
          while (1) switch (_context10.prev = _context10.next) {
            case 0:
              if (!(rawEvent.room_id !== currentViewedRoomId && !this.canUseRoomTimeline(rawEvent.room_id))) {
                _context10.next = 2;
                break;
              }
              return _context10.abrupt("return");
            case 2:
              if (!(rawEvent.state_key !== undefined && rawEvent.state_key !== null)) {
                _context10.next = 7;
                break;
              }
              if (this.canReceiveStateEvent(rawEvent.type, rawEvent.state_key)) {
                _context10.next = 5;
                break;
              }
              return _context10.abrupt("return");
            case 5:
              _context10.next = 9;
              break;
            case 7:
              if (this.canReceiveRoomEvent(rawEvent.type, (_rawEvent$content = rawEvent.content) === null || _rawEvent$content === void 0 ? void 0 : _rawEvent$content["msgtype"])) {
                _context10.next = 9;
                break;
              }
              return _context10.abrupt("return");
            case 9:
              _context10.next = 11;
              return this.transport.send(_WidgetApiAction.WidgetApiToWidgetAction.SendEvent, rawEvent // it's compatible, but missing the index signature
              );
            case 11:
            case "end":
              return _context10.stop();
          }
        }, _callee10, this);
      }));
      function feedEvent(_x11, _x12) {
        return _feedEvent.apply(this, arguments);
      }
      return feedEvent;
    }()
    /**
     * Feeds a to-device event to the widget. If the widget is not able to accept the
     * event due to permissions, this will no-op and return calmly. If the widget failed
     * to handle the event, this will raise an error.
     * @param {IRoomEvent} rawEvent The event to (try to) send to the widget.
     * @param {boolean} encrypted Whether the event contents were encrypted.
     * @returns {Promise<void>} Resolves when complete, rejects if there was an error sending.
     */
  }, {
    key: "feedToDevice",
    value: function () {
      var _feedToDevice = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee11(rawEvent, encrypted) {
        return _regeneratorRuntime().wrap(function _callee11$(_context11) {
          while (1) switch (_context11.prev = _context11.next) {
            case 0:
              if (!this.canReceiveToDeviceEvent(rawEvent.type)) {
                _context11.next = 3;
                break;
              }
              _context11.next = 3;
              return this.transport.send(_WidgetApiAction.WidgetApiToWidgetAction.SendToDevice, // it's compatible, but missing the index signature
              _objectSpread(_objectSpread({}, rawEvent), {}, {
                encrypted: encrypted
              }));
            case 3:
            case "end":
              return _context11.stop();
          }
        }, _callee11, this);
      }));
      function feedToDevice(_x13, _x14) {
        return _feedToDevice.apply(this, arguments);
      }
      return feedToDevice;
    }()
  }]);
  return ClientWidgetApi;
}(_events.EventEmitter);
exports.ClientWidgetApi = ClientWidgetApi;

},{"./Symbols":2,"./interfaces/ApiVersion":6,"./interfaces/Capabilities":7,"./interfaces/GetOpenIDAction":12,"./interfaces/UpdateDelayedEventAction":36,"./interfaces/WidgetApiAction":39,"./interfaces/WidgetApiDirection":40,"./models/WidgetEventCapability":45,"./transport/PostmessageTransport":51,"./util/SimpleObservable":52,"events":53}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Symbols = void 0;
/*
 * Copyright 2021 The Matrix.org Foundation C.I.C.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var Symbols = /*#__PURE__*/function (Symbols) {
  Symbols["AnyRoom"] = "*";
  return Symbols;
}({});
exports.Symbols = Symbols;

},{}],3:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WidgetApiResponseError = exports.WidgetApi = void 0;
var _events = require("events");
var _WidgetApiDirection = require("./interfaces/WidgetApiDirection");
var _ApiVersion = require("./interfaces/ApiVersion");
var _PostmessageTransport = require("./transport/PostmessageTransport");
var _WidgetApiAction = require("./interfaces/WidgetApiAction");
var _GetOpenIDAction = require("./interfaces/GetOpenIDAction");
var _WidgetType = require("./interfaces/WidgetType");
var _ModalWidgetActions = require("./interfaces/ModalWidgetActions");
var _WidgetEventCapability = require("./models/WidgetEventCapability");
var _Symbols = require("./Symbols");
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == _typeof(value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var methodName = context.method, method = delegate.iterator[methodName]; if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel; var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) keys.push(key); return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }
function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }
function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
function _wrapNativeSuper(Class) { var _cache = typeof Map === "function" ? new Map() : undefined; _wrapNativeSuper = function _wrapNativeSuper(Class) { if (Class === null || !_isNativeFunction(Class)) return Class; if (typeof Class !== "function") { throw new TypeError("Super expression must either be null or a function"); } if (typeof _cache !== "undefined") { if (_cache.has(Class)) return _cache.get(Class); _cache.set(Class, Wrapper); } function Wrapper() { return _construct(Class, arguments, _getPrototypeOf(this).constructor); } Wrapper.prototype = Object.create(Class.prototype, { constructor: { value: Wrapper, enumerable: false, writable: true, configurable: true } }); return _setPrototypeOf(Wrapper, Class); }; return _wrapNativeSuper(Class); }
function _construct(Parent, args, Class) { if (_isNativeReflectConstruct()) { _construct = Reflect.construct.bind(); } else { _construct = function _construct(Parent, args, Class) { var a = [null]; a.push.apply(a, args); var Constructor = Function.bind.apply(Parent, a); var instance = new Constructor(); if (Class) _setPrototypeOf(instance, Class.prototype); return instance; }; } return _construct.apply(null, arguments); }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
function _isNativeFunction(fn) { return Function.toString.call(fn).indexOf("[native code]") !== -1; }
function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }
function _awaitAsyncGenerator(value) { return new _OverloadYield(value, 0); }
function _wrapAsyncGenerator(fn) { return function () { return new _AsyncGenerator(fn.apply(this, arguments)); }; }
function _AsyncGenerator(gen) { var front, back; function resume(key, arg) { try { var result = gen[key](arg), value = result.value, overloaded = value instanceof _OverloadYield; Promise.resolve(overloaded ? value.v : value).then(function (arg) { if (overloaded) { var nextKey = "return" === key ? "return" : "next"; if (!value.k || arg.done) return resume(nextKey, arg); arg = gen[nextKey](arg).value; } settle(result.done ? "return" : "normal", arg); }, function (err) { resume("throw", err); }); } catch (err) { settle("throw", err); } } function settle(type, value) { switch (type) { case "return": front.resolve({ value: value, done: !0 }); break; case "throw": front.reject(value); break; default: front.resolve({ value: value, done: !1 }); } (front = front.next) ? resume(front.key, front.arg) : back = null; } this._invoke = function (key, arg) { return new Promise(function (resolve, reject) { var request = { key: key, arg: arg, resolve: resolve, reject: reject, next: null }; back ? back = back.next = request : (front = back = request, resume(key, arg)); }); }, "function" != typeof gen["return"] && (this["return"] = void 0); }
_AsyncGenerator.prototype["function" == typeof Symbol && Symbol.asyncIterator || "@@asyncIterator"] = function () { return this; }, _AsyncGenerator.prototype.next = function (arg) { return this._invoke("next", arg); }, _AsyncGenerator.prototype["throw"] = function (arg) { return this._invoke("throw", arg); }, _AsyncGenerator.prototype["return"] = function (arg) { return this._invoke("return", arg); };
function _OverloadYield(value, kind) { this.v = value, this.k = kind; } /*
                                                                         * Copyright 2020 - 2024 The Matrix.org Foundation C.I.C.
                                                                         *
                                                                         * Licensed under the Apache License, Version 2.0 (the "License");
                                                                         * you may not use this file except in compliance with the License.
                                                                         * You may obtain a copy of the License at
                                                                         *
                                                                         *         http://www.apache.org/licenses/LICENSE-2.0
                                                                         *
                                                                         * Unless required by applicable law or agreed to in writing, software
                                                                         * distributed under the License is distributed on an "AS IS" BASIS,
                                                                         * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                                                                         * See the License for the specific language governing permissions and
                                                                         * limitations under the License.
                                                                         */
var WidgetApiResponseError = /*#__PURE__*/function (_Error) {
  _inherits(WidgetApiResponseError, _Error);
  var _super = _createSuper(WidgetApiResponseError);
  function WidgetApiResponseError(message, data) {
    var _this2;
    _classCallCheck(this, WidgetApiResponseError);
    _this2 = _super.call(this, message);
    _this2.data = data;
    return _this2;
  }
  return _createClass(WidgetApiResponseError);
}( /*#__PURE__*/_wrapNativeSuper(Error));
/**
 * API handler for widgets. This raises events for each action
 * received as `action:${action}` (eg: "action:screenshot").
 * Default handling can be prevented by using preventDefault()
 * on the raised event. The default handling varies for each
 * action: ones which the SDK can handle safely are acknowledged
 * appropriately and ones which are unhandled (custom or require
 * the widget to do something) are rejected with an error.
 *
 * Events which are preventDefault()ed must reply using the
 * transport. The events raised will have a detail of an
 * IWidgetApiRequest interface.
 *
 * When the WidgetApi is ready to start sending requests, it will
 * raise a "ready" CustomEvent. After the ready event fires, actions
 * can be sent and the transport will be ready.
 */
exports.WidgetApiResponseError = WidgetApiResponseError;
WidgetApiResponseError.prototype.name = WidgetApiResponseError.name;
var WidgetApi = /*#__PURE__*/function (_EventEmitter) {
  _inherits(WidgetApi, _EventEmitter);
  var _super2 = _createSuper(WidgetApi);
  /**
   * Creates a new API handler for the given widget.
   * @param {string} widgetId The widget ID to listen for. If not supplied then
   * the API will use the widget ID from the first valid request it receives.
   * @param {string} clientOrigin The origin of the client, or null if not known.
   */
  function WidgetApi() {
    var _this3;
    var widgetId = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
    var clientOrigin = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    _classCallCheck(this, WidgetApi);
    _this3 = _super2.call(this);
    _this3.clientOrigin = clientOrigin;
    _defineProperty(_assertThisInitialized(_this3), "transport", void 0);
    _defineProperty(_assertThisInitialized(_this3), "capabilitiesFinished", false);
    _defineProperty(_assertThisInitialized(_this3), "supportsMSC2974Renegotiate", false);
    _defineProperty(_assertThisInitialized(_this3), "requestedCapabilities", []);
    _defineProperty(_assertThisInitialized(_this3), "approvedCapabilities", void 0);
    _defineProperty(_assertThisInitialized(_this3), "cachedClientVersions", void 0);
    _defineProperty(_assertThisInitialized(_this3), "turnServerWatchers", 0);
    if (!window.parent) {
      throw new Error("No parent window. This widget doesn't appear to be embedded properly.");
    }
    _this3.transport = new _PostmessageTransport.PostmessageTransport(_WidgetApiDirection.WidgetApiDirection.FromWidget, widgetId, window.parent, window);
    _this3.transport.targetOrigin = clientOrigin;
    _this3.transport.on("message", _this3.handleMessage.bind(_assertThisInitialized(_this3)));
    return _this3;
  }

  /**
   * Determines if the widget was granted a particular capability. Note that on
   * clients where the capabilities are not fed back to the widget this function
   * will rely on requested capabilities instead.
   * @param {Capability} capability The capability to check for approval of.
   * @returns {boolean} True if the widget has approval for the given capability.
   */
  _createClass(WidgetApi, [{
    key: "hasCapability",
    value: function hasCapability(capability) {
      if (Array.isArray(this.approvedCapabilities)) {
        return this.approvedCapabilities.includes(capability);
      }
      return this.requestedCapabilities.includes(capability);
    }

    /**
     * Request a capability from the client. It is not guaranteed to be allowed,
     * but will be asked for.
     * @param {Capability} capability The capability to request.
     * @throws Throws if the capabilities negotiation has already started and the
     * widget is unable to request additional capabilities.
     */
  }, {
    key: "requestCapability",
    value: function requestCapability(capability) {
      if (this.capabilitiesFinished && !this.supportsMSC2974Renegotiate) {
        throw new Error("Capabilities have already been negotiated");
      }
      this.requestedCapabilities.push(capability);
    }

    /**
     * Request capabilities from the client. They are not guaranteed to be allowed,
     * but will be asked for if the negotiation has not already happened.
     * @param {Capability[]} capabilities The capabilities to request.
     * @throws Throws if the capabilities negotiation has already started.
     */
  }, {
    key: "requestCapabilities",
    value: function requestCapabilities(capabilities) {
      var _this4 = this;
      capabilities.forEach(function (cap) {
        return _this4.requestCapability(cap);
      });
    }

    /**
     * Requests the capability to interact with rooms other than the user's currently
     * viewed room. Applies to event receiving and sending.
     * @param {string | Symbols.AnyRoom} roomId The room ID, or `Symbols.AnyRoom` to
     * denote all known rooms.
     */
  }, {
    key: "requestCapabilityForRoomTimeline",
    value: function requestCapabilityForRoomTimeline(roomId) {
      this.requestCapability("org.matrix.msc2762.timeline:".concat(roomId));
    }

    /**
     * Requests the capability to send a given state event with optional explicit
     * state key. It is not guaranteed to be allowed, but will be asked for if the
     * negotiation has not already happened.
     * @param {string} eventType The state event type to ask for.
     * @param {string} stateKey If specified, the specific state key to request.
     * Otherwise all state keys will be requested.
     */
  }, {
    key: "requestCapabilityToSendState",
    value: function requestCapabilityToSendState(eventType, stateKey) {
      this.requestCapability(_WidgetEventCapability.WidgetEventCapability.forStateEvent(_WidgetEventCapability.EventDirection.Send, eventType, stateKey).raw);
    }

    /**
     * Requests the capability to receive a given state event with optional explicit
     * state key. It is not guaranteed to be allowed, but will be asked for if the
     * negotiation has not already happened.
     * @param {string} eventType The state event type to ask for.
     * @param {string} stateKey If specified, the specific state key to request.
     * Otherwise all state keys will be requested.
     */
  }, {
    key: "requestCapabilityToReceiveState",
    value: function requestCapabilityToReceiveState(eventType, stateKey) {
      this.requestCapability(_WidgetEventCapability.WidgetEventCapability.forStateEvent(_WidgetEventCapability.EventDirection.Receive, eventType, stateKey).raw);
    }

    /**
     * Requests the capability to send a given to-device event. It is not
     * guaranteed to be allowed, but will be asked for if the negotiation has
     * not already happened.
     * @param {string} eventType The room event type to ask for.
     */
  }, {
    key: "requestCapabilityToSendToDevice",
    value: function requestCapabilityToSendToDevice(eventType) {
      this.requestCapability(_WidgetEventCapability.WidgetEventCapability.forToDeviceEvent(_WidgetEventCapability.EventDirection.Send, eventType).raw);
    }

    /**
     * Requests the capability to receive a given to-device event. It is not
     * guaranteed to be allowed, but will be asked for if the negotiation has
     * not already happened.
     * @param {string} eventType The room event type to ask for.
     */
  }, {
    key: "requestCapabilityToReceiveToDevice",
    value: function requestCapabilityToReceiveToDevice(eventType) {
      this.requestCapability(_WidgetEventCapability.WidgetEventCapability.forToDeviceEvent(_WidgetEventCapability.EventDirection.Receive, eventType).raw);
    }

    /**
     * Requests the capability to send a given room event. It is not guaranteed to be
     * allowed, but will be asked for if the negotiation has not already happened.
     * @param {string} eventType The room event type to ask for.
     */
  }, {
    key: "requestCapabilityToSendEvent",
    value: function requestCapabilityToSendEvent(eventType) {
      this.requestCapability(_WidgetEventCapability.WidgetEventCapability.forRoomEvent(_WidgetEventCapability.EventDirection.Send, eventType).raw);
    }

    /**
     * Requests the capability to receive a given room event. It is not guaranteed to be
     * allowed, but will be asked for if the negotiation has not already happened.
     * @param {string} eventType The room event type to ask for.
     */
  }, {
    key: "requestCapabilityToReceiveEvent",
    value: function requestCapabilityToReceiveEvent(eventType) {
      this.requestCapability(_WidgetEventCapability.WidgetEventCapability.forRoomEvent(_WidgetEventCapability.EventDirection.Receive, eventType).raw);
    }

    /**
     * Requests the capability to send a given message event with optional explicit
     * `msgtype`. It is not guaranteed to be allowed, but will be asked for if the
     * negotiation has not already happened.
     * @param {string} msgtype If specified, the specific msgtype to request.
     * Otherwise all message types will be requested.
     */
  }, {
    key: "requestCapabilityToSendMessage",
    value: function requestCapabilityToSendMessage(msgtype) {
      this.requestCapability(_WidgetEventCapability.WidgetEventCapability.forRoomMessageEvent(_WidgetEventCapability.EventDirection.Send, msgtype).raw);
    }

    /**
     * Requests the capability to receive a given message event with optional explicit
     * `msgtype`. It is not guaranteed to be allowed, but will be asked for if the
     * negotiation has not already happened.
     * @param {string} msgtype If specified, the specific msgtype to request.
     * Otherwise all message types will be requested.
     */
  }, {
    key: "requestCapabilityToReceiveMessage",
    value: function requestCapabilityToReceiveMessage(msgtype) {
      this.requestCapability(_WidgetEventCapability.WidgetEventCapability.forRoomMessageEvent(_WidgetEventCapability.EventDirection.Receive, msgtype).raw);
    }

    /**
     * Requests the capability to receive a given item in room account data. It is not guaranteed to be
     * allowed, but will be asked for if the negotiation has not already happened.
     * @param {string} eventType The state event type to ask for.
     */
  }, {
    key: "requestCapabilityToReceiveRoomAccountData",
    value: function requestCapabilityToReceiveRoomAccountData(eventType) {
      this.requestCapability(_WidgetEventCapability.WidgetEventCapability.forRoomAccountData(_WidgetEventCapability.EventDirection.Receive, eventType).raw);
    }

    /**
     * Requests an OpenID Connect token from the client for the currently logged in
     * user. This token can be validated server-side with the federation API. Note
     * that the widget is responsible for validating the token and caching any results
     * it needs.
     * @returns {Promise<IOpenIDCredentials>} Resolves to a token for verification.
     * @throws Throws if the user rejected the request or the request failed.
     */
  }, {
    key: "requestOpenIDConnectToken",
    value: function requestOpenIDConnectToken() {
      var _this5 = this;
      return new Promise(function (resolve, reject) {
        _this5.transport.sendComplete(_WidgetApiAction.WidgetApiFromWidgetAction.GetOpenIDCredentials, {}).then(function (response) {
          var rdata = response.response;
          if (rdata.state === _GetOpenIDAction.OpenIDRequestState.Allowed) {
            resolve(rdata);
          } else if (rdata.state === _GetOpenIDAction.OpenIDRequestState.Blocked) {
            reject(new Error("User declined to verify their identity"));
          } else if (rdata.state === _GetOpenIDAction.OpenIDRequestState.PendingUserConfirmation) {
            var handlerFn = function handlerFn(ev) {
              ev.preventDefault();
              var request = ev.detail;
              if (request.data.original_request_id !== response.requestId) return;
              if (request.data.state === _GetOpenIDAction.OpenIDRequestState.Allowed) {
                resolve(request.data);
                _this5.transport.reply(request, {}); // ack
              } else if (request.data.state === _GetOpenIDAction.OpenIDRequestState.Blocked) {
                reject(new Error("User declined to verify their identity"));
                _this5.transport.reply(request, {}); // ack
              } else {
                reject(new Error("Invalid state on reply: " + rdata.state));
                _this5.transport.reply(request, {
                  error: {
                    message: "Invalid state"
                  }
                });
              }
              _this5.off("action:".concat(_WidgetApiAction.WidgetApiToWidgetAction.OpenIDCredentials), handlerFn);
            };
            _this5.on("action:".concat(_WidgetApiAction.WidgetApiToWidgetAction.OpenIDCredentials), handlerFn);
          } else {
            reject(new Error("Invalid state: " + rdata.state));
          }
        })["catch"](reject);
      });
    }

    /**
     * Asks the client for additional capabilities. Capabilities can be queued for this
     * request with the requestCapability() functions.
     * @returns {Promise<void>} Resolves when complete. Note that the promise resolves when
     * the capabilities request has gone through, not when the capabilities are approved/denied.
     * Use the WidgetApiToWidgetAction.NotifyCapabilities action to detect changes.
     */
  }, {
    key: "updateRequestedCapabilities",
    value: function updateRequestedCapabilities() {
      return this.transport.send(_WidgetApiAction.WidgetApiFromWidgetAction.MSC2974RenegotiateCapabilities, {
        capabilities: this.requestedCapabilities
      }).then();
    }

    /**
     * Tell the client that the content has been loaded.
     * @returns {Promise} Resolves when the client acknowledges the request.
     */
  }, {
    key: "sendContentLoaded",
    value: function sendContentLoaded() {
      return this.transport.send(_WidgetApiAction.WidgetApiFromWidgetAction.ContentLoaded, {}).then();
    }

    /**
     * Sends a sticker to the client.
     * @param {IStickerActionRequestData} sticker The sticker to send.
     * @returns {Promise} Resolves when the client acknowledges the request.
     */
  }, {
    key: "sendSticker",
    value: function sendSticker(sticker) {
      return this.transport.send(_WidgetApiAction.WidgetApiFromWidgetAction.SendSticker, sticker).then();
    }

    /**
     * Asks the client to set the always-on-screen status for this widget.
     * @param {boolean} value The new state to request.
     * @returns {Promise<boolean>} Resolve with true if the client was able to fulfill
     * the request, resolves to false otherwise. Rejects if an error occurred.
     */
  }, {
    key: "setAlwaysOnScreen",
    value: function setAlwaysOnScreen(value) {
      return this.transport.send(_WidgetApiAction.WidgetApiFromWidgetAction.UpdateAlwaysOnScreen, {
        value: value
      }).then(function (res) {
        return res.success;
      });
    }

    /**
     * Opens a modal widget.
     * @param {string} url The URL to the modal widget.
     * @param {string} name The name of the widget.
     * @param {IModalWidgetOpenRequestDataButton[]} buttons The buttons to have on the widget.
     * @param {IModalWidgetCreateData} data Data to supply to the modal widget.
     * @param {WidgetType} type The type of modal widget.
     * @returns {Promise<void>} Resolves when the modal widget has been opened.
     */
  }, {
    key: "openModalWidget",
    value: function openModalWidget(url, name) {
      var buttons = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
      var data = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
      var type = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : _WidgetType.MatrixWidgetType.Custom;
      return this.transport.send(_WidgetApiAction.WidgetApiFromWidgetAction.OpenModalWidget, {
        type: type,
        url: url,
        name: name,
        buttons: buttons,
        data: data
      }).then();
    }

    /**
     * Closes the modal widget. The widget's session will be terminated shortly after.
     * @param {IModalWidgetReturnData} data Optional data to close the modal widget with.
     * @returns {Promise<void>} Resolves when complete.
     */
  }, {
    key: "closeModalWidget",
    value: function closeModalWidget() {
      var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      return this.transport.send(_WidgetApiAction.WidgetApiFromWidgetAction.CloseModalWidget, data).then();
    }
  }, {
    key: "sendRoomEvent",
    value: function sendRoomEvent(eventType, content, roomId, delay, parentDelayId) {
      return this.sendEvent(eventType, undefined, content, roomId, delay, parentDelayId);
    }
  }, {
    key: "sendStateEvent",
    value: function sendStateEvent(eventType, stateKey, content, roomId, delay, parentDelayId) {
      return this.sendEvent(eventType, stateKey, content, roomId, delay, parentDelayId);
    }
  }, {
    key: "sendEvent",
    value: function sendEvent(eventType, stateKey, content, roomId, delay, parentDelayId) {
      return this.transport.send(_WidgetApiAction.WidgetApiFromWidgetAction.SendEvent, _objectSpread(_objectSpread(_objectSpread(_objectSpread({
        type: eventType,
        content: content
      }, stateKey !== undefined && {
        state_key: stateKey
      }), roomId !== undefined && {
        room_id: roomId
      }), delay !== undefined && {
        delay: delay
      }), parentDelayId !== undefined && {
        parent_delay_id: parentDelayId
      }));
    }

    /**
     * @deprecated This currently relies on an unstable MSC (MSC4157).
     */
  }, {
    key: "updateDelayedEvent",
    value: function updateDelayedEvent(delayId, action) {
      return this.transport.send(_WidgetApiAction.WidgetApiFromWidgetAction.MSC4157UpdateDelayedEvent, {
        delay_id: delayId,
        action: action
      });
    }

    /**
     * Sends a to-device event.
     * @param {string} eventType The type of events being sent.
     * @param {boolean} encrypted Whether to encrypt the message contents.
     * @param {Object} contentMap A map from user IDs to device IDs to message contents.
     * @returns {Promise<ISendToDeviceFromWidgetResponseData>} Resolves when complete.
     */
  }, {
    key: "sendToDevice",
    value: function sendToDevice(eventType, encrypted, contentMap) {
      return this.transport.send(_WidgetApiAction.WidgetApiFromWidgetAction.SendToDevice, {
        type: eventType,
        encrypted: encrypted,
        messages: contentMap
      });
    }
  }, {
    key: "readRoomAccountData",
    value: function readRoomAccountData(eventType, roomIds) {
      var data = {
        type: eventType
      };
      if (roomIds) {
        if (roomIds.includes(_Symbols.Symbols.AnyRoom)) {
          data.room_ids = _Symbols.Symbols.AnyRoom;
        } else {
          data.room_ids = roomIds;
        }
      }
      return this.transport.send(_WidgetApiAction.WidgetApiFromWidgetAction.BeeperReadRoomAccountData, data).then(function (r) {
        return r.events;
      });
    }
  }, {
    key: "readRoomEvents",
    value: function readRoomEvents(eventType, limit, msgtype, roomIds, since) {
      var data = {
        type: eventType,
        msgtype: msgtype
      };
      if (limit !== undefined) {
        data.limit = limit;
      }
      if (roomIds) {
        if (roomIds.includes(_Symbols.Symbols.AnyRoom)) {
          data.room_ids = _Symbols.Symbols.AnyRoom;
        } else {
          data.room_ids = roomIds;
        }
      }
      if (since) {
        data.since = since;
      }
      return this.transport.send(_WidgetApiAction.WidgetApiFromWidgetAction.MSC2876ReadEvents, data).then(function (r) {
        return r.events;
      });
    }

    /**
     * Reads all related events given a known eventId.
     * @param eventId The id of the parent event to be read.
     * @param roomId The room to look within. When undefined, the user's currently
     * viewed room.
     * @param relationType The relationship type of child events to search for.
     * When undefined, all relations are returned.
     * @param eventType The event type of child events to search for. When undefined,
     * all related events are returned.
     * @param limit The maximum number of events to retrieve per room. If not
     * supplied, the server will apply a default limit.
     * @param from The pagination token to start returning results from, as
     * received from a previous call. If not supplied, results start at the most
     * recent topological event known to the server.
     * @param to The pagination token to stop returning results at. If not
     * supplied, results continue up to limit or until there are no more events.
     * @param direction The direction to search for according to MSC3715.
     * @returns Resolves to the room relations.
     */
  }, {
    key: "readEventRelations",
    value: function () {
      var _readEventRelations = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(eventId, roomId, relationType, eventType, limit, from, to, direction) {
        var versions, data;
        return _regeneratorRuntime().wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return this.getClientVersions();
            case 2:
              versions = _context.sent;
              if (versions.includes(_ApiVersion.UnstableApiVersion.MSC3869)) {
                _context.next = 5;
                break;
              }
              throw new Error("The read_relations action is not supported by the client.");
            case 5:
              data = {
                event_id: eventId,
                rel_type: relationType,
                event_type: eventType,
                room_id: roomId,
                to: to,
                from: from,
                limit: limit,
                direction: direction
              };
              return _context.abrupt("return", this.transport.send(_WidgetApiAction.WidgetApiFromWidgetAction.MSC3869ReadRelations, data));
            case 7:
            case "end":
              return _context.stop();
          }
        }, _callee, this);
      }));
      function readEventRelations(_x, _x2, _x3, _x4, _x5, _x6, _x7, _x8) {
        return _readEventRelations.apply(this, arguments);
      }
      return readEventRelations;
    }()
  }, {
    key: "readStateEvents",
    value: function readStateEvents(eventType, limit, stateKey, roomIds) {
      var data = {
        type: eventType,
        state_key: stateKey === undefined ? true : stateKey
      };
      if (limit !== undefined) {
        data.limit = limit;
      }
      if (roomIds) {
        if (roomIds.includes(_Symbols.Symbols.AnyRoom)) {
          data.room_ids = _Symbols.Symbols.AnyRoom;
        } else {
          data.room_ids = roomIds;
        }
      }
      return this.transport.send(_WidgetApiAction.WidgetApiFromWidgetAction.MSC2876ReadEvents, data).then(function (r) {
        return r.events;
      });
    }

    /**
     * Sets a button as disabled or enabled on the modal widget. Buttons are enabled by default.
     * @param {ModalButtonID} buttonId The button ID to enable/disable.
     * @param {boolean} isEnabled Whether or not the button is enabled.
     * @returns {Promise<void>} Resolves when complete.
     * @throws Throws if the button cannot be disabled, or the client refuses to disable the button.
     */
  }, {
    key: "setModalButtonEnabled",
    value: function setModalButtonEnabled(buttonId, isEnabled) {
      if (buttonId === _ModalWidgetActions.BuiltInModalButtonID.Close) {
        throw new Error("The close button cannot be disabled");
      }
      return this.transport.send(_WidgetApiAction.WidgetApiFromWidgetAction.SetModalButtonEnabled, {
        button: buttonId,
        enabled: isEnabled
      }).then();
    }

    /**
     * Attempts to navigate the client to the given URI. This can only be called with Matrix URIs
     * (currently only matrix.to, but in future a Matrix URI scheme will be defined).
     * @param {string} uri The URI to navigate to.
     * @returns {Promise<void>} Resolves when complete.
     * @throws Throws if the URI is invalid or cannot be processed.
     * @deprecated This currently relies on an unstable MSC (MSC2931).
     */
  }, {
    key: "navigateTo",
    value: function navigateTo(uri) {
      if (!uri || !uri.startsWith("https://matrix.to/#")) {
        throw new Error("Invalid matrix.to URI");
      }
      return this.transport.send(_WidgetApiAction.WidgetApiFromWidgetAction.MSC2931Navigate, {
        uri: uri
      }).then();
    }

    /**
     * Starts watching for TURN servers, yielding an initial set of credentials as soon as possible,
     * and thereafter yielding new credentials whenever the previous ones expire.
     * @yields {ITurnServer} The TURN server URIs and credentials currently available to the widget.
     */
  }, {
    key: "getTurnServers",
    value: function getTurnServers() {
      var _this = this;
      return _wrapAsyncGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3() {
        var setTurnServer, onUpdateTurnServers;
        return _regeneratorRuntime().wrap(function _callee3$(_context3) {
          while (1) switch (_context3.prev = _context3.next) {
            case 0:
              onUpdateTurnServers = /*#__PURE__*/function () {
                var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(ev) {
                  return _regeneratorRuntime().wrap(function _callee2$(_context2) {
                    while (1) switch (_context2.prev = _context2.next) {
                      case 0:
                        ev.preventDefault();
                        setTurnServer(ev.detail.data);
                        _context2.next = 4;
                        return _this.transport.reply(ev.detail, {});
                      case 4:
                      case "end":
                        return _context2.stop();
                    }
                  }, _callee2);
                }));
                return function onUpdateTurnServers(_x9) {
                  return _ref.apply(this, arguments);
                };
              }(); // Start listening for updates before we even start watching, to catch
              // TURN data that is sent immediately
              _this.on("action:".concat(_WidgetApiAction.WidgetApiToWidgetAction.UpdateTurnServers), onUpdateTurnServers);

              // Only send the 'watch' action if we aren't already watching
              if (!(_this.turnServerWatchers === 0)) {
                _context3.next = 12;
                break;
              }
              _context3.prev = 3;
              _context3.next = 6;
              return _awaitAsyncGenerator(_this.transport.send(_WidgetApiAction.WidgetApiFromWidgetAction.WatchTurnServers, {}));
            case 6:
              _context3.next = 12;
              break;
            case 8:
              _context3.prev = 8;
              _context3.t0 = _context3["catch"](3);
              _this.off("action:".concat(_WidgetApiAction.WidgetApiToWidgetAction.UpdateTurnServers), onUpdateTurnServers);
              throw _context3.t0;
            case 12:
              _this.turnServerWatchers++;
              _context3.prev = 13;
            case 14:
              if (!true) {
                _context3.next = 21;
                break;
              }
              _context3.next = 17;
              return _awaitAsyncGenerator(new Promise(function (resolve) {
                return setTurnServer = resolve;
              }));
            case 17:
              _context3.next = 19;
              return _context3.sent;
            case 19:
              _context3.next = 14;
              break;
            case 21:
              _context3.prev = 21;
              // The loop was broken by the caller - clean up
              _this.off("action:".concat(_WidgetApiAction.WidgetApiToWidgetAction.UpdateTurnServers), onUpdateTurnServers);

              // Since sending the 'unwatch' action will end updates for all other
              // consumers, only send it if we're the only consumer remaining
              _this.turnServerWatchers--;
              if (!(_this.turnServerWatchers === 0)) {
                _context3.next = 27;
                break;
              }
              _context3.next = 27;
              return _awaitAsyncGenerator(_this.transport.send(_WidgetApiAction.WidgetApiFromWidgetAction.UnwatchTurnServers, {}));
            case 27:
              return _context3.finish(21);
            case 28:
            case "end":
              return _context3.stop();
          }
        }, _callee3, null, [[3, 8], [13,, 21, 28]]);
      }))();
    }

    /**
     * Search for users in the user directory.
     * @param searchTerm The term to search for.
     * @param limit The maximum number of results to return. If not supplied, the
     * @returns Resolves to the search results.
     */
  }, {
    key: "searchUserDirectory",
    value: function () {
      var _searchUserDirectory = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4(searchTerm, limit) {
        var versions, data;
        return _regeneratorRuntime().wrap(function _callee4$(_context4) {
          while (1) switch (_context4.prev = _context4.next) {
            case 0:
              _context4.next = 2;
              return this.getClientVersions();
            case 2:
              versions = _context4.sent;
              if (versions.includes(_ApiVersion.UnstableApiVersion.MSC3973)) {
                _context4.next = 5;
                break;
              }
              throw new Error("The user_directory_search action is not supported by the client.");
            case 5:
              data = {
                search_term: searchTerm,
                limit: limit
              };
              return _context4.abrupt("return", this.transport.send(_WidgetApiAction.WidgetApiFromWidgetAction.MSC3973UserDirectorySearch, data));
            case 7:
            case "end":
              return _context4.stop();
          }
        }, _callee4, this);
      }));
      function searchUserDirectory(_x10, _x11) {
        return _searchUserDirectory.apply(this, arguments);
      }
      return searchUserDirectory;
    }()
    /**
     * Get the config for the media repository.
     * @returns Promise which resolves with an object containing the config.
     */
  }, {
    key: "getMediaConfig",
    value: function () {
      var _getMediaConfig = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5() {
        var versions, data;
        return _regeneratorRuntime().wrap(function _callee5$(_context5) {
          while (1) switch (_context5.prev = _context5.next) {
            case 0:
              _context5.next = 2;
              return this.getClientVersions();
            case 2:
              versions = _context5.sent;
              if (versions.includes(_ApiVersion.UnstableApiVersion.MSC4039)) {
                _context5.next = 5;
                break;
              }
              throw new Error("The get_media_config action is not supported by the client.");
            case 5:
              data = {};
              return _context5.abrupt("return", this.transport.send(_WidgetApiAction.WidgetApiFromWidgetAction.MSC4039GetMediaConfigAction, data));
            case 7:
            case "end":
              return _context5.stop();
          }
        }, _callee5, this);
      }));
      function getMediaConfig() {
        return _getMediaConfig.apply(this, arguments);
      }
      return getMediaConfig;
    }()
    /**
     * Upload a file to the media repository on the homeserver.
     * @param file - The object to upload. Something that can be sent to
     *               XMLHttpRequest.send (typically a File).
     * @returns Resolves to the location of the uploaded file.
     */
  }, {
    key: "uploadFile",
    value: function () {
      var _uploadFile = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee6(file) {
        var versions, data;
        return _regeneratorRuntime().wrap(function _callee6$(_context6) {
          while (1) switch (_context6.prev = _context6.next) {
            case 0:
              _context6.next = 2;
              return this.getClientVersions();
            case 2:
              versions = _context6.sent;
              if (versions.includes(_ApiVersion.UnstableApiVersion.MSC4039)) {
                _context6.next = 5;
                break;
              }
              throw new Error("The upload_file action is not supported by the client.");
            case 5:
              data = {
                file: file
              };
              return _context6.abrupt("return", this.transport.send(_WidgetApiAction.WidgetApiFromWidgetAction.MSC4039UploadFileAction, data));
            case 7:
            case "end":
              return _context6.stop();
          }
        }, _callee6, this);
      }));
      function uploadFile(_x12) {
        return _uploadFile.apply(this, arguments);
      }
      return uploadFile;
    }()
    /**
     * Download a file from the media repository on the homeserver.
     * @param contentUri - MXC URI of the file to download.
     * @returns Resolves to the contents of the file.
     */
  }, {
    key: "downloadFile",
    value: function () {
      var _downloadFile = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee7(contentUri) {
        var versions, data;
        return _regeneratorRuntime().wrap(function _callee7$(_context7) {
          while (1) switch (_context7.prev = _context7.next) {
            case 0:
              _context7.next = 2;
              return this.getClientVersions();
            case 2:
              versions = _context7.sent;
              if (versions.includes(_ApiVersion.UnstableApiVersion.MSC4039)) {
                _context7.next = 5;
                break;
              }
              throw new Error("The download_file action is not supported by the client.");
            case 5:
              data = {
                content_uri: contentUri
              };
              return _context7.abrupt("return", this.transport.send(_WidgetApiAction.WidgetApiFromWidgetAction.MSC4039DownloadFileAction, data));
            case 7:
            case "end":
              return _context7.stop();
          }
        }, _callee7, this);
      }));
      function downloadFile(_x13) {
        return _downloadFile.apply(this, arguments);
      }
      return downloadFile;
    }()
    /**
     * Starts the communication channel. This should be done early to ensure
     * that messages are not missed. Communication can only be stopped by the client.
     */
  }, {
    key: "start",
    value: function start() {
      var _this6 = this;
      this.transport.start();
      this.getClientVersions().then(function (v) {
        if (v.includes(_ApiVersion.UnstableApiVersion.MSC2974)) {
          _this6.supportsMSC2974Renegotiate = true;
        }
      });
    }
  }, {
    key: "handleMessage",
    value: function handleMessage(ev) {
      var actionEv = new CustomEvent("action:".concat(ev.detail.action), {
        detail: ev.detail,
        cancelable: true
      });
      this.emit("action:".concat(ev.detail.action), actionEv);
      if (!actionEv.defaultPrevented) {
        switch (ev.detail.action) {
          case _WidgetApiAction.WidgetApiToWidgetAction.SupportedApiVersions:
            return this.replyVersions(ev.detail);
          case _WidgetApiAction.WidgetApiToWidgetAction.Capabilities:
            return this.handleCapabilities(ev.detail);
          case _WidgetApiAction.WidgetApiToWidgetAction.UpdateVisibility:
            return this.transport.reply(ev.detail, {});
          // ack to avoid error spam
          case _WidgetApiAction.WidgetApiToWidgetAction.NotifyCapabilities:
            return this.transport.reply(ev.detail, {});
          // ack to avoid error spam
          default:
            return this.transport.reply(ev.detail, {
              error: {
                message: "Unknown or unsupported action: " + ev.detail.action
              }
            });
        }
      }
    }
  }, {
    key: "replyVersions",
    value: function replyVersions(request) {
      this.transport.reply(request, {
        supported_versions: _ApiVersion.CurrentApiVersions
      });
    }
  }, {
    key: "getClientVersions",
    value: function getClientVersions() {
      var _this7 = this;
      if (Array.isArray(this.cachedClientVersions)) {
        return Promise.resolve(this.cachedClientVersions);
      }
      return this.transport.send(_WidgetApiAction.WidgetApiFromWidgetAction.SupportedApiVersions, {}).then(function (r) {
        _this7.cachedClientVersions = r.supported_versions;
        return r.supported_versions;
      })["catch"](function (e) {
        console.warn("non-fatal error getting supported client versions: ", e);
        return [];
      });
    }
  }, {
    key: "handleCapabilities",
    value: function handleCapabilities(request) {
      var _this8 = this;
      if (this.capabilitiesFinished) {
        return this.transport.reply(request, {
          error: {
            message: "Capability negotiation already completed"
          }
        });
      }

      // See if we can expect a capabilities notification or not
      return this.getClientVersions().then(function (v) {
        if (v.includes(_ApiVersion.UnstableApiVersion.MSC2871)) {
          _this8.once("action:".concat(_WidgetApiAction.WidgetApiToWidgetAction.NotifyCapabilities), function (ev) {
            _this8.approvedCapabilities = ev.detail.data.approved;
            _this8.emit("ready");
          });
        } else {
          // if we can't expect notification, we're as done as we can be
          _this8.emit("ready");
        }

        // in either case, reply to that capabilities request
        _this8.capabilitiesFinished = true;
        return _this8.transport.reply(request, {
          capabilities: _this8.requestedCapabilities
        });
      });
    }
  }]);
  return WidgetApi;
}(_events.EventEmitter);
exports.WidgetApi = WidgetApi;

},{"./Symbols":2,"./interfaces/ApiVersion":6,"./interfaces/GetOpenIDAction":12,"./interfaces/ModalWidgetActions":23,"./interfaces/WidgetApiAction":39,"./interfaces/WidgetApiDirection":40,"./interfaces/WidgetType":43,"./models/WidgetEventCapability":45,"./transport/PostmessageTransport":51,"events":53}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WidgetDriver = void 0;
var _ = require("..");
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); } /*
                                                                                                                                                                                                                                                                                                                                                                                               * Copyright 2020 - 2024 The Matrix.org Foundation C.I.C.
                                                                                                                                                                                                                                                                                                                                                                                               *
                                                                                                                                                                                                                                                                                                                                                                                               * Licensed under the Apache License, Version 2.0 (the "License");
                                                                                                                                                                                                                                                                                                                                                                                               * you may not use this file except in compliance with the License.
                                                                                                                                                                                                                                                                                                                                                                                               * You may obtain a copy of the License at
                                                                                                                                                                                                                                                                                                                                                                                               *
                                                                                                                                                                                                                                                                                                                                                                                               *         http://www.apache.org/licenses/LICENSE-2.0
                                                                                                                                                                                                                                                                                                                                                                                               *
                                                                                                                                                                                                                                                                                                                                                                                               * Unless required by applicable law or agreed to in writing, software
                                                                                                                                                                                                                                                                                                                                                                                               * distributed under the License is distributed on an "AS IS" BASIS,
                                                                                                                                                                                                                                                                                                                                                                                               * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                                                                                                                                                                                                                                                                                                                                                                                               * See the License for the specific language governing permissions and
                                                                                                                                                                                                                                                                                                                                                                                               * limitations under the License.
                                                                                                                                                                                                                                                                                                                                                                                               */
/**
 * Represents the functions and behaviour the widget-api is unable to
 * do, such as prompting the user for information or interacting with
 * the UI. Clients are expected to implement this class and override
 * any functions they need/want to support.
 *
 * This class assumes the client will have a context of a Widget
 * instance already.
 */
var WidgetDriver = /*#__PURE__*/function () {
  function WidgetDriver() {
    _classCallCheck(this, WidgetDriver);
  }
  _createClass(WidgetDriver, [{
    key: "validateCapabilities",
    value:
    /**
     * Verifies the widget's requested capabilities, returning the ones
     * it is approved to use. Mutating the requested capabilities will
     * have no effect.
     *
     * This SHOULD result in the user being prompted to approve/deny
     * capabilities.
     *
     * By default this rejects all capabilities (returns an empty set).
     * @param {Set<Capability>} requested The set of requested capabilities.
     * @returns {Promise<Set<Capability>>} Resolves to the allowed capabilities.
     */
    function validateCapabilities(requested) {
      return Promise.resolve(new Set());
    }

    /**
     * Sends an event into a room. If `roomId` is falsy, the client should send the event
     * into the room the user is currently looking at. The widget API will have already
     * verified that the widget is capable of sending the event to that room.
     * @param {string} eventType The event type to be sent.
     * @param {*} content The content for the event.
     * @param {string|null} stateKey The state key if this is a state event, otherwise null.
     * May be an empty string.
     * @param {string|null} roomId The room ID to send the event to. If falsy, the room the
     * user is currently looking at.
     * @returns {Promise<ISendEventDetails>} Resolves when the event has been sent with
     * details of that event.
     * @throws Rejected when the event could not be sent.
     */
  }, {
    key: "sendEvent",
    value: function sendEvent(eventType, content) {
      var stateKey = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      var roomId = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
      return Promise.reject(new Error("Failed to override function"));
    }

    /**
     * @experimental Part of MSC4140 & MSC4157
     * Sends a delayed event into a room. If `roomId` is falsy, the client should send it
     * into the room the user is currently looking at. The widget API will have already
     * verified that the widget is capable of sending the event to that room.
     * @param {number|null} delay How much later to send the event, or null to not send the
     * event automatically. May not be null if {@link parentDelayId} is null.
     * @param {string|null} parentDelayId The ID of the delayed event this one is grouped with,
     * or null if it will be put in a new group. May not be null if {@link delay} is null.
     * @param {string} eventType The event type of the event to be sent.
     * @param {*} content The content for the event to be sent.
     * @param {string|null} stateKey The state key if the event to be sent a state event,
     * otherwise null. May be an empty string.
     * @param {string|null} roomId The room ID to send the event to. If falsy, the room the
     * user is currently looking at.
     * @returns {Promise<ISendDelayedEventDetails>} Resolves when the delayed event has been
     * prepared with details of how to refer to it for updating/sending/canceling it later.
     * @throws Rejected when the delayed event could not be sent.
     */
  }, {
    key: "sendDelayedEvent",
    value: function sendDelayedEvent(delay, parentDelayId, eventType, content) {
      var stateKey = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
      var roomId = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : null;
      return Promise.reject(new Error("Failed to override function"));
    }

    /**
     * @experimental Part of MSC4140 & MSC4157
     * Run the specified {@link action} for the delayed event matching the provided {@link delayId}.
     * @throws Rejected when there is no matching delayed event, or when the action failed to run.
     */
  }, {
    key: "updateDelayedEvent",
    value: function updateDelayedEvent(delayId, action) {
      return Promise.reject(new Error("Failed to override function"));
    }

    /**
     * Sends a to-device event. The widget API will have already verified that the widget
     * is capable of sending the event.
     * @param {string} eventType The event type to be sent.
     * @param {boolean} encrypted Whether to encrypt the message contents.
     * @param {Object} contentMap A map from user ID and device ID to event content.
     * @returns {Promise<void>} Resolves when the event has been sent.
     * @throws Rejected when the event could not be sent.
     */
  }, {
    key: "sendToDevice",
    value: function sendToDevice(eventType, encrypted, contentMap) {
      return Promise.reject(new Error("Failed to override function"));
    }
    /**
     * Reads an element of room account data. The widget API will have already verified that the widget is
     * capable of receiving the `eventType` of the requested information. If `roomIds` is supplied, it may
     * contain `Symbols.AnyRoom` to denote that the piece of room account data in each of the client's known
     * rooms should be returned. When `null`, only the room the user is currently looking at should be considered.
     * @param eventType The event type to be read.
     * @param roomIds When null, the user's currently viewed room. Otherwise, the list of room IDs
     * to look within, possibly containing Symbols.AnyRoom to denote all known rooms.
     * @returns {Promise<IRoomAccountData[]>} Resolves to the element of room account data, or an empty array.
     */
  }, {
    key: "readRoomAccountData",
    value: function readRoomAccountData(eventType) {
      var roomIds = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      return Promise.resolve([]);
    }

    /**
     * Reads all events of the given type, and optionally `msgtype` (if applicable/defined),
     * the user has access to. The widget API will have already verified that the widget is
     * capable of receiving the events. Less events than the limit are allowed to be returned,
     * but not more. If `roomIds` is supplied, it may contain `Symbols.AnyRoom` to denote that
     * `limit` in each of the client's known rooms should be returned. When `null`, only the
     * room the user is currently looking at should be considered. If `since` is specified but
     * the event ID isn't present in the number of events fetched by the client due to `limit`,
     * the client will return all the events.
     * @param eventType The event type to be read.
     * @param msgtype The msgtype of the events to be read, if applicable/defined.
     * @param limit The maximum number of events to retrieve per room. Will be zero to denote "as many
     * as possible".
     * @param roomIds When null, the user's currently viewed room. Otherwise, the list of room IDs
     * to look within, possibly containing Symbols.AnyRoom to denote all known rooms.
     * @param since When null, retrieves the number of events specified by the "limit" parameter.
     * Otherwise, the event ID at which only subsequent events will be returned, as many as specified
     * in "limit".
     * @returns {Promise<IRoomEvent[]>} Resolves to the room events, or an empty array.
     */
  }, {
    key: "readRoomEvents",
    value: function readRoomEvents(eventType, msgtype, limit) {
      var roomIds = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
      var since = arguments.length > 4 ? arguments[4] : undefined;
      return Promise.resolve([]);
    }

    /**
     * Reads all events of the given type, and optionally state key (if applicable/defined),
     * the user has access to. The widget API will have already verified that the widget is
     * capable of receiving the events. Less events than the limit are allowed to be returned,
     * but not more. If `roomIds` is supplied, it may contain `Symbols.AnyRoom` to denote that
     * `limit` in each of the client's known rooms should be returned. When `null`, only the
     * room the user is currently looking at should be considered.
     * @param eventType The event type to be read.
     * @param stateKey The state key of the events to be read, if applicable/defined.
     * @param limit The maximum number of events to retrieve. Will be zero to denote "as many
     * as possible".
     * @param roomIds When null, the user's currently viewed room. Otherwise, the list of room IDs
     * to look within, possibly containing Symbols.AnyRoom to denote all known rooms.
     * @returns {Promise<IRoomEvent[]>} Resolves to the state events, or an empty array.
     */
  }, {
    key: "readStateEvents",
    value: function readStateEvents(eventType, stateKey, limit) {
      var roomIds = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
      return Promise.resolve([]);
    }

    /**
     * Reads all events that are related to a given event. The widget API will
     * have already verified that the widget is capable of receiving the event,
     * or will make sure to reject access to events which are returned from this
     * function, but are not capable of receiving. If `relationType` or `eventType`
     * are set, the returned events should already be filtered. Less events than
     * the limit are allowed to be returned, but not more.
     * @param eventId The id of the parent event to be read.
     * @param roomId The room to look within. When undefined, the user's
     * currently viewed room.
     * @param relationType The relationship type of child events to search for.
     * When undefined, all relations are returned.
     * @param eventType The event type of child events to search for. When undefined,
     * all related events are returned.
     * @param from The pagination token to start returning results from, as
     * received from a previous call. If not supplied, results start at the most
     * recent topological event known to the server.
     * @param to The pagination token to stop returning results at. If not
     * supplied, results continue up to limit or until there are no more events.
     * @param limit The maximum number of events to retrieve per room. If not
     * supplied, the server will apply a default limit.
     * @param direction The direction to search for according to MSC3715
     * @returns Resolves to the room relations.
     */
  }, {
    key: "readEventRelations",
    value: function readEventRelations(eventId, roomId, relationType, eventType, from, to, limit, direction) {
      return Promise.resolve({
        chunk: []
      });
    }

    /**
     * Asks the user for permission to validate their identity through OpenID Connect. The
     * interface for this function is an observable which accepts the state machine of the
     * OIDC exchange flow. For example, if the client/user blocks the request then it would
     * feed back a `{state: Blocked}` into the observable. Similarly, if the user already
     * approved the widget then a `{state: Allowed}` would be fed into the observable alongside
     * the token itself. If the client is asking for permission, it should feed in a
     * `{state: PendingUserConfirmation}` followed by the relevant Allowed or Blocked state.
     *
     * The widget API will reject the widget's request with an error if this contract is not
     * met properly. By default, the widget driver will block all OIDC requests.
     * @param {SimpleObservable<IOpenIDUpdate>} observer The observable to feed updates into.
     */
  }, {
    key: "askOpenID",
    value: function askOpenID(observer) {
      observer.update({
        state: _.OpenIDRequestState.Blocked
      });
    }

    /**
     * Navigates the client with a matrix.to URI. In future this function will also be provided
     * with the Matrix URIs once matrix.to is replaced. The given URI will have already been
     * lightly checked to ensure it looks like a valid URI, though the implementation is recommended
     * to do further checks on the URI.
     * @param {string} uri The URI to navigate to.
     * @returns {Promise<void>} Resolves when complete.
     * @throws Throws if there's a problem with the navigation, such as invalid format.
     */
  }, {
    key: "navigate",
    value: function navigate(uri) {
      throw new Error("Navigation is not implemented");
    }

    /**
     * Polls for TURN server data, yielding an initial set of credentials as soon as possible, and
     * thereafter yielding new credentials whenever the previous ones expire. The widget API will
     * have already verified that the widget has permission to access TURN servers.
     * @yields {ITurnServer} The TURN server URIs and credentials currently available to the client.
     */
  }, {
    key: "getTurnServers",
    value: function getTurnServers() {
      throw new Error("TURN server support is not implemented");
    }

    /**
     * Search for users in the user directory.
     * @param searchTerm The term to search for.
     * @param limit The maximum number of results to return. If not supplied, the
     * @returns Resolves to the search results.
     */
  }, {
    key: "searchUserDirectory",
    value: function searchUserDirectory(searchTerm, limit) {
      return Promise.resolve({
        limited: false,
        results: []
      });
    }

    /**
     * Get the config for the media repository.
     * @returns Promise which resolves with an object containing the config.
     */
  }, {
    key: "getMediaConfig",
    value: function getMediaConfig() {
      throw new Error("Get media config is not implemented");
    }

    /**
     * Upload a file to the media repository on the homeserver.
     * @param file - The object to upload. Something that can be sent to
     *               XMLHttpRequest.send (typically a File).
     * @returns Resolves to the location of the uploaded file.
     */
  }, {
    key: "uploadFile",
    value: function uploadFile(file) {
      throw new Error("Upload file is not implemented");
    }

    /**
     * Download a file from the media repository on the homeserver.
     * @param contentUri - MXC URI of the file to download.
     * @returns Resolves to the contents of the file.
     */
  }, {
    key: "downloadFile",
    value: function downloadFile(contentUri) {
      throw new Error("Download file is not implemented");
    }

    /**
     * Expresses an error thrown by this driver in a format compatible with the Widget API.
     * @param error The error to handle.
     * @returns The error expressed as a {@link IWidgetApiErrorResponseDataDetails},
     * or undefined if it cannot be expressed as one.
     */
  }, {
    key: "processError",
    value: function processError(error) {
      return undefined;
    }
  }]);
  return WidgetDriver;
}();
exports.WidgetDriver = WidgetDriver;

},{"..":5}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _WidgetApi = require("./WidgetApi");
Object.keys(_WidgetApi).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _WidgetApi[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _WidgetApi[key];
    }
  });
});
var _ClientWidgetApi = require("./ClientWidgetApi");
Object.keys(_ClientWidgetApi).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _ClientWidgetApi[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _ClientWidgetApi[key];
    }
  });
});
var _Symbols = require("./Symbols");
Object.keys(_Symbols).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _Symbols[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _Symbols[key];
    }
  });
});
var _ITransport = require("./transport/ITransport");
Object.keys(_ITransport).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _ITransport[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _ITransport[key];
    }
  });
});
var _PostmessageTransport = require("./transport/PostmessageTransport");
Object.keys(_PostmessageTransport).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _PostmessageTransport[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _PostmessageTransport[key];
    }
  });
});
var _ICustomWidgetData = require("./interfaces/ICustomWidgetData");
Object.keys(_ICustomWidgetData).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _ICustomWidgetData[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _ICustomWidgetData[key];
    }
  });
});
var _IJitsiWidgetData = require("./interfaces/IJitsiWidgetData");
Object.keys(_IJitsiWidgetData).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _IJitsiWidgetData[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _IJitsiWidgetData[key];
    }
  });
});
var _IStickerpickerWidgetData = require("./interfaces/IStickerpickerWidgetData");
Object.keys(_IStickerpickerWidgetData).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _IStickerpickerWidgetData[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _IStickerpickerWidgetData[key];
    }
  });
});
var _IWidget = require("./interfaces/IWidget");
Object.keys(_IWidget).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _IWidget[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _IWidget[key];
    }
  });
});
var _WidgetType = require("./interfaces/WidgetType");
Object.keys(_WidgetType).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _WidgetType[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _WidgetType[key];
    }
  });
});
var _IWidgetApiErrorResponse = require("./interfaces/IWidgetApiErrorResponse");
Object.keys(_IWidgetApiErrorResponse).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _IWidgetApiErrorResponse[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _IWidgetApiErrorResponse[key];
    }
  });
});
var _IWidgetApiRequest = require("./interfaces/IWidgetApiRequest");
Object.keys(_IWidgetApiRequest).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _IWidgetApiRequest[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _IWidgetApiRequest[key];
    }
  });
});
var _IWidgetApiResponse = require("./interfaces/IWidgetApiResponse");
Object.keys(_IWidgetApiResponse).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _IWidgetApiResponse[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _IWidgetApiResponse[key];
    }
  });
});
var _WidgetApiAction = require("./interfaces/WidgetApiAction");
Object.keys(_WidgetApiAction).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _WidgetApiAction[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _WidgetApiAction[key];
    }
  });
});
var _WidgetApiDirection = require("./interfaces/WidgetApiDirection");
Object.keys(_WidgetApiDirection).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _WidgetApiDirection[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _WidgetApiDirection[key];
    }
  });
});
var _ApiVersion = require("./interfaces/ApiVersion");
Object.keys(_ApiVersion).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _ApiVersion[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _ApiVersion[key];
    }
  });
});
var _Capabilities = require("./interfaces/Capabilities");
Object.keys(_Capabilities).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _Capabilities[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _Capabilities[key];
    }
  });
});
var _CapabilitiesAction = require("./interfaces/CapabilitiesAction");
Object.keys(_CapabilitiesAction).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _CapabilitiesAction[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _CapabilitiesAction[key];
    }
  });
});
var _ContentLoadedAction = require("./interfaces/ContentLoadedAction");
Object.keys(_ContentLoadedAction).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _ContentLoadedAction[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _ContentLoadedAction[key];
    }
  });
});
var _ScreenshotAction = require("./interfaces/ScreenshotAction");
Object.keys(_ScreenshotAction).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _ScreenshotAction[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _ScreenshotAction[key];
    }
  });
});
var _StickerAction = require("./interfaces/StickerAction");
Object.keys(_StickerAction).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _StickerAction[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _StickerAction[key];
    }
  });
});
var _StickyAction = require("./interfaces/StickyAction");
Object.keys(_StickyAction).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _StickyAction[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _StickyAction[key];
    }
  });
});
var _SupportedVersionsAction = require("./interfaces/SupportedVersionsAction");
Object.keys(_SupportedVersionsAction).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _SupportedVersionsAction[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _SupportedVersionsAction[key];
    }
  });
});
var _VisibilityAction = require("./interfaces/VisibilityAction");
Object.keys(_VisibilityAction).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _VisibilityAction[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _VisibilityAction[key];
    }
  });
});
var _GetOpenIDAction = require("./interfaces/GetOpenIDAction");
Object.keys(_GetOpenIDAction).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _GetOpenIDAction[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _GetOpenIDAction[key];
    }
  });
});
var _OpenIDCredentialsAction = require("./interfaces/OpenIDCredentialsAction");
Object.keys(_OpenIDCredentialsAction).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _OpenIDCredentialsAction[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _OpenIDCredentialsAction[key];
    }
  });
});
var _WidgetKind = require("./interfaces/WidgetKind");
Object.keys(_WidgetKind).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _WidgetKind[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _WidgetKind[key];
    }
  });
});
var _ModalButtonKind = require("./interfaces/ModalButtonKind");
Object.keys(_ModalButtonKind).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _ModalButtonKind[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _ModalButtonKind[key];
    }
  });
});
var _ModalWidgetActions = require("./interfaces/ModalWidgetActions");
Object.keys(_ModalWidgetActions).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _ModalWidgetActions[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _ModalWidgetActions[key];
    }
  });
});
var _SetModalButtonEnabledAction = require("./interfaces/SetModalButtonEnabledAction");
Object.keys(_SetModalButtonEnabledAction).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _SetModalButtonEnabledAction[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _SetModalButtonEnabledAction[key];
    }
  });
});
var _WidgetConfigAction = require("./interfaces/WidgetConfigAction");
Object.keys(_WidgetConfigAction).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _WidgetConfigAction[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _WidgetConfigAction[key];
    }
  });
});
var _SendEventAction = require("./interfaces/SendEventAction");
Object.keys(_SendEventAction).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _SendEventAction[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _SendEventAction[key];
    }
  });
});
var _SendToDeviceAction = require("./interfaces/SendToDeviceAction");
Object.keys(_SendToDeviceAction).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _SendToDeviceAction[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _SendToDeviceAction[key];
    }
  });
});
var _ReadEventAction = require("./interfaces/ReadEventAction");
Object.keys(_ReadEventAction).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _ReadEventAction[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _ReadEventAction[key];
    }
  });
});
var _IRoomEvent = require("./interfaces/IRoomEvent");
Object.keys(_IRoomEvent).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _IRoomEvent[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _IRoomEvent[key];
    }
  });
});
var _IRoomAccountData = require("./interfaces/IRoomAccountData");
Object.keys(_IRoomAccountData).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _IRoomAccountData[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _IRoomAccountData[key];
    }
  });
});
var _NavigateAction = require("./interfaces/NavigateAction");
Object.keys(_NavigateAction).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _NavigateAction[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _NavigateAction[key];
    }
  });
});
var _TurnServerActions = require("./interfaces/TurnServerActions");
Object.keys(_TurnServerActions).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _TurnServerActions[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _TurnServerActions[key];
    }
  });
});
var _ReadRelationsAction = require("./interfaces/ReadRelationsAction");
Object.keys(_ReadRelationsAction).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _ReadRelationsAction[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _ReadRelationsAction[key];
    }
  });
});
var _GetMediaConfigAction = require("./interfaces/GetMediaConfigAction");
Object.keys(_GetMediaConfigAction).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _GetMediaConfigAction[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _GetMediaConfigAction[key];
    }
  });
});
var _UpdateDelayedEventAction = require("./interfaces/UpdateDelayedEventAction");
Object.keys(_UpdateDelayedEventAction).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _UpdateDelayedEventAction[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _UpdateDelayedEventAction[key];
    }
  });
});
var _UploadFileAction = require("./interfaces/UploadFileAction");
Object.keys(_UploadFileAction).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _UploadFileAction[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _UploadFileAction[key];
    }
  });
});
var _DownloadFileAction = require("./interfaces/DownloadFileAction");
Object.keys(_DownloadFileAction).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _DownloadFileAction[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _DownloadFileAction[key];
    }
  });
});
var _WidgetEventCapability = require("./models/WidgetEventCapability");
Object.keys(_WidgetEventCapability).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _WidgetEventCapability[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _WidgetEventCapability[key];
    }
  });
});
var _url = require("./models/validation/url");
Object.keys(_url).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _url[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _url[key];
    }
  });
});
var _utils = require("./models/validation/utils");
Object.keys(_utils).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _utils[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _utils[key];
    }
  });
});
var _Widget = require("./models/Widget");
Object.keys(_Widget).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _Widget[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _Widget[key];
    }
  });
});
var _WidgetParser = require("./models/WidgetParser");
Object.keys(_WidgetParser).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _WidgetParser[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _WidgetParser[key];
    }
  });
});
var _urlTemplate = require("./templating/url-template");
Object.keys(_urlTemplate).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _urlTemplate[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _urlTemplate[key];
    }
  });
});
var _SimpleObservable = require("./util/SimpleObservable");
Object.keys(_SimpleObservable).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _SimpleObservable[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _SimpleObservable[key];
    }
  });
});
var _WidgetDriver = require("./driver/WidgetDriver");
Object.keys(_WidgetDriver).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _WidgetDriver[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _WidgetDriver[key];
    }
  });
});

},{"./ClientWidgetApi":1,"./Symbols":2,"./WidgetApi":3,"./driver/WidgetDriver":4,"./interfaces/ApiVersion":6,"./interfaces/Capabilities":7,"./interfaces/CapabilitiesAction":8,"./interfaces/ContentLoadedAction":9,"./interfaces/DownloadFileAction":10,"./interfaces/GetMediaConfigAction":11,"./interfaces/GetOpenIDAction":12,"./interfaces/ICustomWidgetData":13,"./interfaces/IJitsiWidgetData":14,"./interfaces/IRoomAccountData":15,"./interfaces/IRoomEvent":16,"./interfaces/IStickerpickerWidgetData":17,"./interfaces/IWidget":18,"./interfaces/IWidgetApiErrorResponse":19,"./interfaces/IWidgetApiRequest":20,"./interfaces/IWidgetApiResponse":21,"./interfaces/ModalButtonKind":22,"./interfaces/ModalWidgetActions":23,"./interfaces/NavigateAction":24,"./interfaces/OpenIDCredentialsAction":25,"./interfaces/ReadEventAction":26,"./interfaces/ReadRelationsAction":27,"./interfaces/ScreenshotAction":28,"./interfaces/SendEventAction":29,"./interfaces/SendToDeviceAction":30,"./interfaces/SetModalButtonEnabledAction":31,"./interfaces/StickerAction":32,"./interfaces/StickyAction":33,"./interfaces/SupportedVersionsAction":34,"./interfaces/TurnServerActions":35,"./interfaces/UpdateDelayedEventAction":36,"./interfaces/UploadFileAction":37,"./interfaces/VisibilityAction":38,"./interfaces/WidgetApiAction":39,"./interfaces/WidgetApiDirection":40,"./interfaces/WidgetConfigAction":41,"./interfaces/WidgetKind":42,"./interfaces/WidgetType":43,"./models/Widget":44,"./models/WidgetEventCapability":45,"./models/WidgetParser":46,"./models/validation/url":47,"./models/validation/utils":48,"./templating/url-template":49,"./transport/ITransport":50,"./transport/PostmessageTransport":51,"./util/SimpleObservable":52}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UnstableApiVersion = exports.MatrixApiVersion = exports.CurrentApiVersions = void 0;
/*
 * Copyright 2020 The Matrix.org Foundation C.I.C.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var MatrixApiVersion = /*#__PURE__*/function (MatrixApiVersion) {
  MatrixApiVersion["Prerelease1"] = "0.0.1";
  MatrixApiVersion["Prerelease2"] = "0.0.2";
  return MatrixApiVersion;
}({}); //V010 = "0.1.0", // first release
exports.MatrixApiVersion = MatrixApiVersion;
var UnstableApiVersion = /*#__PURE__*/function (UnstableApiVersion) {
  UnstableApiVersion["MSC2762"] = "org.matrix.msc2762";
  UnstableApiVersion["MSC2871"] = "org.matrix.msc2871";
  UnstableApiVersion["MSC2931"] = "org.matrix.msc2931";
  UnstableApiVersion["MSC2974"] = "org.matrix.msc2974";
  UnstableApiVersion["MSC2876"] = "org.matrix.msc2876";
  UnstableApiVersion["MSC3819"] = "org.matrix.msc3819";
  UnstableApiVersion["MSC3846"] = "town.robin.msc3846";
  UnstableApiVersion["MSC3869"] = "org.matrix.msc3869";
  UnstableApiVersion["MSC3973"] = "org.matrix.msc3973";
  UnstableApiVersion["MSC4039"] = "org.matrix.msc4039";
  return UnstableApiVersion;
}({});
exports.UnstableApiVersion = UnstableApiVersion;
var CurrentApiVersions = [MatrixApiVersion.Prerelease1, MatrixApiVersion.Prerelease2,
//MatrixApiVersion.V010,
UnstableApiVersion.MSC2762, UnstableApiVersion.MSC2871, UnstableApiVersion.MSC2931, UnstableApiVersion.MSC2974, UnstableApiVersion.MSC2876, UnstableApiVersion.MSC3819, UnstableApiVersion.MSC3846, UnstableApiVersion.MSC3869, UnstableApiVersion.MSC3973, UnstableApiVersion.MSC4039];
exports.CurrentApiVersions = CurrentApiVersions;

},{}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.VideoConferenceCapabilities = exports.StickerpickerCapabilities = exports.MatrixCapabilities = void 0;
exports.getTimelineRoomIDFromCapability = getTimelineRoomIDFromCapability;
exports.isTimelineCapability = isTimelineCapability;
exports.isTimelineCapabilityFor = isTimelineCapabilityFor;
/*
 * Copyright 2020 - 2021 The Matrix.org Foundation C.I.C.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var MatrixCapabilities = /*#__PURE__*/function (MatrixCapabilities) {
  MatrixCapabilities["Screenshots"] = "m.capability.screenshot";
  MatrixCapabilities["StickerSending"] = "m.sticker";
  MatrixCapabilities["AlwaysOnScreen"] = "m.always_on_screen";
  MatrixCapabilities["RequiresClient"] = "io.element.requires_client";
  MatrixCapabilities["MSC2931Navigate"] = "org.matrix.msc2931.navigate";
  MatrixCapabilities["MSC3846TurnServers"] = "town.robin.msc3846.turn_servers";
  MatrixCapabilities["MSC3973UserDirectorySearch"] = "org.matrix.msc3973.user_directory_search";
  MatrixCapabilities["MSC4039UploadFile"] = "org.matrix.msc4039.upload_file";
  MatrixCapabilities["MSC4039DownloadFile"] = "org.matrix.msc4039.download_file";
  MatrixCapabilities["MSC4157SendDelayedEvent"] = "org.matrix.msc4157.send.delayed_event";
  MatrixCapabilities["MSC4157UpdateDelayedEvent"] = "org.matrix.msc4157.update_delayed_event";
  return MatrixCapabilities;
}({});
exports.MatrixCapabilities = MatrixCapabilities;
var StickerpickerCapabilities = [MatrixCapabilities.StickerSending];
exports.StickerpickerCapabilities = StickerpickerCapabilities;
var VideoConferenceCapabilities = [MatrixCapabilities.AlwaysOnScreen];

/**
 * Determines if a capability is a capability for a timeline.
 * @param {Capability} capability The capability to test.
 * @returns {boolean} True if a timeline capability, false otherwise.
 */
exports.VideoConferenceCapabilities = VideoConferenceCapabilities;
function isTimelineCapability(capability) {
  // TODO: Change when MSC2762 becomes stable.
  return capability === null || capability === void 0 ? void 0 : capability.startsWith("org.matrix.msc2762.timeline:");
}

/**
 * Determines if a capability is a timeline capability for the given room.
 * @param {Capability} capability The capability to test.
 * @param {string | Symbols.AnyRoom} roomId The room ID, or `Symbols.AnyRoom` for that designation.
 * @returns {boolean} True if a matching capability, false otherwise.
 */
function isTimelineCapabilityFor(capability, roomId) {
  return capability === "org.matrix.msc2762.timeline:".concat(roomId);
}

/**
 * Gets the room ID described by a timeline capability.
 * @param {string} capability The capability to parse.
 * @returns {string} The room ID.
 */
function getTimelineRoomIDFromCapability(capability) {
  return capability.substring(capability.indexOf(":") + 1);
}

},{}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

},{}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

},{}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

},{}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

},{}],12:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.OpenIDRequestState = void 0;
/*
 * Copyright 2020 The Matrix.org Foundation C.I.C.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var OpenIDRequestState = /*#__PURE__*/function (OpenIDRequestState) {
  OpenIDRequestState["Allowed"] = "allowed";
  OpenIDRequestState["Blocked"] = "blocked";
  OpenIDRequestState["PendingUserConfirmation"] = "request";
  return OpenIDRequestState;
}({});
exports.OpenIDRequestState = OpenIDRequestState;

},{}],13:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

},{}],14:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

},{}],15:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

},{}],16:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

},{}],17:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

},{}],18:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

},{}],19:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isErrorResponse = isErrorResponse;
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
/*
 * Copyright 2020 - 2024 The Matrix.org Foundation C.I.C.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * The format of errors returned by Matrix API requests
 * made by a WidgetDriver.
 */

function isErrorResponse(responseData) {
  var error = responseData.error;
  return _typeof(error) === "object" && error !== null && "message" in error && typeof error.message === "string";
}

},{}],20:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

},{}],21:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

},{}],22:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ModalButtonKind = void 0;
/*
 * Copyright 2020 The Matrix.org Foundation C.I.C.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var ModalButtonKind = /*#__PURE__*/function (ModalButtonKind) {
  ModalButtonKind["Primary"] = "m.primary";
  ModalButtonKind["Secondary"] = "m.secondary";
  ModalButtonKind["Warning"] = "m.warning";
  ModalButtonKind["Danger"] = "m.danger";
  ModalButtonKind["Link"] = "m.link";
  return ModalButtonKind;
}({});
exports.ModalButtonKind = ModalButtonKind;

},{}],23:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BuiltInModalButtonID = void 0;
/*
 * Copyright 2020 The Matrix.org Foundation C.I.C.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var BuiltInModalButtonID = /*#__PURE__*/function (BuiltInModalButtonID) {
  BuiltInModalButtonID["Close"] = "m.close";
  return BuiltInModalButtonID;
}({}); // Types for a normal modal requesting the opening a modal widget
// Types for a modal widget receiving notifications that its buttons have been pressed
// Types for a modal widget requesting close
// Types for a normal widget being notified that the modal widget it opened has been closed
exports.BuiltInModalButtonID = BuiltInModalButtonID;

},{}],24:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

},{}],25:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

},{}],26:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

},{}],27:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

},{}],28:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

},{}],29:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

},{}],30:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

},{}],31:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

},{}],32:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

},{}],33:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

},{}],34:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

},{}],35:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

},{}],36:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UpdateDelayedEventAction = void 0;
/*
 * Copyright 2020 - 2024 The Matrix.org Foundation C.I.C.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var UpdateDelayedEventAction = /*#__PURE__*/function (UpdateDelayedEventAction) {
  UpdateDelayedEventAction["Cancel"] = "cancel";
  UpdateDelayedEventAction["Restart"] = "restart";
  UpdateDelayedEventAction["Send"] = "send";
  return UpdateDelayedEventAction;
}({});
exports.UpdateDelayedEventAction = UpdateDelayedEventAction;

},{}],37:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

},{}],38:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

},{}],39:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WidgetApiToWidgetAction = exports.WidgetApiFromWidgetAction = void 0;
/*
 * Copyright 2020 The Matrix.org Foundation C.I.C.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var WidgetApiToWidgetAction = /*#__PURE__*/function (WidgetApiToWidgetAction) {
  WidgetApiToWidgetAction["SupportedApiVersions"] = "supported_api_versions";
  WidgetApiToWidgetAction["Capabilities"] = "capabilities";
  WidgetApiToWidgetAction["NotifyCapabilities"] = "notify_capabilities";
  WidgetApiToWidgetAction["TakeScreenshot"] = "screenshot";
  WidgetApiToWidgetAction["UpdateVisibility"] = "visibility";
  WidgetApiToWidgetAction["OpenIDCredentials"] = "openid_credentials";
  WidgetApiToWidgetAction["WidgetConfig"] = "widget_config";
  WidgetApiToWidgetAction["CloseModalWidget"] = "close_modal";
  WidgetApiToWidgetAction["ButtonClicked"] = "button_clicked";
  WidgetApiToWidgetAction["SendEvent"] = "send_event";
  WidgetApiToWidgetAction["SendToDevice"] = "send_to_device";
  WidgetApiToWidgetAction["UpdateTurnServers"] = "update_turn_servers";
  return WidgetApiToWidgetAction;
}({});
exports.WidgetApiToWidgetAction = WidgetApiToWidgetAction;
var WidgetApiFromWidgetAction = /*#__PURE__*/function (WidgetApiFromWidgetAction) {
  WidgetApiFromWidgetAction["SupportedApiVersions"] = "supported_api_versions";
  WidgetApiFromWidgetAction["ContentLoaded"] = "content_loaded";
  WidgetApiFromWidgetAction["SendSticker"] = "m.sticker";
  WidgetApiFromWidgetAction["UpdateAlwaysOnScreen"] = "set_always_on_screen";
  WidgetApiFromWidgetAction["GetOpenIDCredentials"] = "get_openid";
  WidgetApiFromWidgetAction["CloseModalWidget"] = "close_modal";
  WidgetApiFromWidgetAction["OpenModalWidget"] = "open_modal";
  WidgetApiFromWidgetAction["SetModalButtonEnabled"] = "set_button_enabled";
  WidgetApiFromWidgetAction["SendEvent"] = "send_event";
  WidgetApiFromWidgetAction["SendToDevice"] = "send_to_device";
  WidgetApiFromWidgetAction["WatchTurnServers"] = "watch_turn_servers";
  WidgetApiFromWidgetAction["UnwatchTurnServers"] = "unwatch_turn_servers";
  WidgetApiFromWidgetAction["BeeperReadRoomAccountData"] = "com.beeper.read_room_account_data";
  WidgetApiFromWidgetAction["MSC2876ReadEvents"] = "org.matrix.msc2876.read_events";
  WidgetApiFromWidgetAction["MSC2931Navigate"] = "org.matrix.msc2931.navigate";
  WidgetApiFromWidgetAction["MSC2974RenegotiateCapabilities"] = "org.matrix.msc2974.request_capabilities";
  WidgetApiFromWidgetAction["MSC3869ReadRelations"] = "org.matrix.msc3869.read_relations";
  WidgetApiFromWidgetAction["MSC3973UserDirectorySearch"] = "org.matrix.msc3973.user_directory_search";
  WidgetApiFromWidgetAction["MSC4039GetMediaConfigAction"] = "org.matrix.msc4039.get_media_config";
  WidgetApiFromWidgetAction["MSC4039UploadFileAction"] = "org.matrix.msc4039.upload_file";
  WidgetApiFromWidgetAction["MSC4039DownloadFileAction"] = "org.matrix.msc4039.download_file";
  WidgetApiFromWidgetAction["MSC4157UpdateDelayedEvent"] = "org.matrix.msc4157.update_delayed_event";
  return WidgetApiFromWidgetAction;
}({});
exports.WidgetApiFromWidgetAction = WidgetApiFromWidgetAction;

},{}],40:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WidgetApiDirection = void 0;
exports.invertedDirection = invertedDirection;
/*
 * Copyright 2020 The Matrix.org Foundation C.I.C.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var WidgetApiDirection = /*#__PURE__*/function (WidgetApiDirection) {
  WidgetApiDirection["ToWidget"] = "toWidget";
  WidgetApiDirection["FromWidget"] = "fromWidget";
  return WidgetApiDirection;
}({});
exports.WidgetApiDirection = WidgetApiDirection;
function invertedDirection(dir) {
  if (dir === WidgetApiDirection.ToWidget) {
    return WidgetApiDirection.FromWidget;
  } else if (dir === WidgetApiDirection.FromWidget) {
    return WidgetApiDirection.ToWidget;
  } else {
    throw new Error("Invalid direction");
  }
}

},{}],41:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

},{}],42:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WidgetKind = void 0;
/*
 * Copyright 2020 The Matrix.org Foundation C.I.C.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var WidgetKind = /*#__PURE__*/function (WidgetKind) {
  WidgetKind["Room"] = "room";
  WidgetKind["Account"] = "account";
  WidgetKind["Modal"] = "modal";
  return WidgetKind;
}({});
exports.WidgetKind = WidgetKind;

},{}],43:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MatrixWidgetType = void 0;
/*
 * Copyright 2020 The Matrix.org Foundation C.I.C.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var MatrixWidgetType = /*#__PURE__*/function (MatrixWidgetType) {
  MatrixWidgetType["Custom"] = "m.custom";
  MatrixWidgetType["JitsiMeet"] = "m.jitsi";
  MatrixWidgetType["Stickerpicker"] = "m.stickerpicker";
  return MatrixWidgetType;
}({});
exports.MatrixWidgetType = MatrixWidgetType;

},{}],44:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Widget = void 0;
var _utils = require("./validation/utils");
var _ = require("..");
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); } /*
                                                                                                                                                                                                                                                                                                                                                                                               * Copyright 2020 The Matrix.org Foundation C.I.C.
                                                                                                                                                                                                                                                                                                                                                                                               *
                                                                                                                                                                                                                                                                                                                                                                                               * Licensed under the Apache License, Version 2.0 (the "License");
                                                                                                                                                                                                                                                                                                                                                                                               * you may not use this file except in compliance with the License.
                                                                                                                                                                                                                                                                                                                                                                                               * You may obtain a copy of the License at
                                                                                                                                                                                                                                                                                                                                                                                               *
                                                                                                                                                                                                                                                                                                                                                                                               *         http://www.apache.org/licenses/LICENSE-2.0
                                                                                                                                                                                                                                                                                                                                                                                               *
                                                                                                                                                                                                                                                                                                                                                                                               * Unless required by applicable law or agreed to in writing, software
                                                                                                                                                                                                                                                                                                                                                                                               * distributed under the License is distributed on an "AS IS" BASIS,
                                                                                                                                                                                                                                                                                                                                                                                               * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                                                                                                                                                                                                                                                                                                                                                                                               * See the License for the specific language governing permissions and
                                                                                                                                                                                                                                                                                                                                                                                               * limitations under the License.
                                                                                                                                                                                                                                                                                                                                                                                               */
/**
 * Represents the barest form of widget.
 */
var Widget = /*#__PURE__*/function () {
  function Widget(definition) {
    _classCallCheck(this, Widget);
    this.definition = definition;
    if (!this.definition) throw new Error("Definition is required");
    (0, _utils.assertPresent)(definition, "id");
    (0, _utils.assertPresent)(definition, "creatorUserId");
    (0, _utils.assertPresent)(definition, "type");
    (0, _utils.assertPresent)(definition, "url");
  }

  /**
   * The user ID who created the widget.
   */
  _createClass(Widget, [{
    key: "creatorUserId",
    get: function get() {
      return this.definition.creatorUserId;
    }

    /**
     * The type of widget.
     */
  }, {
    key: "type",
    get: function get() {
      return this.definition.type;
    }

    /**
     * The ID of the widget.
     */
  }, {
    key: "id",
    get: function get() {
      return this.definition.id;
    }

    /**
     * The name of the widget, or null if not set.
     */
  }, {
    key: "name",
    get: function get() {
      return this.definition.name || null;
    }

    /**
     * The title for the widget, or null if not set.
     */
  }, {
    key: "title",
    get: function get() {
      return this.rawData.title || null;
    }

    /**
     * The templated URL for the widget.
     */
  }, {
    key: "templateUrl",
    get: function get() {
      return this.definition.url;
    }

    /**
     * The origin for this widget.
     */
  }, {
    key: "origin",
    get: function get() {
      return new URL(this.templateUrl).origin;
    }

    /**
     * Whether or not the client should wait for the iframe to load. Defaults
     * to true.
     */
  }, {
    key: "waitForIframeLoad",
    get: function get() {
      if (this.definition.waitForIframeLoad === false) return false;
      if (this.definition.waitForIframeLoad === true) return true;
      return true; // default true
    }

    /**
     * The raw data for the widget. This will always be defined, though
     * may be empty.
     */
  }, {
    key: "rawData",
    get: function get() {
      return this.definition.data || {};
    }

    /**
     * Gets a complete widget URL for the client to render.
     * @param {ITemplateParams} params The template parameters.
     * @returns {string} A templated URL.
     */
  }, {
    key: "getCompleteUrl",
    value: function getCompleteUrl(params) {
      return (0, _.runTemplate)(this.templateUrl, this.definition, params);
    }
  }]);
  return Widget;
}();
exports.Widget = Widget;

},{"..":5,"./validation/utils":48}],45:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WidgetEventCapability = exports.EventKind = exports.EventDirection = void 0;
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
/*
 * Copyright 2020 The Matrix.org Foundation C.I.C.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var EventKind = /*#__PURE__*/function (EventKind) {
  EventKind["Event"] = "event";
  EventKind["State"] = "state_event";
  EventKind["ToDevice"] = "to_device";
  EventKind["RoomAccount"] = "room_account";
  return EventKind;
}({});
exports.EventKind = EventKind;
var EventDirection = /*#__PURE__*/function (EventDirection) {
  EventDirection["Send"] = "send";
  EventDirection["Receive"] = "receive";
  return EventDirection;
}({});
exports.EventDirection = EventDirection;
var WidgetEventCapability = /*#__PURE__*/function () {
  function WidgetEventCapability(direction, eventType, kind, keyStr, raw) {
    _classCallCheck(this, WidgetEventCapability);
    this.direction = direction;
    this.eventType = eventType;
    this.kind = kind;
    this.keyStr = keyStr;
    this.raw = raw;
  }
  _createClass(WidgetEventCapability, [{
    key: "matchesAsStateEvent",
    value: function matchesAsStateEvent(direction, eventType, stateKey) {
      if (this.kind !== EventKind.State) return false; // not a state event
      if (this.direction !== direction) return false; // direction mismatch
      if (this.eventType !== eventType) return false; // event type mismatch
      if (this.keyStr === null) return true; // all state keys are allowed
      if (this.keyStr === stateKey) return true; // this state key is allowed

      // Default not allowed
      return false;
    }
  }, {
    key: "matchesAsToDeviceEvent",
    value: function matchesAsToDeviceEvent(direction, eventType) {
      if (this.kind !== EventKind.ToDevice) return false; // not a to-device event
      if (this.direction !== direction) return false; // direction mismatch
      if (this.eventType !== eventType) return false; // event type mismatch

      // Checks passed, the event is allowed
      return true;
    }
  }, {
    key: "matchesAsRoomEvent",
    value: function matchesAsRoomEvent(direction, eventType) {
      var msgtype = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      if (this.kind !== EventKind.Event) return false; // not a room event
      if (this.direction !== direction) return false; // direction mismatch
      if (this.eventType !== eventType) return false; // event type mismatch

      if (this.eventType === "m.room.message") {
        if (this.keyStr === null) return true; // all message types are allowed
        if (this.keyStr === msgtype) return true; // this message type is allowed
      } else {
        return true; // already passed the check for if the event is allowed
      }

      // Default not allowed
      return false;
    }
  }, {
    key: "matchesAsRoomAccountData",
    value: function matchesAsRoomAccountData(direction, eventType) {
      if (this.kind !== EventKind.RoomAccount) return false; // not room account data
      if (this.direction !== direction) return false; // direction mismatch
      if (this.eventType !== eventType) return false; // event type mismatch

      // Checks passed, the event is allowed
      return true;
    }
  }], [{
    key: "forStateEvent",
    value: function forStateEvent(direction, eventType, stateKey) {
      // TODO: Enable support for m.* namespace once the MSC lands.
      // https://github.com/matrix-org/matrix-widget-api/issues/22
      eventType = eventType.replace(/#/g, '\\#');
      stateKey = stateKey !== null && stateKey !== undefined ? "#".concat(stateKey) : '';
      var str = "org.matrix.msc2762.".concat(direction, ".state_event:").concat(eventType).concat(stateKey);

      // cheat by sending it through the processor
      return WidgetEventCapability.findEventCapabilities([str])[0];
    }
  }, {
    key: "forToDeviceEvent",
    value: function forToDeviceEvent(direction, eventType) {
      // TODO: Enable support for m.* namespace once the MSC lands.
      // https://github.com/matrix-org/matrix-widget-api/issues/56
      var str = "org.matrix.msc3819.".concat(direction, ".to_device:").concat(eventType);

      // cheat by sending it through the processor
      return WidgetEventCapability.findEventCapabilities([str])[0];
    }
  }, {
    key: "forRoomEvent",
    value: function forRoomEvent(direction, eventType) {
      // TODO: Enable support for m.* namespace once the MSC lands.
      // https://github.com/matrix-org/matrix-widget-api/issues/22
      var str = "org.matrix.msc2762.".concat(direction, ".event:").concat(eventType);

      // cheat by sending it through the processor
      return WidgetEventCapability.findEventCapabilities([str])[0];
    }
  }, {
    key: "forRoomMessageEvent",
    value: function forRoomMessageEvent(direction, msgtype) {
      // TODO: Enable support for m.* namespace once the MSC lands.
      // https://github.com/matrix-org/matrix-widget-api/issues/22
      msgtype = msgtype === null || msgtype === undefined ? '' : msgtype;
      var str = "org.matrix.msc2762.".concat(direction, ".event:m.room.message#").concat(msgtype);

      // cheat by sending it through the processor
      return WidgetEventCapability.findEventCapabilities([str])[0];
    }
  }, {
    key: "forRoomAccountData",
    value: function forRoomAccountData(direction, eventType) {
      var str = "com.beeper.capabilities.".concat(direction, ".room_account_data:").concat(eventType);
      return WidgetEventCapability.findEventCapabilities([str])[0];
    }

    /**
     * Parses a capabilities request to find all the event capability requests.
     * @param {Iterable<Capability>} capabilities The capabilities requested/to parse.
     * @returns {WidgetEventCapability[]} An array of event capability requests. May be empty, but never null.
     */
  }, {
    key: "findEventCapabilities",
    value: function findEventCapabilities(capabilities) {
      var parsed = [];
      var _iterator = _createForOfIteratorHelper(capabilities),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var cap = _step.value;
          var _direction = null;
          var eventSegment = void 0;
          var _kind = null;

          // TODO: Enable support for m.* namespace once the MSCs land.
          // https://github.com/matrix-org/matrix-widget-api/issues/22
          // https://github.com/matrix-org/matrix-widget-api/issues/56

          if (cap.startsWith("org.matrix.msc2762.send.event:")) {
            _direction = EventDirection.Send;
            _kind = EventKind.Event;
            eventSegment = cap.substring("org.matrix.msc2762.send.event:".length);
          } else if (cap.startsWith("org.matrix.msc2762.send.state_event:")) {
            _direction = EventDirection.Send;
            _kind = EventKind.State;
            eventSegment = cap.substring("org.matrix.msc2762.send.state_event:".length);
          } else if (cap.startsWith("org.matrix.msc3819.send.to_device:")) {
            _direction = EventDirection.Send;
            _kind = EventKind.ToDevice;
            eventSegment = cap.substring("org.matrix.msc3819.send.to_device:".length);
          } else if (cap.startsWith("org.matrix.msc2762.receive.event:")) {
            _direction = EventDirection.Receive;
            _kind = EventKind.Event;
            eventSegment = cap.substring("org.matrix.msc2762.receive.event:".length);
          } else if (cap.startsWith("org.matrix.msc2762.receive.state_event:")) {
            _direction = EventDirection.Receive;
            _kind = EventKind.State;
            eventSegment = cap.substring("org.matrix.msc2762.receive.state_event:".length);
          } else if (cap.startsWith("org.matrix.msc3819.receive.to_device:")) {
            _direction = EventDirection.Receive;
            _kind = EventKind.ToDevice;
            eventSegment = cap.substring("org.matrix.msc3819.receive.to_device:".length);
          } else if (cap.startsWith("com.beeper.capabilities.receive.room_account_data:")) {
            _direction = EventDirection.Receive;
            _kind = EventKind.RoomAccount;
            eventSegment = cap.substring("com.beeper.capabilities.receive.room_account_data:".length);
          }
          if (_direction === null || _kind === null || eventSegment === undefined) continue;

          // The capability uses `#` as a separator between event type and state key/msgtype,
          // so we split on that. However, a # is also valid in either one of those so we
          // join accordingly.
          // Eg: `m.room.message##m.text` is "m.room.message" event with msgtype "#m.text".
          var expectingKeyStr = eventSegment.startsWith("m.room.message#") || _kind === EventKind.State;
          var _keyStr = null;
          if (eventSegment.includes('#') && expectingKeyStr) {
            // Dev note: regex is difficult to write, so instead the rules are manually written
            // out. This is probably just as understandable as a boring regex though, so win-win?

            // Test cases:
            // str                      eventSegment        keyStr
            // -------------------------------------------------------------
            // m.room.message#          m.room.message      <empty string>
            // m.room.message#test      m.room.message      test
            // m.room.message\#         m.room.message#     test
            // m.room.message##test     m.room.message      #test
            // m.room.message\##test    m.room.message#     test
            // m.room.message\\##test   m.room.message\#    test
            // m.room.message\\###test  m.room.message\#    #test

            // First step: explode the string
            var parts = eventSegment.split('#');

            // To form the eventSegment, we'll keep finding parts of the exploded string until
            // there's one that doesn't end with the escape character (\). We'll then join those
            // segments together with the exploding character. We have to remember to consume the
            // escape character as well.
            var idx = parts.findIndex(function (p) {
              return !p.endsWith("\\");
            });
            eventSegment = parts.slice(0, idx + 1).map(function (p) {
              return p.endsWith('\\') ? p.substring(0, p.length - 1) : p;
            }).join('#');

            // The keyStr is whatever is left over.
            _keyStr = parts.slice(idx + 1).join('#');
          }
          parsed.push(new WidgetEventCapability(_direction, eventSegment, _kind, _keyStr, cap));
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      return parsed;
    }
  }]);
  return WidgetEventCapability;
}();
exports.WidgetEventCapability = WidgetEventCapability;

},{}],46:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WidgetParser = void 0;
var _Widget = require("./Widget");
var _url = require("./validation/url");
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); } /*
                                                                                                                                                                                                                                                                                                                                                                                               * Copyright 2020 The Matrix.org Foundation C.I.C.
                                                                                                                                                                                                                                                                                                                                                                                               *
                                                                                                                                                                                                                                                                                                                                                                                               * Licensed under the Apache License, Version 2.0 (the "License");
                                                                                                                                                                                                                                                                                                                                                                                               * you may not use this file except in compliance with the License.
                                                                                                                                                                                                                                                                                                                                                                                               * You may obtain a copy of the License at
                                                                                                                                                                                                                                                                                                                                                                                               *
                                                                                                                                                                                                                                                                                                                                                                                               *         http://www.apache.org/licenses/LICENSE-2.0
                                                                                                                                                                                                                                                                                                                                                                                               *
                                                                                                                                                                                                                                                                                                                                                                                               * Unless required by applicable law or agreed to in writing, software
                                                                                                                                                                                                                                                                                                                                                                                               * distributed under the License is distributed on an "AS IS" BASIS,
                                                                                                                                                                                                                                                                                                                                                                                               * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                                                                                                                                                                                                                                                                                                                                                                                               * See the License for the specific language governing permissions and
                                                                                                                                                                                                                                                                                                                                                                                               * limitations under the License.
                                                                                                                                                                                                                                                                                                                                                                                               */
var WidgetParser = /*#__PURE__*/function () {
  function WidgetParser() {
    _classCallCheck(this, WidgetParser);
  } // private constructor because this is a util class

  /**
   * Parses widgets from the "m.widgets" account data event. This will always
   * return an array, though may be empty if no valid widgets were found.
   * @param {IAccountDataWidgets} content The content of the "m.widgets" account data.
   * @returns {Widget[]} The widgets in account data, or an empty array.
   */
  _createClass(WidgetParser, null, [{
    key: "parseAccountData",
    value: function parseAccountData(content) {
      if (!content) return [];
      var result = [];
      for (var _i = 0, _Object$keys = Object.keys(content); _i < _Object$keys.length; _i++) {
        var _widgetId = _Object$keys[_i];
        var roughWidget = content[_widgetId];
        if (!roughWidget) continue;
        if (roughWidget.type !== "m.widget" && roughWidget.type !== "im.vector.modular.widgets") continue;
        if (!roughWidget.sender) continue;
        var probableWidgetId = roughWidget.state_key || roughWidget.id;
        if (probableWidgetId !== _widgetId) continue;
        var asStateEvent = {
          content: roughWidget.content,
          sender: roughWidget.sender,
          type: "m.widget",
          state_key: _widgetId,
          event_id: "$example",
          room_id: "!example",
          origin_server_ts: 1
        };
        var widget = WidgetParser.parseRoomWidget(asStateEvent);
        if (widget) result.push(widget);
      }
      return result;
    }

    /**
     * Parses all the widgets possible in the given array. This will always return
     * an array, though may be empty if no widgets could be parsed.
     * @param {IStateEvent[]} currentState The room state to parse.
     * @returns {Widget[]} The widgets in the state, or an empty array.
     */
  }, {
    key: "parseWidgetsFromRoomState",
    value: function parseWidgetsFromRoomState(currentState) {
      if (!currentState) return [];
      var result = [];
      var _iterator = _createForOfIteratorHelper(currentState),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var state = _step.value;
          var widget = WidgetParser.parseRoomWidget(state);
          if (widget) result.push(widget);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      return result;
    }

    /**
     * Parses a state event into a widget. If the state event does not represent
     * a widget (wrong event type, invalid widget, etc) then null is returned.
     * @param {IStateEvent} stateEvent The state event.
     * @returns {Widget|null} The widget, or null if invalid
     */
  }, {
    key: "parseRoomWidget",
    value: function parseRoomWidget(stateEvent) {
      if (!stateEvent) return null;

      // TODO: [Legacy] Remove legacy support
      if (stateEvent.type !== "m.widget" && stateEvent.type !== "im.vector.modular.widgets") {
        return null;
      }

      // Dev note: Throughout this function we have null safety to ensure that
      // if the caller did not supply something useful that we don't error. This
      // is done against the requirements of the interface because not everyone
      // will have an interface to validate against.

      var content = stateEvent.content || {};

      // Form our best approximation of a widget with the information we have
      var estimatedWidget = {
        id: stateEvent.state_key,
        creatorUserId: content['creatorUserId'] || stateEvent.sender,
        name: content['name'],
        type: content['type'],
        url: content['url'],
        waitForIframeLoad: content['waitForIframeLoad'],
        data: content['data']
      };

      // Finally, process that widget
      return WidgetParser.processEstimatedWidget(estimatedWidget);
    }
  }, {
    key: "processEstimatedWidget",
    value: function processEstimatedWidget(widget) {
      // Validate that the widget has the best chance of passing as a widget
      if (!widget.id || !widget.creatorUserId || !widget.type) {
        return null;
      }
      if (!(0, _url.isValidUrl)(widget.url)) {
        return null;
      }
      // TODO: Validate data for known widget types
      return new _Widget.Widget(widget);
    }
  }]);
  return WidgetParser;
}();
exports.WidgetParser = WidgetParser;

},{"./Widget":44,"./validation/url":47}],47:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isValidUrl = isValidUrl;
/*
 * Copyright 2020 The Matrix.org Foundation C.I.C.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function isValidUrl(val) {
  if (!val) return false; // easy: not valid if not present

  try {
    var parsed = new URL(val);
    if (parsed.protocol !== "http" && parsed.protocol !== "https") {
      return false;
    }
    return true;
  } catch (e) {
    if (e instanceof TypeError) {
      return false;
    }
    throw e;
  }
}

},{}],48:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.assertPresent = assertPresent;
/*
 * Copyright 2020 The Matrix.org Foundation C.I.C.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function assertPresent(obj, key) {
  if (!obj[key]) {
    throw new Error("".concat(String(key), " is required"));
  }
}

},{}],49:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.runTemplate = runTemplate;
exports.toString = toString;
/*
 * Copyright 2020, 2021 The Matrix.org Foundation C.I.C.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function runTemplate(url, widget, params) {
  // Always apply the supplied params over top of data to ensure the data can't lie about them.
  var variables = Object.assign({}, widget.data, {
    'matrix_room_id': params.widgetRoomId || "",
    'matrix_user_id': params.currentUserId,
    'matrix_display_name': params.userDisplayName || params.currentUserId,
    'matrix_avatar_url': params.userHttpAvatarUrl || "",
    'matrix_widget_id': widget.id,
    // TODO: Convert to stable (https://github.com/matrix-org/matrix-doc/pull/2873)
    'org.matrix.msc2873.client_id': params.clientId || "",
    'org.matrix.msc2873.client_theme': params.clientTheme || "",
    'org.matrix.msc2873.client_language': params.clientLanguage || "",
    // TODO: Convert to stable (https://github.com/matrix-org/matrix-spec-proposals/pull/3819)
    'org.matrix.msc3819.matrix_device_id': params.deviceId || "",
    // TODO: Convert to stable (https://github.com/matrix-org/matrix-spec-proposals/pull/4039)
    'org.matrix.msc4039.matrix_base_url': params.baseUrl || ""
  });
  var result = url;
  for (var _i = 0, _Object$keys = Object.keys(variables); _i < _Object$keys.length; _i++) {
    var key = _Object$keys[_i];
    // Regex escape from https://stackoverflow.com/a/6969486/7037379
    var pattern = "$".concat(key).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    var rexp = new RegExp(pattern, 'g');

    // This is technically not what we're supposed to do for a couple of reasons:
    // 1. We are assuming that there won't later be a $key match after we replace a variable.
    // 2. We are assuming that the variable is in a place where it can be escaped (eg: path or query string).
    result = result.replace(rexp, encodeURIComponent(toString(variables[key])));
  }
  return result;
}
function toString(a) {
  if (a === null || a === undefined) {
    return "".concat(a);
  }
  return String(a);
}

},{}],50:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

},{}],51:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PostmessageTransport = void 0;
var _events = require("events");
var _ = require("..");
var _excluded = ["message"];
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }
function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }
function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }
function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }
function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); } /*
                                                                                                                                                                                                                                                                                                                                                                                               * Copyright 2020 - 2024 The Matrix.org Foundation C.I.C.
                                                                                                                                                                                                                                                                                                                                                                                               *
                                                                                                                                                                                                                                                                                                                                                                                               * Licensed under the Apache License, Version 2.0 (the "License");
                                                                                                                                                                                                                                                                                                                                                                                               * you may not use this file except in compliance with the License.
                                                                                                                                                                                                                                                                                                                                                                                               * You may obtain a copy of the License at
                                                                                                                                                                                                                                                                                                                                                                                               *
                                                                                                                                                                                                                                                                                                                                                                                               *         http://www.apache.org/licenses/LICENSE-2.0
                                                                                                                                                                                                                                                                                                                                                                                               *
                                                                                                                                                                                                                                                                                                                                                                                               * Unless required by applicable law or agreed to in writing, software
                                                                                                                                                                                                                                                                                                                                                                                               * distributed under the License is distributed on an "AS IS" BASIS,
                                                                                                                                                                                                                                                                                                                                                                                               * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                                                                                                                                                                                                                                                                                                                                                                                               * See the License for the specific language governing permissions and
                                                                                                                                                                                                                                                                                                                                                                                               * limitations under the License.
                                                                                                                                                                                                                                                                                                                                                                                               */
/**
 * Transport for the Widget API over postMessage.
 */
var PostmessageTransport = /*#__PURE__*/function (_EventEmitter) {
  _inherits(PostmessageTransport, _EventEmitter);
  var _super = _createSuper(PostmessageTransport);
  function PostmessageTransport(sendDirection, initialWidgetId, transportWindow, inboundWindow) {
    var _this;
    _classCallCheck(this, PostmessageTransport);
    _this = _super.call(this);
    _this.sendDirection = sendDirection;
    _this.initialWidgetId = initialWidgetId;
    _this.transportWindow = transportWindow;
    _this.inboundWindow = inboundWindow;
    _defineProperty(_assertThisInitialized(_this), "strictOriginCheck", false);
    _defineProperty(_assertThisInitialized(_this), "targetOrigin", "*");
    _defineProperty(_assertThisInitialized(_this), "timeoutSeconds", 10);
    _defineProperty(_assertThisInitialized(_this), "_ready", false);
    _defineProperty(_assertThisInitialized(_this), "_widgetId", null);
    _defineProperty(_assertThisInitialized(_this), "outboundRequests", new Map());
    _defineProperty(_assertThisInitialized(_this), "stopController", new AbortController());
    _this._widgetId = initialWidgetId;
    return _this;
  }
  _createClass(PostmessageTransport, [{
    key: "ready",
    get: function get() {
      return this._ready;
    }
  }, {
    key: "widgetId",
    get: function get() {
      return this._widgetId || null;
    }
  }, {
    key: "nextRequestId",
    get: function get() {
      var idBase = "widgetapi-".concat(Date.now());
      var index = 0;
      var id = idBase;
      while (this.outboundRequests.has(id)) {
        id = "".concat(idBase, "-").concat(index++);
      }

      // reserve the ID
      this.outboundRequests.set(id, null);
      return id;
    }
  }, {
    key: "sendInternal",
    value: function sendInternal(message) {
      console.log("[PostmessageTransport] Sending object to ".concat(this.targetOrigin, ": "), message);
      this.transportWindow.postMessage(message, this.targetOrigin);
    }
  }, {
    key: "reply",
    value: function reply(request, responseData) {
      return this.sendInternal(_objectSpread(_objectSpread({}, request), {}, {
        response: responseData
      }));
    }
  }, {
    key: "send",
    value: function send(action, data) {
      return this.sendComplete(action, data).then(function (r) {
        return r.response;
      });
    }
  }, {
    key: "sendComplete",
    value: function sendComplete(action, data) {
      var _this2 = this;
      if (!this.ready || !this.widgetId) {
        return Promise.reject(new Error("Not ready or unknown widget ID"));
      }
      var request = {
        api: this.sendDirection,
        widgetId: this.widgetId,
        requestId: this.nextRequestId,
        action: action,
        data: data
      };
      if (action === _.WidgetApiToWidgetAction.UpdateVisibility) {
        request['visible'] = data['visible'];
      }
      return new Promise(function (prResolve, prReject) {
        var resolve = function resolve(response) {
          cleanUp();
          prResolve(response);
        };
        var reject = function reject(err) {
          cleanUp();
          prReject(err);
        };
        var timerId = setTimeout(function () {
          return reject(new Error("Request timed out"));
        }, (_this2.timeoutSeconds || 1) * 1000);
        var onStop = function onStop() {
          return reject(new Error("Transport stopped"));
        };
        _this2.stopController.signal.addEventListener("abort", onStop);
        var cleanUp = function cleanUp() {
          _this2.outboundRequests["delete"](request.requestId);
          clearTimeout(timerId);
          _this2.stopController.signal.removeEventListener("abort", onStop);
        };
        _this2.outboundRequests.set(request.requestId, {
          request: request,
          resolve: resolve,
          reject: reject
        });
        _this2.sendInternal(request);
      });
    }
  }, {
    key: "start",
    value: function start() {
      var _this3 = this;
      this.inboundWindow.addEventListener("message", function (ev) {
        _this3.handleMessage(ev);
      });
      this._ready = true;
    }
  }, {
    key: "stop",
    value: function stop() {
      this._ready = false;
      this.stopController.abort();
    }
  }, {
    key: "handleMessage",
    value: function handleMessage(ev) {
      if (this.stopController.signal.aborted) return;
      if (!ev.data) return; // invalid event

      if (this.strictOriginCheck && ev.origin !== window.origin) return; // bad origin

      // treat the message as a response first, then downgrade to a request
      var response = ev.data;
      if (!response.action || !response.requestId || !response.widgetId) return; // invalid request/response

      if (!response.response) {
        // it's a request
        var request = response;
        if (request.api !== (0, _.invertedDirection)(this.sendDirection)) return; // wrong direction
        this.handleRequest(request);
      } else {
        // it's a response
        if (response.api !== this.sendDirection) return; // wrong direction
        this.handleResponse(response);
      }
    }
  }, {
    key: "handleRequest",
    value: function handleRequest(request) {
      if (this.widgetId) {
        if (this.widgetId !== request.widgetId) return; // wrong widget
      } else {
        this._widgetId = request.widgetId;
      }
      this.emit("message", new CustomEvent("message", {
        detail: request
      }));
    }
  }, {
    key: "handleResponse",
    value: function handleResponse(response) {
      if (response.widgetId !== this.widgetId) return; // wrong widget

      var req = this.outboundRequests.get(response.requestId);
      if (!req) return; // response to an unknown request

      if ((0, _.isErrorResponse)(response.response)) {
        var _response$response$er = response.response.error,
          message = _response$response$er.message,
          data = _objectWithoutProperties(_response$response$er, _excluded);
        req.reject(new _.WidgetApiResponseError(message, data));
      } else {
        req.resolve(response);
      }
    }
  }]);
  return PostmessageTransport;
}(_events.EventEmitter);
exports.PostmessageTransport = PostmessageTransport;

},{"..":5,"events":53}],52:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SimpleObservable = void 0;
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
/*
 * Copyright 2020 The Matrix.org Foundation C.I.C.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var SimpleObservable = /*#__PURE__*/function () {
  function SimpleObservable(initialFn) {
    _classCallCheck(this, SimpleObservable);
    _defineProperty(this, "listeners", []);
    if (initialFn) this.listeners.push(initialFn);
  }
  _createClass(SimpleObservable, [{
    key: "onUpdate",
    value: function onUpdate(fn) {
      this.listeners.push(fn);
    }
  }, {
    key: "update",
    value: function update(val) {
      var _iterator = _createForOfIteratorHelper(this.listeners),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var listener = _step.value;
          listener(val);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }
  }, {
    key: "close",
    value: function close() {
      this.listeners = []; // reset
    }
  }]);
  return SimpleObservable;
}();
exports.SimpleObservable = SimpleObservable;

},{}],53:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var R = typeof Reflect === 'object' ? Reflect : null
var ReflectApply = R && typeof R.apply === 'function'
  ? R.apply
  : function ReflectApply(target, receiver, args) {
    return Function.prototype.apply.call(target, receiver, args);
  }

var ReflectOwnKeys
if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target)
      .concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target);
  };
}

function ProcessEmitWarning(warning) {
  if (console && console.warn) console.warn(warning);
}

var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  return value !== value;
}

function EventEmitter() {
  EventEmitter.init.call(this);
}
module.exports = EventEmitter;
module.exports.once = once;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

function checkListener(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
}

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function() {
    return defaultMaxListeners;
  },
  set: function(arg) {
    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    }
    defaultMaxListeners = arg;
  }
});

EventEmitter.init = function() {

  if (this._events === undefined ||
      this._events === Object.getPrototypeOf(this)._events) {
    this._events = Object.create(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }
  this._maxListeners = n;
  return this;
};

function _getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return _getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
  var args = [];
  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
  var doError = (type === 'error');

  var events = this._events;
  if (events !== undefined)
    doError = (doError && events.error === undefined);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    var er;
    if (args.length > 0)
      er = args[0];
    if (er instanceof Error) {
      // Note: The comments on the `throw` lines are intentional, they show
      // up in Node's output if this results in an unhandled exception.
      throw er; // Unhandled 'error' event
    }
    // At least give some kind of context to the user
    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    err.context = er;
    throw err; // Unhandled 'error' event
  }

  var handler = events[type];

  if (handler === undefined)
    return false;

  if (typeof handler === 'function') {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      ReflectApply(listeners[i], this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  checkListener(listener);

  events = target._events;
  if (events === undefined) {
    events = target._events = Object.create(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener !== undefined) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (existing === undefined) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
        prepend ? [listener, existing] : [existing, listener];
      // If we've already got an array, just append.
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    }

    // Check for listener leak
    m = _getMaxListeners(target);
    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true;
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      var w = new Error('Possible EventEmitter memory leak detected. ' +
                          existing.length + ' ' + String(type) + ' listeners ' +
                          'added. Use emitter.setMaxListeners() to ' +
                          'increase limit');
      w.name = 'MaxListenersExceededWarning';
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    if (arguments.length === 0)
      return this.listener.call(this.target);
    return this.listener.apply(this.target, arguments);
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  checkListener(listener);
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      checkListener(listener);
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      checkListener(listener);

      events = this._events;
      if (events === undefined)
        return this;

      list = events[type];
      if (list === undefined)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = Object.create(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else {
          spliceOne(list, position);
        }

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener !== undefined)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (events === undefined)
        return this;

      // not listening for removeListener, no need to emit
      if (events.removeListener === undefined) {
        if (arguments.length === 0) {
          this._events = Object.create(null);
          this._eventsCount = 0;
        } else if (events[type] !== undefined) {
          if (--this._eventsCount === 0)
            this._events = Object.create(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = Object.create(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners !== undefined) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (events === undefined)
    return [];

  var evlistener = events[type];
  if (evlistener === undefined)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ?
    unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events !== undefined) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener !== undefined) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function spliceOne(list, index) {
  for (; index + 1 < list.length; index++)
    list[index] = list[index + 1];
  list.pop();
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function once(emitter, name) {
  return new Promise(function (resolve, reject) {
    function errorListener(err) {
      emitter.removeListener(name, resolver);
      reject(err);
    }

    function resolver() {
      if (typeof emitter.removeListener === 'function') {
        emitter.removeListener('error', errorListener);
      }
      resolve([].slice.call(arguments));
    };

    eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
    if (name !== 'error') {
      addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
    }
  });
}

function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
  if (typeof emitter.on === 'function') {
    eventTargetAgnosticAddListener(emitter, 'error', handler, flags);
  }
}

function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
  if (typeof emitter.on === 'function') {
    if (flags.once) {
      emitter.once(name, listener);
    } else {
      emitter.on(name, listener);
    }
  } else if (typeof emitter.addEventListener === 'function') {
    // EventTarget does not have `error` event semantics like Node
    // EventEmitters, we do not listen for `error` events here.
    emitter.addEventListener(name, function wrapListener(arg) {
      // IE does not have builtin `{ once: true }` support so we
      // have to do it manually.
      if (flags.once) {
        emitter.removeEventListener(name, wrapListener);
      }
      listener(arg);
    });
  } else {
    throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
  }
}

},{}]},{},[5])(5)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvQ2xpZW50V2lkZ2V0QXBpLmpzIiwibGliL1N5bWJvbHMuanMiLCJsaWIvV2lkZ2V0QXBpLmpzIiwibGliL2RyaXZlci9XaWRnZXREcml2ZXIuanMiLCJsaWIvaW5kZXguanMiLCJsaWIvaW50ZXJmYWNlcy9BcGlWZXJzaW9uLmpzIiwibGliL2ludGVyZmFjZXMvQ2FwYWJpbGl0aWVzLmpzIiwibGliL2ludGVyZmFjZXMvQ2FwYWJpbGl0aWVzQWN0aW9uLmpzIiwibGliL2ludGVyZmFjZXMvQ29udGVudExvYWRlZEFjdGlvbi5qcyIsImxpYi9pbnRlcmZhY2VzL0Rvd25sb2FkRmlsZUFjdGlvbi5qcyIsImxpYi9pbnRlcmZhY2VzL0dldE1lZGlhQ29uZmlnQWN0aW9uLmpzIiwibGliL2ludGVyZmFjZXMvR2V0T3BlbklEQWN0aW9uLmpzIiwibGliL2ludGVyZmFjZXMvSUN1c3RvbVdpZGdldERhdGEuanMiLCJsaWIvaW50ZXJmYWNlcy9JSml0c2lXaWRnZXREYXRhLmpzIiwibGliL2ludGVyZmFjZXMvSVJvb21BY2NvdW50RGF0YS5qcyIsImxpYi9pbnRlcmZhY2VzL0lSb29tRXZlbnQuanMiLCJsaWIvaW50ZXJmYWNlcy9JU3RpY2tlcnBpY2tlcldpZGdldERhdGEuanMiLCJsaWIvaW50ZXJmYWNlcy9JV2lkZ2V0LmpzIiwibGliL2ludGVyZmFjZXMvSVdpZGdldEFwaUVycm9yUmVzcG9uc2UuanMiLCJsaWIvaW50ZXJmYWNlcy9JV2lkZ2V0QXBpUmVxdWVzdC5qcyIsImxpYi9pbnRlcmZhY2VzL0lXaWRnZXRBcGlSZXNwb25zZS5qcyIsImxpYi9pbnRlcmZhY2VzL01vZGFsQnV0dG9uS2luZC5qcyIsImxpYi9pbnRlcmZhY2VzL01vZGFsV2lkZ2V0QWN0aW9ucy5qcyIsImxpYi9pbnRlcmZhY2VzL05hdmlnYXRlQWN0aW9uLmpzIiwibGliL2ludGVyZmFjZXMvT3BlbklEQ3JlZGVudGlhbHNBY3Rpb24uanMiLCJsaWIvaW50ZXJmYWNlcy9SZWFkRXZlbnRBY3Rpb24uanMiLCJsaWIvaW50ZXJmYWNlcy9SZWFkUmVsYXRpb25zQWN0aW9uLmpzIiwibGliL2ludGVyZmFjZXMvU2NyZWVuc2hvdEFjdGlvbi5qcyIsImxpYi9pbnRlcmZhY2VzL1NlbmRFdmVudEFjdGlvbi5qcyIsImxpYi9pbnRlcmZhY2VzL1NlbmRUb0RldmljZUFjdGlvbi5qcyIsImxpYi9pbnRlcmZhY2VzL1NldE1vZGFsQnV0dG9uRW5hYmxlZEFjdGlvbi5qcyIsImxpYi9pbnRlcmZhY2VzL1N0aWNrZXJBY3Rpb24uanMiLCJsaWIvaW50ZXJmYWNlcy9TdGlja3lBY3Rpb24uanMiLCJsaWIvaW50ZXJmYWNlcy9TdXBwb3J0ZWRWZXJzaW9uc0FjdGlvbi5qcyIsImxpYi9pbnRlcmZhY2VzL1R1cm5TZXJ2ZXJBY3Rpb25zLmpzIiwibGliL2ludGVyZmFjZXMvVXBkYXRlRGVsYXllZEV2ZW50QWN0aW9uLmpzIiwibGliL2ludGVyZmFjZXMvVXBsb2FkRmlsZUFjdGlvbi5qcyIsImxpYi9pbnRlcmZhY2VzL1Zpc2liaWxpdHlBY3Rpb24uanMiLCJsaWIvaW50ZXJmYWNlcy9XaWRnZXRBcGlBY3Rpb24uanMiLCJsaWIvaW50ZXJmYWNlcy9XaWRnZXRBcGlEaXJlY3Rpb24uanMiLCJsaWIvaW50ZXJmYWNlcy9XaWRnZXRDb25maWdBY3Rpb24uanMiLCJsaWIvaW50ZXJmYWNlcy9XaWRnZXRLaW5kLmpzIiwibGliL2ludGVyZmFjZXMvV2lkZ2V0VHlwZS5qcyIsImxpYi9tb2RlbHMvV2lkZ2V0LmpzIiwibGliL21vZGVscy9XaWRnZXRFdmVudENhcGFiaWxpdHkuanMiLCJsaWIvbW9kZWxzL1dpZGdldFBhcnNlci5qcyIsImxpYi9tb2RlbHMvdmFsaWRhdGlvbi91cmwuanMiLCJsaWIvbW9kZWxzL3ZhbGlkYXRpb24vdXRpbHMuanMiLCJsaWIvdGVtcGxhdGluZy91cmwtdGVtcGxhdGUuanMiLCJsaWIvdHJhbnNwb3J0L0lUcmFuc3BvcnQuanMiLCJsaWIvdHJhbnNwb3J0L1Bvc3RtZXNzYWdlVHJhbnNwb3J0LmpzIiwibGliL3V0aWwvU2ltcGxlT2JzZXJ2YWJsZS5qcyIsIm5vZGVfbW9kdWxlcy9ldmVudHMvZXZlbnRzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaDBDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNTlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdGpCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDalFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLkNsaWVudFdpZGdldEFwaSA9IHZvaWQgMDtcbnZhciBfZXZlbnRzID0gcmVxdWlyZShcImV2ZW50c1wiKTtcbnZhciBfUG9zdG1lc3NhZ2VUcmFuc3BvcnQgPSByZXF1aXJlKFwiLi90cmFuc3BvcnQvUG9zdG1lc3NhZ2VUcmFuc3BvcnRcIik7XG52YXIgX1dpZGdldEFwaURpcmVjdGlvbiA9IHJlcXVpcmUoXCIuL2ludGVyZmFjZXMvV2lkZ2V0QXBpRGlyZWN0aW9uXCIpO1xudmFyIF9XaWRnZXRBcGlBY3Rpb24gPSByZXF1aXJlKFwiLi9pbnRlcmZhY2VzL1dpZGdldEFwaUFjdGlvblwiKTtcbnZhciBfQ2FwYWJpbGl0aWVzID0gcmVxdWlyZShcIi4vaW50ZXJmYWNlcy9DYXBhYmlsaXRpZXNcIik7XG52YXIgX0FwaVZlcnNpb24gPSByZXF1aXJlKFwiLi9pbnRlcmZhY2VzL0FwaVZlcnNpb25cIik7XG52YXIgX1dpZGdldEV2ZW50Q2FwYWJpbGl0eSA9IHJlcXVpcmUoXCIuL21vZGVscy9XaWRnZXRFdmVudENhcGFiaWxpdHlcIik7XG52YXIgX0dldE9wZW5JREFjdGlvbiA9IHJlcXVpcmUoXCIuL2ludGVyZmFjZXMvR2V0T3BlbklEQWN0aW9uXCIpO1xudmFyIF9TaW1wbGVPYnNlcnZhYmxlID0gcmVxdWlyZShcIi4vdXRpbC9TaW1wbGVPYnNlcnZhYmxlXCIpO1xudmFyIF9TeW1ib2xzID0gcmVxdWlyZShcIi4vU3ltYm9sc1wiKTtcbnZhciBfVXBkYXRlRGVsYXllZEV2ZW50QWN0aW9uID0gcmVxdWlyZShcIi4vaW50ZXJmYWNlcy9VcGRhdGVEZWxheWVkRXZlbnRBY3Rpb25cIik7XG5mdW5jdGlvbiBfdHlwZW9mKG9iaikgeyBcIkBiYWJlbC9oZWxwZXJzIC0gdHlwZW9mXCI7IHJldHVybiBfdHlwZW9mID0gXCJmdW5jdGlvblwiID09IHR5cGVvZiBTeW1ib2wgJiYgXCJzeW1ib2xcIiA9PSB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID8gZnVuY3Rpb24gKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfSA6IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIG9iaiAmJiBcImZ1bmN0aW9uXCIgPT0gdHlwZW9mIFN5bWJvbCAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvYmogIT09IFN5bWJvbC5wcm90b3R5cGUgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajsgfSwgX3R5cGVvZihvYmopOyB9XG5mdW5jdGlvbiBfcmVnZW5lcmF0b3JSdW50aW1lKCkgeyBcInVzZSBzdHJpY3RcIjsgLyohIHJlZ2VuZXJhdG9yLXJ1bnRpbWUgLS0gQ29weXJpZ2h0IChjKSAyMDE0LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuIC0tIGxpY2Vuc2UgKE1JVCk6IGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWdlbmVyYXRvci9ibG9iL21haW4vTElDRU5TRSAqLyBfcmVnZW5lcmF0b3JSdW50aW1lID0gZnVuY3Rpb24gX3JlZ2VuZXJhdG9yUnVudGltZSgpIHsgcmV0dXJuIGV4cG9ydHM7IH07IHZhciBleHBvcnRzID0ge30sIE9wID0gT2JqZWN0LnByb3RvdHlwZSwgaGFzT3duID0gT3AuaGFzT3duUHJvcGVydHksIGRlZmluZVByb3BlcnR5ID0gT2JqZWN0LmRlZmluZVByb3BlcnR5IHx8IGZ1bmN0aW9uIChvYmosIGtleSwgZGVzYykgeyBvYmpba2V5XSA9IGRlc2MudmFsdWU7IH0sICRTeW1ib2wgPSBcImZ1bmN0aW9uXCIgPT0gdHlwZW9mIFN5bWJvbCA/IFN5bWJvbCA6IHt9LCBpdGVyYXRvclN5bWJvbCA9ICRTeW1ib2wuaXRlcmF0b3IgfHwgXCJAQGl0ZXJhdG9yXCIsIGFzeW5jSXRlcmF0b3JTeW1ib2wgPSAkU3ltYm9sLmFzeW5jSXRlcmF0b3IgfHwgXCJAQGFzeW5jSXRlcmF0b3JcIiwgdG9TdHJpbmdUYWdTeW1ib2wgPSAkU3ltYm9sLnRvU3RyaW5nVGFnIHx8IFwiQEB0b1N0cmluZ1RhZ1wiOyBmdW5jdGlvbiBkZWZpbmUob2JqLCBrZXksIHZhbHVlKSB7IHJldHVybiBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBrZXksIHsgdmFsdWU6IHZhbHVlLCBlbnVtZXJhYmxlOiAhMCwgY29uZmlndXJhYmxlOiAhMCwgd3JpdGFibGU6ICEwIH0pLCBvYmpba2V5XTsgfSB0cnkgeyBkZWZpbmUoe30sIFwiXCIpOyB9IGNhdGNoIChlcnIpIHsgZGVmaW5lID0gZnVuY3Rpb24gZGVmaW5lKG9iaiwga2V5LCB2YWx1ZSkgeyByZXR1cm4gb2JqW2tleV0gPSB2YWx1ZTsgfTsgfSBmdW5jdGlvbiB3cmFwKGlubmVyRm4sIG91dGVyRm4sIHNlbGYsIHRyeUxvY3NMaXN0KSB7IHZhciBwcm90b0dlbmVyYXRvciA9IG91dGVyRm4gJiYgb3V0ZXJGbi5wcm90b3R5cGUgaW5zdGFuY2VvZiBHZW5lcmF0b3IgPyBvdXRlckZuIDogR2VuZXJhdG9yLCBnZW5lcmF0b3IgPSBPYmplY3QuY3JlYXRlKHByb3RvR2VuZXJhdG9yLnByb3RvdHlwZSksIGNvbnRleHQgPSBuZXcgQ29udGV4dCh0cnlMb2NzTGlzdCB8fCBbXSk7IHJldHVybiBkZWZpbmVQcm9wZXJ0eShnZW5lcmF0b3IsIFwiX2ludm9rZVwiLCB7IHZhbHVlOiBtYWtlSW52b2tlTWV0aG9kKGlubmVyRm4sIHNlbGYsIGNvbnRleHQpIH0pLCBnZW5lcmF0b3I7IH0gZnVuY3Rpb24gdHJ5Q2F0Y2goZm4sIG9iaiwgYXJnKSB7IHRyeSB7IHJldHVybiB7IHR5cGU6IFwibm9ybWFsXCIsIGFyZzogZm4uY2FsbChvYmosIGFyZykgfTsgfSBjYXRjaCAoZXJyKSB7IHJldHVybiB7IHR5cGU6IFwidGhyb3dcIiwgYXJnOiBlcnIgfTsgfSB9IGV4cG9ydHMud3JhcCA9IHdyYXA7IHZhciBDb250aW51ZVNlbnRpbmVsID0ge307IGZ1bmN0aW9uIEdlbmVyYXRvcigpIHt9IGZ1bmN0aW9uIEdlbmVyYXRvckZ1bmN0aW9uKCkge30gZnVuY3Rpb24gR2VuZXJhdG9yRnVuY3Rpb25Qcm90b3R5cGUoKSB7fSB2YXIgSXRlcmF0b3JQcm90b3R5cGUgPSB7fTsgZGVmaW5lKEl0ZXJhdG9yUHJvdG90eXBlLCBpdGVyYXRvclN5bWJvbCwgZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSk7IHZhciBnZXRQcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZiwgTmF0aXZlSXRlcmF0b3JQcm90b3R5cGUgPSBnZXRQcm90byAmJiBnZXRQcm90byhnZXRQcm90byh2YWx1ZXMoW10pKSk7IE5hdGl2ZUl0ZXJhdG9yUHJvdG90eXBlICYmIE5hdGl2ZUl0ZXJhdG9yUHJvdG90eXBlICE9PSBPcCAmJiBoYXNPd24uY2FsbChOYXRpdmVJdGVyYXRvclByb3RvdHlwZSwgaXRlcmF0b3JTeW1ib2wpICYmIChJdGVyYXRvclByb3RvdHlwZSA9IE5hdGl2ZUl0ZXJhdG9yUHJvdG90eXBlKTsgdmFyIEdwID0gR2VuZXJhdG9yRnVuY3Rpb25Qcm90b3R5cGUucHJvdG90eXBlID0gR2VuZXJhdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSXRlcmF0b3JQcm90b3R5cGUpOyBmdW5jdGlvbiBkZWZpbmVJdGVyYXRvck1ldGhvZHMocHJvdG90eXBlKSB7IFtcIm5leHRcIiwgXCJ0aHJvd1wiLCBcInJldHVyblwiXS5mb3JFYWNoKGZ1bmN0aW9uIChtZXRob2QpIHsgZGVmaW5lKHByb3RvdHlwZSwgbWV0aG9kLCBmdW5jdGlvbiAoYXJnKSB7IHJldHVybiB0aGlzLl9pbnZva2UobWV0aG9kLCBhcmcpOyB9KTsgfSk7IH0gZnVuY3Rpb24gQXN5bmNJdGVyYXRvcihnZW5lcmF0b3IsIFByb21pc2VJbXBsKSB7IGZ1bmN0aW9uIGludm9rZShtZXRob2QsIGFyZywgcmVzb2x2ZSwgcmVqZWN0KSB7IHZhciByZWNvcmQgPSB0cnlDYXRjaChnZW5lcmF0b3JbbWV0aG9kXSwgZ2VuZXJhdG9yLCBhcmcpOyBpZiAoXCJ0aHJvd1wiICE9PSByZWNvcmQudHlwZSkgeyB2YXIgcmVzdWx0ID0gcmVjb3JkLmFyZywgdmFsdWUgPSByZXN1bHQudmFsdWU7IHJldHVybiB2YWx1ZSAmJiBcIm9iamVjdFwiID09IF90eXBlb2YodmFsdWUpICYmIGhhc093bi5jYWxsKHZhbHVlLCBcIl9fYXdhaXRcIikgPyBQcm9taXNlSW1wbC5yZXNvbHZlKHZhbHVlLl9fYXdhaXQpLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7IGludm9rZShcIm5leHRcIiwgdmFsdWUsIHJlc29sdmUsIHJlamVjdCk7IH0sIGZ1bmN0aW9uIChlcnIpIHsgaW52b2tlKFwidGhyb3dcIiwgZXJyLCByZXNvbHZlLCByZWplY3QpOyB9KSA6IFByb21pc2VJbXBsLnJlc29sdmUodmFsdWUpLnRoZW4oZnVuY3Rpb24gKHVud3JhcHBlZCkgeyByZXN1bHQudmFsdWUgPSB1bndyYXBwZWQsIHJlc29sdmUocmVzdWx0KTsgfSwgZnVuY3Rpb24gKGVycm9yKSB7IHJldHVybiBpbnZva2UoXCJ0aHJvd1wiLCBlcnJvciwgcmVzb2x2ZSwgcmVqZWN0KTsgfSk7IH0gcmVqZWN0KHJlY29yZC5hcmcpOyB9IHZhciBwcmV2aW91c1Byb21pc2U7IGRlZmluZVByb3BlcnR5KHRoaXMsIFwiX2ludm9rZVwiLCB7IHZhbHVlOiBmdW5jdGlvbiB2YWx1ZShtZXRob2QsIGFyZykgeyBmdW5jdGlvbiBjYWxsSW52b2tlV2l0aE1ldGhvZEFuZEFyZygpIHsgcmV0dXJuIG5ldyBQcm9taXNlSW1wbChmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7IGludm9rZShtZXRob2QsIGFyZywgcmVzb2x2ZSwgcmVqZWN0KTsgfSk7IH0gcmV0dXJuIHByZXZpb3VzUHJvbWlzZSA9IHByZXZpb3VzUHJvbWlzZSA/IHByZXZpb3VzUHJvbWlzZS50aGVuKGNhbGxJbnZva2VXaXRoTWV0aG9kQW5kQXJnLCBjYWxsSW52b2tlV2l0aE1ldGhvZEFuZEFyZykgOiBjYWxsSW52b2tlV2l0aE1ldGhvZEFuZEFyZygpOyB9IH0pOyB9IGZ1bmN0aW9uIG1ha2VJbnZva2VNZXRob2QoaW5uZXJGbiwgc2VsZiwgY29udGV4dCkgeyB2YXIgc3RhdGUgPSBcInN1c3BlbmRlZFN0YXJ0XCI7IHJldHVybiBmdW5jdGlvbiAobWV0aG9kLCBhcmcpIHsgaWYgKFwiZXhlY3V0aW5nXCIgPT09IHN0YXRlKSB0aHJvdyBuZXcgRXJyb3IoXCJHZW5lcmF0b3IgaXMgYWxyZWFkeSBydW5uaW5nXCIpOyBpZiAoXCJjb21wbGV0ZWRcIiA9PT0gc3RhdGUpIHsgaWYgKFwidGhyb3dcIiA9PT0gbWV0aG9kKSB0aHJvdyBhcmc7IHJldHVybiBkb25lUmVzdWx0KCk7IH0gZm9yIChjb250ZXh0Lm1ldGhvZCA9IG1ldGhvZCwgY29udGV4dC5hcmcgPSBhcmc7OykgeyB2YXIgZGVsZWdhdGUgPSBjb250ZXh0LmRlbGVnYXRlOyBpZiAoZGVsZWdhdGUpIHsgdmFyIGRlbGVnYXRlUmVzdWx0ID0gbWF5YmVJbnZva2VEZWxlZ2F0ZShkZWxlZ2F0ZSwgY29udGV4dCk7IGlmIChkZWxlZ2F0ZVJlc3VsdCkgeyBpZiAoZGVsZWdhdGVSZXN1bHQgPT09IENvbnRpbnVlU2VudGluZWwpIGNvbnRpbnVlOyByZXR1cm4gZGVsZWdhdGVSZXN1bHQ7IH0gfSBpZiAoXCJuZXh0XCIgPT09IGNvbnRleHQubWV0aG9kKSBjb250ZXh0LnNlbnQgPSBjb250ZXh0Ll9zZW50ID0gY29udGV4dC5hcmc7ZWxzZSBpZiAoXCJ0aHJvd1wiID09PSBjb250ZXh0Lm1ldGhvZCkgeyBpZiAoXCJzdXNwZW5kZWRTdGFydFwiID09PSBzdGF0ZSkgdGhyb3cgc3RhdGUgPSBcImNvbXBsZXRlZFwiLCBjb250ZXh0LmFyZzsgY29udGV4dC5kaXNwYXRjaEV4Y2VwdGlvbihjb250ZXh0LmFyZyk7IH0gZWxzZSBcInJldHVyblwiID09PSBjb250ZXh0Lm1ldGhvZCAmJiBjb250ZXh0LmFicnVwdChcInJldHVyblwiLCBjb250ZXh0LmFyZyk7IHN0YXRlID0gXCJleGVjdXRpbmdcIjsgdmFyIHJlY29yZCA9IHRyeUNhdGNoKGlubmVyRm4sIHNlbGYsIGNvbnRleHQpOyBpZiAoXCJub3JtYWxcIiA9PT0gcmVjb3JkLnR5cGUpIHsgaWYgKHN0YXRlID0gY29udGV4dC5kb25lID8gXCJjb21wbGV0ZWRcIiA6IFwic3VzcGVuZGVkWWllbGRcIiwgcmVjb3JkLmFyZyA9PT0gQ29udGludWVTZW50aW5lbCkgY29udGludWU7IHJldHVybiB7IHZhbHVlOiByZWNvcmQuYXJnLCBkb25lOiBjb250ZXh0LmRvbmUgfTsgfSBcInRocm93XCIgPT09IHJlY29yZC50eXBlICYmIChzdGF0ZSA9IFwiY29tcGxldGVkXCIsIGNvbnRleHQubWV0aG9kID0gXCJ0aHJvd1wiLCBjb250ZXh0LmFyZyA9IHJlY29yZC5hcmcpOyB9IH07IH0gZnVuY3Rpb24gbWF5YmVJbnZva2VEZWxlZ2F0ZShkZWxlZ2F0ZSwgY29udGV4dCkgeyB2YXIgbWV0aG9kTmFtZSA9IGNvbnRleHQubWV0aG9kLCBtZXRob2QgPSBkZWxlZ2F0ZS5pdGVyYXRvclttZXRob2ROYW1lXTsgaWYgKHVuZGVmaW5lZCA9PT0gbWV0aG9kKSByZXR1cm4gY29udGV4dC5kZWxlZ2F0ZSA9IG51bGwsIFwidGhyb3dcIiA9PT0gbWV0aG9kTmFtZSAmJiBkZWxlZ2F0ZS5pdGVyYXRvcltcInJldHVyblwiXSAmJiAoY29udGV4dC5tZXRob2QgPSBcInJldHVyblwiLCBjb250ZXh0LmFyZyA9IHVuZGVmaW5lZCwgbWF5YmVJbnZva2VEZWxlZ2F0ZShkZWxlZ2F0ZSwgY29udGV4dCksIFwidGhyb3dcIiA9PT0gY29udGV4dC5tZXRob2QpIHx8IFwicmV0dXJuXCIgIT09IG1ldGhvZE5hbWUgJiYgKGNvbnRleHQubWV0aG9kID0gXCJ0aHJvd1wiLCBjb250ZXh0LmFyZyA9IG5ldyBUeXBlRXJyb3IoXCJUaGUgaXRlcmF0b3IgZG9lcyBub3QgcHJvdmlkZSBhICdcIiArIG1ldGhvZE5hbWUgKyBcIicgbWV0aG9kXCIpKSwgQ29udGludWVTZW50aW5lbDsgdmFyIHJlY29yZCA9IHRyeUNhdGNoKG1ldGhvZCwgZGVsZWdhdGUuaXRlcmF0b3IsIGNvbnRleHQuYXJnKTsgaWYgKFwidGhyb3dcIiA9PT0gcmVjb3JkLnR5cGUpIHJldHVybiBjb250ZXh0Lm1ldGhvZCA9IFwidGhyb3dcIiwgY29udGV4dC5hcmcgPSByZWNvcmQuYXJnLCBjb250ZXh0LmRlbGVnYXRlID0gbnVsbCwgQ29udGludWVTZW50aW5lbDsgdmFyIGluZm8gPSByZWNvcmQuYXJnOyByZXR1cm4gaW5mbyA/IGluZm8uZG9uZSA/IChjb250ZXh0W2RlbGVnYXRlLnJlc3VsdE5hbWVdID0gaW5mby52YWx1ZSwgY29udGV4dC5uZXh0ID0gZGVsZWdhdGUubmV4dExvYywgXCJyZXR1cm5cIiAhPT0gY29udGV4dC5tZXRob2QgJiYgKGNvbnRleHQubWV0aG9kID0gXCJuZXh0XCIsIGNvbnRleHQuYXJnID0gdW5kZWZpbmVkKSwgY29udGV4dC5kZWxlZ2F0ZSA9IG51bGwsIENvbnRpbnVlU2VudGluZWwpIDogaW5mbyA6IChjb250ZXh0Lm1ldGhvZCA9IFwidGhyb3dcIiwgY29udGV4dC5hcmcgPSBuZXcgVHlwZUVycm9yKFwiaXRlcmF0b3IgcmVzdWx0IGlzIG5vdCBhbiBvYmplY3RcIiksIGNvbnRleHQuZGVsZWdhdGUgPSBudWxsLCBDb250aW51ZVNlbnRpbmVsKTsgfSBmdW5jdGlvbiBwdXNoVHJ5RW50cnkobG9jcykgeyB2YXIgZW50cnkgPSB7IHRyeUxvYzogbG9jc1swXSB9OyAxIGluIGxvY3MgJiYgKGVudHJ5LmNhdGNoTG9jID0gbG9jc1sxXSksIDIgaW4gbG9jcyAmJiAoZW50cnkuZmluYWxseUxvYyA9IGxvY3NbMl0sIGVudHJ5LmFmdGVyTG9jID0gbG9jc1szXSksIHRoaXMudHJ5RW50cmllcy5wdXNoKGVudHJ5KTsgfSBmdW5jdGlvbiByZXNldFRyeUVudHJ5KGVudHJ5KSB7IHZhciByZWNvcmQgPSBlbnRyeS5jb21wbGV0aW9uIHx8IHt9OyByZWNvcmQudHlwZSA9IFwibm9ybWFsXCIsIGRlbGV0ZSByZWNvcmQuYXJnLCBlbnRyeS5jb21wbGV0aW9uID0gcmVjb3JkOyB9IGZ1bmN0aW9uIENvbnRleHQodHJ5TG9jc0xpc3QpIHsgdGhpcy50cnlFbnRyaWVzID0gW3sgdHJ5TG9jOiBcInJvb3RcIiB9XSwgdHJ5TG9jc0xpc3QuZm9yRWFjaChwdXNoVHJ5RW50cnksIHRoaXMpLCB0aGlzLnJlc2V0KCEwKTsgfSBmdW5jdGlvbiB2YWx1ZXMoaXRlcmFibGUpIHsgaWYgKGl0ZXJhYmxlKSB7IHZhciBpdGVyYXRvck1ldGhvZCA9IGl0ZXJhYmxlW2l0ZXJhdG9yU3ltYm9sXTsgaWYgKGl0ZXJhdG9yTWV0aG9kKSByZXR1cm4gaXRlcmF0b3JNZXRob2QuY2FsbChpdGVyYWJsZSk7IGlmIChcImZ1bmN0aW9uXCIgPT0gdHlwZW9mIGl0ZXJhYmxlLm5leHQpIHJldHVybiBpdGVyYWJsZTsgaWYgKCFpc05hTihpdGVyYWJsZS5sZW5ndGgpKSB7IHZhciBpID0gLTEsIG5leHQgPSBmdW5jdGlvbiBuZXh0KCkgeyBmb3IgKDsgKytpIDwgaXRlcmFibGUubGVuZ3RoOykgaWYgKGhhc093bi5jYWxsKGl0ZXJhYmxlLCBpKSkgcmV0dXJuIG5leHQudmFsdWUgPSBpdGVyYWJsZVtpXSwgbmV4dC5kb25lID0gITEsIG5leHQ7IHJldHVybiBuZXh0LnZhbHVlID0gdW5kZWZpbmVkLCBuZXh0LmRvbmUgPSAhMCwgbmV4dDsgfTsgcmV0dXJuIG5leHQubmV4dCA9IG5leHQ7IH0gfSByZXR1cm4geyBuZXh0OiBkb25lUmVzdWx0IH07IH0gZnVuY3Rpb24gZG9uZVJlc3VsdCgpIHsgcmV0dXJuIHsgdmFsdWU6IHVuZGVmaW5lZCwgZG9uZTogITAgfTsgfSByZXR1cm4gR2VuZXJhdG9yRnVuY3Rpb24ucHJvdG90eXBlID0gR2VuZXJhdG9yRnVuY3Rpb25Qcm90b3R5cGUsIGRlZmluZVByb3BlcnR5KEdwLCBcImNvbnN0cnVjdG9yXCIsIHsgdmFsdWU6IEdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlLCBjb25maWd1cmFibGU6ICEwIH0pLCBkZWZpbmVQcm9wZXJ0eShHZW5lcmF0b3JGdW5jdGlvblByb3RvdHlwZSwgXCJjb25zdHJ1Y3RvclwiLCB7IHZhbHVlOiBHZW5lcmF0b3JGdW5jdGlvbiwgY29uZmlndXJhYmxlOiAhMCB9KSwgR2VuZXJhdG9yRnVuY3Rpb24uZGlzcGxheU5hbWUgPSBkZWZpbmUoR2VuZXJhdG9yRnVuY3Rpb25Qcm90b3R5cGUsIHRvU3RyaW5nVGFnU3ltYm9sLCBcIkdlbmVyYXRvckZ1bmN0aW9uXCIpLCBleHBvcnRzLmlzR2VuZXJhdG9yRnVuY3Rpb24gPSBmdW5jdGlvbiAoZ2VuRnVuKSB7IHZhciBjdG9yID0gXCJmdW5jdGlvblwiID09IHR5cGVvZiBnZW5GdW4gJiYgZ2VuRnVuLmNvbnN0cnVjdG9yOyByZXR1cm4gISFjdG9yICYmIChjdG9yID09PSBHZW5lcmF0b3JGdW5jdGlvbiB8fCBcIkdlbmVyYXRvckZ1bmN0aW9uXCIgPT09IChjdG9yLmRpc3BsYXlOYW1lIHx8IGN0b3IubmFtZSkpOyB9LCBleHBvcnRzLm1hcmsgPSBmdW5jdGlvbiAoZ2VuRnVuKSB7IHJldHVybiBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3Quc2V0UHJvdG90eXBlT2YoZ2VuRnVuLCBHZW5lcmF0b3JGdW5jdGlvblByb3RvdHlwZSkgOiAoZ2VuRnVuLl9fcHJvdG9fXyA9IEdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlLCBkZWZpbmUoZ2VuRnVuLCB0b1N0cmluZ1RhZ1N5bWJvbCwgXCJHZW5lcmF0b3JGdW5jdGlvblwiKSksIGdlbkZ1bi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEdwKSwgZ2VuRnVuOyB9LCBleHBvcnRzLmF3cmFwID0gZnVuY3Rpb24gKGFyZykgeyByZXR1cm4geyBfX2F3YWl0OiBhcmcgfTsgfSwgZGVmaW5lSXRlcmF0b3JNZXRob2RzKEFzeW5jSXRlcmF0b3IucHJvdG90eXBlKSwgZGVmaW5lKEFzeW5jSXRlcmF0b3IucHJvdG90eXBlLCBhc3luY0l0ZXJhdG9yU3ltYm9sLCBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzOyB9KSwgZXhwb3J0cy5Bc3luY0l0ZXJhdG9yID0gQXN5bmNJdGVyYXRvciwgZXhwb3J0cy5hc3luYyA9IGZ1bmN0aW9uIChpbm5lckZuLCBvdXRlckZuLCBzZWxmLCB0cnlMb2NzTGlzdCwgUHJvbWlzZUltcGwpIHsgdm9pZCAwID09PSBQcm9taXNlSW1wbCAmJiAoUHJvbWlzZUltcGwgPSBQcm9taXNlKTsgdmFyIGl0ZXIgPSBuZXcgQXN5bmNJdGVyYXRvcih3cmFwKGlubmVyRm4sIG91dGVyRm4sIHNlbGYsIHRyeUxvY3NMaXN0KSwgUHJvbWlzZUltcGwpOyByZXR1cm4gZXhwb3J0cy5pc0dlbmVyYXRvckZ1bmN0aW9uKG91dGVyRm4pID8gaXRlciA6IGl0ZXIubmV4dCgpLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkgeyByZXR1cm4gcmVzdWx0LmRvbmUgPyByZXN1bHQudmFsdWUgOiBpdGVyLm5leHQoKTsgfSk7IH0sIGRlZmluZUl0ZXJhdG9yTWV0aG9kcyhHcCksIGRlZmluZShHcCwgdG9TdHJpbmdUYWdTeW1ib2wsIFwiR2VuZXJhdG9yXCIpLCBkZWZpbmUoR3AsIGl0ZXJhdG9yU3ltYm9sLCBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzOyB9KSwgZGVmaW5lKEdwLCBcInRvU3RyaW5nXCIsIGZ1bmN0aW9uICgpIHsgcmV0dXJuIFwiW29iamVjdCBHZW5lcmF0b3JdXCI7IH0pLCBleHBvcnRzLmtleXMgPSBmdW5jdGlvbiAodmFsKSB7IHZhciBvYmplY3QgPSBPYmplY3QodmFsKSwga2V5cyA9IFtdOyBmb3IgKHZhciBrZXkgaW4gb2JqZWN0KSBrZXlzLnB1c2goa2V5KTsgcmV0dXJuIGtleXMucmV2ZXJzZSgpLCBmdW5jdGlvbiBuZXh0KCkgeyBmb3IgKDsga2V5cy5sZW5ndGg7KSB7IHZhciBrZXkgPSBrZXlzLnBvcCgpOyBpZiAoa2V5IGluIG9iamVjdCkgcmV0dXJuIG5leHQudmFsdWUgPSBrZXksIG5leHQuZG9uZSA9ICExLCBuZXh0OyB9IHJldHVybiBuZXh0LmRvbmUgPSAhMCwgbmV4dDsgfTsgfSwgZXhwb3J0cy52YWx1ZXMgPSB2YWx1ZXMsIENvbnRleHQucHJvdG90eXBlID0geyBjb25zdHJ1Y3RvcjogQ29udGV4dCwgcmVzZXQ6IGZ1bmN0aW9uIHJlc2V0KHNraXBUZW1wUmVzZXQpIHsgaWYgKHRoaXMucHJldiA9IDAsIHRoaXMubmV4dCA9IDAsIHRoaXMuc2VudCA9IHRoaXMuX3NlbnQgPSB1bmRlZmluZWQsIHRoaXMuZG9uZSA9ICExLCB0aGlzLmRlbGVnYXRlID0gbnVsbCwgdGhpcy5tZXRob2QgPSBcIm5leHRcIiwgdGhpcy5hcmcgPSB1bmRlZmluZWQsIHRoaXMudHJ5RW50cmllcy5mb3JFYWNoKHJlc2V0VHJ5RW50cnkpLCAhc2tpcFRlbXBSZXNldCkgZm9yICh2YXIgbmFtZSBpbiB0aGlzKSBcInRcIiA9PT0gbmFtZS5jaGFyQXQoMCkgJiYgaGFzT3duLmNhbGwodGhpcywgbmFtZSkgJiYgIWlzTmFOKCtuYW1lLnNsaWNlKDEpKSAmJiAodGhpc1tuYW1lXSA9IHVuZGVmaW5lZCk7IH0sIHN0b3A6IGZ1bmN0aW9uIHN0b3AoKSB7IHRoaXMuZG9uZSA9ICEwOyB2YXIgcm9vdFJlY29yZCA9IHRoaXMudHJ5RW50cmllc1swXS5jb21wbGV0aW9uOyBpZiAoXCJ0aHJvd1wiID09PSByb290UmVjb3JkLnR5cGUpIHRocm93IHJvb3RSZWNvcmQuYXJnOyByZXR1cm4gdGhpcy5ydmFsOyB9LCBkaXNwYXRjaEV4Y2VwdGlvbjogZnVuY3Rpb24gZGlzcGF0Y2hFeGNlcHRpb24oZXhjZXB0aW9uKSB7IGlmICh0aGlzLmRvbmUpIHRocm93IGV4Y2VwdGlvbjsgdmFyIGNvbnRleHQgPSB0aGlzOyBmdW5jdGlvbiBoYW5kbGUobG9jLCBjYXVnaHQpIHsgcmV0dXJuIHJlY29yZC50eXBlID0gXCJ0aHJvd1wiLCByZWNvcmQuYXJnID0gZXhjZXB0aW9uLCBjb250ZXh0Lm5leHQgPSBsb2MsIGNhdWdodCAmJiAoY29udGV4dC5tZXRob2QgPSBcIm5leHRcIiwgY29udGV4dC5hcmcgPSB1bmRlZmluZWQpLCAhIWNhdWdodDsgfSBmb3IgKHZhciBpID0gdGhpcy50cnlFbnRyaWVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7IHZhciBlbnRyeSA9IHRoaXMudHJ5RW50cmllc1tpXSwgcmVjb3JkID0gZW50cnkuY29tcGxldGlvbjsgaWYgKFwicm9vdFwiID09PSBlbnRyeS50cnlMb2MpIHJldHVybiBoYW5kbGUoXCJlbmRcIik7IGlmIChlbnRyeS50cnlMb2MgPD0gdGhpcy5wcmV2KSB7IHZhciBoYXNDYXRjaCA9IGhhc093bi5jYWxsKGVudHJ5LCBcImNhdGNoTG9jXCIpLCBoYXNGaW5hbGx5ID0gaGFzT3duLmNhbGwoZW50cnksIFwiZmluYWxseUxvY1wiKTsgaWYgKGhhc0NhdGNoICYmIGhhc0ZpbmFsbHkpIHsgaWYgKHRoaXMucHJldiA8IGVudHJ5LmNhdGNoTG9jKSByZXR1cm4gaGFuZGxlKGVudHJ5LmNhdGNoTG9jLCAhMCk7IGlmICh0aGlzLnByZXYgPCBlbnRyeS5maW5hbGx5TG9jKSByZXR1cm4gaGFuZGxlKGVudHJ5LmZpbmFsbHlMb2MpOyB9IGVsc2UgaWYgKGhhc0NhdGNoKSB7IGlmICh0aGlzLnByZXYgPCBlbnRyeS5jYXRjaExvYykgcmV0dXJuIGhhbmRsZShlbnRyeS5jYXRjaExvYywgITApOyB9IGVsc2UgeyBpZiAoIWhhc0ZpbmFsbHkpIHRocm93IG5ldyBFcnJvcihcInRyeSBzdGF0ZW1lbnQgd2l0aG91dCBjYXRjaCBvciBmaW5hbGx5XCIpOyBpZiAodGhpcy5wcmV2IDwgZW50cnkuZmluYWxseUxvYykgcmV0dXJuIGhhbmRsZShlbnRyeS5maW5hbGx5TG9jKTsgfSB9IH0gfSwgYWJydXB0OiBmdW5jdGlvbiBhYnJ1cHQodHlwZSwgYXJnKSB7IGZvciAodmFyIGkgPSB0aGlzLnRyeUVudHJpZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHsgdmFyIGVudHJ5ID0gdGhpcy50cnlFbnRyaWVzW2ldOyBpZiAoZW50cnkudHJ5TG9jIDw9IHRoaXMucHJldiAmJiBoYXNPd24uY2FsbChlbnRyeSwgXCJmaW5hbGx5TG9jXCIpICYmIHRoaXMucHJldiA8IGVudHJ5LmZpbmFsbHlMb2MpIHsgdmFyIGZpbmFsbHlFbnRyeSA9IGVudHJ5OyBicmVhazsgfSB9IGZpbmFsbHlFbnRyeSAmJiAoXCJicmVha1wiID09PSB0eXBlIHx8IFwiY29udGludWVcIiA9PT0gdHlwZSkgJiYgZmluYWxseUVudHJ5LnRyeUxvYyA8PSBhcmcgJiYgYXJnIDw9IGZpbmFsbHlFbnRyeS5maW5hbGx5TG9jICYmIChmaW5hbGx5RW50cnkgPSBudWxsKTsgdmFyIHJlY29yZCA9IGZpbmFsbHlFbnRyeSA/IGZpbmFsbHlFbnRyeS5jb21wbGV0aW9uIDoge307IHJldHVybiByZWNvcmQudHlwZSA9IHR5cGUsIHJlY29yZC5hcmcgPSBhcmcsIGZpbmFsbHlFbnRyeSA/ICh0aGlzLm1ldGhvZCA9IFwibmV4dFwiLCB0aGlzLm5leHQgPSBmaW5hbGx5RW50cnkuZmluYWxseUxvYywgQ29udGludWVTZW50aW5lbCkgOiB0aGlzLmNvbXBsZXRlKHJlY29yZCk7IH0sIGNvbXBsZXRlOiBmdW5jdGlvbiBjb21wbGV0ZShyZWNvcmQsIGFmdGVyTG9jKSB7IGlmIChcInRocm93XCIgPT09IHJlY29yZC50eXBlKSB0aHJvdyByZWNvcmQuYXJnOyByZXR1cm4gXCJicmVha1wiID09PSByZWNvcmQudHlwZSB8fCBcImNvbnRpbnVlXCIgPT09IHJlY29yZC50eXBlID8gdGhpcy5uZXh0ID0gcmVjb3JkLmFyZyA6IFwicmV0dXJuXCIgPT09IHJlY29yZC50eXBlID8gKHRoaXMucnZhbCA9IHRoaXMuYXJnID0gcmVjb3JkLmFyZywgdGhpcy5tZXRob2QgPSBcInJldHVyblwiLCB0aGlzLm5leHQgPSBcImVuZFwiKSA6IFwibm9ybWFsXCIgPT09IHJlY29yZC50eXBlICYmIGFmdGVyTG9jICYmICh0aGlzLm5leHQgPSBhZnRlckxvYyksIENvbnRpbnVlU2VudGluZWw7IH0sIGZpbmlzaDogZnVuY3Rpb24gZmluaXNoKGZpbmFsbHlMb2MpIHsgZm9yICh2YXIgaSA9IHRoaXMudHJ5RW50cmllcy5sZW5ndGggLSAxOyBpID49IDA7IC0taSkgeyB2YXIgZW50cnkgPSB0aGlzLnRyeUVudHJpZXNbaV07IGlmIChlbnRyeS5maW5hbGx5TG9jID09PSBmaW5hbGx5TG9jKSByZXR1cm4gdGhpcy5jb21wbGV0ZShlbnRyeS5jb21wbGV0aW9uLCBlbnRyeS5hZnRlckxvYyksIHJlc2V0VHJ5RW50cnkoZW50cnkpLCBDb250aW51ZVNlbnRpbmVsOyB9IH0sIFwiY2F0Y2hcIjogZnVuY3Rpb24gX2NhdGNoKHRyeUxvYykgeyBmb3IgKHZhciBpID0gdGhpcy50cnlFbnRyaWVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7IHZhciBlbnRyeSA9IHRoaXMudHJ5RW50cmllc1tpXTsgaWYgKGVudHJ5LnRyeUxvYyA9PT0gdHJ5TG9jKSB7IHZhciByZWNvcmQgPSBlbnRyeS5jb21wbGV0aW9uOyBpZiAoXCJ0aHJvd1wiID09PSByZWNvcmQudHlwZSkgeyB2YXIgdGhyb3duID0gcmVjb3JkLmFyZzsgcmVzZXRUcnlFbnRyeShlbnRyeSk7IH0gcmV0dXJuIHRocm93bjsgfSB9IHRocm93IG5ldyBFcnJvcihcImlsbGVnYWwgY2F0Y2ggYXR0ZW1wdFwiKTsgfSwgZGVsZWdhdGVZaWVsZDogZnVuY3Rpb24gZGVsZWdhdGVZaWVsZChpdGVyYWJsZSwgcmVzdWx0TmFtZSwgbmV4dExvYykgeyByZXR1cm4gdGhpcy5kZWxlZ2F0ZSA9IHsgaXRlcmF0b3I6IHZhbHVlcyhpdGVyYWJsZSksIHJlc3VsdE5hbWU6IHJlc3VsdE5hbWUsIG5leHRMb2M6IG5leHRMb2MgfSwgXCJuZXh0XCIgPT09IHRoaXMubWV0aG9kICYmICh0aGlzLmFyZyA9IHVuZGVmaW5lZCksIENvbnRpbnVlU2VudGluZWw7IH0gfSwgZXhwb3J0czsgfVxuZnVuY3Rpb24gYXN5bmNHZW5lcmF0b3JTdGVwKGdlbiwgcmVzb2x2ZSwgcmVqZWN0LCBfbmV4dCwgX3Rocm93LCBrZXksIGFyZykgeyB0cnkgeyB2YXIgaW5mbyA9IGdlbltrZXldKGFyZyk7IHZhciB2YWx1ZSA9IGluZm8udmFsdWU7IH0gY2F0Y2ggKGVycm9yKSB7IHJlamVjdChlcnJvcik7IHJldHVybjsgfSBpZiAoaW5mby5kb25lKSB7IHJlc29sdmUodmFsdWUpOyB9IGVsc2UgeyBQcm9taXNlLnJlc29sdmUodmFsdWUpLnRoZW4oX25leHQsIF90aHJvdyk7IH0gfVxuZnVuY3Rpb24gX2FzeW5jVG9HZW5lcmF0b3IoZm4pIHsgcmV0dXJuIGZ1bmN0aW9uICgpIHsgdmFyIHNlbGYgPSB0aGlzLCBhcmdzID0gYXJndW1lbnRzOyByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkgeyB2YXIgZ2VuID0gZm4uYXBwbHkoc2VsZiwgYXJncyk7IGZ1bmN0aW9uIF9uZXh0KHZhbHVlKSB7IGFzeW5jR2VuZXJhdG9yU3RlcChnZW4sIHJlc29sdmUsIHJlamVjdCwgX25leHQsIF90aHJvdywgXCJuZXh0XCIsIHZhbHVlKTsgfSBmdW5jdGlvbiBfdGhyb3coZXJyKSB7IGFzeW5jR2VuZXJhdG9yU3RlcChnZW4sIHJlc29sdmUsIHJlamVjdCwgX25leHQsIF90aHJvdywgXCJ0aHJvd1wiLCBlcnIpOyB9IF9uZXh0KHVuZGVmaW5lZCk7IH0pOyB9OyB9XG5mdW5jdGlvbiBfY3JlYXRlRm9yT2ZJdGVyYXRvckhlbHBlcihvLCBhbGxvd0FycmF5TGlrZSkgeyB2YXIgaXQgPSB0eXBlb2YgU3ltYm9sICE9PSBcInVuZGVmaW5lZFwiICYmIG9bU3ltYm9sLml0ZXJhdG9yXSB8fCBvW1wiQEBpdGVyYXRvclwiXTsgaWYgKCFpdCkgeyBpZiAoQXJyYXkuaXNBcnJheShvKSB8fCAoaXQgPSBfdW5zdXBwb3J0ZWRJdGVyYWJsZVRvQXJyYXkobykpIHx8IGFsbG93QXJyYXlMaWtlICYmIG8gJiYgdHlwZW9mIG8ubGVuZ3RoID09PSBcIm51bWJlclwiKSB7IGlmIChpdCkgbyA9IGl0OyB2YXIgaSA9IDA7IHZhciBGID0gZnVuY3Rpb24gRigpIHt9OyByZXR1cm4geyBzOiBGLCBuOiBmdW5jdGlvbiBuKCkgeyBpZiAoaSA+PSBvLmxlbmd0aCkgcmV0dXJuIHsgZG9uZTogdHJ1ZSB9OyByZXR1cm4geyBkb25lOiBmYWxzZSwgdmFsdWU6IG9baSsrXSB9OyB9LCBlOiBmdW5jdGlvbiBlKF9lKSB7IHRocm93IF9lOyB9LCBmOiBGIH07IH0gdGhyb3cgbmV3IFR5cGVFcnJvcihcIkludmFsaWQgYXR0ZW1wdCB0byBpdGVyYXRlIG5vbi1pdGVyYWJsZSBpbnN0YW5jZS5cXG5JbiBvcmRlciB0byBiZSBpdGVyYWJsZSwgbm9uLWFycmF5IG9iamVjdHMgbXVzdCBoYXZlIGEgW1N5bWJvbC5pdGVyYXRvcl0oKSBtZXRob2QuXCIpOyB9IHZhciBub3JtYWxDb21wbGV0aW9uID0gdHJ1ZSwgZGlkRXJyID0gZmFsc2UsIGVycjsgcmV0dXJuIHsgczogZnVuY3Rpb24gcygpIHsgaXQgPSBpdC5jYWxsKG8pOyB9LCBuOiBmdW5jdGlvbiBuKCkgeyB2YXIgc3RlcCA9IGl0Lm5leHQoKTsgbm9ybWFsQ29tcGxldGlvbiA9IHN0ZXAuZG9uZTsgcmV0dXJuIHN0ZXA7IH0sIGU6IGZ1bmN0aW9uIGUoX2UyKSB7IGRpZEVyciA9IHRydWU7IGVyciA9IF9lMjsgfSwgZjogZnVuY3Rpb24gZigpIHsgdHJ5IHsgaWYgKCFub3JtYWxDb21wbGV0aW9uICYmIGl0W1wicmV0dXJuXCJdICE9IG51bGwpIGl0W1wicmV0dXJuXCJdKCk7IH0gZmluYWxseSB7IGlmIChkaWRFcnIpIHRocm93IGVycjsgfSB9IH07IH1cbmZ1bmN0aW9uIF91bnN1cHBvcnRlZEl0ZXJhYmxlVG9BcnJheShvLCBtaW5MZW4pIHsgaWYgKCFvKSByZXR1cm47IGlmICh0eXBlb2YgbyA9PT0gXCJzdHJpbmdcIikgcmV0dXJuIF9hcnJheUxpa2VUb0FycmF5KG8sIG1pbkxlbik7IHZhciBuID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pLnNsaWNlKDgsIC0xKTsgaWYgKG4gPT09IFwiT2JqZWN0XCIgJiYgby5jb25zdHJ1Y3RvcikgbiA9IG8uY29uc3RydWN0b3IubmFtZTsgaWYgKG4gPT09IFwiTWFwXCIgfHwgbiA9PT0gXCJTZXRcIikgcmV0dXJuIEFycmF5LmZyb20obyk7IGlmIChuID09PSBcIkFyZ3VtZW50c1wiIHx8IC9eKD86VWl8SSludCg/Ojh8MTZ8MzIpKD86Q2xhbXBlZCk/QXJyYXkkLy50ZXN0KG4pKSByZXR1cm4gX2FycmF5TGlrZVRvQXJyYXkobywgbWluTGVuKTsgfVxuZnVuY3Rpb24gX2FycmF5TGlrZVRvQXJyYXkoYXJyLCBsZW4pIHsgaWYgKGxlbiA9PSBudWxsIHx8IGxlbiA+IGFyci5sZW5ndGgpIGxlbiA9IGFyci5sZW5ndGg7IGZvciAodmFyIGkgPSAwLCBhcnIyID0gbmV3IEFycmF5KGxlbik7IGkgPCBsZW47IGkrKykgYXJyMltpXSA9IGFycltpXTsgcmV0dXJuIGFycjI7IH1cbmZ1bmN0aW9uIG93bktleXMob2JqZWN0LCBlbnVtZXJhYmxlT25seSkgeyB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG9iamVjdCk7IGlmIChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKSB7IHZhciBzeW1ib2xzID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhvYmplY3QpOyBlbnVtZXJhYmxlT25seSAmJiAoc3ltYm9scyA9IHN5bWJvbHMuZmlsdGVyKGZ1bmN0aW9uIChzeW0pIHsgcmV0dXJuIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqZWN0LCBzeW0pLmVudW1lcmFibGU7IH0pKSwga2V5cy5wdXNoLmFwcGx5KGtleXMsIHN5bWJvbHMpOyB9IHJldHVybiBrZXlzOyB9XG5mdW5jdGlvbiBfb2JqZWN0U3ByZWFkKHRhcmdldCkgeyBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgeyB2YXIgc291cmNlID0gbnVsbCAhPSBhcmd1bWVudHNbaV0gPyBhcmd1bWVudHNbaV0gOiB7fTsgaSAlIDIgPyBvd25LZXlzKE9iamVjdChzb3VyY2UpLCAhMCkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7IF9kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgc291cmNlW2tleV0pOyB9KSA6IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzID8gT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycyhzb3VyY2UpKSA6IG93bktleXMoT2JqZWN0KHNvdXJjZSkpLmZvckVhY2goZnVuY3Rpb24gKGtleSkgeyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Ioc291cmNlLCBrZXkpKTsgfSk7IH0gcmV0dXJuIHRhcmdldDsgfVxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cbmZ1bmN0aW9uIF9kZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgX3RvUHJvcGVydHlLZXkoZGVzY3JpcHRvci5rZXkpLCBkZXNjcmlwdG9yKTsgfSB9XG5mdW5jdGlvbiBfY3JlYXRlQ2xhc3MoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIF9kZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDb25zdHJ1Y3RvciwgXCJwcm90b3R5cGVcIiwgeyB3cml0YWJsZTogZmFsc2UgfSk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfVxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gXCJmdW5jdGlvblwiICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uXCIpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHN1YkNsYXNzLCBcInByb3RvdHlwZVwiLCB7IHdyaXRhYmxlOiBmYWxzZSB9KTsgaWYgKHN1cGVyQ2xhc3MpIF9zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcyk7IH1cbmZ1bmN0aW9uIF9zZXRQcm90b3R5cGVPZihvLCBwKSB7IF9zZXRQcm90b3R5cGVPZiA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiA/IE9iamVjdC5zZXRQcm90b3R5cGVPZi5iaW5kKCkgOiBmdW5jdGlvbiBfc2V0UHJvdG90eXBlT2YobywgcCkgeyBvLl9fcHJvdG9fXyA9IHA7IHJldHVybiBvOyB9OyByZXR1cm4gX3NldFByb3RvdHlwZU9mKG8sIHApOyB9XG5mdW5jdGlvbiBfY3JlYXRlU3VwZXIoRGVyaXZlZCkgeyB2YXIgaGFzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCA9IF9pc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QoKTsgcmV0dXJuIGZ1bmN0aW9uIF9jcmVhdGVTdXBlckludGVybmFsKCkgeyB2YXIgU3VwZXIgPSBfZ2V0UHJvdG90eXBlT2YoRGVyaXZlZCksIHJlc3VsdDsgaWYgKGhhc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QpIHsgdmFyIE5ld1RhcmdldCA9IF9nZXRQcm90b3R5cGVPZih0aGlzKS5jb25zdHJ1Y3RvcjsgcmVzdWx0ID0gUmVmbGVjdC5jb25zdHJ1Y3QoU3VwZXIsIGFyZ3VtZW50cywgTmV3VGFyZ2V0KTsgfSBlbHNlIHsgcmVzdWx0ID0gU3VwZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTsgfSByZXR1cm4gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4odGhpcywgcmVzdWx0KTsgfTsgfVxuZnVuY3Rpb24gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4oc2VsZiwgY2FsbCkgeyBpZiAoY2FsbCAmJiAoX3R5cGVvZihjYWxsKSA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgY2FsbCA9PT0gXCJmdW5jdGlvblwiKSkgeyByZXR1cm4gY2FsbDsgfSBlbHNlIGlmIChjYWxsICE9PSB2b2lkIDApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkRlcml2ZWQgY29uc3RydWN0b3JzIG1heSBvbmx5IHJldHVybiBvYmplY3Qgb3IgdW5kZWZpbmVkXCIpOyB9IHJldHVybiBfYXNzZXJ0VGhpc0luaXRpYWxpemVkKHNlbGYpOyB9XG5mdW5jdGlvbiBfYXNzZXJ0VGhpc0luaXRpYWxpemVkKHNlbGYpIHsgaWYgKHNlbGYgPT09IHZvaWQgMCkgeyB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXCJ0aGlzIGhhc24ndCBiZWVuIGluaXRpYWxpc2VkIC0gc3VwZXIoKSBoYXNuJ3QgYmVlbiBjYWxsZWRcIik7IH0gcmV0dXJuIHNlbGY7IH1cbmZ1bmN0aW9uIF9pc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QoKSB7IGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJ1bmRlZmluZWRcIiB8fCAhUmVmbGVjdC5jb25zdHJ1Y3QpIHJldHVybiBmYWxzZTsgaWYgKFJlZmxlY3QuY29uc3RydWN0LnNoYW0pIHJldHVybiBmYWxzZTsgaWYgKHR5cGVvZiBQcm94eSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gdHJ1ZTsgdHJ5IHsgQm9vbGVhbi5wcm90b3R5cGUudmFsdWVPZi5jYWxsKFJlZmxlY3QuY29uc3RydWN0KEJvb2xlYW4sIFtdLCBmdW5jdGlvbiAoKSB7fSkpOyByZXR1cm4gdHJ1ZTsgfSBjYXRjaCAoZSkgeyByZXR1cm4gZmFsc2U7IH0gfVxuZnVuY3Rpb24gX2dldFByb3RvdHlwZU9mKG8pIHsgX2dldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LmdldFByb3RvdHlwZU9mLmJpbmQoKSA6IGZ1bmN0aW9uIF9nZXRQcm90b3R5cGVPZihvKSB7IHJldHVybiBvLl9fcHJvdG9fXyB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2Yobyk7IH07IHJldHVybiBfZ2V0UHJvdG90eXBlT2Yobyk7IH1cbmZ1bmN0aW9uIF9kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwgdmFsdWUpIHsga2V5ID0gX3RvUHJvcGVydHlLZXkoa2V5KTsgaWYgKGtleSBpbiBvYmopIHsgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwga2V5LCB7IHZhbHVlOiB2YWx1ZSwgZW51bWVyYWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlLCB3cml0YWJsZTogdHJ1ZSB9KTsgfSBlbHNlIHsgb2JqW2tleV0gPSB2YWx1ZTsgfSByZXR1cm4gb2JqOyB9XG5mdW5jdGlvbiBfdG9Qcm9wZXJ0eUtleShhcmcpIHsgdmFyIGtleSA9IF90b1ByaW1pdGl2ZShhcmcsIFwic3RyaW5nXCIpOyByZXR1cm4gX3R5cGVvZihrZXkpID09PSBcInN5bWJvbFwiID8ga2V5IDogU3RyaW5nKGtleSk7IH1cbmZ1bmN0aW9uIF90b1ByaW1pdGl2ZShpbnB1dCwgaGludCkgeyBpZiAoX3R5cGVvZihpbnB1dCkgIT09IFwib2JqZWN0XCIgfHwgaW5wdXQgPT09IG51bGwpIHJldHVybiBpbnB1dDsgdmFyIHByaW0gPSBpbnB1dFtTeW1ib2wudG9QcmltaXRpdmVdOyBpZiAocHJpbSAhPT0gdW5kZWZpbmVkKSB7IHZhciByZXMgPSBwcmltLmNhbGwoaW5wdXQsIGhpbnQgfHwgXCJkZWZhdWx0XCIpOyBpZiAoX3R5cGVvZihyZXMpICE9PSBcIm9iamVjdFwiKSByZXR1cm4gcmVzOyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQEB0b1ByaW1pdGl2ZSBtdXN0IHJldHVybiBhIHByaW1pdGl2ZSB2YWx1ZS5cIik7IH0gcmV0dXJuIChoaW50ID09PSBcInN0cmluZ1wiID8gU3RyaW5nIDogTnVtYmVyKShpbnB1dCk7IH1cbmZ1bmN0aW9uIF9hc3luY0l0ZXJhdG9yKGl0ZXJhYmxlKSB7IHZhciBtZXRob2QsIGFzeW5jLCBzeW5jLCByZXRyeSA9IDI7IGZvciAoXCJ1bmRlZmluZWRcIiAhPSB0eXBlb2YgU3ltYm9sICYmIChhc3luYyA9IFN5bWJvbC5hc3luY0l0ZXJhdG9yLCBzeW5jID0gU3ltYm9sLml0ZXJhdG9yKTsgcmV0cnktLTspIHsgaWYgKGFzeW5jICYmIG51bGwgIT0gKG1ldGhvZCA9IGl0ZXJhYmxlW2FzeW5jXSkpIHJldHVybiBtZXRob2QuY2FsbChpdGVyYWJsZSk7IGlmIChzeW5jICYmIG51bGwgIT0gKG1ldGhvZCA9IGl0ZXJhYmxlW3N5bmNdKSkgcmV0dXJuIG5ldyBBc3luY0Zyb21TeW5jSXRlcmF0b3IobWV0aG9kLmNhbGwoaXRlcmFibGUpKTsgYXN5bmMgPSBcIkBAYXN5bmNJdGVyYXRvclwiLCBzeW5jID0gXCJAQGl0ZXJhdG9yXCI7IH0gdGhyb3cgbmV3IFR5cGVFcnJvcihcIk9iamVjdCBpcyBub3QgYXN5bmMgaXRlcmFibGVcIik7IH1cbmZ1bmN0aW9uIEFzeW5jRnJvbVN5bmNJdGVyYXRvcihzKSB7IGZ1bmN0aW9uIEFzeW5jRnJvbVN5bmNJdGVyYXRvckNvbnRpbnVhdGlvbihyKSB7IGlmIChPYmplY3QocikgIT09IHIpIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgVHlwZUVycm9yKHIgKyBcIiBpcyBub3QgYW4gb2JqZWN0LlwiKSk7IHZhciBkb25lID0gci5kb25lOyByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHIudmFsdWUpLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7IHJldHVybiB7IHZhbHVlOiB2YWx1ZSwgZG9uZTogZG9uZSB9OyB9KTsgfSByZXR1cm4gQXN5bmNGcm9tU3luY0l0ZXJhdG9yID0gZnVuY3Rpb24gQXN5bmNGcm9tU3luY0l0ZXJhdG9yKHMpIHsgdGhpcy5zID0gcywgdGhpcy5uID0gcy5uZXh0OyB9LCBBc3luY0Zyb21TeW5jSXRlcmF0b3IucHJvdG90eXBlID0geyBzOiBudWxsLCBuOiBudWxsLCBuZXh0OiBmdW5jdGlvbiBuZXh0KCkgeyByZXR1cm4gQXN5bmNGcm9tU3luY0l0ZXJhdG9yQ29udGludWF0aW9uKHRoaXMubi5hcHBseSh0aGlzLnMsIGFyZ3VtZW50cykpOyB9LCBcInJldHVyblwiOiBmdW5jdGlvbiBfcmV0dXJuKHZhbHVlKSB7IHZhciByZXQgPSB0aGlzLnNbXCJyZXR1cm5cIl07IHJldHVybiB2b2lkIDAgPT09IHJldCA/IFByb21pc2UucmVzb2x2ZSh7IHZhbHVlOiB2YWx1ZSwgZG9uZTogITAgfSkgOiBBc3luY0Zyb21TeW5jSXRlcmF0b3JDb250aW51YXRpb24ocmV0LmFwcGx5KHRoaXMucywgYXJndW1lbnRzKSk7IH0sIFwidGhyb3dcIjogZnVuY3Rpb24gX3Rocm93KHZhbHVlKSB7IHZhciB0aHIgPSB0aGlzLnNbXCJyZXR1cm5cIl07IHJldHVybiB2b2lkIDAgPT09IHRociA/IFByb21pc2UucmVqZWN0KHZhbHVlKSA6IEFzeW5jRnJvbVN5bmNJdGVyYXRvckNvbnRpbnVhdGlvbih0aHIuYXBwbHkodGhpcy5zLCBhcmd1bWVudHMpKTsgfSB9LCBuZXcgQXN5bmNGcm9tU3luY0l0ZXJhdG9yKHMpOyB9IC8qXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIENvcHlyaWdodCAyMDIwIC0gMjAyNCBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiAgICAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuLyoqXG4gKiBBUEkgaGFuZGxlciBmb3IgdGhlIGNsaWVudCBzaWRlIG9mIHdpZGdldHMuIFRoaXMgcmFpc2VzIGV2ZW50c1xuICogZm9yIGVhY2ggYWN0aW9uIHJlY2VpdmVkIGFzIGBhY3Rpb246JHthY3Rpb259YCAoZWc6IFwiYWN0aW9uOnNjcmVlbnNob3RcIikuXG4gKiBEZWZhdWx0IGhhbmRsaW5nIGNhbiBiZSBwcmV2ZW50ZWQgYnkgdXNpbmcgcHJldmVudERlZmF1bHQoKSBvbiB0aGVcbiAqIHJhaXNlZCBldmVudC4gVGhlIGRlZmF1bHQgaGFuZGxpbmcgdmFyaWVzIGZvciBlYWNoIGFjdGlvbjogb25lc1xuICogd2hpY2ggdGhlIFNESyBjYW4gaGFuZGxlIHNhZmVseSBhcmUgYWNrbm93bGVkZ2VkIGFwcHJvcHJpYXRlbHkgYW5kXG4gKiBvbmVzIHdoaWNoIGFyZSB1bmhhbmRsZWQgKGN1c3RvbSBvciByZXF1aXJlIHRoZSBjbGllbnQgdG8gZG8gc29tZXRoaW5nKVxuICogYXJlIHJlamVjdGVkIHdpdGggYW4gZXJyb3IuXG4gKlxuICogRXZlbnRzIHdoaWNoIGFyZSBwcmV2ZW50RGVmYXVsdCgpZWQgbXVzdCByZXBseSB1c2luZyB0aGUgdHJhbnNwb3J0LlxuICogVGhlIGV2ZW50cyByYWlzZWQgd2lsbCBoYXZlIGEgZGVmYXVsdCBvZiBhbiBJV2lkZ2V0QXBpUmVxdWVzdFxuICogaW50ZXJmYWNlLlxuICpcbiAqIFdoZW4gdGhlIENsaWVudFdpZGdldEFwaSBpcyByZWFkeSB0byBzdGFydCBzZW5kaW5nIHJlcXVlc3RzLCBpdCB3aWxsXG4gKiByYWlzZSBhIFwicmVhZHlcIiBDdXN0b21FdmVudC4gQWZ0ZXIgdGhlIHJlYWR5IGV2ZW50IGZpcmVzLCBhY3Rpb25zIGNhblxuICogYmUgc2VudCBhbmQgdGhlIHRyYW5zcG9ydCB3aWxsIGJlIHJlYWR5LlxuICpcbiAqIFdoZW4gdGhlIHdpZGdldCBoYXMgaW5kaWNhdGVkIGl0IGhhcyBsb2FkZWQsIHRoaXMgY2xhc3MgcmFpc2VzIGFcbiAqIFwicHJlcGFyaW5nXCIgQ3VzdG9tRXZlbnQuIFRoZSBwcmVwYXJpbmcgZXZlbnQgZG9lcyBub3QgaW5kaWNhdGUgdGhhdFxuICogdGhlIHdpZGdldCBpcyByZWFkeSB0byByZWNlaXZlIGNvbW11bmljYXRpb25zIC0gdGhhdCBpcyBzaWduaWZpZWQgYnlcbiAqIHRoZSByZWFkeSBldmVudCBleGNsdXNpdmVseS5cbiAqXG4gKiBUaGlzIGNsYXNzIG9ubHkgaGFuZGxlcyBvbmUgd2lkZ2V0IGF0IGEgdGltZS5cbiAqL1xudmFyIENsaWVudFdpZGdldEFwaSA9IC8qI19fUFVSRV9fKi9mdW5jdGlvbiAoX0V2ZW50RW1pdHRlcikge1xuICBfaW5oZXJpdHMoQ2xpZW50V2lkZ2V0QXBpLCBfRXZlbnRFbWl0dGVyKTtcbiAgdmFyIF9zdXBlciA9IF9jcmVhdGVTdXBlcihDbGllbnRXaWRnZXRBcGkpO1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBjbGllbnQgd2lkZ2V0IEFQSS4gVGhpcyB3aWxsIGluc3RhbnRpYXRlIHRoZSB0cmFuc3BvcnRcbiAgICogYW5kIHN0YXJ0IGV2ZXJ5dGhpbmcuIFdoZW4gdGhlIGlmcmFtZSBpcyBsb2FkZWQgdW5kZXIgdGhlIHdpZGdldCdzXG4gICAqIGNvbmRpdGlvbnMsIGEgXCJyZWFkeVwiIGV2ZW50IHdpbGwgYmUgcmFpc2VkLlxuICAgKiBAcGFyYW0ge1dpZGdldH0gd2lkZ2V0IFRoZSB3aWRnZXQgdG8gY29tbXVuaWNhdGUgd2l0aC5cbiAgICogQHBhcmFtIHtIVE1MSUZyYW1lRWxlbWVudH0gaWZyYW1lIFRoZSBpZnJhbWUgdGhlIHdpZGdldCBpcyBpbi5cbiAgICogQHBhcmFtIHtXaWRnZXREcml2ZXJ9IGRyaXZlciBUaGUgZHJpdmVyIGZvciB0aGlzIHdpZGdldC9jbGllbnQuXG4gICAqL1xuICBmdW5jdGlvbiBDbGllbnRXaWRnZXRBcGkod2lkZ2V0LCBpZnJhbWUsIGRyaXZlcikge1xuICAgIHZhciBfdGhpcztcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgQ2xpZW50V2lkZ2V0QXBpKTtcbiAgICBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMpO1xuICAgIF90aGlzLndpZGdldCA9IHdpZGdldDtcbiAgICBfdGhpcy5pZnJhbWUgPSBpZnJhbWU7XG4gICAgX3RoaXMuZHJpdmVyID0gZHJpdmVyO1xuICAgIF9kZWZpbmVQcm9wZXJ0eShfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSwgXCJ0cmFuc3BvcnRcIiwgdm9pZCAwKTtcbiAgICAvLyBjb250ZW50TG9hZGVkQWN0aW9uU2VudCBpcyB1c2VkIHRvIGNoZWNrIHRoYXQgb25seSBvbmUgQ29udGVudExvYWRlZCByZXF1ZXN0IGlzIHNlbmQuXG4gICAgX2RlZmluZVByb3BlcnR5KF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpLCBcImNvbnRlbnRMb2FkZWRBY3Rpb25TZW50XCIsIGZhbHNlKTtcbiAgICBfZGVmaW5lUHJvcGVydHkoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcyksIFwiYWxsb3dlZENhcGFiaWxpdGllc1wiLCBuZXcgU2V0KCkpO1xuICAgIF9kZWZpbmVQcm9wZXJ0eShfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSwgXCJhbGxvd2VkRXZlbnRzXCIsIFtdKTtcbiAgICBfZGVmaW5lUHJvcGVydHkoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcyksIFwiaXNTdG9wcGVkXCIsIGZhbHNlKTtcbiAgICBfZGVmaW5lUHJvcGVydHkoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcyksIFwidHVyblNlcnZlcnNcIiwgbnVsbCk7XG4gICAgX2RlZmluZVByb3BlcnR5KF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpLCBcImNvbnRlbnRMb2FkZWRXYWl0VGltZXJcIiwgdm9pZCAwKTtcbiAgICBpZiAoIShpZnJhbWUgIT09IG51bGwgJiYgaWZyYW1lICE9PSB2b2lkIDAgJiYgaWZyYW1lLmNvbnRlbnRXaW5kb3cpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBpZnJhbWUgc3VwcGxpZWRcIik7XG4gICAgfVxuICAgIGlmICghd2lkZ2V0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIHdpZGdldFwiKTtcbiAgICB9XG4gICAgaWYgKCFkcml2ZXIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgZHJpdmVyXCIpO1xuICAgIH1cbiAgICBfdGhpcy50cmFuc3BvcnQgPSBuZXcgX1Bvc3RtZXNzYWdlVHJhbnNwb3J0LlBvc3RtZXNzYWdlVHJhbnNwb3J0KF9XaWRnZXRBcGlEaXJlY3Rpb24uV2lkZ2V0QXBpRGlyZWN0aW9uLlRvV2lkZ2V0LCB3aWRnZXQuaWQsIGlmcmFtZS5jb250ZW50V2luZG93LCB3aW5kb3cpO1xuICAgIF90aGlzLnRyYW5zcG9ydC50YXJnZXRPcmlnaW4gPSB3aWRnZXQub3JpZ2luO1xuICAgIF90aGlzLnRyYW5zcG9ydC5vbihcIm1lc3NhZ2VcIiwgX3RoaXMuaGFuZGxlTWVzc2FnZS5iaW5kKF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpKSk7XG4gICAgaWZyYW1lLmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkXCIsIF90aGlzLm9uSWZyYW1lTG9hZC5iaW5kKF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpKSk7XG4gICAgX3RoaXMudHJhbnNwb3J0LnN0YXJ0KCk7XG4gICAgcmV0dXJuIF90aGlzO1xuICB9XG4gIF9jcmVhdGVDbGFzcyhDbGllbnRXaWRnZXRBcGksIFt7XG4gICAga2V5OiBcImhhc0NhcGFiaWxpdHlcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gaGFzQ2FwYWJpbGl0eShjYXBhYmlsaXR5KSB7XG4gICAgICByZXR1cm4gdGhpcy5hbGxvd2VkQ2FwYWJpbGl0aWVzLmhhcyhjYXBhYmlsaXR5KTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiY2FuVXNlUm9vbVRpbWVsaW5lXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGNhblVzZVJvb21UaW1lbGluZShyb29tSWQpIHtcbiAgICAgIHJldHVybiB0aGlzLmhhc0NhcGFiaWxpdHkoXCJvcmcubWF0cml4Lm1zYzI3NjIudGltZWxpbmU6XCIuY29uY2F0KF9TeW1ib2xzLlN5bWJvbHMuQW55Um9vbSkpIHx8IHRoaXMuaGFzQ2FwYWJpbGl0eShcIm9yZy5tYXRyaXgubXNjMjc2Mi50aW1lbGluZTpcIi5jb25jYXQocm9vbUlkKSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImNhblNlbmRSb29tRXZlbnRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gY2FuU2VuZFJvb21FdmVudChldmVudFR5cGUpIHtcbiAgICAgIHZhciBtc2d0eXBlID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiBudWxsO1xuICAgICAgcmV0dXJuIHRoaXMuYWxsb3dlZEV2ZW50cy5zb21lKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHJldHVybiBlLm1hdGNoZXNBc1Jvb21FdmVudChfV2lkZ2V0RXZlbnRDYXBhYmlsaXR5LkV2ZW50RGlyZWN0aW9uLlNlbmQsIGV2ZW50VHlwZSwgbXNndHlwZSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiY2FuU2VuZFN0YXRlRXZlbnRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gY2FuU2VuZFN0YXRlRXZlbnQoZXZlbnRUeXBlLCBzdGF0ZUtleSkge1xuICAgICAgcmV0dXJuIHRoaXMuYWxsb3dlZEV2ZW50cy5zb21lKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHJldHVybiBlLm1hdGNoZXNBc1N0YXRlRXZlbnQoX1dpZGdldEV2ZW50Q2FwYWJpbGl0eS5FdmVudERpcmVjdGlvbi5TZW5kLCBldmVudFR5cGUsIHN0YXRlS2V5KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJjYW5TZW5kVG9EZXZpY2VFdmVudFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBjYW5TZW5kVG9EZXZpY2VFdmVudChldmVudFR5cGUpIHtcbiAgICAgIHJldHVybiB0aGlzLmFsbG93ZWRFdmVudHMuc29tZShmdW5jdGlvbiAoZSkge1xuICAgICAgICByZXR1cm4gZS5tYXRjaGVzQXNUb0RldmljZUV2ZW50KF9XaWRnZXRFdmVudENhcGFiaWxpdHkuRXZlbnREaXJlY3Rpb24uU2VuZCwgZXZlbnRUeXBlKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJjYW5SZWNlaXZlUm9vbUV2ZW50XCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGNhblJlY2VpdmVSb29tRXZlbnQoZXZlbnRUeXBlKSB7XG4gICAgICB2YXIgbXNndHlwZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDogbnVsbDtcbiAgICAgIHJldHVybiB0aGlzLmFsbG93ZWRFdmVudHMuc29tZShmdW5jdGlvbiAoZSkge1xuICAgICAgICByZXR1cm4gZS5tYXRjaGVzQXNSb29tRXZlbnQoX1dpZGdldEV2ZW50Q2FwYWJpbGl0eS5FdmVudERpcmVjdGlvbi5SZWNlaXZlLCBldmVudFR5cGUsIG1zZ3R5cGUpO1xuICAgICAgfSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImNhblJlY2VpdmVTdGF0ZUV2ZW50XCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGNhblJlY2VpdmVTdGF0ZUV2ZW50KGV2ZW50VHlwZSwgc3RhdGVLZXkpIHtcbiAgICAgIHJldHVybiB0aGlzLmFsbG93ZWRFdmVudHMuc29tZShmdW5jdGlvbiAoZSkge1xuICAgICAgICByZXR1cm4gZS5tYXRjaGVzQXNTdGF0ZUV2ZW50KF9XaWRnZXRFdmVudENhcGFiaWxpdHkuRXZlbnREaXJlY3Rpb24uUmVjZWl2ZSwgZXZlbnRUeXBlLCBzdGF0ZUtleSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiY2FuUmVjZWl2ZVRvRGV2aWNlRXZlbnRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gY2FuUmVjZWl2ZVRvRGV2aWNlRXZlbnQoZXZlbnRUeXBlKSB7XG4gICAgICByZXR1cm4gdGhpcy5hbGxvd2VkRXZlbnRzLnNvbWUoZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgcmV0dXJuIGUubWF0Y2hlc0FzVG9EZXZpY2VFdmVudChfV2lkZ2V0RXZlbnRDYXBhYmlsaXR5LkV2ZW50RGlyZWN0aW9uLlJlY2VpdmUsIGV2ZW50VHlwZSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiY2FuUmVjZWl2ZVJvb21BY2NvdW50RGF0YVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBjYW5SZWNlaXZlUm9vbUFjY291bnREYXRhKGV2ZW50VHlwZSkge1xuICAgICAgcmV0dXJuIHRoaXMuYWxsb3dlZEV2ZW50cy5zb21lKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHJldHVybiBlLm1hdGNoZXNBc1Jvb21BY2NvdW50RGF0YShfV2lkZ2V0RXZlbnRDYXBhYmlsaXR5LkV2ZW50RGlyZWN0aW9uLlJlY2VpdmUsIGV2ZW50VHlwZSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwic3RvcFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzdG9wKCkge1xuICAgICAgdGhpcy5pc1N0b3BwZWQgPSB0cnVlO1xuICAgICAgdGhpcy50cmFuc3BvcnQuc3RvcCgpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJiZWdpbkNhcGFiaWxpdGllc1wiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBiZWdpbkNhcGFiaWxpdGllcygpIHtcbiAgICAgIHZhciBfdGhpczIgPSB0aGlzO1xuICAgICAgLy8gd2lkZ2V0IGhhcyBsb2FkZWQgLSB0ZWxsIGFsbCB0aGUgbGlzdGVuZXJzIHRoYXRcbiAgICAgIHRoaXMuZW1pdChcInByZXBhcmluZ1wiKTtcbiAgICAgIHZhciByZXF1ZXN0ZWRDYXBzO1xuICAgICAgdGhpcy50cmFuc3BvcnQuc2VuZChfV2lkZ2V0QXBpQWN0aW9uLldpZGdldEFwaVRvV2lkZ2V0QWN0aW9uLkNhcGFiaWxpdGllcywge30pLnRoZW4oZnVuY3Rpb24gKGNhcHMpIHtcbiAgICAgICAgcmVxdWVzdGVkQ2FwcyA9IGNhcHMuY2FwYWJpbGl0aWVzO1xuICAgICAgICByZXR1cm4gX3RoaXMyLmRyaXZlci52YWxpZGF0ZUNhcGFiaWxpdGllcyhuZXcgU2V0KGNhcHMuY2FwYWJpbGl0aWVzKSk7XG4gICAgICB9KS50aGVuKGZ1bmN0aW9uIChhbGxvd2VkQ2Fwcykge1xuICAgICAgICBjb25zb2xlLmxvZyhcIldpZGdldCBcIi5jb25jYXQoX3RoaXMyLndpZGdldC5pZCwgXCIgaXMgYWxsb3dlZCBjYXBhYmlsaXRpZXM6XCIpLCBBcnJheS5mcm9tKGFsbG93ZWRDYXBzKSk7XG4gICAgICAgIF90aGlzMi5hbGxvd2VkQ2FwYWJpbGl0aWVzID0gYWxsb3dlZENhcHM7XG4gICAgICAgIF90aGlzMi5hbGxvd2VkRXZlbnRzID0gX1dpZGdldEV2ZW50Q2FwYWJpbGl0eS5XaWRnZXRFdmVudENhcGFiaWxpdHkuZmluZEV2ZW50Q2FwYWJpbGl0aWVzKGFsbG93ZWRDYXBzKTtcbiAgICAgICAgX3RoaXMyLm5vdGlmeUNhcGFiaWxpdGllcyhyZXF1ZXN0ZWRDYXBzKTtcbiAgICAgICAgX3RoaXMyLmVtaXQoXCJyZWFkeVwiKTtcbiAgICAgIH0pW1wiY2F0Y2hcIl0oZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgX3RoaXMyLmVtaXQoXCJlcnJvcjpwcmVwYXJpbmdcIiwgZSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwibm90aWZ5Q2FwYWJpbGl0aWVzXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIG5vdGlmeUNhcGFiaWxpdGllcyhyZXF1ZXN0ZWQpIHtcbiAgICAgIHZhciBfdGhpczMgPSB0aGlzO1xuICAgICAgdGhpcy50cmFuc3BvcnQuc2VuZChfV2lkZ2V0QXBpQWN0aW9uLldpZGdldEFwaVRvV2lkZ2V0QWN0aW9uLk5vdGlmeUNhcGFiaWxpdGllcywge1xuICAgICAgICByZXF1ZXN0ZWQ6IHJlcXVlc3RlZCxcbiAgICAgICAgYXBwcm92ZWQ6IEFycmF5LmZyb20odGhpcy5hbGxvd2VkQ2FwYWJpbGl0aWVzKVxuICAgICAgfSlbXCJjYXRjaFwiXShmdW5jdGlvbiAoZSkge1xuICAgICAgICBjb25zb2xlLndhcm4oXCJub24tZmF0YWwgZXJyb3Igbm90aWZ5aW5nIHdpZGdldCBvZiBhcHByb3ZlZCBjYXBhYmlsaXRpZXM6XCIsIGUpO1xuICAgICAgfSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIF90aGlzMy5lbWl0KFwiY2FwYWJpbGl0aWVzTm90aWZpZWRcIik7XG4gICAgICB9KTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwib25JZnJhbWVMb2FkXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIG9uSWZyYW1lTG9hZChldikge1xuICAgICAgaWYgKHRoaXMud2lkZ2V0LndhaXRGb3JJZnJhbWVMb2FkKSB7XG4gICAgICAgIC8vIElmIHRoZSB3aWRnZXQgaXMgc2V0IHRvIHdhaXRGb3JJZnJhbWVMb2FkIHRoZSBjYXBhYmlsaXRpZXMgaW1tZWRpYXRseSBnZXQgc2V0dXAgYWZ0ZXIgbG9hZC5cbiAgICAgICAgLy8gVGhlIGNsaWVudCBkb2VzIG5vdCB3YWl0IGZvciB0aGUgQ29udGVudExvYWRlZCBhY3Rpb24uXG4gICAgICAgIHRoaXMuYmVnaW5DYXBhYmlsaXRpZXMoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFJlYWNoaW5nIHRoaXMgbWVhbnMsIHRoYXQgdGhlIElmcmFtZSBnb3QgcmVsb2FkZWQvbG9hZGVkIGFuZFxuICAgICAgICAvLyB0aGUgY2xpZW50QXBpIGlzIGF3YWl0aW5nIHRoZSBGSVJTVCBDb250ZW50TG9hZGVkIGFjdGlvbi5cbiAgICAgICAgY29uc29sZS5sb2coXCJ3YWl0Rm9ySWZyYW1lTG9hZCBpcyBmYWxzZTogd2FpdGluZyBmb3Igd2lkZ2V0IHRvIHNlbmQgY29udGVudExvYWRlZFwiKTtcbiAgICAgICAgdGhpcy5jb250ZW50TG9hZGVkV2FpdFRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIldpZGdldCBzcGVjaWZpZWQgd2FpdEZvcklmcmFtZUxvYWQ9ZmFsc2UgYnV0IHRpbWVkIG91dCB3YWl0aW5nIGZvciBjb250ZW50TG9hZGVkIGV2ZW50IVwiKTtcbiAgICAgICAgfSwgMTAwMDApO1xuICAgICAgICB0aGlzLmNvbnRlbnRMb2FkZWRBY3Rpb25TZW50ID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImhhbmRsZUNvbnRlbnRMb2FkZWRBY3Rpb25cIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gaGFuZGxlQ29udGVudExvYWRlZEFjdGlvbihhY3Rpb24pIHtcbiAgICAgIGlmICh0aGlzLmNvbnRlbnRMb2FkZWRXYWl0VGltZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5jb250ZW50TG9hZGVkV2FpdFRpbWVyKTtcbiAgICAgICAgdGhpcy5jb250ZW50TG9hZGVkV2FpdFRpbWVyID0gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuY29udGVudExvYWRlZEFjdGlvblNlbnQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW1wcm9wZXIgc2VxdWVuY2U6IENvbnRlbnRMb2FkZWQgQWN0aW9uIGNhbiBvbmx5IGJlIHNlbnQgb25jZSBhZnRlciB0aGUgd2lkZ2V0IGxvYWRlZCBcIiArIFwiYW5kIHNob3VsZCBvbmx5IGJlIHVzZWQgaWYgd2FpdEZvcklmcmFtZUxvYWQgaXMgZmFsc2UgKGRlZmF1bHQ9dHJ1ZSlcIik7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy53aWRnZXQud2FpdEZvcklmcmFtZUxvYWQpIHtcbiAgICAgICAgdGhpcy50cmFuc3BvcnQucmVwbHkoYWN0aW9uLCB7XG4gICAgICAgICAgZXJyb3I6IHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IFwiSW1wcm9wZXIgc2VxdWVuY2U6IG5vdCBleHBlY3RpbmcgQ29udGVudExvYWRlZCBldmVudCBpZiBcIiArIFwid2FpdEZvcklmcmFtZUxvYWQgaXMgdHJ1ZSAoZGVmYXVsdD10cnVlKVwiXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMudHJhbnNwb3J0LnJlcGx5KGFjdGlvbiwge30pO1xuICAgICAgICB0aGlzLmJlZ2luQ2FwYWJpbGl0aWVzKCk7XG4gICAgICB9XG4gICAgICB0aGlzLmNvbnRlbnRMb2FkZWRBY3Rpb25TZW50ID0gdHJ1ZTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwicmVwbHlWZXJzaW9uc1wiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiByZXBseVZlcnNpb25zKHJlcXVlc3QpIHtcbiAgICAgIHRoaXMudHJhbnNwb3J0LnJlcGx5KHJlcXVlc3QsIHtcbiAgICAgICAgc3VwcG9ydGVkX3ZlcnNpb25zOiBfQXBpVmVyc2lvbi5DdXJyZW50QXBpVmVyc2lvbnNcbiAgICAgIH0pO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJoYW5kbGVDYXBhYmlsaXRpZXNSZW5lZ290aWF0ZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBoYW5kbGVDYXBhYmlsaXRpZXNSZW5lZ290aWF0ZShyZXF1ZXN0KSB7XG4gICAgICB2YXIgX3JlcXVlc3QkZGF0YSxcbiAgICAgICAgX3RoaXM0ID0gdGhpcztcbiAgICAgIC8vIGFja25vd2xlZGdlIGZpcnN0XG4gICAgICB0aGlzLnRyYW5zcG9ydC5yZXBseShyZXF1ZXN0LCB7fSk7XG4gICAgICB2YXIgcmVxdWVzdGVkID0gKChfcmVxdWVzdCRkYXRhID0gcmVxdWVzdC5kYXRhKSA9PT0gbnVsbCB8fCBfcmVxdWVzdCRkYXRhID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfcmVxdWVzdCRkYXRhLmNhcGFiaWxpdGllcykgfHwgW107XG4gICAgICB2YXIgbmV3bHlSZXF1ZXN0ZWQgPSBuZXcgU2V0KHJlcXVlc3RlZC5maWx0ZXIoZnVuY3Rpb24gKHIpIHtcbiAgICAgICAgcmV0dXJuICFfdGhpczQuaGFzQ2FwYWJpbGl0eShyKTtcbiAgICAgIH0pKTtcbiAgICAgIGlmIChuZXdseVJlcXVlc3RlZC5zaXplID09PSAwKSB7XG4gICAgICAgIC8vIE5vdGhpbmcgdG8gZG8gLSBub3RpZnkgY2FwYWJpbGl0aWVzXG4gICAgICAgIHJldHVybiB0aGlzLm5vdGlmeUNhcGFiaWxpdGllcyhbXSk7XG4gICAgICB9XG4gICAgICB0aGlzLmRyaXZlci52YWxpZGF0ZUNhcGFiaWxpdGllcyhuZXdseVJlcXVlc3RlZCkudGhlbihmdW5jdGlvbiAoYWxsb3dlZCkge1xuICAgICAgICBhbGxvd2VkLmZvckVhY2goZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgICByZXR1cm4gX3RoaXM0LmFsbG93ZWRDYXBhYmlsaXRpZXMuYWRkKGMpO1xuICAgICAgICB9KTtcbiAgICAgICAgdmFyIGFsbG93ZWRFdmVudHMgPSBfV2lkZ2V0RXZlbnRDYXBhYmlsaXR5LldpZGdldEV2ZW50Q2FwYWJpbGl0eS5maW5kRXZlbnRDYXBhYmlsaXRpZXMoYWxsb3dlZCk7XG4gICAgICAgIGFsbG93ZWRFdmVudHMuZm9yRWFjaChmdW5jdGlvbiAoYykge1xuICAgICAgICAgIHJldHVybiBfdGhpczQuYWxsb3dlZEV2ZW50cy5wdXNoKGMpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIF90aGlzNC5ub3RpZnlDYXBhYmlsaXRpZXMoQXJyYXkuZnJvbShuZXdseVJlcXVlc3RlZCkpO1xuICAgICAgfSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImhhbmRsZU5hdmlnYXRlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGhhbmRsZU5hdmlnYXRlKHJlcXVlc3QpIHtcbiAgICAgIHZhciBfcmVxdWVzdCRkYXRhMixcbiAgICAgICAgX3JlcXVlc3QkZGF0YTMsXG4gICAgICAgIF90aGlzNSA9IHRoaXM7XG4gICAgICBpZiAoIXRoaXMuaGFzQ2FwYWJpbGl0eShfQ2FwYWJpbGl0aWVzLk1hdHJpeENhcGFiaWxpdGllcy5NU0MyOTMxTmF2aWdhdGUpKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRyYW5zcG9ydC5yZXBseShyZXF1ZXN0LCB7XG4gICAgICAgICAgZXJyb3I6IHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IFwiTWlzc2luZyBjYXBhYmlsaXR5XCJcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgaWYgKCEoKF9yZXF1ZXN0JGRhdGEyID0gcmVxdWVzdC5kYXRhKSAhPT0gbnVsbCAmJiBfcmVxdWVzdCRkYXRhMiAhPT0gdm9pZCAwICYmIF9yZXF1ZXN0JGRhdGEyLnVyaSkgfHwgISgoX3JlcXVlc3QkZGF0YTMgPSByZXF1ZXN0LmRhdGEpICE9PSBudWxsICYmIF9yZXF1ZXN0JGRhdGEzICE9PSB2b2lkIDAgJiYgX3JlcXVlc3QkZGF0YTMudXJpLnRvU3RyaW5nKCkuc3RhcnRzV2l0aChcImh0dHBzOi8vbWF0cml4LnRvLyNcIikpKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRyYW5zcG9ydC5yZXBseShyZXF1ZXN0LCB7XG4gICAgICAgICAgZXJyb3I6IHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IFwiSW52YWxpZCBtYXRyaXgudG8gVVJJXCJcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgdmFyIG9uRXJyID0gZnVuY3Rpb24gb25FcnIoZSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiW0NsaWVudFdpZGdldEFwaV0gRmFpbGVkIHRvIGhhbmRsZSBuYXZpZ2F0aW9uOiBcIiwgZSk7XG4gICAgICAgIF90aGlzNS5oYW5kbGVEcml2ZXJFcnJvcihlLCByZXF1ZXN0LCBcIkVycm9yIGhhbmRsaW5nIG5hdmlnYXRpb25cIik7XG4gICAgICB9O1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGhpcy5kcml2ZXIubmF2aWdhdGUocmVxdWVzdC5kYXRhLnVyaS50b1N0cmluZygpKVtcImNhdGNoXCJdKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgcmV0dXJuIG9uRXJyKGUpO1xuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICByZXR1cm4gX3RoaXM1LnRyYW5zcG9ydC5yZXBseShyZXF1ZXN0LCB7fSk7XG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gb25FcnIoZSk7XG4gICAgICB9XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImhhbmRsZU9JRENcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gaGFuZGxlT0lEQyhyZXF1ZXN0KSB7XG4gICAgICB2YXIgX3RoaXM2ID0gdGhpcztcbiAgICAgIHZhciBwaGFzZSA9IDE7IC8vIDEgPSBpbml0aWFsIHJlcXVlc3QsIDIgPSBhZnRlciB1c2VyIG1hbnVhbCBjb25maXJtYXRpb25cblxuICAgICAgdmFyIHJlcGx5U3RhdGUgPSBmdW5jdGlvbiByZXBseVN0YXRlKHN0YXRlLCBjcmVkZW50aWFsKSB7XG4gICAgICAgIGNyZWRlbnRpYWwgPSBjcmVkZW50aWFsIHx8IHt9O1xuICAgICAgICBpZiAocGhhc2UgPiAxKSB7XG4gICAgICAgICAgcmV0dXJuIF90aGlzNi50cmFuc3BvcnQuc2VuZChfV2lkZ2V0QXBpQWN0aW9uLldpZGdldEFwaVRvV2lkZ2V0QWN0aW9uLk9wZW5JRENyZWRlbnRpYWxzLCBfb2JqZWN0U3ByZWFkKHtcbiAgICAgICAgICAgIHN0YXRlOiBzdGF0ZSxcbiAgICAgICAgICAgIG9yaWdpbmFsX3JlcXVlc3RfaWQ6IHJlcXVlc3QucmVxdWVzdElkXG4gICAgICAgICAgfSwgY3JlZGVudGlhbCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBfdGhpczYudHJhbnNwb3J0LnJlcGx5KHJlcXVlc3QsIF9vYmplY3RTcHJlYWQoe1xuICAgICAgICAgICAgc3RhdGU6IHN0YXRlXG4gICAgICAgICAgfSwgY3JlZGVudGlhbCkpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgdmFyIHJlcGx5RXJyb3IgPSBmdW5jdGlvbiByZXBseUVycm9yKG1zZykge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiW0NsaWVudFdpZGdldEFwaV0gRmFpbGVkIHRvIGhhbmRsZSBPSURDOiBcIiwgbXNnKTtcbiAgICAgICAgaWYgKHBoYXNlID4gMSkge1xuICAgICAgICAgIC8vIFdlIGRvbid0IGhhdmUgYSB3YXkgdG8gaW5kaWNhdGUgdGhhdCBhIHJhbmRvbSBlcnJvciBoYXBwZW5lZCBpbiB0aGlzIGZsb3csIHNvXG4gICAgICAgICAgLy8ganVzdCBibG9jayB0aGUgYXR0ZW1wdC5cbiAgICAgICAgICByZXR1cm4gcmVwbHlTdGF0ZShfR2V0T3BlbklEQWN0aW9uLk9wZW5JRFJlcXVlc3RTdGF0ZS5CbG9ja2VkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gX3RoaXM2LnRyYW5zcG9ydC5yZXBseShyZXF1ZXN0LCB7XG4gICAgICAgICAgICBlcnJvcjoge1xuICAgICAgICAgICAgICBtZXNzYWdlOiBtc2dcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIHZhciBvYnNlcnZlciA9IG5ldyBfU2ltcGxlT2JzZXJ2YWJsZS5TaW1wbGVPYnNlcnZhYmxlKGZ1bmN0aW9uICh1cGRhdGUpIHtcbiAgICAgICAgaWYgKHVwZGF0ZS5zdGF0ZSA9PT0gX0dldE9wZW5JREFjdGlvbi5PcGVuSURSZXF1ZXN0U3RhdGUuUGVuZGluZ1VzZXJDb25maXJtYXRpb24gJiYgcGhhc2UgPiAxKSB7XG4gICAgICAgICAgb2JzZXJ2ZXIuY2xvc2UoKTtcbiAgICAgICAgICByZXR1cm4gcmVwbHlFcnJvcihcImNsaWVudCBwcm92aWRlZCBvdXQtb2YtcGhhc2UgcmVzcG9uc2UgdG8gT0lEQyBmbG93XCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh1cGRhdGUuc3RhdGUgPT09IF9HZXRPcGVuSURBY3Rpb24uT3BlbklEUmVxdWVzdFN0YXRlLlBlbmRpbmdVc2VyQ29uZmlybWF0aW9uKSB7XG4gICAgICAgICAgcmVwbHlTdGF0ZSh1cGRhdGUuc3RhdGUpO1xuICAgICAgICAgIHBoYXNlKys7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh1cGRhdGUuc3RhdGUgPT09IF9HZXRPcGVuSURBY3Rpb24uT3BlbklEUmVxdWVzdFN0YXRlLkFsbG93ZWQgJiYgIXVwZGF0ZS50b2tlbikge1xuICAgICAgICAgIHJldHVybiByZXBseUVycm9yKFwiY2xpZW50IHByb3ZpZGVkIGludmFsaWQgT0lEQyB0b2tlbiBmb3IgYW4gYWxsb3dlZCByZXF1ZXN0XCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh1cGRhdGUuc3RhdGUgPT09IF9HZXRPcGVuSURBY3Rpb24uT3BlbklEUmVxdWVzdFN0YXRlLkJsb2NrZWQpIHtcbiAgICAgICAgICB1cGRhdGUudG9rZW4gPSB1bmRlZmluZWQ7IC8vIGp1c3QgaW4gY2FzZSB0aGUgY2xpZW50IGRpZCBzb21ldGhpbmcgd2VpcmRcbiAgICAgICAgfVxuXG4gICAgICAgIG9ic2VydmVyLmNsb3NlKCk7XG4gICAgICAgIHJldHVybiByZXBseVN0YXRlKHVwZGF0ZS5zdGF0ZSwgdXBkYXRlLnRva2VuKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5kcml2ZXIuYXNrT3BlbklEKG9ic2VydmVyKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiaGFuZGxlUmVhZFJvb21BY2NvdW50RGF0YVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBoYW5kbGVSZWFkUm9vbUFjY291bnREYXRhKHJlcXVlc3QpIHtcbiAgICAgIHZhciBfdGhpczcgPSB0aGlzO1xuICAgICAgdmFyIGV2ZW50cyA9IFByb21pc2UucmVzb2x2ZShbXSk7XG4gICAgICBldmVudHMgPSB0aGlzLmRyaXZlci5yZWFkUm9vbUFjY291bnREYXRhKHJlcXVlc3QuZGF0YS50eXBlKTtcbiAgICAgIGlmICghdGhpcy5jYW5SZWNlaXZlUm9vbUFjY291bnREYXRhKHJlcXVlc3QuZGF0YS50eXBlKSkge1xuICAgICAgICByZXR1cm4gdGhpcy50cmFuc3BvcnQucmVwbHkocmVxdWVzdCwge1xuICAgICAgICAgIGVycm9yOiB7XG4gICAgICAgICAgICBtZXNzYWdlOiBcIkNhbm5vdCByZWFkIHJvb20gYWNjb3VudCBkYXRhIG9mIHRoaXMgdHlwZVwiXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBldmVudHMudGhlbihmdW5jdGlvbiAoZXZzKSB7XG4gICAgICAgIF90aGlzNy50cmFuc3BvcnQucmVwbHkocmVxdWVzdCwge1xuICAgICAgICAgIGV2ZW50czogZXZzXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImhhbmRsZVJlYWRFdmVudHNcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gaGFuZGxlUmVhZEV2ZW50cyhyZXF1ZXN0KSB7XG4gICAgICB2YXIgX3RoaXM4ID0gdGhpcztcbiAgICAgIGlmICghcmVxdWVzdC5kYXRhLnR5cGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHJhbnNwb3J0LnJlcGx5KHJlcXVlc3QsIHtcbiAgICAgICAgICBlcnJvcjoge1xuICAgICAgICAgICAgbWVzc2FnZTogXCJJbnZhbGlkIHJlcXVlc3QgLSBtaXNzaW5nIGV2ZW50IHR5cGVcIlxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBpZiAocmVxdWVzdC5kYXRhLmxpbWl0ICE9PSB1bmRlZmluZWQgJiYgKCFyZXF1ZXN0LmRhdGEubGltaXQgfHwgcmVxdWVzdC5kYXRhLmxpbWl0IDwgMCkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHJhbnNwb3J0LnJlcGx5KHJlcXVlc3QsIHtcbiAgICAgICAgICBlcnJvcjoge1xuICAgICAgICAgICAgbWVzc2FnZTogXCJJbnZhbGlkIHJlcXVlc3QgLSBsaW1pdCBvdXQgb2YgcmFuZ2VcIlxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICB2YXIgYXNrUm9vbUlkcyA9IG51bGw7IC8vIG51bGwgZGVub3RlcyBjdXJyZW50IHJvb20gb25seVxuICAgICAgaWYgKHJlcXVlc3QuZGF0YS5yb29tX2lkcykge1xuICAgICAgICBhc2tSb29tSWRzID0gcmVxdWVzdC5kYXRhLnJvb21faWRzO1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoYXNrUm9vbUlkcykpIHtcbiAgICAgICAgICBhc2tSb29tSWRzID0gW2Fza1Jvb21JZHNdO1xuICAgICAgICB9XG4gICAgICAgIHZhciBfaXRlcmF0b3IyID0gX2NyZWF0ZUZvck9mSXRlcmF0b3JIZWxwZXIoYXNrUm9vbUlkcyksXG4gICAgICAgICAgX3N0ZXAyO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGZvciAoX2l0ZXJhdG9yMi5zKCk7ICEoX3N0ZXAyID0gX2l0ZXJhdG9yMi5uKCkpLmRvbmU7KSB7XG4gICAgICAgICAgICB2YXIgcm9vbUlkID0gX3N0ZXAyLnZhbHVlO1xuICAgICAgICAgICAgaWYgKCF0aGlzLmNhblVzZVJvb21UaW1lbGluZShyb29tSWQpKSB7XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLnRyYW5zcG9ydC5yZXBseShyZXF1ZXN0LCB7XG4gICAgICAgICAgICAgICAgZXJyb3I6IHtcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IFwiVW5hYmxlIHRvIGFjY2VzcyByb29tIHRpbWVsaW5lOiBcIi5jb25jYXQocm9vbUlkKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICBfaXRlcmF0b3IyLmUoZXJyKTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICBfaXRlcmF0b3IyLmYoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdmFyIGxpbWl0ID0gcmVxdWVzdC5kYXRhLmxpbWl0IHx8IDA7XG4gICAgICB2YXIgc2luY2UgPSByZXF1ZXN0LmRhdGEuc2luY2U7XG4gICAgICB2YXIgZXZlbnRzID0gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICAgIGlmIChyZXF1ZXN0LmRhdGEuc3RhdGVfa2V5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdmFyIHN0YXRlS2V5ID0gcmVxdWVzdC5kYXRhLnN0YXRlX2tleSA9PT0gdHJ1ZSA/IHVuZGVmaW5lZCA6IHJlcXVlc3QuZGF0YS5zdGF0ZV9rZXkudG9TdHJpbmcoKTtcbiAgICAgICAgaWYgKCF0aGlzLmNhblJlY2VpdmVTdGF0ZUV2ZW50KHJlcXVlc3QuZGF0YS50eXBlLCBzdGF0ZUtleSAhPT0gbnVsbCAmJiBzdGF0ZUtleSAhPT0gdm9pZCAwID8gc3RhdGVLZXkgOiBudWxsKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLnRyYW5zcG9ydC5yZXBseShyZXF1ZXN0LCB7XG4gICAgICAgICAgICBlcnJvcjoge1xuICAgICAgICAgICAgICBtZXNzYWdlOiBcIkNhbm5vdCByZWFkIHN0YXRlIGV2ZW50cyBvZiB0aGlzIHR5cGVcIlxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGV2ZW50cyA9IHRoaXMuZHJpdmVyLnJlYWRTdGF0ZUV2ZW50cyhyZXF1ZXN0LmRhdGEudHlwZSwgc3RhdGVLZXksIGxpbWl0LCBhc2tSb29tSWRzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICghdGhpcy5jYW5SZWNlaXZlUm9vbUV2ZW50KHJlcXVlc3QuZGF0YS50eXBlLCByZXF1ZXN0LmRhdGEubXNndHlwZSkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy50cmFuc3BvcnQucmVwbHkocmVxdWVzdCwge1xuICAgICAgICAgICAgZXJyb3I6IHtcbiAgICAgICAgICAgICAgbWVzc2FnZTogXCJDYW5ub3QgcmVhZCByb29tIGV2ZW50cyBvZiB0aGlzIHR5cGVcIlxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGV2ZW50cyA9IHRoaXMuZHJpdmVyLnJlYWRSb29tRXZlbnRzKHJlcXVlc3QuZGF0YS50eXBlLCByZXF1ZXN0LmRhdGEubXNndHlwZSwgbGltaXQsIGFza1Jvb21JZHMsIHNpbmNlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBldmVudHMudGhlbihmdW5jdGlvbiAoZXZzKSB7XG4gICAgICAgIHJldHVybiBfdGhpczgudHJhbnNwb3J0LnJlcGx5KHJlcXVlc3QsIHtcbiAgICAgICAgICBldmVudHM6IGV2c1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJoYW5kbGVTZW5kRXZlbnRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gaGFuZGxlU2VuZEV2ZW50KHJlcXVlc3QpIHtcbiAgICAgIHZhciBfdGhpczkgPSB0aGlzO1xuICAgICAgaWYgKCFyZXF1ZXN0LmRhdGEudHlwZSkge1xuICAgICAgICByZXR1cm4gdGhpcy50cmFuc3BvcnQucmVwbHkocmVxdWVzdCwge1xuICAgICAgICAgIGVycm9yOiB7XG4gICAgICAgICAgICBtZXNzYWdlOiBcIkludmFsaWQgcmVxdWVzdCAtIG1pc3NpbmcgZXZlbnQgdHlwZVwiXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGlmICghIXJlcXVlc3QuZGF0YS5yb29tX2lkICYmICF0aGlzLmNhblVzZVJvb21UaW1lbGluZShyZXF1ZXN0LmRhdGEucm9vbV9pZCkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHJhbnNwb3J0LnJlcGx5KHJlcXVlc3QsIHtcbiAgICAgICAgICBlcnJvcjoge1xuICAgICAgICAgICAgbWVzc2FnZTogXCJVbmFibGUgdG8gYWNjZXNzIHJvb20gdGltZWxpbmU6IFwiLmNvbmNhdChyZXF1ZXN0LmRhdGEucm9vbV9pZClcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgdmFyIGlzRGVsYXllZEV2ZW50ID0gcmVxdWVzdC5kYXRhLmRlbGF5ICE9PSB1bmRlZmluZWQgfHwgcmVxdWVzdC5kYXRhLnBhcmVudF9kZWxheV9pZCAhPT0gdW5kZWZpbmVkO1xuICAgICAgaWYgKGlzRGVsYXllZEV2ZW50ICYmICF0aGlzLmhhc0NhcGFiaWxpdHkoX0NhcGFiaWxpdGllcy5NYXRyaXhDYXBhYmlsaXRpZXMuTVNDNDE1N1NlbmREZWxheWVkRXZlbnQpKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRyYW5zcG9ydC5yZXBseShyZXF1ZXN0LCB7XG4gICAgICAgICAgZXJyb3I6IHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IFwiTWlzc2luZyBjYXBhYmlsaXR5XCJcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgdmFyIHNlbmRFdmVudFByb21pc2U7XG4gICAgICBpZiAocmVxdWVzdC5kYXRhLnN0YXRlX2tleSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmICghdGhpcy5jYW5TZW5kU3RhdGVFdmVudChyZXF1ZXN0LmRhdGEudHlwZSwgcmVxdWVzdC5kYXRhLnN0YXRlX2tleSkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy50cmFuc3BvcnQucmVwbHkocmVxdWVzdCwge1xuICAgICAgICAgICAgZXJyb3I6IHtcbiAgICAgICAgICAgICAgbWVzc2FnZTogXCJDYW5ub3Qgc2VuZCBzdGF0ZSBldmVudHMgb2YgdGhpcyB0eXBlXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzRGVsYXllZEV2ZW50KSB7XG4gICAgICAgICAgc2VuZEV2ZW50UHJvbWlzZSA9IHRoaXMuZHJpdmVyLnNlbmRFdmVudChyZXF1ZXN0LmRhdGEudHlwZSwgcmVxdWVzdC5kYXRhLmNvbnRlbnQgfHwge30sIHJlcXVlc3QuZGF0YS5zdGF0ZV9rZXksIHJlcXVlc3QuZGF0YS5yb29tX2lkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgX3JlcXVlc3QkZGF0YSRkZWxheSwgX3JlcXVlc3QkZGF0YSRwYXJlbnRfO1xuICAgICAgICAgIHNlbmRFdmVudFByb21pc2UgPSB0aGlzLmRyaXZlci5zZW5kRGVsYXllZEV2ZW50KChfcmVxdWVzdCRkYXRhJGRlbGF5ID0gcmVxdWVzdC5kYXRhLmRlbGF5KSAhPT0gbnVsbCAmJiBfcmVxdWVzdCRkYXRhJGRlbGF5ICE9PSB2b2lkIDAgPyBfcmVxdWVzdCRkYXRhJGRlbGF5IDogbnVsbCwgKF9yZXF1ZXN0JGRhdGEkcGFyZW50XyA9IHJlcXVlc3QuZGF0YS5wYXJlbnRfZGVsYXlfaWQpICE9PSBudWxsICYmIF9yZXF1ZXN0JGRhdGEkcGFyZW50XyAhPT0gdm9pZCAwID8gX3JlcXVlc3QkZGF0YSRwYXJlbnRfIDogbnVsbCwgcmVxdWVzdC5kYXRhLnR5cGUsIHJlcXVlc3QuZGF0YS5jb250ZW50IHx8IHt9LCByZXF1ZXN0LmRhdGEuc3RhdGVfa2V5LCByZXF1ZXN0LmRhdGEucm9vbV9pZCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBjb250ZW50ID0gcmVxdWVzdC5kYXRhLmNvbnRlbnQgfHwge307XG4gICAgICAgIHZhciBtc2d0eXBlID0gY29udGVudFsnbXNndHlwZSddO1xuICAgICAgICBpZiAoIXRoaXMuY2FuU2VuZFJvb21FdmVudChyZXF1ZXN0LmRhdGEudHlwZSwgbXNndHlwZSkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy50cmFuc3BvcnQucmVwbHkocmVxdWVzdCwge1xuICAgICAgICAgICAgZXJyb3I6IHtcbiAgICAgICAgICAgICAgbWVzc2FnZTogXCJDYW5ub3Qgc2VuZCByb29tIGV2ZW50cyBvZiB0aGlzIHR5cGVcIlxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaXNEZWxheWVkRXZlbnQpIHtcbiAgICAgICAgICBzZW5kRXZlbnRQcm9taXNlID0gdGhpcy5kcml2ZXIuc2VuZEV2ZW50KHJlcXVlc3QuZGF0YS50eXBlLCBjb250ZW50LCBudWxsLFxuICAgICAgICAgIC8vIG5vdCBzZW5kaW5nIGEgc3RhdGUgZXZlbnRcbiAgICAgICAgICByZXF1ZXN0LmRhdGEucm9vbV9pZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIF9yZXF1ZXN0JGRhdGEkZGVsYXkyLCBfcmVxdWVzdCRkYXRhJHBhcmVudF8yO1xuICAgICAgICAgIHNlbmRFdmVudFByb21pc2UgPSB0aGlzLmRyaXZlci5zZW5kRGVsYXllZEV2ZW50KChfcmVxdWVzdCRkYXRhJGRlbGF5MiA9IHJlcXVlc3QuZGF0YS5kZWxheSkgIT09IG51bGwgJiYgX3JlcXVlc3QkZGF0YSRkZWxheTIgIT09IHZvaWQgMCA/IF9yZXF1ZXN0JGRhdGEkZGVsYXkyIDogbnVsbCwgKF9yZXF1ZXN0JGRhdGEkcGFyZW50XzIgPSByZXF1ZXN0LmRhdGEucGFyZW50X2RlbGF5X2lkKSAhPT0gbnVsbCAmJiBfcmVxdWVzdCRkYXRhJHBhcmVudF8yICE9PSB2b2lkIDAgPyBfcmVxdWVzdCRkYXRhJHBhcmVudF8yIDogbnVsbCwgcmVxdWVzdC5kYXRhLnR5cGUsIGNvbnRlbnQsIG51bGwsXG4gICAgICAgICAgLy8gbm90IHNlbmRpbmcgYSBzdGF0ZSBldmVudFxuICAgICAgICAgIHJlcXVlc3QuZGF0YS5yb29tX2lkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgc2VuZEV2ZW50UHJvbWlzZS50aGVuKGZ1bmN0aW9uIChzZW50RXZlbnQpIHtcbiAgICAgICAgcmV0dXJuIF90aGlzOS50cmFuc3BvcnQucmVwbHkocmVxdWVzdCwgX29iamVjdFNwcmVhZCh7XG4gICAgICAgICAgcm9vbV9pZDogc2VudEV2ZW50LnJvb21JZFxuICAgICAgICB9LCBcImV2ZW50SWRcIiBpbiBzZW50RXZlbnQgPyB7XG4gICAgICAgICAgZXZlbnRfaWQ6IHNlbnRFdmVudC5ldmVudElkXG4gICAgICAgIH0gOiB7XG4gICAgICAgICAgZGVsYXlfaWQ6IHNlbnRFdmVudC5kZWxheUlkXG4gICAgICAgIH0pKTtcbiAgICAgIH0pW1wiY2F0Y2hcIl0oZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcImVycm9yIHNlbmRpbmcgZXZlbnQ6IFwiLCBlKTtcbiAgICAgICAgX3RoaXM5LmhhbmRsZURyaXZlckVycm9yKGUsIHJlcXVlc3QsIFwiRXJyb3Igc2VuZGluZyBldmVudFwiKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJoYW5kbGVVcGRhdGVEZWxheWVkRXZlbnRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gaGFuZGxlVXBkYXRlRGVsYXllZEV2ZW50KHJlcXVlc3QpIHtcbiAgICAgIHZhciBfdGhpczEwID0gdGhpcztcbiAgICAgIGlmICghcmVxdWVzdC5kYXRhLmRlbGF5X2lkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRyYW5zcG9ydC5yZXBseShyZXF1ZXN0LCB7XG4gICAgICAgICAgZXJyb3I6IHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IFwiSW52YWxpZCByZXF1ZXN0IC0gbWlzc2luZyBkZWxheV9pZFwiXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGlmICghdGhpcy5oYXNDYXBhYmlsaXR5KF9DYXBhYmlsaXRpZXMuTWF0cml4Q2FwYWJpbGl0aWVzLk1TQzQxNTdVcGRhdGVEZWxheWVkRXZlbnQpKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRyYW5zcG9ydC5yZXBseShyZXF1ZXN0LCB7XG4gICAgICAgICAgZXJyb3I6IHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IFwiTWlzc2luZyBjYXBhYmlsaXR5XCJcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgc3dpdGNoIChyZXF1ZXN0LmRhdGEuYWN0aW9uKSB7XG4gICAgICAgIGNhc2UgX1VwZGF0ZURlbGF5ZWRFdmVudEFjdGlvbi5VcGRhdGVEZWxheWVkRXZlbnRBY3Rpb24uQ2FuY2VsOlxuICAgICAgICBjYXNlIF9VcGRhdGVEZWxheWVkRXZlbnRBY3Rpb24uVXBkYXRlRGVsYXllZEV2ZW50QWN0aW9uLlJlc3RhcnQ6XG4gICAgICAgIGNhc2UgX1VwZGF0ZURlbGF5ZWRFdmVudEFjdGlvbi5VcGRhdGVEZWxheWVkRXZlbnRBY3Rpb24uU2VuZDpcbiAgICAgICAgICB0aGlzLmRyaXZlci51cGRhdGVEZWxheWVkRXZlbnQocmVxdWVzdC5kYXRhLmRlbGF5X2lkLCByZXF1ZXN0LmRhdGEuYWN0aW9uKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpczEwLnRyYW5zcG9ydC5yZXBseShyZXF1ZXN0LCB7fSk7XG4gICAgICAgICAgfSlbXCJjYXRjaFwiXShmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcImVycm9yIHVwZGF0aW5nIGRlbGF5ZWQgZXZlbnQ6IFwiLCBlKTtcbiAgICAgICAgICAgIF90aGlzMTAuaGFuZGxlRHJpdmVyRXJyb3IoZSwgcmVxdWVzdCwgXCJFcnJvciB1cGRhdGluZyBkZWxheWVkIGV2ZW50XCIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJldHVybiB0aGlzLnRyYW5zcG9ydC5yZXBseShyZXF1ZXN0LCB7XG4gICAgICAgICAgICBlcnJvcjoge1xuICAgICAgICAgICAgICBtZXNzYWdlOiBcIkludmFsaWQgcmVxdWVzdCAtIHVuc3VwcG9ydGVkIGFjdGlvblwiXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImhhbmRsZVNlbmRUb0RldmljZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgX2hhbmRsZVNlbmRUb0RldmljZSA9IF9hc3luY1RvR2VuZXJhdG9yKCAvKiNfX1BVUkVfXyovX3JlZ2VuZXJhdG9yUnVudGltZSgpLm1hcmsoZnVuY3Rpb24gX2NhbGxlZShyZXF1ZXN0KSB7XG4gICAgICAgIHJldHVybiBfcmVnZW5lcmF0b3JSdW50aW1lKCkud3JhcChmdW5jdGlvbiBfY2FsbGVlJChfY29udGV4dCkge1xuICAgICAgICAgIHdoaWxlICgxKSBzd2l0Y2ggKF9jb250ZXh0LnByZXYgPSBfY29udGV4dC5uZXh0KSB7XG4gICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgIGlmIChyZXF1ZXN0LmRhdGEudHlwZSkge1xuICAgICAgICAgICAgICAgIF9jb250ZXh0Lm5leHQgPSA1O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIF9jb250ZXh0Lm5leHQgPSAzO1xuICAgICAgICAgICAgICByZXR1cm4gdGhpcy50cmFuc3BvcnQucmVwbHkocmVxdWVzdCwge1xuICAgICAgICAgICAgICAgIGVycm9yOiB7XG4gICAgICAgICAgICAgICAgICBtZXNzYWdlOiBcIkludmFsaWQgcmVxdWVzdCAtIG1pc3NpbmcgZXZlbnQgdHlwZVwiXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgICAgX2NvbnRleHQubmV4dCA9IDMxO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgNTpcbiAgICAgICAgICAgICAgaWYgKHJlcXVlc3QuZGF0YS5tZXNzYWdlcykge1xuICAgICAgICAgICAgICAgIF9jb250ZXh0Lm5leHQgPSAxMDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBfY29udGV4dC5uZXh0ID0gODtcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudHJhbnNwb3J0LnJlcGx5KHJlcXVlc3QsIHtcbiAgICAgICAgICAgICAgICBlcnJvcjoge1xuICAgICAgICAgICAgICAgICAgbWVzc2FnZTogXCJJbnZhbGlkIHJlcXVlc3QgLSBtaXNzaW5nIGV2ZW50IGNvbnRlbnRzXCJcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY2FzZSA4OlxuICAgICAgICAgICAgICBfY29udGV4dC5uZXh0ID0gMzE7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAxMDpcbiAgICAgICAgICAgICAgaWYgKCEodHlwZW9mIHJlcXVlc3QuZGF0YS5lbmNyeXB0ZWQgIT09IFwiYm9vbGVhblwiKSkge1xuICAgICAgICAgICAgICAgIF9jb250ZXh0Lm5leHQgPSAxNTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBfY29udGV4dC5uZXh0ID0gMTM7XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLnRyYW5zcG9ydC5yZXBseShyZXF1ZXN0LCB7XG4gICAgICAgICAgICAgICAgZXJyb3I6IHtcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IFwiSW52YWxpZCByZXF1ZXN0IC0gbWlzc2luZyBlbmNyeXB0aW9uIGZsYWdcIlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjYXNlIDEzOlxuICAgICAgICAgICAgICBfY29udGV4dC5uZXh0ID0gMzE7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAxNTpcbiAgICAgICAgICAgICAgaWYgKHRoaXMuY2FuU2VuZFRvRGV2aWNlRXZlbnQocmVxdWVzdC5kYXRhLnR5cGUpKSB7XG4gICAgICAgICAgICAgICAgX2NvbnRleHQubmV4dCA9IDIwO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIF9jb250ZXh0Lm5leHQgPSAxODtcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudHJhbnNwb3J0LnJlcGx5KHJlcXVlc3QsIHtcbiAgICAgICAgICAgICAgICBlcnJvcjoge1xuICAgICAgICAgICAgICAgICAgbWVzc2FnZTogXCJDYW5ub3Qgc2VuZCB0by1kZXZpY2UgZXZlbnRzIG9mIHRoaXMgdHlwZVwiXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNhc2UgMTg6XG4gICAgICAgICAgICAgIF9jb250ZXh0Lm5leHQgPSAzMTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDIwOlxuICAgICAgICAgICAgICBfY29udGV4dC5wcmV2ID0gMjA7XG4gICAgICAgICAgICAgIF9jb250ZXh0Lm5leHQgPSAyMztcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZHJpdmVyLnNlbmRUb0RldmljZShyZXF1ZXN0LmRhdGEudHlwZSwgcmVxdWVzdC5kYXRhLmVuY3J5cHRlZCwgcmVxdWVzdC5kYXRhLm1lc3NhZ2VzKTtcbiAgICAgICAgICAgIGNhc2UgMjM6XG4gICAgICAgICAgICAgIF9jb250ZXh0Lm5leHQgPSAyNTtcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudHJhbnNwb3J0LnJlcGx5KHJlcXVlc3QsIHt9KTtcbiAgICAgICAgICAgIGNhc2UgMjU6XG4gICAgICAgICAgICAgIF9jb250ZXh0Lm5leHQgPSAzMTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDI3OlxuICAgICAgICAgICAgICBfY29udGV4dC5wcmV2ID0gMjc7XG4gICAgICAgICAgICAgIF9jb250ZXh0LnQwID0gX2NvbnRleHRbXCJjYXRjaFwiXSgyMCk7XG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJlcnJvciBzZW5kaW5nIHRvLWRldmljZSBldmVudFwiLCBfY29udGV4dC50MCk7XG4gICAgICAgICAgICAgIHRoaXMuaGFuZGxlRHJpdmVyRXJyb3IoX2NvbnRleHQudDAsIHJlcXVlc3QsIFwiRXJyb3Igc2VuZGluZyBldmVudFwiKTtcbiAgICAgICAgICAgIGNhc2UgMzE6XG4gICAgICAgICAgICBjYXNlIFwiZW5kXCI6XG4gICAgICAgICAgICAgIHJldHVybiBfY29udGV4dC5zdG9wKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LCBfY2FsbGVlLCB0aGlzLCBbWzIwLCAyN11dKTtcbiAgICAgIH0pKTtcbiAgICAgIGZ1bmN0aW9uIGhhbmRsZVNlbmRUb0RldmljZShfeCkge1xuICAgICAgICByZXR1cm4gX2hhbmRsZVNlbmRUb0RldmljZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGhhbmRsZVNlbmRUb0RldmljZTtcbiAgICB9KClcbiAgfSwge1xuICAgIGtleTogXCJwb2xsVHVyblNlcnZlcnNcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIF9wb2xsVHVyblNlcnZlcnMgPSBfYXN5bmNUb0dlbmVyYXRvciggLyojX19QVVJFX18qL19yZWdlbmVyYXRvclJ1bnRpbWUoKS5tYXJrKGZ1bmN0aW9uIF9jYWxsZWUyKHR1cm5TZXJ2ZXJzLCBpbml0aWFsU2VydmVyKSB7XG4gICAgICAgIHZhciBfaXRlcmF0b3JBYnJ1cHRDb21wbGV0aW9uLCBfZGlkSXRlcmF0b3JFcnJvciwgX2l0ZXJhdG9yRXJyb3IsIF9pdGVyYXRvciwgX3N0ZXAsIHNlcnZlcjtcbiAgICAgICAgcmV0dXJuIF9yZWdlbmVyYXRvclJ1bnRpbWUoKS53cmFwKGZ1bmN0aW9uIF9jYWxsZWUyJChfY29udGV4dDIpIHtcbiAgICAgICAgICB3aGlsZSAoMSkgc3dpdGNoIChfY29udGV4dDIucHJldiA9IF9jb250ZXh0Mi5uZXh0KSB7XG4gICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgIF9jb250ZXh0Mi5wcmV2ID0gMDtcbiAgICAgICAgICAgICAgX2NvbnRleHQyLm5leHQgPSAzO1xuICAgICAgICAgICAgICByZXR1cm4gdGhpcy50cmFuc3BvcnQuc2VuZChfV2lkZ2V0QXBpQWN0aW9uLldpZGdldEFwaVRvV2lkZ2V0QWN0aW9uLlVwZGF0ZVR1cm5TZXJ2ZXJzLCBpbml0aWFsU2VydmVyIC8vIGl0J3MgY29tcGF0aWJsZSwgYnV0IG1pc3NpbmcgdGhlIGluZGV4IHNpZ25hdHVyZVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgICAvLyBQaWNrIHRoZSBnZW5lcmF0b3IgdXAgd2hlcmUgd2UgbGVmdCBvZmZcbiAgICAgICAgICAgICAgX2l0ZXJhdG9yQWJydXB0Q29tcGxldGlvbiA9IGZhbHNlO1xuICAgICAgICAgICAgICBfZGlkSXRlcmF0b3JFcnJvciA9IGZhbHNlO1xuICAgICAgICAgICAgICBfY29udGV4dDIucHJldiA9IDU7XG4gICAgICAgICAgICAgIF9pdGVyYXRvciA9IF9hc3luY0l0ZXJhdG9yKHR1cm5TZXJ2ZXJzKTtcbiAgICAgICAgICAgIGNhc2UgNzpcbiAgICAgICAgICAgICAgX2NvbnRleHQyLm5leHQgPSA5O1xuICAgICAgICAgICAgICByZXR1cm4gX2l0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgICAgIGNhc2UgOTpcbiAgICAgICAgICAgICAgaWYgKCEoX2l0ZXJhdG9yQWJydXB0Q29tcGxldGlvbiA9ICEoX3N0ZXAgPSBfY29udGV4dDIuc2VudCkuZG9uZSkpIHtcbiAgICAgICAgICAgICAgICBfY29udGV4dDIubmV4dCA9IDE2O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHNlcnZlciA9IF9zdGVwLnZhbHVlO1xuICAgICAgICAgICAgICBfY29udGV4dDIubmV4dCA9IDEzO1xuICAgICAgICAgICAgICByZXR1cm4gdGhpcy50cmFuc3BvcnQuc2VuZChfV2lkZ2V0QXBpQWN0aW9uLldpZGdldEFwaVRvV2lkZ2V0QWN0aW9uLlVwZGF0ZVR1cm5TZXJ2ZXJzLCBzZXJ2ZXIgLy8gaXQncyBjb21wYXRpYmxlLCBidXQgbWlzc2luZyB0aGUgaW5kZXggc2lnbmF0dXJlXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICBjYXNlIDEzOlxuICAgICAgICAgICAgICBfaXRlcmF0b3JBYnJ1cHRDb21wbGV0aW9uID0gZmFsc2U7XG4gICAgICAgICAgICAgIF9jb250ZXh0Mi5uZXh0ID0gNztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDE2OlxuICAgICAgICAgICAgICBfY29udGV4dDIubmV4dCA9IDIyO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMTg6XG4gICAgICAgICAgICAgIF9jb250ZXh0Mi5wcmV2ID0gMTg7XG4gICAgICAgICAgICAgIF9jb250ZXh0Mi50MCA9IF9jb250ZXh0MltcImNhdGNoXCJdKDUpO1xuICAgICAgICAgICAgICBfZGlkSXRlcmF0b3JFcnJvciA9IHRydWU7XG4gICAgICAgICAgICAgIF9pdGVyYXRvckVycm9yID0gX2NvbnRleHQyLnQwO1xuICAgICAgICAgICAgY2FzZSAyMjpcbiAgICAgICAgICAgICAgX2NvbnRleHQyLnByZXYgPSAyMjtcbiAgICAgICAgICAgICAgX2NvbnRleHQyLnByZXYgPSAyMztcbiAgICAgICAgICAgICAgaWYgKCEoX2l0ZXJhdG9yQWJydXB0Q29tcGxldGlvbiAmJiBfaXRlcmF0b3JbXCJyZXR1cm5cIl0gIT0gbnVsbCkpIHtcbiAgICAgICAgICAgICAgICBfY29udGV4dDIubmV4dCA9IDI3O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIF9jb250ZXh0Mi5uZXh0ID0gMjc7XG4gICAgICAgICAgICAgIHJldHVybiBfaXRlcmF0b3JbXCJyZXR1cm5cIl0oKTtcbiAgICAgICAgICAgIGNhc2UgMjc6XG4gICAgICAgICAgICAgIF9jb250ZXh0Mi5wcmV2ID0gMjc7XG4gICAgICAgICAgICAgIGlmICghX2RpZEl0ZXJhdG9yRXJyb3IpIHtcbiAgICAgICAgICAgICAgICBfY29udGV4dDIubmV4dCA9IDMwO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHRocm93IF9pdGVyYXRvckVycm9yO1xuICAgICAgICAgICAgY2FzZSAzMDpcbiAgICAgICAgICAgICAgcmV0dXJuIF9jb250ZXh0Mi5maW5pc2goMjcpO1xuICAgICAgICAgICAgY2FzZSAzMTpcbiAgICAgICAgICAgICAgcmV0dXJuIF9jb250ZXh0Mi5maW5pc2goMjIpO1xuICAgICAgICAgICAgY2FzZSAzMjpcbiAgICAgICAgICAgICAgX2NvbnRleHQyLm5leHQgPSAzNztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDM0OlxuICAgICAgICAgICAgICBfY29udGV4dDIucHJldiA9IDM0O1xuICAgICAgICAgICAgICBfY29udGV4dDIudDEgPSBfY29udGV4dDJbXCJjYXRjaFwiXSgwKTtcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcImVycm9yIHBvbGxpbmcgZm9yIFRVUk4gc2VydmVyc1wiLCBfY29udGV4dDIudDEpO1xuICAgICAgICAgICAgY2FzZSAzNzpcbiAgICAgICAgICAgIGNhc2UgXCJlbmRcIjpcbiAgICAgICAgICAgICAgcmV0dXJuIF9jb250ZXh0Mi5zdG9wKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LCBfY2FsbGVlMiwgdGhpcywgW1swLCAzNF0sIFs1LCAxOCwgMjIsIDMyXSwgWzIzLCwgMjcsIDMxXV0pO1xuICAgICAgfSkpO1xuICAgICAgZnVuY3Rpb24gcG9sbFR1cm5TZXJ2ZXJzKF94MiwgX3gzKSB7XG4gICAgICAgIHJldHVybiBfcG9sbFR1cm5TZXJ2ZXJzLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcG9sbFR1cm5TZXJ2ZXJzO1xuICAgIH0oKVxuICB9LCB7XG4gICAga2V5OiBcImhhbmRsZVdhdGNoVHVyblNlcnZlcnNcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIF9oYW5kbGVXYXRjaFR1cm5TZXJ2ZXJzID0gX2FzeW5jVG9HZW5lcmF0b3IoIC8qI19fUFVSRV9fKi9fcmVnZW5lcmF0b3JSdW50aW1lKCkubWFyayhmdW5jdGlvbiBfY2FsbGVlMyhyZXF1ZXN0KSB7XG4gICAgICAgIHZhciB0dXJuU2VydmVycywgX3lpZWxkJHR1cm5TZXJ2ZXJzJG5lLCBkb25lLCB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIF9yZWdlbmVyYXRvclJ1bnRpbWUoKS53cmFwKGZ1bmN0aW9uIF9jYWxsZWUzJChfY29udGV4dDMpIHtcbiAgICAgICAgICB3aGlsZSAoMSkgc3dpdGNoIChfY29udGV4dDMucHJldiA9IF9jb250ZXh0My5uZXh0KSB7XG4gICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgIGlmICh0aGlzLmhhc0NhcGFiaWxpdHkoX0NhcGFiaWxpdGllcy5NYXRyaXhDYXBhYmlsaXRpZXMuTVNDMzg0NlR1cm5TZXJ2ZXJzKSkge1xuICAgICAgICAgICAgICAgIF9jb250ZXh0My5uZXh0ID0gNTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBfY29udGV4dDMubmV4dCA9IDM7XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLnRyYW5zcG9ydC5yZXBseShyZXF1ZXN0LCB7XG4gICAgICAgICAgICAgICAgZXJyb3I6IHtcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IFwiTWlzc2luZyBjYXBhYmlsaXR5XCJcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgICBfY29udGV4dDMubmV4dCA9IDMwO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgNTpcbiAgICAgICAgICAgICAgaWYgKCF0aGlzLnR1cm5TZXJ2ZXJzKSB7XG4gICAgICAgICAgICAgICAgX2NvbnRleHQzLm5leHQgPSAxMDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBfY29udGV4dDMubmV4dCA9IDg7XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLnRyYW5zcG9ydC5yZXBseShyZXF1ZXN0LCB7fSk7XG4gICAgICAgICAgICBjYXNlIDg6XG4gICAgICAgICAgICAgIF9jb250ZXh0My5uZXh0ID0gMzA7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAxMDpcbiAgICAgICAgICAgICAgX2NvbnRleHQzLnByZXYgPSAxMDtcbiAgICAgICAgICAgICAgdHVyblNlcnZlcnMgPSB0aGlzLmRyaXZlci5nZXRUdXJuU2VydmVycygpOyAvLyBQZWVrIGF0IHRoZSBmaXJzdCByZXN1bHQsIHNvIHdlIGNhbiBhdCBsZWFzdCB2ZXJpZnkgdGhhdCB0aGVcbiAgICAgICAgICAgICAgLy8gY2xpZW50IGlzbid0IGJhbm5lZCBmcm9tIGdldHRpbmcgVFVSTiBzZXJ2ZXJzIGVudGlyZWx5XG4gICAgICAgICAgICAgIF9jb250ZXh0My5uZXh0ID0gMTQ7XG4gICAgICAgICAgICAgIHJldHVybiB0dXJuU2VydmVycy5uZXh0KCk7XG4gICAgICAgICAgICBjYXNlIDE0OlxuICAgICAgICAgICAgICBfeWllbGQkdHVyblNlcnZlcnMkbmUgPSBfY29udGV4dDMuc2VudDtcbiAgICAgICAgICAgICAgZG9uZSA9IF95aWVsZCR0dXJuU2VydmVycyRuZS5kb25lO1xuICAgICAgICAgICAgICB2YWx1ZSA9IF95aWVsZCR0dXJuU2VydmVycyRuZS52YWx1ZTtcbiAgICAgICAgICAgICAgaWYgKCFkb25lKSB7XG4gICAgICAgICAgICAgICAgX2NvbnRleHQzLm5leHQgPSAxOTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDbGllbnQgcmVmdXNlcyB0byBwcm92aWRlIGFueSBUVVJOIHNlcnZlcnNcIik7XG4gICAgICAgICAgICBjYXNlIDE5OlxuICAgICAgICAgICAgICBfY29udGV4dDMubmV4dCA9IDIxO1xuICAgICAgICAgICAgICByZXR1cm4gdGhpcy50cmFuc3BvcnQucmVwbHkocmVxdWVzdCwge30pO1xuICAgICAgICAgICAgY2FzZSAyMTpcbiAgICAgICAgICAgICAgLy8gU3RhcnQgdGhlIHBvbGwgbG9vcCwgc2VuZGluZyB0aGUgd2lkZ2V0IHRoZSBpbml0aWFsIHJlc3VsdFxuICAgICAgICAgICAgICB0aGlzLnBvbGxUdXJuU2VydmVycyh0dXJuU2VydmVycywgdmFsdWUpO1xuICAgICAgICAgICAgICB0aGlzLnR1cm5TZXJ2ZXJzID0gdHVyblNlcnZlcnM7XG4gICAgICAgICAgICAgIF9jb250ZXh0My5uZXh0ID0gMzA7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAyNTpcbiAgICAgICAgICAgICAgX2NvbnRleHQzLnByZXYgPSAyNTtcbiAgICAgICAgICAgICAgX2NvbnRleHQzLnQwID0gX2NvbnRleHQzW1wiY2F0Y2hcIl0oMTApO1xuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiZXJyb3IgZ2V0dGluZyBmaXJzdCBUVVJOIHNlcnZlciByZXN1bHRzXCIsIF9jb250ZXh0My50MCk7XG4gICAgICAgICAgICAgIF9jb250ZXh0My5uZXh0ID0gMzA7XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLnRyYW5zcG9ydC5yZXBseShyZXF1ZXN0LCB7XG4gICAgICAgICAgICAgICAgZXJyb3I6IHtcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IFwiVFVSTiBzZXJ2ZXJzIG5vdCBhdmFpbGFibGVcIlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjYXNlIDMwOlxuICAgICAgICAgICAgY2FzZSBcImVuZFwiOlxuICAgICAgICAgICAgICByZXR1cm4gX2NvbnRleHQzLnN0b3AoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIF9jYWxsZWUzLCB0aGlzLCBbWzEwLCAyNV1dKTtcbiAgICAgIH0pKTtcbiAgICAgIGZ1bmN0aW9uIGhhbmRsZVdhdGNoVHVyblNlcnZlcnMoX3g0KSB7XG4gICAgICAgIHJldHVybiBfaGFuZGxlV2F0Y2hUdXJuU2VydmVycy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGhhbmRsZVdhdGNoVHVyblNlcnZlcnM7XG4gICAgfSgpXG4gIH0sIHtcbiAgICBrZXk6IFwiaGFuZGxlVW53YXRjaFR1cm5TZXJ2ZXJzXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBfaGFuZGxlVW53YXRjaFR1cm5TZXJ2ZXJzID0gX2FzeW5jVG9HZW5lcmF0b3IoIC8qI19fUFVSRV9fKi9fcmVnZW5lcmF0b3JSdW50aW1lKCkubWFyayhmdW5jdGlvbiBfY2FsbGVlNChyZXF1ZXN0KSB7XG4gICAgICAgIHJldHVybiBfcmVnZW5lcmF0b3JSdW50aW1lKCkud3JhcChmdW5jdGlvbiBfY2FsbGVlNCQoX2NvbnRleHQ0KSB7XG4gICAgICAgICAgd2hpbGUgKDEpIHN3aXRjaCAoX2NvbnRleHQ0LnByZXYgPSBfY29udGV4dDQubmV4dCkge1xuICAgICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgICBpZiAodGhpcy5oYXNDYXBhYmlsaXR5KF9DYXBhYmlsaXRpZXMuTWF0cml4Q2FwYWJpbGl0aWVzLk1TQzM4NDZUdXJuU2VydmVycykpIHtcbiAgICAgICAgICAgICAgICBfY29udGV4dDQubmV4dCA9IDU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgX2NvbnRleHQ0Lm5leHQgPSAzO1xuICAgICAgICAgICAgICByZXR1cm4gdGhpcy50cmFuc3BvcnQucmVwbHkocmVxdWVzdCwge1xuICAgICAgICAgICAgICAgIGVycm9yOiB7XG4gICAgICAgICAgICAgICAgICBtZXNzYWdlOiBcIk1pc3NpbmcgY2FwYWJpbGl0eVwiXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgICAgX2NvbnRleHQ0Lm5leHQgPSAxNTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDU6XG4gICAgICAgICAgICAgIGlmICh0aGlzLnR1cm5TZXJ2ZXJzKSB7XG4gICAgICAgICAgICAgICAgX2NvbnRleHQ0Lm5leHQgPSAxMDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBfY29udGV4dDQubmV4dCA9IDg7XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLnRyYW5zcG9ydC5yZXBseShyZXF1ZXN0LCB7fSk7XG4gICAgICAgICAgICBjYXNlIDg6XG4gICAgICAgICAgICAgIF9jb250ZXh0NC5uZXh0ID0gMTU7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAxMDpcbiAgICAgICAgICAgICAgX2NvbnRleHQ0Lm5leHQgPSAxMjtcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudHVyblNlcnZlcnNbXCJyZXR1cm5cIl0odW5kZWZpbmVkKTtcbiAgICAgICAgICAgIGNhc2UgMTI6XG4gICAgICAgICAgICAgIHRoaXMudHVyblNlcnZlcnMgPSBudWxsO1xuICAgICAgICAgICAgICBfY29udGV4dDQubmV4dCA9IDE1O1xuICAgICAgICAgICAgICByZXR1cm4gdGhpcy50cmFuc3BvcnQucmVwbHkocmVxdWVzdCwge30pO1xuICAgICAgICAgICAgY2FzZSAxNTpcbiAgICAgICAgICAgIGNhc2UgXCJlbmRcIjpcbiAgICAgICAgICAgICAgcmV0dXJuIF9jb250ZXh0NC5zdG9wKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LCBfY2FsbGVlNCwgdGhpcyk7XG4gICAgICB9KSk7XG4gICAgICBmdW5jdGlvbiBoYW5kbGVVbndhdGNoVHVyblNlcnZlcnMoX3g1KSB7XG4gICAgICAgIHJldHVybiBfaGFuZGxlVW53YXRjaFR1cm5TZXJ2ZXJzLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gaGFuZGxlVW53YXRjaFR1cm5TZXJ2ZXJzO1xuICAgIH0oKVxuICB9LCB7XG4gICAga2V5OiBcImhhbmRsZVJlYWRSZWxhdGlvbnNcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIF9oYW5kbGVSZWFkUmVsYXRpb25zID0gX2FzeW5jVG9HZW5lcmF0b3IoIC8qI19fUFVSRV9fKi9fcmVnZW5lcmF0b3JSdW50aW1lKCkubWFyayhmdW5jdGlvbiBfY2FsbGVlNShyZXF1ZXN0KSB7XG4gICAgICAgIHZhciBfdGhpczExID0gdGhpcztcbiAgICAgICAgdmFyIHJlc3VsdCwgY2h1bms7XG4gICAgICAgIHJldHVybiBfcmVnZW5lcmF0b3JSdW50aW1lKCkud3JhcChmdW5jdGlvbiBfY2FsbGVlNSQoX2NvbnRleHQ1KSB7XG4gICAgICAgICAgd2hpbGUgKDEpIHN3aXRjaCAoX2NvbnRleHQ1LnByZXYgPSBfY29udGV4dDUubmV4dCkge1xuICAgICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgICBpZiAocmVxdWVzdC5kYXRhLmV2ZW50X2lkKSB7XG4gICAgICAgICAgICAgICAgX2NvbnRleHQ1Lm5leHQgPSAyO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBfY29udGV4dDUuYWJydXB0KFwicmV0dXJuXCIsIHRoaXMudHJhbnNwb3J0LnJlcGx5KHJlcXVlc3QsIHtcbiAgICAgICAgICAgICAgICBlcnJvcjoge1xuICAgICAgICAgICAgICAgICAgbWVzc2FnZTogXCJJbnZhbGlkIHJlcXVlc3QgLSBtaXNzaW5nIGV2ZW50IElEXCJcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgaWYgKCEocmVxdWVzdC5kYXRhLmxpbWl0ICE9PSB1bmRlZmluZWQgJiYgcmVxdWVzdC5kYXRhLmxpbWl0IDwgMCkpIHtcbiAgICAgICAgICAgICAgICBfY29udGV4dDUubmV4dCA9IDQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIF9jb250ZXh0NS5hYnJ1cHQoXCJyZXR1cm5cIiwgdGhpcy50cmFuc3BvcnQucmVwbHkocmVxdWVzdCwge1xuICAgICAgICAgICAgICAgIGVycm9yOiB7XG4gICAgICAgICAgICAgICAgICBtZXNzYWdlOiBcIkludmFsaWQgcmVxdWVzdCAtIGxpbWl0IG91dCBvZiByYW5nZVwiXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgICAgIGlmICghKHJlcXVlc3QuZGF0YS5yb29tX2lkICE9PSB1bmRlZmluZWQgJiYgIXRoaXMuY2FuVXNlUm9vbVRpbWVsaW5lKHJlcXVlc3QuZGF0YS5yb29tX2lkKSkpIHtcbiAgICAgICAgICAgICAgICBfY29udGV4dDUubmV4dCA9IDY7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIF9jb250ZXh0NS5hYnJ1cHQoXCJyZXR1cm5cIiwgdGhpcy50cmFuc3BvcnQucmVwbHkocmVxdWVzdCwge1xuICAgICAgICAgICAgICAgIGVycm9yOiB7XG4gICAgICAgICAgICAgICAgICBtZXNzYWdlOiBcIlVuYWJsZSB0byBhY2Nlc3Mgcm9vbSB0aW1lbGluZTogXCIuY29uY2F0KHJlcXVlc3QuZGF0YS5yb29tX2lkKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgY2FzZSA2OlxuICAgICAgICAgICAgICBfY29udGV4dDUucHJldiA9IDY7XG4gICAgICAgICAgICAgIF9jb250ZXh0NS5uZXh0ID0gOTtcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZHJpdmVyLnJlYWRFdmVudFJlbGF0aW9ucyhyZXF1ZXN0LmRhdGEuZXZlbnRfaWQsIHJlcXVlc3QuZGF0YS5yb29tX2lkLCByZXF1ZXN0LmRhdGEucmVsX3R5cGUsIHJlcXVlc3QuZGF0YS5ldmVudF90eXBlLCByZXF1ZXN0LmRhdGEuZnJvbSwgcmVxdWVzdC5kYXRhLnRvLCByZXF1ZXN0LmRhdGEubGltaXQsIHJlcXVlc3QuZGF0YS5kaXJlY3Rpb24pO1xuICAgICAgICAgICAgY2FzZSA5OlxuICAgICAgICAgICAgICByZXN1bHQgPSBfY29udGV4dDUuc2VudDtcbiAgICAgICAgICAgICAgLy8gb25seSByZXR1cm4gZXZlbnRzIHRoYXQgdGhlIHVzZXIgaGFzIHRoZSBwZXJtaXNzaW9uIHRvIHJlY2VpdmVcbiAgICAgICAgICAgICAgY2h1bmsgPSByZXN1bHQuY2h1bmsuZmlsdGVyKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGUuc3RhdGVfa2V5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBfdGhpczExLmNhblJlY2VpdmVTdGF0ZUV2ZW50KGUudHlwZSwgZS5zdGF0ZV9rZXkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gX3RoaXMxMS5jYW5SZWNlaXZlUm9vbUV2ZW50KGUudHlwZSwgZS5jb250ZW50Wydtc2d0eXBlJ10pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJldHVybiBfY29udGV4dDUuYWJydXB0KFwicmV0dXJuXCIsIHRoaXMudHJhbnNwb3J0LnJlcGx5KHJlcXVlc3QsIHtcbiAgICAgICAgICAgICAgICBjaHVuazogY2h1bmssXG4gICAgICAgICAgICAgICAgcHJldl9iYXRjaDogcmVzdWx0LnByZXZCYXRjaCxcbiAgICAgICAgICAgICAgICBuZXh0X2JhdGNoOiByZXN1bHQubmV4dEJhdGNoXG4gICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIGNhc2UgMTQ6XG4gICAgICAgICAgICAgIF9jb250ZXh0NS5wcmV2ID0gMTQ7XG4gICAgICAgICAgICAgIF9jb250ZXh0NS50MCA9IF9jb250ZXh0NVtcImNhdGNoXCJdKDYpO1xuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiZXJyb3IgZ2V0dGluZyB0aGUgcmVsYXRpb25zXCIsIF9jb250ZXh0NS50MCk7XG4gICAgICAgICAgICAgIHRoaXMuaGFuZGxlRHJpdmVyRXJyb3IoX2NvbnRleHQ1LnQwLCByZXF1ZXN0LCBcIlVuZXhwZWN0ZWQgZXJyb3Igd2hpbGUgcmVhZGluZyByZWxhdGlvbnNcIik7XG4gICAgICAgICAgICBjYXNlIDE4OlxuICAgICAgICAgICAgY2FzZSBcImVuZFwiOlxuICAgICAgICAgICAgICByZXR1cm4gX2NvbnRleHQ1LnN0b3AoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIF9jYWxsZWU1LCB0aGlzLCBbWzYsIDE0XV0pO1xuICAgICAgfSkpO1xuICAgICAgZnVuY3Rpb24gaGFuZGxlUmVhZFJlbGF0aW9ucyhfeDYpIHtcbiAgICAgICAgcmV0dXJuIF9oYW5kbGVSZWFkUmVsYXRpb25zLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gaGFuZGxlUmVhZFJlbGF0aW9ucztcbiAgICB9KClcbiAgfSwge1xuICAgIGtleTogXCJoYW5kbGVVc2VyRGlyZWN0b3J5U2VhcmNoXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBfaGFuZGxlVXNlckRpcmVjdG9yeVNlYXJjaCA9IF9hc3luY1RvR2VuZXJhdG9yKCAvKiNfX1BVUkVfXyovX3JlZ2VuZXJhdG9yUnVudGltZSgpLm1hcmsoZnVuY3Rpb24gX2NhbGxlZTYocmVxdWVzdCkge1xuICAgICAgICB2YXIgcmVzdWx0O1xuICAgICAgICByZXR1cm4gX3JlZ2VuZXJhdG9yUnVudGltZSgpLndyYXAoZnVuY3Rpb24gX2NhbGxlZTYkKF9jb250ZXh0Nikge1xuICAgICAgICAgIHdoaWxlICgxKSBzd2l0Y2ggKF9jb250ZXh0Ni5wcmV2ID0gX2NvbnRleHQ2Lm5leHQpIHtcbiAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgICAgaWYgKHRoaXMuaGFzQ2FwYWJpbGl0eShfQ2FwYWJpbGl0aWVzLk1hdHJpeENhcGFiaWxpdGllcy5NU0MzOTczVXNlckRpcmVjdG9yeVNlYXJjaCkpIHtcbiAgICAgICAgICAgICAgICBfY29udGV4dDYubmV4dCA9IDI7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIF9jb250ZXh0Ni5hYnJ1cHQoXCJyZXR1cm5cIiwgdGhpcy50cmFuc3BvcnQucmVwbHkocmVxdWVzdCwge1xuICAgICAgICAgICAgICAgIGVycm9yOiB7XG4gICAgICAgICAgICAgICAgICBtZXNzYWdlOiBcIk1pc3NpbmcgY2FwYWJpbGl0eVwiXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgIGlmICghKHR5cGVvZiByZXF1ZXN0LmRhdGEuc2VhcmNoX3Rlcm0gIT09ICdzdHJpbmcnKSkge1xuICAgICAgICAgICAgICAgIF9jb250ZXh0Ni5uZXh0ID0gNDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gX2NvbnRleHQ2LmFicnVwdChcInJldHVyblwiLCB0aGlzLnRyYW5zcG9ydC5yZXBseShyZXF1ZXN0LCB7XG4gICAgICAgICAgICAgICAgZXJyb3I6IHtcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IFwiSW52YWxpZCByZXF1ZXN0IC0gbWlzc2luZyBzZWFyY2ggdGVybVwiXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgICAgIGlmICghKHJlcXVlc3QuZGF0YS5saW1pdCAhPT0gdW5kZWZpbmVkICYmIHJlcXVlc3QuZGF0YS5saW1pdCA8IDApKSB7XG4gICAgICAgICAgICAgICAgX2NvbnRleHQ2Lm5leHQgPSA2O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBfY29udGV4dDYuYWJydXB0KFwicmV0dXJuXCIsIHRoaXMudHJhbnNwb3J0LnJlcGx5KHJlcXVlc3QsIHtcbiAgICAgICAgICAgICAgICBlcnJvcjoge1xuICAgICAgICAgICAgICAgICAgbWVzc2FnZTogXCJJbnZhbGlkIHJlcXVlc3QgLSBsaW1pdCBvdXQgb2YgcmFuZ2VcIlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgY2FzZSA2OlxuICAgICAgICAgICAgICBfY29udGV4dDYucHJldiA9IDY7XG4gICAgICAgICAgICAgIF9jb250ZXh0Ni5uZXh0ID0gOTtcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZHJpdmVyLnNlYXJjaFVzZXJEaXJlY3RvcnkocmVxdWVzdC5kYXRhLnNlYXJjaF90ZXJtLCByZXF1ZXN0LmRhdGEubGltaXQpO1xuICAgICAgICAgICAgY2FzZSA5OlxuICAgICAgICAgICAgICByZXN1bHQgPSBfY29udGV4dDYuc2VudDtcbiAgICAgICAgICAgICAgcmV0dXJuIF9jb250ZXh0Ni5hYnJ1cHQoXCJyZXR1cm5cIiwgdGhpcy50cmFuc3BvcnQucmVwbHkocmVxdWVzdCwge1xuICAgICAgICAgICAgICAgIGxpbWl0ZWQ6IHJlc3VsdC5saW1pdGVkLFxuICAgICAgICAgICAgICAgIHJlc3VsdHM6IHJlc3VsdC5yZXN1bHRzLm1hcChmdW5jdGlvbiAocikge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgdXNlcl9pZDogci51c2VySWQsXG4gICAgICAgICAgICAgICAgICAgIGRpc3BsYXlfbmFtZTogci5kaXNwbGF5TmFtZSxcbiAgICAgICAgICAgICAgICAgICAgYXZhdGFyX3VybDogci5hdmF0YXJVcmxcbiAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgY2FzZSAxMzpcbiAgICAgICAgICAgICAgX2NvbnRleHQ2LnByZXYgPSAxMztcbiAgICAgICAgICAgICAgX2NvbnRleHQ2LnQwID0gX2NvbnRleHQ2W1wiY2F0Y2hcIl0oNik7XG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJlcnJvciBzZWFyY2hpbmcgaW4gdGhlIHVzZXIgZGlyZWN0b3J5XCIsIF9jb250ZXh0Ni50MCk7XG4gICAgICAgICAgICAgIHRoaXMuaGFuZGxlRHJpdmVyRXJyb3IoX2NvbnRleHQ2LnQwLCByZXF1ZXN0LCBcIlVuZXhwZWN0ZWQgZXJyb3Igd2hpbGUgc2VhcmNoaW5nIGluIHRoZSB1c2VyIGRpcmVjdG9yeVwiKTtcbiAgICAgICAgICAgIGNhc2UgMTc6XG4gICAgICAgICAgICBjYXNlIFwiZW5kXCI6XG4gICAgICAgICAgICAgIHJldHVybiBfY29udGV4dDYuc3RvcCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgX2NhbGxlZTYsIHRoaXMsIFtbNiwgMTNdXSk7XG4gICAgICB9KSk7XG4gICAgICBmdW5jdGlvbiBoYW5kbGVVc2VyRGlyZWN0b3J5U2VhcmNoKF94Nykge1xuICAgICAgICByZXR1cm4gX2hhbmRsZVVzZXJEaXJlY3RvcnlTZWFyY2guYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBoYW5kbGVVc2VyRGlyZWN0b3J5U2VhcmNoO1xuICAgIH0oKVxuICB9LCB7XG4gICAga2V5OiBcImhhbmRsZUdldE1lZGlhQ29uZmlnXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBfaGFuZGxlR2V0TWVkaWFDb25maWcgPSBfYXN5bmNUb0dlbmVyYXRvciggLyojX19QVVJFX18qL19yZWdlbmVyYXRvclJ1bnRpbWUoKS5tYXJrKGZ1bmN0aW9uIF9jYWxsZWU3KHJlcXVlc3QpIHtcbiAgICAgICAgdmFyIHJlc3VsdDtcbiAgICAgICAgcmV0dXJuIF9yZWdlbmVyYXRvclJ1bnRpbWUoKS53cmFwKGZ1bmN0aW9uIF9jYWxsZWU3JChfY29udGV4dDcpIHtcbiAgICAgICAgICB3aGlsZSAoMSkgc3dpdGNoIChfY29udGV4dDcucHJldiA9IF9jb250ZXh0Ny5uZXh0KSB7XG4gICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgIGlmICh0aGlzLmhhc0NhcGFiaWxpdHkoX0NhcGFiaWxpdGllcy5NYXRyaXhDYXBhYmlsaXRpZXMuTVNDNDAzOVVwbG9hZEZpbGUpKSB7XG4gICAgICAgICAgICAgICAgX2NvbnRleHQ3Lm5leHQgPSAyO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBfY29udGV4dDcuYWJydXB0KFwicmV0dXJuXCIsIHRoaXMudHJhbnNwb3J0LnJlcGx5KHJlcXVlc3QsIHtcbiAgICAgICAgICAgICAgICBlcnJvcjoge1xuICAgICAgICAgICAgICAgICAgbWVzc2FnZTogXCJNaXNzaW5nIGNhcGFiaWxpdHlcIlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICBfY29udGV4dDcucHJldiA9IDI7XG4gICAgICAgICAgICAgIF9jb250ZXh0Ny5uZXh0ID0gNTtcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZHJpdmVyLmdldE1lZGlhQ29uZmlnKCk7XG4gICAgICAgICAgICBjYXNlIDU6XG4gICAgICAgICAgICAgIHJlc3VsdCA9IF9jb250ZXh0Ny5zZW50O1xuICAgICAgICAgICAgICByZXR1cm4gX2NvbnRleHQ3LmFicnVwdChcInJldHVyblwiLCB0aGlzLnRyYW5zcG9ydC5yZXBseShyZXF1ZXN0LCByZXN1bHQpKTtcbiAgICAgICAgICAgIGNhc2UgOTpcbiAgICAgICAgICAgICAgX2NvbnRleHQ3LnByZXYgPSA5O1xuICAgICAgICAgICAgICBfY29udGV4dDcudDAgPSBfY29udGV4dDdbXCJjYXRjaFwiXSgyKTtcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcImVycm9yIHdoaWxlIGdldHRpbmcgdGhlIG1lZGlhIGNvbmZpZ3VyYXRpb25cIiwgX2NvbnRleHQ3LnQwKTtcbiAgICAgICAgICAgICAgdGhpcy5oYW5kbGVEcml2ZXJFcnJvcihfY29udGV4dDcudDAsIHJlcXVlc3QsIFwiVW5leHBlY3RlZCBlcnJvciB3aGlsZSBnZXR0aW5nIHRoZSBtZWRpYSBjb25maWd1cmF0aW9uXCIpO1xuICAgICAgICAgICAgY2FzZSAxMzpcbiAgICAgICAgICAgIGNhc2UgXCJlbmRcIjpcbiAgICAgICAgICAgICAgcmV0dXJuIF9jb250ZXh0Ny5zdG9wKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LCBfY2FsbGVlNywgdGhpcywgW1syLCA5XV0pO1xuICAgICAgfSkpO1xuICAgICAgZnVuY3Rpb24gaGFuZGxlR2V0TWVkaWFDb25maWcoX3g4KSB7XG4gICAgICAgIHJldHVybiBfaGFuZGxlR2V0TWVkaWFDb25maWcuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBoYW5kbGVHZXRNZWRpYUNvbmZpZztcbiAgICB9KClcbiAgfSwge1xuICAgIGtleTogXCJoYW5kbGVVcGxvYWRGaWxlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBfaGFuZGxlVXBsb2FkRmlsZSA9IF9hc3luY1RvR2VuZXJhdG9yKCAvKiNfX1BVUkVfXyovX3JlZ2VuZXJhdG9yUnVudGltZSgpLm1hcmsoZnVuY3Rpb24gX2NhbGxlZTgocmVxdWVzdCkge1xuICAgICAgICB2YXIgcmVzdWx0O1xuICAgICAgICByZXR1cm4gX3JlZ2VuZXJhdG9yUnVudGltZSgpLndyYXAoZnVuY3Rpb24gX2NhbGxlZTgkKF9jb250ZXh0OCkge1xuICAgICAgICAgIHdoaWxlICgxKSBzd2l0Y2ggKF9jb250ZXh0OC5wcmV2ID0gX2NvbnRleHQ4Lm5leHQpIHtcbiAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgICAgaWYgKHRoaXMuaGFzQ2FwYWJpbGl0eShfQ2FwYWJpbGl0aWVzLk1hdHJpeENhcGFiaWxpdGllcy5NU0M0MDM5VXBsb2FkRmlsZSkpIHtcbiAgICAgICAgICAgICAgICBfY29udGV4dDgubmV4dCA9IDI7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIF9jb250ZXh0OC5hYnJ1cHQoXCJyZXR1cm5cIiwgdGhpcy50cmFuc3BvcnQucmVwbHkocmVxdWVzdCwge1xuICAgICAgICAgICAgICAgIGVycm9yOiB7XG4gICAgICAgICAgICAgICAgICBtZXNzYWdlOiBcIk1pc3NpbmcgY2FwYWJpbGl0eVwiXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgIF9jb250ZXh0OC5wcmV2ID0gMjtcbiAgICAgICAgICAgICAgX2NvbnRleHQ4Lm5leHQgPSA1O1xuICAgICAgICAgICAgICByZXR1cm4gdGhpcy5kcml2ZXIudXBsb2FkRmlsZShyZXF1ZXN0LmRhdGEuZmlsZSk7XG4gICAgICAgICAgICBjYXNlIDU6XG4gICAgICAgICAgICAgIHJlc3VsdCA9IF9jb250ZXh0OC5zZW50O1xuICAgICAgICAgICAgICByZXR1cm4gX2NvbnRleHQ4LmFicnVwdChcInJldHVyblwiLCB0aGlzLnRyYW5zcG9ydC5yZXBseShyZXF1ZXN0LCB7XG4gICAgICAgICAgICAgICAgY29udGVudF91cmk6IHJlc3VsdC5jb250ZW50VXJpXG4gICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIGNhc2UgOTpcbiAgICAgICAgICAgICAgX2NvbnRleHQ4LnByZXYgPSA5O1xuICAgICAgICAgICAgICBfY29udGV4dDgudDAgPSBfY29udGV4dDhbXCJjYXRjaFwiXSgyKTtcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcImVycm9yIHdoaWxlIHVwbG9hZGluZyBhIGZpbGVcIiwgX2NvbnRleHQ4LnQwKTtcbiAgICAgICAgICAgICAgdGhpcy5oYW5kbGVEcml2ZXJFcnJvcihfY29udGV4dDgudDAsIHJlcXVlc3QsIFwiVW5leHBlY3RlZCBlcnJvciB3aGlsZSB1cGxvYWRpbmcgYSBmaWxlXCIpO1xuICAgICAgICAgICAgY2FzZSAxMzpcbiAgICAgICAgICAgIGNhc2UgXCJlbmRcIjpcbiAgICAgICAgICAgICAgcmV0dXJuIF9jb250ZXh0OC5zdG9wKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LCBfY2FsbGVlOCwgdGhpcywgW1syLCA5XV0pO1xuICAgICAgfSkpO1xuICAgICAgZnVuY3Rpb24gaGFuZGxlVXBsb2FkRmlsZShfeDkpIHtcbiAgICAgICAgcmV0dXJuIF9oYW5kbGVVcGxvYWRGaWxlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gaGFuZGxlVXBsb2FkRmlsZTtcbiAgICB9KClcbiAgfSwge1xuICAgIGtleTogXCJoYW5kbGVEb3dubG9hZEZpbGVcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIF9oYW5kbGVEb3dubG9hZEZpbGUgPSBfYXN5bmNUb0dlbmVyYXRvciggLyojX19QVVJFX18qL19yZWdlbmVyYXRvclJ1bnRpbWUoKS5tYXJrKGZ1bmN0aW9uIF9jYWxsZWU5KHJlcXVlc3QpIHtcbiAgICAgICAgdmFyIHJlc3VsdDtcbiAgICAgICAgcmV0dXJuIF9yZWdlbmVyYXRvclJ1bnRpbWUoKS53cmFwKGZ1bmN0aW9uIF9jYWxsZWU5JChfY29udGV4dDkpIHtcbiAgICAgICAgICB3aGlsZSAoMSkgc3dpdGNoIChfY29udGV4dDkucHJldiA9IF9jb250ZXh0OS5uZXh0KSB7XG4gICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgIGlmICh0aGlzLmhhc0NhcGFiaWxpdHkoX0NhcGFiaWxpdGllcy5NYXRyaXhDYXBhYmlsaXRpZXMuTVNDNDAzOURvd25sb2FkRmlsZSkpIHtcbiAgICAgICAgICAgICAgICBfY29udGV4dDkubmV4dCA9IDI7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIF9jb250ZXh0OS5hYnJ1cHQoXCJyZXR1cm5cIiwgdGhpcy50cmFuc3BvcnQucmVwbHkocmVxdWVzdCwge1xuICAgICAgICAgICAgICAgIGVycm9yOiB7XG4gICAgICAgICAgICAgICAgICBtZXNzYWdlOiBcIk1pc3NpbmcgY2FwYWJpbGl0eVwiXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgIF9jb250ZXh0OS5wcmV2ID0gMjtcbiAgICAgICAgICAgICAgX2NvbnRleHQ5Lm5leHQgPSA1O1xuICAgICAgICAgICAgICByZXR1cm4gdGhpcy5kcml2ZXIuZG93bmxvYWRGaWxlKHJlcXVlc3QuZGF0YS5jb250ZW50X3VyaSk7XG4gICAgICAgICAgICBjYXNlIDU6XG4gICAgICAgICAgICAgIHJlc3VsdCA9IF9jb250ZXh0OS5zZW50O1xuICAgICAgICAgICAgICByZXR1cm4gX2NvbnRleHQ5LmFicnVwdChcInJldHVyblwiLCB0aGlzLnRyYW5zcG9ydC5yZXBseShyZXF1ZXN0LCB7XG4gICAgICAgICAgICAgICAgZmlsZTogcmVzdWx0LmZpbGVcbiAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgY2FzZSA5OlxuICAgICAgICAgICAgICBfY29udGV4dDkucHJldiA9IDk7XG4gICAgICAgICAgICAgIF9jb250ZXh0OS50MCA9IF9jb250ZXh0OVtcImNhdGNoXCJdKDIpO1xuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiZXJyb3Igd2hpbGUgZG93bmxvYWRpbmcgYSBmaWxlXCIsIF9jb250ZXh0OS50MCk7XG4gICAgICAgICAgICAgIHRoaXMuaGFuZGxlRHJpdmVyRXJyb3IoX2NvbnRleHQ5LnQwLCByZXF1ZXN0LCBcIlVuZXhwZWN0ZWQgZXJyb3Igd2hpbGUgZG93bmxvYWRpbmcgYSBmaWxlXCIpO1xuICAgICAgICAgICAgY2FzZSAxMzpcbiAgICAgICAgICAgIGNhc2UgXCJlbmRcIjpcbiAgICAgICAgICAgICAgcmV0dXJuIF9jb250ZXh0OS5zdG9wKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LCBfY2FsbGVlOSwgdGhpcywgW1syLCA5XV0pO1xuICAgICAgfSkpO1xuICAgICAgZnVuY3Rpb24gaGFuZGxlRG93bmxvYWRGaWxlKF94MTApIHtcbiAgICAgICAgcmV0dXJuIF9oYW5kbGVEb3dubG9hZEZpbGUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBoYW5kbGVEb3dubG9hZEZpbGU7XG4gICAgfSgpXG4gIH0sIHtcbiAgICBrZXk6IFwiaGFuZGxlRHJpdmVyRXJyb3JcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gaGFuZGxlRHJpdmVyRXJyb3IoZSwgcmVxdWVzdCwgbWVzc2FnZSkge1xuICAgICAgdmFyIGRhdGEgPSB0aGlzLmRyaXZlci5wcm9jZXNzRXJyb3IoZSk7XG4gICAgICB0aGlzLnRyYW5zcG9ydC5yZXBseShyZXF1ZXN0LCB7XG4gICAgICAgIGVycm9yOiBfb2JqZWN0U3ByZWFkKHtcbiAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlXG4gICAgICAgIH0sIGRhdGEpXG4gICAgICB9KTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiaGFuZGxlTWVzc2FnZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBoYW5kbGVNZXNzYWdlKGV2KSB7XG4gICAgICBpZiAodGhpcy5pc1N0b3BwZWQpIHJldHVybjtcbiAgICAgIHZhciBhY3Rpb25FdiA9IG5ldyBDdXN0b21FdmVudChcImFjdGlvbjpcIi5jb25jYXQoZXYuZGV0YWlsLmFjdGlvbiksIHtcbiAgICAgICAgZGV0YWlsOiBldi5kZXRhaWwsXG4gICAgICAgIGNhbmNlbGFibGU6IHRydWVcbiAgICAgIH0pO1xuICAgICAgdGhpcy5lbWl0KFwiYWN0aW9uOlwiLmNvbmNhdChldi5kZXRhaWwuYWN0aW9uKSwgYWN0aW9uRXYpO1xuICAgICAgaWYgKCFhY3Rpb25Fdi5kZWZhdWx0UHJldmVudGVkKSB7XG4gICAgICAgIHN3aXRjaCAoZXYuZGV0YWlsLmFjdGlvbikge1xuICAgICAgICAgIGNhc2UgX1dpZGdldEFwaUFjdGlvbi5XaWRnZXRBcGlGcm9tV2lkZ2V0QWN0aW9uLkNvbnRlbnRMb2FkZWQ6XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVDb250ZW50TG9hZGVkQWN0aW9uKGV2LmRldGFpbCk7XG4gICAgICAgICAgY2FzZSBfV2lkZ2V0QXBpQWN0aW9uLldpZGdldEFwaUZyb21XaWRnZXRBY3Rpb24uU3VwcG9ydGVkQXBpVmVyc2lvbnM6XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZXBseVZlcnNpb25zKGV2LmRldGFpbCk7XG4gICAgICAgICAgY2FzZSBfV2lkZ2V0QXBpQWN0aW9uLldpZGdldEFwaUZyb21XaWRnZXRBY3Rpb24uU2VuZEV2ZW50OlxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlU2VuZEV2ZW50KGV2LmRldGFpbCk7XG4gICAgICAgICAgY2FzZSBfV2lkZ2V0QXBpQWN0aW9uLldpZGdldEFwaUZyb21XaWRnZXRBY3Rpb24uU2VuZFRvRGV2aWNlOlxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlU2VuZFRvRGV2aWNlKGV2LmRldGFpbCk7XG4gICAgICAgICAgY2FzZSBfV2lkZ2V0QXBpQWN0aW9uLldpZGdldEFwaUZyb21XaWRnZXRBY3Rpb24uR2V0T3BlbklEQ3JlZGVudGlhbHM6XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVPSURDKGV2LmRldGFpbCk7XG4gICAgICAgICAgY2FzZSBfV2lkZ2V0QXBpQWN0aW9uLldpZGdldEFwaUZyb21XaWRnZXRBY3Rpb24uTVNDMjkzMU5hdmlnYXRlOlxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlTmF2aWdhdGUoZXYuZGV0YWlsKTtcbiAgICAgICAgICBjYXNlIF9XaWRnZXRBcGlBY3Rpb24uV2lkZ2V0QXBpRnJvbVdpZGdldEFjdGlvbi5NU0MyOTc0UmVuZWdvdGlhdGVDYXBhYmlsaXRpZXM6XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVDYXBhYmlsaXRpZXNSZW5lZ290aWF0ZShldi5kZXRhaWwpO1xuICAgICAgICAgIGNhc2UgX1dpZGdldEFwaUFjdGlvbi5XaWRnZXRBcGlGcm9tV2lkZ2V0QWN0aW9uLk1TQzI4NzZSZWFkRXZlbnRzOlxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlUmVhZEV2ZW50cyhldi5kZXRhaWwpO1xuICAgICAgICAgIGNhc2UgX1dpZGdldEFwaUFjdGlvbi5XaWRnZXRBcGlGcm9tV2lkZ2V0QWN0aW9uLldhdGNoVHVyblNlcnZlcnM6XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVXYXRjaFR1cm5TZXJ2ZXJzKGV2LmRldGFpbCk7XG4gICAgICAgICAgY2FzZSBfV2lkZ2V0QXBpQWN0aW9uLldpZGdldEFwaUZyb21XaWRnZXRBY3Rpb24uVW53YXRjaFR1cm5TZXJ2ZXJzOlxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlVW53YXRjaFR1cm5TZXJ2ZXJzKGV2LmRldGFpbCk7XG4gICAgICAgICAgY2FzZSBfV2lkZ2V0QXBpQWN0aW9uLldpZGdldEFwaUZyb21XaWRnZXRBY3Rpb24uTVNDMzg2OVJlYWRSZWxhdGlvbnM6XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVSZWFkUmVsYXRpb25zKGV2LmRldGFpbCk7XG4gICAgICAgICAgY2FzZSBfV2lkZ2V0QXBpQWN0aW9uLldpZGdldEFwaUZyb21XaWRnZXRBY3Rpb24uTVNDMzk3M1VzZXJEaXJlY3RvcnlTZWFyY2g6XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVVc2VyRGlyZWN0b3J5U2VhcmNoKGV2LmRldGFpbCk7XG4gICAgICAgICAgY2FzZSBfV2lkZ2V0QXBpQWN0aW9uLldpZGdldEFwaUZyb21XaWRnZXRBY3Rpb24uQmVlcGVyUmVhZFJvb21BY2NvdW50RGF0YTpcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmhhbmRsZVJlYWRSb29tQWNjb3VudERhdGEoZXYuZGV0YWlsKTtcbiAgICAgICAgICBjYXNlIF9XaWRnZXRBcGlBY3Rpb24uV2lkZ2V0QXBpRnJvbVdpZGdldEFjdGlvbi5NU0M0MDM5R2V0TWVkaWFDb25maWdBY3Rpb246XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVHZXRNZWRpYUNvbmZpZyhldi5kZXRhaWwpO1xuICAgICAgICAgIGNhc2UgX1dpZGdldEFwaUFjdGlvbi5XaWRnZXRBcGlGcm9tV2lkZ2V0QWN0aW9uLk1TQzQwMzlVcGxvYWRGaWxlQWN0aW9uOlxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlVXBsb2FkRmlsZShldi5kZXRhaWwpO1xuICAgICAgICAgIGNhc2UgX1dpZGdldEFwaUFjdGlvbi5XaWRnZXRBcGlGcm9tV2lkZ2V0QWN0aW9uLk1TQzQwMzlEb3dubG9hZEZpbGVBY3Rpb246XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVEb3dubG9hZEZpbGUoZXYuZGV0YWlsKTtcbiAgICAgICAgICBjYXNlIF9XaWRnZXRBcGlBY3Rpb24uV2lkZ2V0QXBpRnJvbVdpZGdldEFjdGlvbi5NU0M0MTU3VXBkYXRlRGVsYXllZEV2ZW50OlxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlVXBkYXRlRGVsYXllZEV2ZW50KGV2LmRldGFpbCk7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnRyYW5zcG9ydC5yZXBseShldi5kZXRhaWwsIHtcbiAgICAgICAgICAgICAgZXJyb3I6IHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBcIlVua25vd24gb3IgdW5zdXBwb3J0ZWQgYWN0aW9uOiBcIiArIGV2LmRldGFpbC5hY3Rpb25cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUYWtlcyBhIHNjcmVlbnNob3Qgb2YgdGhlIHdpZGdldC5cbiAgICAgKiBAcmV0dXJucyBSZXNvbHZlcyB0byB0aGUgd2lkZ2V0J3Mgc2NyZWVuc2hvdC5cbiAgICAgKiBAdGhyb3dzIFRocm93cyBpZiB0aGVyZSBpcyBhIHByb2JsZW0uXG4gICAgICovXG4gIH0sIHtcbiAgICBrZXk6IFwidGFrZVNjcmVlbnNob3RcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gdGFrZVNjcmVlbnNob3QoKSB7XG4gICAgICByZXR1cm4gdGhpcy50cmFuc3BvcnQuc2VuZChfV2lkZ2V0QXBpQWN0aW9uLldpZGdldEFwaVRvV2lkZ2V0QWN0aW9uLlRha2VTY3JlZW5zaG90LCB7fSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWxlcnRzIHRoZSB3aWRnZXQgdG8gd2hldGhlciBvciBub3QgaXQgaXMgY3VycmVudGx5IHZpc2libGUuXG4gICAgICogQHBhcmFtIHtib29sZWFufSBpc1Zpc2libGUgV2hldGhlciB0aGUgd2lkZ2V0IGlzIHZpc2libGUgb3Igbm90LlxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPElXaWRnZXRBcGlSZXNwb25zZURhdGE+fSBSZXNvbHZlcyB3aGVuIHRoZSB3aWRnZXQgYWNrbm93bGVkZ2VzIHRoZSB1cGRhdGUuXG4gICAgICovXG4gIH0sIHtcbiAgICBrZXk6IFwidXBkYXRlVmlzaWJpbGl0eVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiB1cGRhdGVWaXNpYmlsaXR5KGlzVmlzaWJsZSkge1xuICAgICAgcmV0dXJuIHRoaXMudHJhbnNwb3J0LnNlbmQoX1dpZGdldEFwaUFjdGlvbi5XaWRnZXRBcGlUb1dpZGdldEFjdGlvbi5VcGRhdGVWaXNpYmlsaXR5LCB7XG4gICAgICAgIHZpc2libGU6IGlzVmlzaWJsZVxuICAgICAgfSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInNlbmRXaWRnZXRDb25maWdcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gc2VuZFdpZGdldENvbmZpZyhkYXRhKSB7XG4gICAgICByZXR1cm4gdGhpcy50cmFuc3BvcnQuc2VuZChfV2lkZ2V0QXBpQWN0aW9uLldpZGdldEFwaVRvV2lkZ2V0QWN0aW9uLldpZGdldENvbmZpZywgZGF0YSkudGhlbigpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJub3RpZnlNb2RhbFdpZGdldEJ1dHRvbkNsaWNrZWRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gbm90aWZ5TW9kYWxXaWRnZXRCdXR0b25DbGlja2VkKGlkKSB7XG4gICAgICByZXR1cm4gdGhpcy50cmFuc3BvcnQuc2VuZChfV2lkZ2V0QXBpQWN0aW9uLldpZGdldEFwaVRvV2lkZ2V0QWN0aW9uLkJ1dHRvbkNsaWNrZWQsIHtcbiAgICAgICAgaWQ6IGlkXG4gICAgICB9KS50aGVuKCk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcIm5vdGlmeU1vZGFsV2lkZ2V0Q2xvc2VcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gbm90aWZ5TW9kYWxXaWRnZXRDbG9zZShkYXRhKSB7XG4gICAgICByZXR1cm4gdGhpcy50cmFuc3BvcnQuc2VuZChfV2lkZ2V0QXBpQWN0aW9uLldpZGdldEFwaVRvV2lkZ2V0QWN0aW9uLkNsb3NlTW9kYWxXaWRnZXQsIGRhdGEpLnRoZW4oKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGZWVkcyBhbiBldmVudCB0byB0aGUgd2lkZ2V0LiBJZiB0aGUgd2lkZ2V0IGlzIG5vdCBhYmxlIHRvIGFjY2VwdCB0aGUgZXZlbnQgZHVlIHRvXG4gICAgICogcGVybWlzc2lvbnMsIHRoaXMgd2lsbCBuby1vcCBhbmQgcmV0dXJuIGNhbG1seS4gSWYgdGhlIHdpZGdldCBmYWlsZWQgdG8gaGFuZGxlIHRoZVxuICAgICAqIGV2ZW50LCB0aGlzIHdpbGwgcmFpc2UgYW4gZXJyb3IuXG4gICAgICogQHBhcmFtIHtJUm9vbUV2ZW50fSByYXdFdmVudCBUaGUgZXZlbnQgdG8gKHRyeSB0bykgc2VuZCB0byB0aGUgd2lkZ2V0LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjdXJyZW50Vmlld2VkUm9vbUlkIFRoZSByb29tIElEIHRoZSB1c2VyIGlzIGN1cnJlbnRseSBpbnRlcmFjdGluZyB3aXRoLlxuICAgICAqIE5vdCB0aGUgcm9vbSBJRCBvZiB0aGUgZXZlbnQuXG4gICAgICogQHJldHVybnMge1Byb21pc2U8dm9pZD59IFJlc29sdmVzIHdoZW4gY29tcGxldGUsIHJlamVjdHMgaWYgdGhlcmUgd2FzIGFuIGVycm9yIHNlbmRpbmcuXG4gICAgICovXG4gIH0sIHtcbiAgICBrZXk6IFwiZmVlZEV2ZW50XCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBfZmVlZEV2ZW50ID0gX2FzeW5jVG9HZW5lcmF0b3IoIC8qI19fUFVSRV9fKi9fcmVnZW5lcmF0b3JSdW50aW1lKCkubWFyayhmdW5jdGlvbiBfY2FsbGVlMTAocmF3RXZlbnQsIGN1cnJlbnRWaWV3ZWRSb29tSWQpIHtcbiAgICAgICAgdmFyIF9yYXdFdmVudCRjb250ZW50O1xuICAgICAgICByZXR1cm4gX3JlZ2VuZXJhdG9yUnVudGltZSgpLndyYXAoZnVuY3Rpb24gX2NhbGxlZTEwJChfY29udGV4dDEwKSB7XG4gICAgICAgICAgd2hpbGUgKDEpIHN3aXRjaCAoX2NvbnRleHQxMC5wcmV2ID0gX2NvbnRleHQxMC5uZXh0KSB7XG4gICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgIGlmICghKHJhd0V2ZW50LnJvb21faWQgIT09IGN1cnJlbnRWaWV3ZWRSb29tSWQgJiYgIXRoaXMuY2FuVXNlUm9vbVRpbWVsaW5lKHJhd0V2ZW50LnJvb21faWQpKSkge1xuICAgICAgICAgICAgICAgIF9jb250ZXh0MTAubmV4dCA9IDI7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIF9jb250ZXh0MTAuYWJydXB0KFwicmV0dXJuXCIpO1xuICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICBpZiAoIShyYXdFdmVudC5zdGF0ZV9rZXkgIT09IHVuZGVmaW5lZCAmJiByYXdFdmVudC5zdGF0ZV9rZXkgIT09IG51bGwpKSB7XG4gICAgICAgICAgICAgICAgX2NvbnRleHQxMC5uZXh0ID0gNztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAodGhpcy5jYW5SZWNlaXZlU3RhdGVFdmVudChyYXdFdmVudC50eXBlLCByYXdFdmVudC5zdGF0ZV9rZXkpKSB7XG4gICAgICAgICAgICAgICAgX2NvbnRleHQxMC5uZXh0ID0gNTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gX2NvbnRleHQxMC5hYnJ1cHQoXCJyZXR1cm5cIik7XG4gICAgICAgICAgICBjYXNlIDU6XG4gICAgICAgICAgICAgIF9jb250ZXh0MTAubmV4dCA9IDk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSA3OlxuICAgICAgICAgICAgICBpZiAodGhpcy5jYW5SZWNlaXZlUm9vbUV2ZW50KHJhd0V2ZW50LnR5cGUsIChfcmF3RXZlbnQkY29udGVudCA9IHJhd0V2ZW50LmNvbnRlbnQpID09PSBudWxsIHx8IF9yYXdFdmVudCRjb250ZW50ID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfcmF3RXZlbnQkY29udGVudFtcIm1zZ3R5cGVcIl0pKSB7XG4gICAgICAgICAgICAgICAgX2NvbnRleHQxMC5uZXh0ID0gOTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gX2NvbnRleHQxMC5hYnJ1cHQoXCJyZXR1cm5cIik7XG4gICAgICAgICAgICBjYXNlIDk6XG4gICAgICAgICAgICAgIF9jb250ZXh0MTAubmV4dCA9IDExO1xuICAgICAgICAgICAgICByZXR1cm4gdGhpcy50cmFuc3BvcnQuc2VuZChfV2lkZ2V0QXBpQWN0aW9uLldpZGdldEFwaVRvV2lkZ2V0QWN0aW9uLlNlbmRFdmVudCwgcmF3RXZlbnQgLy8gaXQncyBjb21wYXRpYmxlLCBidXQgbWlzc2luZyB0aGUgaW5kZXggc2lnbmF0dXJlXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICBjYXNlIDExOlxuICAgICAgICAgICAgY2FzZSBcImVuZFwiOlxuICAgICAgICAgICAgICByZXR1cm4gX2NvbnRleHQxMC5zdG9wKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LCBfY2FsbGVlMTAsIHRoaXMpO1xuICAgICAgfSkpO1xuICAgICAgZnVuY3Rpb24gZmVlZEV2ZW50KF94MTEsIF94MTIpIHtcbiAgICAgICAgcmV0dXJuIF9mZWVkRXZlbnQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmZWVkRXZlbnQ7XG4gICAgfSgpXG4gICAgLyoqXG4gICAgICogRmVlZHMgYSB0by1kZXZpY2UgZXZlbnQgdG8gdGhlIHdpZGdldC4gSWYgdGhlIHdpZGdldCBpcyBub3QgYWJsZSB0byBhY2NlcHQgdGhlXG4gICAgICogZXZlbnQgZHVlIHRvIHBlcm1pc3Npb25zLCB0aGlzIHdpbGwgbm8tb3AgYW5kIHJldHVybiBjYWxtbHkuIElmIHRoZSB3aWRnZXQgZmFpbGVkXG4gICAgICogdG8gaGFuZGxlIHRoZSBldmVudCwgdGhpcyB3aWxsIHJhaXNlIGFuIGVycm9yLlxuICAgICAqIEBwYXJhbSB7SVJvb21FdmVudH0gcmF3RXZlbnQgVGhlIGV2ZW50IHRvICh0cnkgdG8pIHNlbmQgdG8gdGhlIHdpZGdldC5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGVuY3J5cHRlZCBXaGV0aGVyIHRoZSBldmVudCBjb250ZW50cyB3ZXJlIGVuY3J5cHRlZC5cbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn0gUmVzb2x2ZXMgd2hlbiBjb21wbGV0ZSwgcmVqZWN0cyBpZiB0aGVyZSB3YXMgYW4gZXJyb3Igc2VuZGluZy5cbiAgICAgKi9cbiAgfSwge1xuICAgIGtleTogXCJmZWVkVG9EZXZpY2VcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIF9mZWVkVG9EZXZpY2UgPSBfYXN5bmNUb0dlbmVyYXRvciggLyojX19QVVJFX18qL19yZWdlbmVyYXRvclJ1bnRpbWUoKS5tYXJrKGZ1bmN0aW9uIF9jYWxsZWUxMShyYXdFdmVudCwgZW5jcnlwdGVkKSB7XG4gICAgICAgIHJldHVybiBfcmVnZW5lcmF0b3JSdW50aW1lKCkud3JhcChmdW5jdGlvbiBfY2FsbGVlMTEkKF9jb250ZXh0MTEpIHtcbiAgICAgICAgICB3aGlsZSAoMSkgc3dpdGNoIChfY29udGV4dDExLnByZXYgPSBfY29udGV4dDExLm5leHQpIHtcbiAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgICAgaWYgKCF0aGlzLmNhblJlY2VpdmVUb0RldmljZUV2ZW50KHJhd0V2ZW50LnR5cGUpKSB7XG4gICAgICAgICAgICAgICAgX2NvbnRleHQxMS5uZXh0ID0gMztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBfY29udGV4dDExLm5leHQgPSAzO1xuICAgICAgICAgICAgICByZXR1cm4gdGhpcy50cmFuc3BvcnQuc2VuZChfV2lkZ2V0QXBpQWN0aW9uLldpZGdldEFwaVRvV2lkZ2V0QWN0aW9uLlNlbmRUb0RldmljZSwgLy8gaXQncyBjb21wYXRpYmxlLCBidXQgbWlzc2luZyB0aGUgaW5kZXggc2lnbmF0dXJlXG4gICAgICAgICAgICAgIF9vYmplY3RTcHJlYWQoX29iamVjdFNwcmVhZCh7fSwgcmF3RXZlbnQpLCB7fSwge1xuICAgICAgICAgICAgICAgIGVuY3J5cHRlZDogZW5jcnlwdGVkXG4gICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgIGNhc2UgXCJlbmRcIjpcbiAgICAgICAgICAgICAgcmV0dXJuIF9jb250ZXh0MTEuc3RvcCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgX2NhbGxlZTExLCB0aGlzKTtcbiAgICAgIH0pKTtcbiAgICAgIGZ1bmN0aW9uIGZlZWRUb0RldmljZShfeDEzLCBfeDE0KSB7XG4gICAgICAgIHJldHVybiBfZmVlZFRvRGV2aWNlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmVlZFRvRGV2aWNlO1xuICAgIH0oKVxuICB9XSk7XG4gIHJldHVybiBDbGllbnRXaWRnZXRBcGk7XG59KF9ldmVudHMuRXZlbnRFbWl0dGVyKTtcbmV4cG9ydHMuQ2xpZW50V2lkZ2V0QXBpID0gQ2xpZW50V2lkZ2V0QXBpO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Q2xpZW50V2lkZ2V0QXBpLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5TeW1ib2xzID0gdm9pZCAwO1xuLypcbiAqIENvcHlyaWdodCAyMDIxIFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xudmFyIFN5bWJvbHMgPSAvKiNfX1BVUkVfXyovZnVuY3Rpb24gKFN5bWJvbHMpIHtcbiAgU3ltYm9sc1tcIkFueVJvb21cIl0gPSBcIipcIjtcbiAgcmV0dXJuIFN5bWJvbHM7XG59KHt9KTtcbmV4cG9ydHMuU3ltYm9scyA9IFN5bWJvbHM7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1TeW1ib2xzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuXG5mdW5jdGlvbiBfdHlwZW9mKG9iaikgeyBcIkBiYWJlbC9oZWxwZXJzIC0gdHlwZW9mXCI7IHJldHVybiBfdHlwZW9mID0gXCJmdW5jdGlvblwiID09IHR5cGVvZiBTeW1ib2wgJiYgXCJzeW1ib2xcIiA9PSB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID8gZnVuY3Rpb24gKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfSA6IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIG9iaiAmJiBcImZ1bmN0aW9uXCIgPT0gdHlwZW9mIFN5bWJvbCAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvYmogIT09IFN5bWJvbC5wcm90b3R5cGUgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajsgfSwgX3R5cGVvZihvYmopOyB9XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5XaWRnZXRBcGlSZXNwb25zZUVycm9yID0gZXhwb3J0cy5XaWRnZXRBcGkgPSB2b2lkIDA7XG52YXIgX2V2ZW50cyA9IHJlcXVpcmUoXCJldmVudHNcIik7XG52YXIgX1dpZGdldEFwaURpcmVjdGlvbiA9IHJlcXVpcmUoXCIuL2ludGVyZmFjZXMvV2lkZ2V0QXBpRGlyZWN0aW9uXCIpO1xudmFyIF9BcGlWZXJzaW9uID0gcmVxdWlyZShcIi4vaW50ZXJmYWNlcy9BcGlWZXJzaW9uXCIpO1xudmFyIF9Qb3N0bWVzc2FnZVRyYW5zcG9ydCA9IHJlcXVpcmUoXCIuL3RyYW5zcG9ydC9Qb3N0bWVzc2FnZVRyYW5zcG9ydFwiKTtcbnZhciBfV2lkZ2V0QXBpQWN0aW9uID0gcmVxdWlyZShcIi4vaW50ZXJmYWNlcy9XaWRnZXRBcGlBY3Rpb25cIik7XG52YXIgX0dldE9wZW5JREFjdGlvbiA9IHJlcXVpcmUoXCIuL2ludGVyZmFjZXMvR2V0T3BlbklEQWN0aW9uXCIpO1xudmFyIF9XaWRnZXRUeXBlID0gcmVxdWlyZShcIi4vaW50ZXJmYWNlcy9XaWRnZXRUeXBlXCIpO1xudmFyIF9Nb2RhbFdpZGdldEFjdGlvbnMgPSByZXF1aXJlKFwiLi9pbnRlcmZhY2VzL01vZGFsV2lkZ2V0QWN0aW9uc1wiKTtcbnZhciBfV2lkZ2V0RXZlbnRDYXBhYmlsaXR5ID0gcmVxdWlyZShcIi4vbW9kZWxzL1dpZGdldEV2ZW50Q2FwYWJpbGl0eVwiKTtcbnZhciBfU3ltYm9scyA9IHJlcXVpcmUoXCIuL1N5bWJvbHNcIik7XG5mdW5jdGlvbiBfcmVnZW5lcmF0b3JSdW50aW1lKCkgeyBcInVzZSBzdHJpY3RcIjsgLyohIHJlZ2VuZXJhdG9yLXJ1bnRpbWUgLS0gQ29weXJpZ2h0IChjKSAyMDE0LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuIC0tIGxpY2Vuc2UgKE1JVCk6IGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWdlbmVyYXRvci9ibG9iL21haW4vTElDRU5TRSAqLyBfcmVnZW5lcmF0b3JSdW50aW1lID0gZnVuY3Rpb24gX3JlZ2VuZXJhdG9yUnVudGltZSgpIHsgcmV0dXJuIGV4cG9ydHM7IH07IHZhciBleHBvcnRzID0ge30sIE9wID0gT2JqZWN0LnByb3RvdHlwZSwgaGFzT3duID0gT3AuaGFzT3duUHJvcGVydHksIGRlZmluZVByb3BlcnR5ID0gT2JqZWN0LmRlZmluZVByb3BlcnR5IHx8IGZ1bmN0aW9uIChvYmosIGtleSwgZGVzYykgeyBvYmpba2V5XSA9IGRlc2MudmFsdWU7IH0sICRTeW1ib2wgPSBcImZ1bmN0aW9uXCIgPT0gdHlwZW9mIFN5bWJvbCA/IFN5bWJvbCA6IHt9LCBpdGVyYXRvclN5bWJvbCA9ICRTeW1ib2wuaXRlcmF0b3IgfHwgXCJAQGl0ZXJhdG9yXCIsIGFzeW5jSXRlcmF0b3JTeW1ib2wgPSAkU3ltYm9sLmFzeW5jSXRlcmF0b3IgfHwgXCJAQGFzeW5jSXRlcmF0b3JcIiwgdG9TdHJpbmdUYWdTeW1ib2wgPSAkU3ltYm9sLnRvU3RyaW5nVGFnIHx8IFwiQEB0b1N0cmluZ1RhZ1wiOyBmdW5jdGlvbiBkZWZpbmUob2JqLCBrZXksIHZhbHVlKSB7IHJldHVybiBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBrZXksIHsgdmFsdWU6IHZhbHVlLCBlbnVtZXJhYmxlOiAhMCwgY29uZmlndXJhYmxlOiAhMCwgd3JpdGFibGU6ICEwIH0pLCBvYmpba2V5XTsgfSB0cnkgeyBkZWZpbmUoe30sIFwiXCIpOyB9IGNhdGNoIChlcnIpIHsgZGVmaW5lID0gZnVuY3Rpb24gZGVmaW5lKG9iaiwga2V5LCB2YWx1ZSkgeyByZXR1cm4gb2JqW2tleV0gPSB2YWx1ZTsgfTsgfSBmdW5jdGlvbiB3cmFwKGlubmVyRm4sIG91dGVyRm4sIHNlbGYsIHRyeUxvY3NMaXN0KSB7IHZhciBwcm90b0dlbmVyYXRvciA9IG91dGVyRm4gJiYgb3V0ZXJGbi5wcm90b3R5cGUgaW5zdGFuY2VvZiBHZW5lcmF0b3IgPyBvdXRlckZuIDogR2VuZXJhdG9yLCBnZW5lcmF0b3IgPSBPYmplY3QuY3JlYXRlKHByb3RvR2VuZXJhdG9yLnByb3RvdHlwZSksIGNvbnRleHQgPSBuZXcgQ29udGV4dCh0cnlMb2NzTGlzdCB8fCBbXSk7IHJldHVybiBkZWZpbmVQcm9wZXJ0eShnZW5lcmF0b3IsIFwiX2ludm9rZVwiLCB7IHZhbHVlOiBtYWtlSW52b2tlTWV0aG9kKGlubmVyRm4sIHNlbGYsIGNvbnRleHQpIH0pLCBnZW5lcmF0b3I7IH0gZnVuY3Rpb24gdHJ5Q2F0Y2goZm4sIG9iaiwgYXJnKSB7IHRyeSB7IHJldHVybiB7IHR5cGU6IFwibm9ybWFsXCIsIGFyZzogZm4uY2FsbChvYmosIGFyZykgfTsgfSBjYXRjaCAoZXJyKSB7IHJldHVybiB7IHR5cGU6IFwidGhyb3dcIiwgYXJnOiBlcnIgfTsgfSB9IGV4cG9ydHMud3JhcCA9IHdyYXA7IHZhciBDb250aW51ZVNlbnRpbmVsID0ge307IGZ1bmN0aW9uIEdlbmVyYXRvcigpIHt9IGZ1bmN0aW9uIEdlbmVyYXRvckZ1bmN0aW9uKCkge30gZnVuY3Rpb24gR2VuZXJhdG9yRnVuY3Rpb25Qcm90b3R5cGUoKSB7fSB2YXIgSXRlcmF0b3JQcm90b3R5cGUgPSB7fTsgZGVmaW5lKEl0ZXJhdG9yUHJvdG90eXBlLCBpdGVyYXRvclN5bWJvbCwgZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSk7IHZhciBnZXRQcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZiwgTmF0aXZlSXRlcmF0b3JQcm90b3R5cGUgPSBnZXRQcm90byAmJiBnZXRQcm90byhnZXRQcm90byh2YWx1ZXMoW10pKSk7IE5hdGl2ZUl0ZXJhdG9yUHJvdG90eXBlICYmIE5hdGl2ZUl0ZXJhdG9yUHJvdG90eXBlICE9PSBPcCAmJiBoYXNPd24uY2FsbChOYXRpdmVJdGVyYXRvclByb3RvdHlwZSwgaXRlcmF0b3JTeW1ib2wpICYmIChJdGVyYXRvclByb3RvdHlwZSA9IE5hdGl2ZUl0ZXJhdG9yUHJvdG90eXBlKTsgdmFyIEdwID0gR2VuZXJhdG9yRnVuY3Rpb25Qcm90b3R5cGUucHJvdG90eXBlID0gR2VuZXJhdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSXRlcmF0b3JQcm90b3R5cGUpOyBmdW5jdGlvbiBkZWZpbmVJdGVyYXRvck1ldGhvZHMocHJvdG90eXBlKSB7IFtcIm5leHRcIiwgXCJ0aHJvd1wiLCBcInJldHVyblwiXS5mb3JFYWNoKGZ1bmN0aW9uIChtZXRob2QpIHsgZGVmaW5lKHByb3RvdHlwZSwgbWV0aG9kLCBmdW5jdGlvbiAoYXJnKSB7IHJldHVybiB0aGlzLl9pbnZva2UobWV0aG9kLCBhcmcpOyB9KTsgfSk7IH0gZnVuY3Rpb24gQXN5bmNJdGVyYXRvcihnZW5lcmF0b3IsIFByb21pc2VJbXBsKSB7IGZ1bmN0aW9uIGludm9rZShtZXRob2QsIGFyZywgcmVzb2x2ZSwgcmVqZWN0KSB7IHZhciByZWNvcmQgPSB0cnlDYXRjaChnZW5lcmF0b3JbbWV0aG9kXSwgZ2VuZXJhdG9yLCBhcmcpOyBpZiAoXCJ0aHJvd1wiICE9PSByZWNvcmQudHlwZSkgeyB2YXIgcmVzdWx0ID0gcmVjb3JkLmFyZywgdmFsdWUgPSByZXN1bHQudmFsdWU7IHJldHVybiB2YWx1ZSAmJiBcIm9iamVjdFwiID09IF90eXBlb2YodmFsdWUpICYmIGhhc093bi5jYWxsKHZhbHVlLCBcIl9fYXdhaXRcIikgPyBQcm9taXNlSW1wbC5yZXNvbHZlKHZhbHVlLl9fYXdhaXQpLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7IGludm9rZShcIm5leHRcIiwgdmFsdWUsIHJlc29sdmUsIHJlamVjdCk7IH0sIGZ1bmN0aW9uIChlcnIpIHsgaW52b2tlKFwidGhyb3dcIiwgZXJyLCByZXNvbHZlLCByZWplY3QpOyB9KSA6IFByb21pc2VJbXBsLnJlc29sdmUodmFsdWUpLnRoZW4oZnVuY3Rpb24gKHVud3JhcHBlZCkgeyByZXN1bHQudmFsdWUgPSB1bndyYXBwZWQsIHJlc29sdmUocmVzdWx0KTsgfSwgZnVuY3Rpb24gKGVycm9yKSB7IHJldHVybiBpbnZva2UoXCJ0aHJvd1wiLCBlcnJvciwgcmVzb2x2ZSwgcmVqZWN0KTsgfSk7IH0gcmVqZWN0KHJlY29yZC5hcmcpOyB9IHZhciBwcmV2aW91c1Byb21pc2U7IGRlZmluZVByb3BlcnR5KHRoaXMsIFwiX2ludm9rZVwiLCB7IHZhbHVlOiBmdW5jdGlvbiB2YWx1ZShtZXRob2QsIGFyZykgeyBmdW5jdGlvbiBjYWxsSW52b2tlV2l0aE1ldGhvZEFuZEFyZygpIHsgcmV0dXJuIG5ldyBQcm9taXNlSW1wbChmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7IGludm9rZShtZXRob2QsIGFyZywgcmVzb2x2ZSwgcmVqZWN0KTsgfSk7IH0gcmV0dXJuIHByZXZpb3VzUHJvbWlzZSA9IHByZXZpb3VzUHJvbWlzZSA/IHByZXZpb3VzUHJvbWlzZS50aGVuKGNhbGxJbnZva2VXaXRoTWV0aG9kQW5kQXJnLCBjYWxsSW52b2tlV2l0aE1ldGhvZEFuZEFyZykgOiBjYWxsSW52b2tlV2l0aE1ldGhvZEFuZEFyZygpOyB9IH0pOyB9IGZ1bmN0aW9uIG1ha2VJbnZva2VNZXRob2QoaW5uZXJGbiwgc2VsZiwgY29udGV4dCkgeyB2YXIgc3RhdGUgPSBcInN1c3BlbmRlZFN0YXJ0XCI7IHJldHVybiBmdW5jdGlvbiAobWV0aG9kLCBhcmcpIHsgaWYgKFwiZXhlY3V0aW5nXCIgPT09IHN0YXRlKSB0aHJvdyBuZXcgRXJyb3IoXCJHZW5lcmF0b3IgaXMgYWxyZWFkeSBydW5uaW5nXCIpOyBpZiAoXCJjb21wbGV0ZWRcIiA9PT0gc3RhdGUpIHsgaWYgKFwidGhyb3dcIiA9PT0gbWV0aG9kKSB0aHJvdyBhcmc7IHJldHVybiBkb25lUmVzdWx0KCk7IH0gZm9yIChjb250ZXh0Lm1ldGhvZCA9IG1ldGhvZCwgY29udGV4dC5hcmcgPSBhcmc7OykgeyB2YXIgZGVsZWdhdGUgPSBjb250ZXh0LmRlbGVnYXRlOyBpZiAoZGVsZWdhdGUpIHsgdmFyIGRlbGVnYXRlUmVzdWx0ID0gbWF5YmVJbnZva2VEZWxlZ2F0ZShkZWxlZ2F0ZSwgY29udGV4dCk7IGlmIChkZWxlZ2F0ZVJlc3VsdCkgeyBpZiAoZGVsZWdhdGVSZXN1bHQgPT09IENvbnRpbnVlU2VudGluZWwpIGNvbnRpbnVlOyByZXR1cm4gZGVsZWdhdGVSZXN1bHQ7IH0gfSBpZiAoXCJuZXh0XCIgPT09IGNvbnRleHQubWV0aG9kKSBjb250ZXh0LnNlbnQgPSBjb250ZXh0Ll9zZW50ID0gY29udGV4dC5hcmc7ZWxzZSBpZiAoXCJ0aHJvd1wiID09PSBjb250ZXh0Lm1ldGhvZCkgeyBpZiAoXCJzdXNwZW5kZWRTdGFydFwiID09PSBzdGF0ZSkgdGhyb3cgc3RhdGUgPSBcImNvbXBsZXRlZFwiLCBjb250ZXh0LmFyZzsgY29udGV4dC5kaXNwYXRjaEV4Y2VwdGlvbihjb250ZXh0LmFyZyk7IH0gZWxzZSBcInJldHVyblwiID09PSBjb250ZXh0Lm1ldGhvZCAmJiBjb250ZXh0LmFicnVwdChcInJldHVyblwiLCBjb250ZXh0LmFyZyk7IHN0YXRlID0gXCJleGVjdXRpbmdcIjsgdmFyIHJlY29yZCA9IHRyeUNhdGNoKGlubmVyRm4sIHNlbGYsIGNvbnRleHQpOyBpZiAoXCJub3JtYWxcIiA9PT0gcmVjb3JkLnR5cGUpIHsgaWYgKHN0YXRlID0gY29udGV4dC5kb25lID8gXCJjb21wbGV0ZWRcIiA6IFwic3VzcGVuZGVkWWllbGRcIiwgcmVjb3JkLmFyZyA9PT0gQ29udGludWVTZW50aW5lbCkgY29udGludWU7IHJldHVybiB7IHZhbHVlOiByZWNvcmQuYXJnLCBkb25lOiBjb250ZXh0LmRvbmUgfTsgfSBcInRocm93XCIgPT09IHJlY29yZC50eXBlICYmIChzdGF0ZSA9IFwiY29tcGxldGVkXCIsIGNvbnRleHQubWV0aG9kID0gXCJ0aHJvd1wiLCBjb250ZXh0LmFyZyA9IHJlY29yZC5hcmcpOyB9IH07IH0gZnVuY3Rpb24gbWF5YmVJbnZva2VEZWxlZ2F0ZShkZWxlZ2F0ZSwgY29udGV4dCkgeyB2YXIgbWV0aG9kTmFtZSA9IGNvbnRleHQubWV0aG9kLCBtZXRob2QgPSBkZWxlZ2F0ZS5pdGVyYXRvclttZXRob2ROYW1lXTsgaWYgKHVuZGVmaW5lZCA9PT0gbWV0aG9kKSByZXR1cm4gY29udGV4dC5kZWxlZ2F0ZSA9IG51bGwsIFwidGhyb3dcIiA9PT0gbWV0aG9kTmFtZSAmJiBkZWxlZ2F0ZS5pdGVyYXRvcltcInJldHVyblwiXSAmJiAoY29udGV4dC5tZXRob2QgPSBcInJldHVyblwiLCBjb250ZXh0LmFyZyA9IHVuZGVmaW5lZCwgbWF5YmVJbnZva2VEZWxlZ2F0ZShkZWxlZ2F0ZSwgY29udGV4dCksIFwidGhyb3dcIiA9PT0gY29udGV4dC5tZXRob2QpIHx8IFwicmV0dXJuXCIgIT09IG1ldGhvZE5hbWUgJiYgKGNvbnRleHQubWV0aG9kID0gXCJ0aHJvd1wiLCBjb250ZXh0LmFyZyA9IG5ldyBUeXBlRXJyb3IoXCJUaGUgaXRlcmF0b3IgZG9lcyBub3QgcHJvdmlkZSBhICdcIiArIG1ldGhvZE5hbWUgKyBcIicgbWV0aG9kXCIpKSwgQ29udGludWVTZW50aW5lbDsgdmFyIHJlY29yZCA9IHRyeUNhdGNoKG1ldGhvZCwgZGVsZWdhdGUuaXRlcmF0b3IsIGNvbnRleHQuYXJnKTsgaWYgKFwidGhyb3dcIiA9PT0gcmVjb3JkLnR5cGUpIHJldHVybiBjb250ZXh0Lm1ldGhvZCA9IFwidGhyb3dcIiwgY29udGV4dC5hcmcgPSByZWNvcmQuYXJnLCBjb250ZXh0LmRlbGVnYXRlID0gbnVsbCwgQ29udGludWVTZW50aW5lbDsgdmFyIGluZm8gPSByZWNvcmQuYXJnOyByZXR1cm4gaW5mbyA/IGluZm8uZG9uZSA/IChjb250ZXh0W2RlbGVnYXRlLnJlc3VsdE5hbWVdID0gaW5mby52YWx1ZSwgY29udGV4dC5uZXh0ID0gZGVsZWdhdGUubmV4dExvYywgXCJyZXR1cm5cIiAhPT0gY29udGV4dC5tZXRob2QgJiYgKGNvbnRleHQubWV0aG9kID0gXCJuZXh0XCIsIGNvbnRleHQuYXJnID0gdW5kZWZpbmVkKSwgY29udGV4dC5kZWxlZ2F0ZSA9IG51bGwsIENvbnRpbnVlU2VudGluZWwpIDogaW5mbyA6IChjb250ZXh0Lm1ldGhvZCA9IFwidGhyb3dcIiwgY29udGV4dC5hcmcgPSBuZXcgVHlwZUVycm9yKFwiaXRlcmF0b3IgcmVzdWx0IGlzIG5vdCBhbiBvYmplY3RcIiksIGNvbnRleHQuZGVsZWdhdGUgPSBudWxsLCBDb250aW51ZVNlbnRpbmVsKTsgfSBmdW5jdGlvbiBwdXNoVHJ5RW50cnkobG9jcykgeyB2YXIgZW50cnkgPSB7IHRyeUxvYzogbG9jc1swXSB9OyAxIGluIGxvY3MgJiYgKGVudHJ5LmNhdGNoTG9jID0gbG9jc1sxXSksIDIgaW4gbG9jcyAmJiAoZW50cnkuZmluYWxseUxvYyA9IGxvY3NbMl0sIGVudHJ5LmFmdGVyTG9jID0gbG9jc1szXSksIHRoaXMudHJ5RW50cmllcy5wdXNoKGVudHJ5KTsgfSBmdW5jdGlvbiByZXNldFRyeUVudHJ5KGVudHJ5KSB7IHZhciByZWNvcmQgPSBlbnRyeS5jb21wbGV0aW9uIHx8IHt9OyByZWNvcmQudHlwZSA9IFwibm9ybWFsXCIsIGRlbGV0ZSByZWNvcmQuYXJnLCBlbnRyeS5jb21wbGV0aW9uID0gcmVjb3JkOyB9IGZ1bmN0aW9uIENvbnRleHQodHJ5TG9jc0xpc3QpIHsgdGhpcy50cnlFbnRyaWVzID0gW3sgdHJ5TG9jOiBcInJvb3RcIiB9XSwgdHJ5TG9jc0xpc3QuZm9yRWFjaChwdXNoVHJ5RW50cnksIHRoaXMpLCB0aGlzLnJlc2V0KCEwKTsgfSBmdW5jdGlvbiB2YWx1ZXMoaXRlcmFibGUpIHsgaWYgKGl0ZXJhYmxlKSB7IHZhciBpdGVyYXRvck1ldGhvZCA9IGl0ZXJhYmxlW2l0ZXJhdG9yU3ltYm9sXTsgaWYgKGl0ZXJhdG9yTWV0aG9kKSByZXR1cm4gaXRlcmF0b3JNZXRob2QuY2FsbChpdGVyYWJsZSk7IGlmIChcImZ1bmN0aW9uXCIgPT0gdHlwZW9mIGl0ZXJhYmxlLm5leHQpIHJldHVybiBpdGVyYWJsZTsgaWYgKCFpc05hTihpdGVyYWJsZS5sZW5ndGgpKSB7IHZhciBpID0gLTEsIG5leHQgPSBmdW5jdGlvbiBuZXh0KCkgeyBmb3IgKDsgKytpIDwgaXRlcmFibGUubGVuZ3RoOykgaWYgKGhhc093bi5jYWxsKGl0ZXJhYmxlLCBpKSkgcmV0dXJuIG5leHQudmFsdWUgPSBpdGVyYWJsZVtpXSwgbmV4dC5kb25lID0gITEsIG5leHQ7IHJldHVybiBuZXh0LnZhbHVlID0gdW5kZWZpbmVkLCBuZXh0LmRvbmUgPSAhMCwgbmV4dDsgfTsgcmV0dXJuIG5leHQubmV4dCA9IG5leHQ7IH0gfSByZXR1cm4geyBuZXh0OiBkb25lUmVzdWx0IH07IH0gZnVuY3Rpb24gZG9uZVJlc3VsdCgpIHsgcmV0dXJuIHsgdmFsdWU6IHVuZGVmaW5lZCwgZG9uZTogITAgfTsgfSByZXR1cm4gR2VuZXJhdG9yRnVuY3Rpb24ucHJvdG90eXBlID0gR2VuZXJhdG9yRnVuY3Rpb25Qcm90b3R5cGUsIGRlZmluZVByb3BlcnR5KEdwLCBcImNvbnN0cnVjdG9yXCIsIHsgdmFsdWU6IEdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlLCBjb25maWd1cmFibGU6ICEwIH0pLCBkZWZpbmVQcm9wZXJ0eShHZW5lcmF0b3JGdW5jdGlvblByb3RvdHlwZSwgXCJjb25zdHJ1Y3RvclwiLCB7IHZhbHVlOiBHZW5lcmF0b3JGdW5jdGlvbiwgY29uZmlndXJhYmxlOiAhMCB9KSwgR2VuZXJhdG9yRnVuY3Rpb24uZGlzcGxheU5hbWUgPSBkZWZpbmUoR2VuZXJhdG9yRnVuY3Rpb25Qcm90b3R5cGUsIHRvU3RyaW5nVGFnU3ltYm9sLCBcIkdlbmVyYXRvckZ1bmN0aW9uXCIpLCBleHBvcnRzLmlzR2VuZXJhdG9yRnVuY3Rpb24gPSBmdW5jdGlvbiAoZ2VuRnVuKSB7IHZhciBjdG9yID0gXCJmdW5jdGlvblwiID09IHR5cGVvZiBnZW5GdW4gJiYgZ2VuRnVuLmNvbnN0cnVjdG9yOyByZXR1cm4gISFjdG9yICYmIChjdG9yID09PSBHZW5lcmF0b3JGdW5jdGlvbiB8fCBcIkdlbmVyYXRvckZ1bmN0aW9uXCIgPT09IChjdG9yLmRpc3BsYXlOYW1lIHx8IGN0b3IubmFtZSkpOyB9LCBleHBvcnRzLm1hcmsgPSBmdW5jdGlvbiAoZ2VuRnVuKSB7IHJldHVybiBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3Quc2V0UHJvdG90eXBlT2YoZ2VuRnVuLCBHZW5lcmF0b3JGdW5jdGlvblByb3RvdHlwZSkgOiAoZ2VuRnVuLl9fcHJvdG9fXyA9IEdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlLCBkZWZpbmUoZ2VuRnVuLCB0b1N0cmluZ1RhZ1N5bWJvbCwgXCJHZW5lcmF0b3JGdW5jdGlvblwiKSksIGdlbkZ1bi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEdwKSwgZ2VuRnVuOyB9LCBleHBvcnRzLmF3cmFwID0gZnVuY3Rpb24gKGFyZykgeyByZXR1cm4geyBfX2F3YWl0OiBhcmcgfTsgfSwgZGVmaW5lSXRlcmF0b3JNZXRob2RzKEFzeW5jSXRlcmF0b3IucHJvdG90eXBlKSwgZGVmaW5lKEFzeW5jSXRlcmF0b3IucHJvdG90eXBlLCBhc3luY0l0ZXJhdG9yU3ltYm9sLCBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzOyB9KSwgZXhwb3J0cy5Bc3luY0l0ZXJhdG9yID0gQXN5bmNJdGVyYXRvciwgZXhwb3J0cy5hc3luYyA9IGZ1bmN0aW9uIChpbm5lckZuLCBvdXRlckZuLCBzZWxmLCB0cnlMb2NzTGlzdCwgUHJvbWlzZUltcGwpIHsgdm9pZCAwID09PSBQcm9taXNlSW1wbCAmJiAoUHJvbWlzZUltcGwgPSBQcm9taXNlKTsgdmFyIGl0ZXIgPSBuZXcgQXN5bmNJdGVyYXRvcih3cmFwKGlubmVyRm4sIG91dGVyRm4sIHNlbGYsIHRyeUxvY3NMaXN0KSwgUHJvbWlzZUltcGwpOyByZXR1cm4gZXhwb3J0cy5pc0dlbmVyYXRvckZ1bmN0aW9uKG91dGVyRm4pID8gaXRlciA6IGl0ZXIubmV4dCgpLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkgeyByZXR1cm4gcmVzdWx0LmRvbmUgPyByZXN1bHQudmFsdWUgOiBpdGVyLm5leHQoKTsgfSk7IH0sIGRlZmluZUl0ZXJhdG9yTWV0aG9kcyhHcCksIGRlZmluZShHcCwgdG9TdHJpbmdUYWdTeW1ib2wsIFwiR2VuZXJhdG9yXCIpLCBkZWZpbmUoR3AsIGl0ZXJhdG9yU3ltYm9sLCBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzOyB9KSwgZGVmaW5lKEdwLCBcInRvU3RyaW5nXCIsIGZ1bmN0aW9uICgpIHsgcmV0dXJuIFwiW29iamVjdCBHZW5lcmF0b3JdXCI7IH0pLCBleHBvcnRzLmtleXMgPSBmdW5jdGlvbiAodmFsKSB7IHZhciBvYmplY3QgPSBPYmplY3QodmFsKSwga2V5cyA9IFtdOyBmb3IgKHZhciBrZXkgaW4gb2JqZWN0KSBrZXlzLnB1c2goa2V5KTsgcmV0dXJuIGtleXMucmV2ZXJzZSgpLCBmdW5jdGlvbiBuZXh0KCkgeyBmb3IgKDsga2V5cy5sZW5ndGg7KSB7IHZhciBrZXkgPSBrZXlzLnBvcCgpOyBpZiAoa2V5IGluIG9iamVjdCkgcmV0dXJuIG5leHQudmFsdWUgPSBrZXksIG5leHQuZG9uZSA9ICExLCBuZXh0OyB9IHJldHVybiBuZXh0LmRvbmUgPSAhMCwgbmV4dDsgfTsgfSwgZXhwb3J0cy52YWx1ZXMgPSB2YWx1ZXMsIENvbnRleHQucHJvdG90eXBlID0geyBjb25zdHJ1Y3RvcjogQ29udGV4dCwgcmVzZXQ6IGZ1bmN0aW9uIHJlc2V0KHNraXBUZW1wUmVzZXQpIHsgaWYgKHRoaXMucHJldiA9IDAsIHRoaXMubmV4dCA9IDAsIHRoaXMuc2VudCA9IHRoaXMuX3NlbnQgPSB1bmRlZmluZWQsIHRoaXMuZG9uZSA9ICExLCB0aGlzLmRlbGVnYXRlID0gbnVsbCwgdGhpcy5tZXRob2QgPSBcIm5leHRcIiwgdGhpcy5hcmcgPSB1bmRlZmluZWQsIHRoaXMudHJ5RW50cmllcy5mb3JFYWNoKHJlc2V0VHJ5RW50cnkpLCAhc2tpcFRlbXBSZXNldCkgZm9yICh2YXIgbmFtZSBpbiB0aGlzKSBcInRcIiA9PT0gbmFtZS5jaGFyQXQoMCkgJiYgaGFzT3duLmNhbGwodGhpcywgbmFtZSkgJiYgIWlzTmFOKCtuYW1lLnNsaWNlKDEpKSAmJiAodGhpc1tuYW1lXSA9IHVuZGVmaW5lZCk7IH0sIHN0b3A6IGZ1bmN0aW9uIHN0b3AoKSB7IHRoaXMuZG9uZSA9ICEwOyB2YXIgcm9vdFJlY29yZCA9IHRoaXMudHJ5RW50cmllc1swXS5jb21wbGV0aW9uOyBpZiAoXCJ0aHJvd1wiID09PSByb290UmVjb3JkLnR5cGUpIHRocm93IHJvb3RSZWNvcmQuYXJnOyByZXR1cm4gdGhpcy5ydmFsOyB9LCBkaXNwYXRjaEV4Y2VwdGlvbjogZnVuY3Rpb24gZGlzcGF0Y2hFeGNlcHRpb24oZXhjZXB0aW9uKSB7IGlmICh0aGlzLmRvbmUpIHRocm93IGV4Y2VwdGlvbjsgdmFyIGNvbnRleHQgPSB0aGlzOyBmdW5jdGlvbiBoYW5kbGUobG9jLCBjYXVnaHQpIHsgcmV0dXJuIHJlY29yZC50eXBlID0gXCJ0aHJvd1wiLCByZWNvcmQuYXJnID0gZXhjZXB0aW9uLCBjb250ZXh0Lm5leHQgPSBsb2MsIGNhdWdodCAmJiAoY29udGV4dC5tZXRob2QgPSBcIm5leHRcIiwgY29udGV4dC5hcmcgPSB1bmRlZmluZWQpLCAhIWNhdWdodDsgfSBmb3IgKHZhciBpID0gdGhpcy50cnlFbnRyaWVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7IHZhciBlbnRyeSA9IHRoaXMudHJ5RW50cmllc1tpXSwgcmVjb3JkID0gZW50cnkuY29tcGxldGlvbjsgaWYgKFwicm9vdFwiID09PSBlbnRyeS50cnlMb2MpIHJldHVybiBoYW5kbGUoXCJlbmRcIik7IGlmIChlbnRyeS50cnlMb2MgPD0gdGhpcy5wcmV2KSB7IHZhciBoYXNDYXRjaCA9IGhhc093bi5jYWxsKGVudHJ5LCBcImNhdGNoTG9jXCIpLCBoYXNGaW5hbGx5ID0gaGFzT3duLmNhbGwoZW50cnksIFwiZmluYWxseUxvY1wiKTsgaWYgKGhhc0NhdGNoICYmIGhhc0ZpbmFsbHkpIHsgaWYgKHRoaXMucHJldiA8IGVudHJ5LmNhdGNoTG9jKSByZXR1cm4gaGFuZGxlKGVudHJ5LmNhdGNoTG9jLCAhMCk7IGlmICh0aGlzLnByZXYgPCBlbnRyeS5maW5hbGx5TG9jKSByZXR1cm4gaGFuZGxlKGVudHJ5LmZpbmFsbHlMb2MpOyB9IGVsc2UgaWYgKGhhc0NhdGNoKSB7IGlmICh0aGlzLnByZXYgPCBlbnRyeS5jYXRjaExvYykgcmV0dXJuIGhhbmRsZShlbnRyeS5jYXRjaExvYywgITApOyB9IGVsc2UgeyBpZiAoIWhhc0ZpbmFsbHkpIHRocm93IG5ldyBFcnJvcihcInRyeSBzdGF0ZW1lbnQgd2l0aG91dCBjYXRjaCBvciBmaW5hbGx5XCIpOyBpZiAodGhpcy5wcmV2IDwgZW50cnkuZmluYWxseUxvYykgcmV0dXJuIGhhbmRsZShlbnRyeS5maW5hbGx5TG9jKTsgfSB9IH0gfSwgYWJydXB0OiBmdW5jdGlvbiBhYnJ1cHQodHlwZSwgYXJnKSB7IGZvciAodmFyIGkgPSB0aGlzLnRyeUVudHJpZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHsgdmFyIGVudHJ5ID0gdGhpcy50cnlFbnRyaWVzW2ldOyBpZiAoZW50cnkudHJ5TG9jIDw9IHRoaXMucHJldiAmJiBoYXNPd24uY2FsbChlbnRyeSwgXCJmaW5hbGx5TG9jXCIpICYmIHRoaXMucHJldiA8IGVudHJ5LmZpbmFsbHlMb2MpIHsgdmFyIGZpbmFsbHlFbnRyeSA9IGVudHJ5OyBicmVhazsgfSB9IGZpbmFsbHlFbnRyeSAmJiAoXCJicmVha1wiID09PSB0eXBlIHx8IFwiY29udGludWVcIiA9PT0gdHlwZSkgJiYgZmluYWxseUVudHJ5LnRyeUxvYyA8PSBhcmcgJiYgYXJnIDw9IGZpbmFsbHlFbnRyeS5maW5hbGx5TG9jICYmIChmaW5hbGx5RW50cnkgPSBudWxsKTsgdmFyIHJlY29yZCA9IGZpbmFsbHlFbnRyeSA/IGZpbmFsbHlFbnRyeS5jb21wbGV0aW9uIDoge307IHJldHVybiByZWNvcmQudHlwZSA9IHR5cGUsIHJlY29yZC5hcmcgPSBhcmcsIGZpbmFsbHlFbnRyeSA/ICh0aGlzLm1ldGhvZCA9IFwibmV4dFwiLCB0aGlzLm5leHQgPSBmaW5hbGx5RW50cnkuZmluYWxseUxvYywgQ29udGludWVTZW50aW5lbCkgOiB0aGlzLmNvbXBsZXRlKHJlY29yZCk7IH0sIGNvbXBsZXRlOiBmdW5jdGlvbiBjb21wbGV0ZShyZWNvcmQsIGFmdGVyTG9jKSB7IGlmIChcInRocm93XCIgPT09IHJlY29yZC50eXBlKSB0aHJvdyByZWNvcmQuYXJnOyByZXR1cm4gXCJicmVha1wiID09PSByZWNvcmQudHlwZSB8fCBcImNvbnRpbnVlXCIgPT09IHJlY29yZC50eXBlID8gdGhpcy5uZXh0ID0gcmVjb3JkLmFyZyA6IFwicmV0dXJuXCIgPT09IHJlY29yZC50eXBlID8gKHRoaXMucnZhbCA9IHRoaXMuYXJnID0gcmVjb3JkLmFyZywgdGhpcy5tZXRob2QgPSBcInJldHVyblwiLCB0aGlzLm5leHQgPSBcImVuZFwiKSA6IFwibm9ybWFsXCIgPT09IHJlY29yZC50eXBlICYmIGFmdGVyTG9jICYmICh0aGlzLm5leHQgPSBhZnRlckxvYyksIENvbnRpbnVlU2VudGluZWw7IH0sIGZpbmlzaDogZnVuY3Rpb24gZmluaXNoKGZpbmFsbHlMb2MpIHsgZm9yICh2YXIgaSA9IHRoaXMudHJ5RW50cmllcy5sZW5ndGggLSAxOyBpID49IDA7IC0taSkgeyB2YXIgZW50cnkgPSB0aGlzLnRyeUVudHJpZXNbaV07IGlmIChlbnRyeS5maW5hbGx5TG9jID09PSBmaW5hbGx5TG9jKSByZXR1cm4gdGhpcy5jb21wbGV0ZShlbnRyeS5jb21wbGV0aW9uLCBlbnRyeS5hZnRlckxvYyksIHJlc2V0VHJ5RW50cnkoZW50cnkpLCBDb250aW51ZVNlbnRpbmVsOyB9IH0sIFwiY2F0Y2hcIjogZnVuY3Rpb24gX2NhdGNoKHRyeUxvYykgeyBmb3IgKHZhciBpID0gdGhpcy50cnlFbnRyaWVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7IHZhciBlbnRyeSA9IHRoaXMudHJ5RW50cmllc1tpXTsgaWYgKGVudHJ5LnRyeUxvYyA9PT0gdHJ5TG9jKSB7IHZhciByZWNvcmQgPSBlbnRyeS5jb21wbGV0aW9uOyBpZiAoXCJ0aHJvd1wiID09PSByZWNvcmQudHlwZSkgeyB2YXIgdGhyb3duID0gcmVjb3JkLmFyZzsgcmVzZXRUcnlFbnRyeShlbnRyeSk7IH0gcmV0dXJuIHRocm93bjsgfSB9IHRocm93IG5ldyBFcnJvcihcImlsbGVnYWwgY2F0Y2ggYXR0ZW1wdFwiKTsgfSwgZGVsZWdhdGVZaWVsZDogZnVuY3Rpb24gZGVsZWdhdGVZaWVsZChpdGVyYWJsZSwgcmVzdWx0TmFtZSwgbmV4dExvYykgeyByZXR1cm4gdGhpcy5kZWxlZ2F0ZSA9IHsgaXRlcmF0b3I6IHZhbHVlcyhpdGVyYWJsZSksIHJlc3VsdE5hbWU6IHJlc3VsdE5hbWUsIG5leHRMb2M6IG5leHRMb2MgfSwgXCJuZXh0XCIgPT09IHRoaXMubWV0aG9kICYmICh0aGlzLmFyZyA9IHVuZGVmaW5lZCksIENvbnRpbnVlU2VudGluZWw7IH0gfSwgZXhwb3J0czsgfVxuZnVuY3Rpb24gYXN5bmNHZW5lcmF0b3JTdGVwKGdlbiwgcmVzb2x2ZSwgcmVqZWN0LCBfbmV4dCwgX3Rocm93LCBrZXksIGFyZykgeyB0cnkgeyB2YXIgaW5mbyA9IGdlbltrZXldKGFyZyk7IHZhciB2YWx1ZSA9IGluZm8udmFsdWU7IH0gY2F0Y2ggKGVycm9yKSB7IHJlamVjdChlcnJvcik7IHJldHVybjsgfSBpZiAoaW5mby5kb25lKSB7IHJlc29sdmUodmFsdWUpOyB9IGVsc2UgeyBQcm9taXNlLnJlc29sdmUodmFsdWUpLnRoZW4oX25leHQsIF90aHJvdyk7IH0gfVxuZnVuY3Rpb24gX2FzeW5jVG9HZW5lcmF0b3IoZm4pIHsgcmV0dXJuIGZ1bmN0aW9uICgpIHsgdmFyIHNlbGYgPSB0aGlzLCBhcmdzID0gYXJndW1lbnRzOyByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkgeyB2YXIgZ2VuID0gZm4uYXBwbHkoc2VsZiwgYXJncyk7IGZ1bmN0aW9uIF9uZXh0KHZhbHVlKSB7IGFzeW5jR2VuZXJhdG9yU3RlcChnZW4sIHJlc29sdmUsIHJlamVjdCwgX25leHQsIF90aHJvdywgXCJuZXh0XCIsIHZhbHVlKTsgfSBmdW5jdGlvbiBfdGhyb3coZXJyKSB7IGFzeW5jR2VuZXJhdG9yU3RlcChnZW4sIHJlc29sdmUsIHJlamVjdCwgX25leHQsIF90aHJvdywgXCJ0aHJvd1wiLCBlcnIpOyB9IF9uZXh0KHVuZGVmaW5lZCk7IH0pOyB9OyB9XG5mdW5jdGlvbiBvd25LZXlzKG9iamVjdCwgZW51bWVyYWJsZU9ubHkpIHsgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhvYmplY3QpOyBpZiAoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scykgeyB2YXIgc3ltYm9scyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMob2JqZWN0KTsgZW51bWVyYWJsZU9ubHkgJiYgKHN5bWJvbHMgPSBzeW1ib2xzLmZpbHRlcihmdW5jdGlvbiAoc3ltKSB7IHJldHVybiBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iamVjdCwgc3ltKS5lbnVtZXJhYmxlOyB9KSksIGtleXMucHVzaC5hcHBseShrZXlzLCBzeW1ib2xzKTsgfSByZXR1cm4ga2V5czsgfVxuZnVuY3Rpb24gX29iamVjdFNwcmVhZCh0YXJnZXQpIHsgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHsgdmFyIHNvdXJjZSA9IG51bGwgIT0gYXJndW1lbnRzW2ldID8gYXJndW1lbnRzW2ldIDoge307IGkgJSAyID8gb3duS2V5cyhPYmplY3Qoc291cmNlKSwgITApLmZvckVhY2goZnVuY3Rpb24gKGtleSkgeyBfZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHNvdXJjZVtrZXldKTsgfSkgOiBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycyA/IE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnMoc291cmNlKSkgOiBvd25LZXlzKE9iamVjdChzb3VyY2UpKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHNvdXJjZSwga2V5KSk7IH0pOyB9IHJldHVybiB0YXJnZXQ7IH1cbmZ1bmN0aW9uIF9kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwgdmFsdWUpIHsga2V5ID0gX3RvUHJvcGVydHlLZXkoa2V5KTsgaWYgKGtleSBpbiBvYmopIHsgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwga2V5LCB7IHZhbHVlOiB2YWx1ZSwgZW51bWVyYWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlLCB3cml0YWJsZTogdHJ1ZSB9KTsgfSBlbHNlIHsgb2JqW2tleV0gPSB2YWx1ZTsgfSByZXR1cm4gb2JqOyB9XG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIF90b1Byb3BlcnR5S2V5KGRlc2NyaXB0b3Iua2V5KSwgZGVzY3JpcHRvcik7IH0gfVxuZnVuY3Rpb24gX2NyZWF0ZUNsYXNzKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyBPYmplY3QuZGVmaW5lUHJvcGVydHkoQ29uc3RydWN0b3IsIFwicHJvdG90eXBlXCIsIHsgd3JpdGFibGU6IGZhbHNlIH0pOyByZXR1cm4gQ29uc3RydWN0b3I7IH1cbmZ1bmN0aW9uIF90b1Byb3BlcnR5S2V5KGFyZykgeyB2YXIga2V5ID0gX3RvUHJpbWl0aXZlKGFyZywgXCJzdHJpbmdcIik7IHJldHVybiBfdHlwZW9mKGtleSkgPT09IFwic3ltYm9sXCIgPyBrZXkgOiBTdHJpbmcoa2V5KTsgfVxuZnVuY3Rpb24gX3RvUHJpbWl0aXZlKGlucHV0LCBoaW50KSB7IGlmIChfdHlwZW9mKGlucHV0KSAhPT0gXCJvYmplY3RcIiB8fCBpbnB1dCA9PT0gbnVsbCkgcmV0dXJuIGlucHV0OyB2YXIgcHJpbSA9IGlucHV0W1N5bWJvbC50b1ByaW1pdGl2ZV07IGlmIChwcmltICE9PSB1bmRlZmluZWQpIHsgdmFyIHJlcyA9IHByaW0uY2FsbChpbnB1dCwgaGludCB8fCBcImRlZmF1bHRcIik7IGlmIChfdHlwZW9mKHJlcykgIT09IFwib2JqZWN0XCIpIHJldHVybiByZXM7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJAQHRvUHJpbWl0aXZlIG11c3QgcmV0dXJuIGEgcHJpbWl0aXZlIHZhbHVlLlwiKTsgfSByZXR1cm4gKGhpbnQgPT09IFwic3RyaW5nXCIgPyBTdHJpbmcgOiBOdW1iZXIpKGlucHV0KTsgfVxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09IFwiZnVuY3Rpb25cIiAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvblwiKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eShzdWJDbGFzcywgXCJwcm90b3R5cGVcIiwgeyB3cml0YWJsZTogZmFsc2UgfSk7IGlmIChzdXBlckNsYXNzKSBfc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpOyB9XG5mdW5jdGlvbiBfY3JlYXRlU3VwZXIoRGVyaXZlZCkgeyB2YXIgaGFzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCA9IF9pc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QoKTsgcmV0dXJuIGZ1bmN0aW9uIF9jcmVhdGVTdXBlckludGVybmFsKCkgeyB2YXIgU3VwZXIgPSBfZ2V0UHJvdG90eXBlT2YoRGVyaXZlZCksIHJlc3VsdDsgaWYgKGhhc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QpIHsgdmFyIE5ld1RhcmdldCA9IF9nZXRQcm90b3R5cGVPZih0aGlzKS5jb25zdHJ1Y3RvcjsgcmVzdWx0ID0gUmVmbGVjdC5jb25zdHJ1Y3QoU3VwZXIsIGFyZ3VtZW50cywgTmV3VGFyZ2V0KTsgfSBlbHNlIHsgcmVzdWx0ID0gU3VwZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTsgfSByZXR1cm4gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4odGhpcywgcmVzdWx0KTsgfTsgfVxuZnVuY3Rpb24gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4oc2VsZiwgY2FsbCkgeyBpZiAoY2FsbCAmJiAoX3R5cGVvZihjYWxsKSA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgY2FsbCA9PT0gXCJmdW5jdGlvblwiKSkgeyByZXR1cm4gY2FsbDsgfSBlbHNlIGlmIChjYWxsICE9PSB2b2lkIDApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkRlcml2ZWQgY29uc3RydWN0b3JzIG1heSBvbmx5IHJldHVybiBvYmplY3Qgb3IgdW5kZWZpbmVkXCIpOyB9IHJldHVybiBfYXNzZXJ0VGhpc0luaXRpYWxpemVkKHNlbGYpOyB9XG5mdW5jdGlvbiBfYXNzZXJ0VGhpc0luaXRpYWxpemVkKHNlbGYpIHsgaWYgKHNlbGYgPT09IHZvaWQgMCkgeyB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXCJ0aGlzIGhhc24ndCBiZWVuIGluaXRpYWxpc2VkIC0gc3VwZXIoKSBoYXNuJ3QgYmVlbiBjYWxsZWRcIik7IH0gcmV0dXJuIHNlbGY7IH1cbmZ1bmN0aW9uIF93cmFwTmF0aXZlU3VwZXIoQ2xhc3MpIHsgdmFyIF9jYWNoZSA9IHR5cGVvZiBNYXAgPT09IFwiZnVuY3Rpb25cIiA/IG5ldyBNYXAoKSA6IHVuZGVmaW5lZDsgX3dyYXBOYXRpdmVTdXBlciA9IGZ1bmN0aW9uIF93cmFwTmF0aXZlU3VwZXIoQ2xhc3MpIHsgaWYgKENsYXNzID09PSBudWxsIHx8ICFfaXNOYXRpdmVGdW5jdGlvbihDbGFzcykpIHJldHVybiBDbGFzczsgaWYgKHR5cGVvZiBDbGFzcyAhPT0gXCJmdW5jdGlvblwiKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvblwiKTsgfSBpZiAodHlwZW9mIF9jYWNoZSAhPT0gXCJ1bmRlZmluZWRcIikgeyBpZiAoX2NhY2hlLmhhcyhDbGFzcykpIHJldHVybiBfY2FjaGUuZ2V0KENsYXNzKTsgX2NhY2hlLnNldChDbGFzcywgV3JhcHBlcik7IH0gZnVuY3Rpb24gV3JhcHBlcigpIHsgcmV0dXJuIF9jb25zdHJ1Y3QoQ2xhc3MsIGFyZ3VtZW50cywgX2dldFByb3RvdHlwZU9mKHRoaXMpLmNvbnN0cnVjdG9yKTsgfSBXcmFwcGVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQ2xhc3MucHJvdG90eXBlLCB7IGNvbnN0cnVjdG9yOiB7IHZhbHVlOiBXcmFwcGVyLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyByZXR1cm4gX3NldFByb3RvdHlwZU9mKFdyYXBwZXIsIENsYXNzKTsgfTsgcmV0dXJuIF93cmFwTmF0aXZlU3VwZXIoQ2xhc3MpOyB9XG5mdW5jdGlvbiBfY29uc3RydWN0KFBhcmVudCwgYXJncywgQ2xhc3MpIHsgaWYgKF9pc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QoKSkgeyBfY29uc3RydWN0ID0gUmVmbGVjdC5jb25zdHJ1Y3QuYmluZCgpOyB9IGVsc2UgeyBfY29uc3RydWN0ID0gZnVuY3Rpb24gX2NvbnN0cnVjdChQYXJlbnQsIGFyZ3MsIENsYXNzKSB7IHZhciBhID0gW251bGxdOyBhLnB1c2guYXBwbHkoYSwgYXJncyk7IHZhciBDb25zdHJ1Y3RvciA9IEZ1bmN0aW9uLmJpbmQuYXBwbHkoUGFyZW50LCBhKTsgdmFyIGluc3RhbmNlID0gbmV3IENvbnN0cnVjdG9yKCk7IGlmIChDbGFzcykgX3NldFByb3RvdHlwZU9mKGluc3RhbmNlLCBDbGFzcy5wcm90b3R5cGUpOyByZXR1cm4gaW5zdGFuY2U7IH07IH0gcmV0dXJuIF9jb25zdHJ1Y3QuYXBwbHkobnVsbCwgYXJndW1lbnRzKTsgfVxuZnVuY3Rpb24gX2lzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCgpIHsgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcInVuZGVmaW5lZFwiIHx8ICFSZWZsZWN0LmNvbnN0cnVjdCkgcmV0dXJuIGZhbHNlOyBpZiAoUmVmbGVjdC5jb25zdHJ1Y3Quc2hhbSkgcmV0dXJuIGZhbHNlOyBpZiAodHlwZW9mIFByb3h5ID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiB0cnVlOyB0cnkgeyBCb29sZWFuLnByb3RvdHlwZS52YWx1ZU9mLmNhbGwoUmVmbGVjdC5jb25zdHJ1Y3QoQm9vbGVhbiwgW10sIGZ1bmN0aW9uICgpIHt9KSk7IHJldHVybiB0cnVlOyB9IGNhdGNoIChlKSB7IHJldHVybiBmYWxzZTsgfSB9XG5mdW5jdGlvbiBfaXNOYXRpdmVGdW5jdGlvbihmbikgeyByZXR1cm4gRnVuY3Rpb24udG9TdHJpbmcuY2FsbChmbikuaW5kZXhPZihcIltuYXRpdmUgY29kZV1cIikgIT09IC0xOyB9XG5mdW5jdGlvbiBfc2V0UHJvdG90eXBlT2YobywgcCkgeyBfc2V0UHJvdG90eXBlT2YgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3Quc2V0UHJvdG90eXBlT2YuYmluZCgpIDogZnVuY3Rpb24gX3NldFByb3RvdHlwZU9mKG8sIHApIHsgby5fX3Byb3RvX18gPSBwOyByZXR1cm4gbzsgfTsgcmV0dXJuIF9zZXRQcm90b3R5cGVPZihvLCBwKTsgfVxuZnVuY3Rpb24gX2dldFByb3RvdHlwZU9mKG8pIHsgX2dldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LmdldFByb3RvdHlwZU9mLmJpbmQoKSA6IGZ1bmN0aW9uIF9nZXRQcm90b3R5cGVPZihvKSB7IHJldHVybiBvLl9fcHJvdG9fXyB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2Yobyk7IH07IHJldHVybiBfZ2V0UHJvdG90eXBlT2Yobyk7IH1cbmZ1bmN0aW9uIF9hd2FpdEFzeW5jR2VuZXJhdG9yKHZhbHVlKSB7IHJldHVybiBuZXcgX092ZXJsb2FkWWllbGQodmFsdWUsIDApOyB9XG5mdW5jdGlvbiBfd3JhcEFzeW5jR2VuZXJhdG9yKGZuKSB7IHJldHVybiBmdW5jdGlvbiAoKSB7IHJldHVybiBuZXcgX0FzeW5jR2VuZXJhdG9yKGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykpOyB9OyB9XG5mdW5jdGlvbiBfQXN5bmNHZW5lcmF0b3IoZ2VuKSB7IHZhciBmcm9udCwgYmFjazsgZnVuY3Rpb24gcmVzdW1lKGtleSwgYXJnKSB7IHRyeSB7IHZhciByZXN1bHQgPSBnZW5ba2V5XShhcmcpLCB2YWx1ZSA9IHJlc3VsdC52YWx1ZSwgb3ZlcmxvYWRlZCA9IHZhbHVlIGluc3RhbmNlb2YgX092ZXJsb2FkWWllbGQ7IFByb21pc2UucmVzb2x2ZShvdmVybG9hZGVkID8gdmFsdWUudiA6IHZhbHVlKS50aGVuKGZ1bmN0aW9uIChhcmcpIHsgaWYgKG92ZXJsb2FkZWQpIHsgdmFyIG5leHRLZXkgPSBcInJldHVyblwiID09PSBrZXkgPyBcInJldHVyblwiIDogXCJuZXh0XCI7IGlmICghdmFsdWUuayB8fCBhcmcuZG9uZSkgcmV0dXJuIHJlc3VtZShuZXh0S2V5LCBhcmcpOyBhcmcgPSBnZW5bbmV4dEtleV0oYXJnKS52YWx1ZTsgfSBzZXR0bGUocmVzdWx0LmRvbmUgPyBcInJldHVyblwiIDogXCJub3JtYWxcIiwgYXJnKTsgfSwgZnVuY3Rpb24gKGVycikgeyByZXN1bWUoXCJ0aHJvd1wiLCBlcnIpOyB9KTsgfSBjYXRjaCAoZXJyKSB7IHNldHRsZShcInRocm93XCIsIGVycik7IH0gfSBmdW5jdGlvbiBzZXR0bGUodHlwZSwgdmFsdWUpIHsgc3dpdGNoICh0eXBlKSB7IGNhc2UgXCJyZXR1cm5cIjogZnJvbnQucmVzb2x2ZSh7IHZhbHVlOiB2YWx1ZSwgZG9uZTogITAgfSk7IGJyZWFrOyBjYXNlIFwidGhyb3dcIjogZnJvbnQucmVqZWN0KHZhbHVlKTsgYnJlYWs7IGRlZmF1bHQ6IGZyb250LnJlc29sdmUoeyB2YWx1ZTogdmFsdWUsIGRvbmU6ICExIH0pOyB9IChmcm9udCA9IGZyb250Lm5leHQpID8gcmVzdW1lKGZyb250LmtleSwgZnJvbnQuYXJnKSA6IGJhY2sgPSBudWxsOyB9IHRoaXMuX2ludm9rZSA9IGZ1bmN0aW9uIChrZXksIGFyZykgeyByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkgeyB2YXIgcmVxdWVzdCA9IHsga2V5OiBrZXksIGFyZzogYXJnLCByZXNvbHZlOiByZXNvbHZlLCByZWplY3Q6IHJlamVjdCwgbmV4dDogbnVsbCB9OyBiYWNrID8gYmFjayA9IGJhY2submV4dCA9IHJlcXVlc3QgOiAoZnJvbnQgPSBiYWNrID0gcmVxdWVzdCwgcmVzdW1lKGtleSwgYXJnKSk7IH0pOyB9LCBcImZ1bmN0aW9uXCIgIT0gdHlwZW9mIGdlbltcInJldHVyblwiXSAmJiAodGhpc1tcInJldHVyblwiXSA9IHZvaWQgMCk7IH1cbl9Bc3luY0dlbmVyYXRvci5wcm90b3R5cGVbXCJmdW5jdGlvblwiID09IHR5cGVvZiBTeW1ib2wgJiYgU3ltYm9sLmFzeW5jSXRlcmF0b3IgfHwgXCJAQGFzeW5jSXRlcmF0b3JcIl0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzOyB9LCBfQXN5bmNHZW5lcmF0b3IucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbiAoYXJnKSB7IHJldHVybiB0aGlzLl9pbnZva2UoXCJuZXh0XCIsIGFyZyk7IH0sIF9Bc3luY0dlbmVyYXRvci5wcm90b3R5cGVbXCJ0aHJvd1wiXSA9IGZ1bmN0aW9uIChhcmcpIHsgcmV0dXJuIHRoaXMuX2ludm9rZShcInRocm93XCIsIGFyZyk7IH0sIF9Bc3luY0dlbmVyYXRvci5wcm90b3R5cGVbXCJyZXR1cm5cIl0gPSBmdW5jdGlvbiAoYXJnKSB7IHJldHVybiB0aGlzLl9pbnZva2UoXCJyZXR1cm5cIiwgYXJnKTsgfTtcbmZ1bmN0aW9uIF9PdmVybG9hZFlpZWxkKHZhbHVlLCBraW5kKSB7IHRoaXMudiA9IHZhbHVlLCB0aGlzLmsgPSBraW5kOyB9IC8qXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBDb3B5cmlnaHQgMjAyMCAtIDIwMjQgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICogICAgICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICovXG52YXIgV2lkZ2V0QXBpUmVzcG9uc2VFcnJvciA9IC8qI19fUFVSRV9fKi9mdW5jdGlvbiAoX0Vycm9yKSB7XG4gIF9pbmhlcml0cyhXaWRnZXRBcGlSZXNwb25zZUVycm9yLCBfRXJyb3IpO1xuICB2YXIgX3N1cGVyID0gX2NyZWF0ZVN1cGVyKFdpZGdldEFwaVJlc3BvbnNlRXJyb3IpO1xuICBmdW5jdGlvbiBXaWRnZXRBcGlSZXNwb25zZUVycm9yKG1lc3NhZ2UsIGRhdGEpIHtcbiAgICB2YXIgX3RoaXMyO1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBXaWRnZXRBcGlSZXNwb25zZUVycm9yKTtcbiAgICBfdGhpczIgPSBfc3VwZXIuY2FsbCh0aGlzLCBtZXNzYWdlKTtcbiAgICBfdGhpczIuZGF0YSA9IGRhdGE7XG4gICAgcmV0dXJuIF90aGlzMjtcbiAgfVxuICByZXR1cm4gX2NyZWF0ZUNsYXNzKFdpZGdldEFwaVJlc3BvbnNlRXJyb3IpO1xufSggLyojX19QVVJFX18qL193cmFwTmF0aXZlU3VwZXIoRXJyb3IpKTtcbi8qKlxuICogQVBJIGhhbmRsZXIgZm9yIHdpZGdldHMuIFRoaXMgcmFpc2VzIGV2ZW50cyBmb3IgZWFjaCBhY3Rpb25cbiAqIHJlY2VpdmVkIGFzIGBhY3Rpb246JHthY3Rpb259YCAoZWc6IFwiYWN0aW9uOnNjcmVlbnNob3RcIikuXG4gKiBEZWZhdWx0IGhhbmRsaW5nIGNhbiBiZSBwcmV2ZW50ZWQgYnkgdXNpbmcgcHJldmVudERlZmF1bHQoKVxuICogb24gdGhlIHJhaXNlZCBldmVudC4gVGhlIGRlZmF1bHQgaGFuZGxpbmcgdmFyaWVzIGZvciBlYWNoXG4gKiBhY3Rpb246IG9uZXMgd2hpY2ggdGhlIFNESyBjYW4gaGFuZGxlIHNhZmVseSBhcmUgYWNrbm93bGVkZ2VkXG4gKiBhcHByb3ByaWF0ZWx5IGFuZCBvbmVzIHdoaWNoIGFyZSB1bmhhbmRsZWQgKGN1c3RvbSBvciByZXF1aXJlXG4gKiB0aGUgd2lkZ2V0IHRvIGRvIHNvbWV0aGluZykgYXJlIHJlamVjdGVkIHdpdGggYW4gZXJyb3IuXG4gKlxuICogRXZlbnRzIHdoaWNoIGFyZSBwcmV2ZW50RGVmYXVsdCgpZWQgbXVzdCByZXBseSB1c2luZyB0aGVcbiAqIHRyYW5zcG9ydC4gVGhlIGV2ZW50cyByYWlzZWQgd2lsbCBoYXZlIGEgZGV0YWlsIG9mIGFuXG4gKiBJV2lkZ2V0QXBpUmVxdWVzdCBpbnRlcmZhY2UuXG4gKlxuICogV2hlbiB0aGUgV2lkZ2V0QXBpIGlzIHJlYWR5IHRvIHN0YXJ0IHNlbmRpbmcgcmVxdWVzdHMsIGl0IHdpbGxcbiAqIHJhaXNlIGEgXCJyZWFkeVwiIEN1c3RvbUV2ZW50LiBBZnRlciB0aGUgcmVhZHkgZXZlbnQgZmlyZXMsIGFjdGlvbnNcbiAqIGNhbiBiZSBzZW50IGFuZCB0aGUgdHJhbnNwb3J0IHdpbGwgYmUgcmVhZHkuXG4gKi9cbmV4cG9ydHMuV2lkZ2V0QXBpUmVzcG9uc2VFcnJvciA9IFdpZGdldEFwaVJlc3BvbnNlRXJyb3I7XG5XaWRnZXRBcGlSZXNwb25zZUVycm9yLnByb3RvdHlwZS5uYW1lID0gV2lkZ2V0QXBpUmVzcG9uc2VFcnJvci5uYW1lO1xudmFyIFdpZGdldEFwaSA9IC8qI19fUFVSRV9fKi9mdW5jdGlvbiAoX0V2ZW50RW1pdHRlcikge1xuICBfaW5oZXJpdHMoV2lkZ2V0QXBpLCBfRXZlbnRFbWl0dGVyKTtcbiAgdmFyIF9zdXBlcjIgPSBfY3JlYXRlU3VwZXIoV2lkZ2V0QXBpKTtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgQVBJIGhhbmRsZXIgZm9yIHRoZSBnaXZlbiB3aWRnZXQuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB3aWRnZXRJZCBUaGUgd2lkZ2V0IElEIHRvIGxpc3RlbiBmb3IuIElmIG5vdCBzdXBwbGllZCB0aGVuXG4gICAqIHRoZSBBUEkgd2lsbCB1c2UgdGhlIHdpZGdldCBJRCBmcm9tIHRoZSBmaXJzdCB2YWxpZCByZXF1ZXN0IGl0IHJlY2VpdmVzLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gY2xpZW50T3JpZ2luIFRoZSBvcmlnaW4gb2YgdGhlIGNsaWVudCwgb3IgbnVsbCBpZiBub3Qga25vd24uXG4gICAqL1xuICBmdW5jdGlvbiBXaWRnZXRBcGkoKSB7XG4gICAgdmFyIF90aGlzMztcbiAgICB2YXIgd2lkZ2V0SWQgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IG51bGw7XG4gICAgdmFyIGNsaWVudE9yaWdpbiA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDogbnVsbDtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgV2lkZ2V0QXBpKTtcbiAgICBfdGhpczMgPSBfc3VwZXIyLmNhbGwodGhpcyk7XG4gICAgX3RoaXMzLmNsaWVudE9yaWdpbiA9IGNsaWVudE9yaWdpbjtcbiAgICBfZGVmaW5lUHJvcGVydHkoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpczMpLCBcInRyYW5zcG9ydFwiLCB2b2lkIDApO1xuICAgIF9kZWZpbmVQcm9wZXJ0eShfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzMyksIFwiY2FwYWJpbGl0aWVzRmluaXNoZWRcIiwgZmFsc2UpO1xuICAgIF9kZWZpbmVQcm9wZXJ0eShfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzMyksIFwic3VwcG9ydHNNU0MyOTc0UmVuZWdvdGlhdGVcIiwgZmFsc2UpO1xuICAgIF9kZWZpbmVQcm9wZXJ0eShfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzMyksIFwicmVxdWVzdGVkQ2FwYWJpbGl0aWVzXCIsIFtdKTtcbiAgICBfZGVmaW5lUHJvcGVydHkoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpczMpLCBcImFwcHJvdmVkQ2FwYWJpbGl0aWVzXCIsIHZvaWQgMCk7XG4gICAgX2RlZmluZVByb3BlcnR5KF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMzKSwgXCJjYWNoZWRDbGllbnRWZXJzaW9uc1wiLCB2b2lkIDApO1xuICAgIF9kZWZpbmVQcm9wZXJ0eShfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzMyksIFwidHVyblNlcnZlcldhdGNoZXJzXCIsIDApO1xuICAgIGlmICghd2luZG93LnBhcmVudCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gcGFyZW50IHdpbmRvdy4gVGhpcyB3aWRnZXQgZG9lc24ndCBhcHBlYXIgdG8gYmUgZW1iZWRkZWQgcHJvcGVybHkuXCIpO1xuICAgIH1cbiAgICBfdGhpczMudHJhbnNwb3J0ID0gbmV3IF9Qb3N0bWVzc2FnZVRyYW5zcG9ydC5Qb3N0bWVzc2FnZVRyYW5zcG9ydChfV2lkZ2V0QXBpRGlyZWN0aW9uLldpZGdldEFwaURpcmVjdGlvbi5Gcm9tV2lkZ2V0LCB3aWRnZXRJZCwgd2luZG93LnBhcmVudCwgd2luZG93KTtcbiAgICBfdGhpczMudHJhbnNwb3J0LnRhcmdldE9yaWdpbiA9IGNsaWVudE9yaWdpbjtcbiAgICBfdGhpczMudHJhbnNwb3J0Lm9uKFwibWVzc2FnZVwiLCBfdGhpczMuaGFuZGxlTWVzc2FnZS5iaW5kKF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMzKSkpO1xuICAgIHJldHVybiBfdGhpczM7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyBpZiB0aGUgd2lkZ2V0IHdhcyBncmFudGVkIGEgcGFydGljdWxhciBjYXBhYmlsaXR5LiBOb3RlIHRoYXQgb25cbiAgICogY2xpZW50cyB3aGVyZSB0aGUgY2FwYWJpbGl0aWVzIGFyZSBub3QgZmVkIGJhY2sgdG8gdGhlIHdpZGdldCB0aGlzIGZ1bmN0aW9uXG4gICAqIHdpbGwgcmVseSBvbiByZXF1ZXN0ZWQgY2FwYWJpbGl0aWVzIGluc3RlYWQuXG4gICAqIEBwYXJhbSB7Q2FwYWJpbGl0eX0gY2FwYWJpbGl0eSBUaGUgY2FwYWJpbGl0eSB0byBjaGVjayBmb3IgYXBwcm92YWwgb2YuXG4gICAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHRoZSB3aWRnZXQgaGFzIGFwcHJvdmFsIGZvciB0aGUgZ2l2ZW4gY2FwYWJpbGl0eS5cbiAgICovXG4gIF9jcmVhdGVDbGFzcyhXaWRnZXRBcGksIFt7XG4gICAga2V5OiBcImhhc0NhcGFiaWxpdHlcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gaGFzQ2FwYWJpbGl0eShjYXBhYmlsaXR5KSB7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheSh0aGlzLmFwcHJvdmVkQ2FwYWJpbGl0aWVzKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcHByb3ZlZENhcGFiaWxpdGllcy5pbmNsdWRlcyhjYXBhYmlsaXR5KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLnJlcXVlc3RlZENhcGFiaWxpdGllcy5pbmNsdWRlcyhjYXBhYmlsaXR5KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0IGEgY2FwYWJpbGl0eSBmcm9tIHRoZSBjbGllbnQuIEl0IGlzIG5vdCBndWFyYW50ZWVkIHRvIGJlIGFsbG93ZWQsXG4gICAgICogYnV0IHdpbGwgYmUgYXNrZWQgZm9yLlxuICAgICAqIEBwYXJhbSB7Q2FwYWJpbGl0eX0gY2FwYWJpbGl0eSBUaGUgY2FwYWJpbGl0eSB0byByZXF1ZXN0LlxuICAgICAqIEB0aHJvd3MgVGhyb3dzIGlmIHRoZSBjYXBhYmlsaXRpZXMgbmVnb3RpYXRpb24gaGFzIGFscmVhZHkgc3RhcnRlZCBhbmQgdGhlXG4gICAgICogd2lkZ2V0IGlzIHVuYWJsZSB0byByZXF1ZXN0IGFkZGl0aW9uYWwgY2FwYWJpbGl0aWVzLlxuICAgICAqL1xuICB9LCB7XG4gICAga2V5OiBcInJlcXVlc3RDYXBhYmlsaXR5XCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHJlcXVlc3RDYXBhYmlsaXR5KGNhcGFiaWxpdHkpIHtcbiAgICAgIGlmICh0aGlzLmNhcGFiaWxpdGllc0ZpbmlzaGVkICYmICF0aGlzLnN1cHBvcnRzTVNDMjk3NFJlbmVnb3RpYXRlKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhcGFiaWxpdGllcyBoYXZlIGFscmVhZHkgYmVlbiBuZWdvdGlhdGVkXCIpO1xuICAgICAgfVxuICAgICAgdGhpcy5yZXF1ZXN0ZWRDYXBhYmlsaXRpZXMucHVzaChjYXBhYmlsaXR5KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0IGNhcGFiaWxpdGllcyBmcm9tIHRoZSBjbGllbnQuIFRoZXkgYXJlIG5vdCBndWFyYW50ZWVkIHRvIGJlIGFsbG93ZWQsXG4gICAgICogYnV0IHdpbGwgYmUgYXNrZWQgZm9yIGlmIHRoZSBuZWdvdGlhdGlvbiBoYXMgbm90IGFscmVhZHkgaGFwcGVuZWQuXG4gICAgICogQHBhcmFtIHtDYXBhYmlsaXR5W119IGNhcGFiaWxpdGllcyBUaGUgY2FwYWJpbGl0aWVzIHRvIHJlcXVlc3QuXG4gICAgICogQHRocm93cyBUaHJvd3MgaWYgdGhlIGNhcGFiaWxpdGllcyBuZWdvdGlhdGlvbiBoYXMgYWxyZWFkeSBzdGFydGVkLlxuICAgICAqL1xuICB9LCB7XG4gICAga2V5OiBcInJlcXVlc3RDYXBhYmlsaXRpZXNcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gcmVxdWVzdENhcGFiaWxpdGllcyhjYXBhYmlsaXRpZXMpIHtcbiAgICAgIHZhciBfdGhpczQgPSB0aGlzO1xuICAgICAgY2FwYWJpbGl0aWVzLmZvckVhY2goZnVuY3Rpb24gKGNhcCkge1xuICAgICAgICByZXR1cm4gX3RoaXM0LnJlcXVlc3RDYXBhYmlsaXR5KGNhcCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0cyB0aGUgY2FwYWJpbGl0eSB0byBpbnRlcmFjdCB3aXRoIHJvb21zIG90aGVyIHRoYW4gdGhlIHVzZXIncyBjdXJyZW50bHlcbiAgICAgKiB2aWV3ZWQgcm9vbS4gQXBwbGllcyB0byBldmVudCByZWNlaXZpbmcgYW5kIHNlbmRpbmcuXG4gICAgICogQHBhcmFtIHtzdHJpbmcgfCBTeW1ib2xzLkFueVJvb219IHJvb21JZCBUaGUgcm9vbSBJRCwgb3IgYFN5bWJvbHMuQW55Um9vbWAgdG9cbiAgICAgKiBkZW5vdGUgYWxsIGtub3duIHJvb21zLlxuICAgICAqL1xuICB9LCB7XG4gICAga2V5OiBcInJlcXVlc3RDYXBhYmlsaXR5Rm9yUm9vbVRpbWVsaW5lXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHJlcXVlc3RDYXBhYmlsaXR5Rm9yUm9vbVRpbWVsaW5lKHJvb21JZCkge1xuICAgICAgdGhpcy5yZXF1ZXN0Q2FwYWJpbGl0eShcIm9yZy5tYXRyaXgubXNjMjc2Mi50aW1lbGluZTpcIi5jb25jYXQocm9vbUlkKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVxdWVzdHMgdGhlIGNhcGFiaWxpdHkgdG8gc2VuZCBhIGdpdmVuIHN0YXRlIGV2ZW50IHdpdGggb3B0aW9uYWwgZXhwbGljaXRcbiAgICAgKiBzdGF0ZSBrZXkuIEl0IGlzIG5vdCBndWFyYW50ZWVkIHRvIGJlIGFsbG93ZWQsIGJ1dCB3aWxsIGJlIGFza2VkIGZvciBpZiB0aGVcbiAgICAgKiBuZWdvdGlhdGlvbiBoYXMgbm90IGFscmVhZHkgaGFwcGVuZWQuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50VHlwZSBUaGUgc3RhdGUgZXZlbnQgdHlwZSB0byBhc2sgZm9yLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzdGF0ZUtleSBJZiBzcGVjaWZpZWQsIHRoZSBzcGVjaWZpYyBzdGF0ZSBrZXkgdG8gcmVxdWVzdC5cbiAgICAgKiBPdGhlcndpc2UgYWxsIHN0YXRlIGtleXMgd2lsbCBiZSByZXF1ZXN0ZWQuXG4gICAgICovXG4gIH0sIHtcbiAgICBrZXk6IFwicmVxdWVzdENhcGFiaWxpdHlUb1NlbmRTdGF0ZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiByZXF1ZXN0Q2FwYWJpbGl0eVRvU2VuZFN0YXRlKGV2ZW50VHlwZSwgc3RhdGVLZXkpIHtcbiAgICAgIHRoaXMucmVxdWVzdENhcGFiaWxpdHkoX1dpZGdldEV2ZW50Q2FwYWJpbGl0eS5XaWRnZXRFdmVudENhcGFiaWxpdHkuZm9yU3RhdGVFdmVudChfV2lkZ2V0RXZlbnRDYXBhYmlsaXR5LkV2ZW50RGlyZWN0aW9uLlNlbmQsIGV2ZW50VHlwZSwgc3RhdGVLZXkpLnJhdyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVxdWVzdHMgdGhlIGNhcGFiaWxpdHkgdG8gcmVjZWl2ZSBhIGdpdmVuIHN0YXRlIGV2ZW50IHdpdGggb3B0aW9uYWwgZXhwbGljaXRcbiAgICAgKiBzdGF0ZSBrZXkuIEl0IGlzIG5vdCBndWFyYW50ZWVkIHRvIGJlIGFsbG93ZWQsIGJ1dCB3aWxsIGJlIGFza2VkIGZvciBpZiB0aGVcbiAgICAgKiBuZWdvdGlhdGlvbiBoYXMgbm90IGFscmVhZHkgaGFwcGVuZWQuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50VHlwZSBUaGUgc3RhdGUgZXZlbnQgdHlwZSB0byBhc2sgZm9yLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzdGF0ZUtleSBJZiBzcGVjaWZpZWQsIHRoZSBzcGVjaWZpYyBzdGF0ZSBrZXkgdG8gcmVxdWVzdC5cbiAgICAgKiBPdGhlcndpc2UgYWxsIHN0YXRlIGtleXMgd2lsbCBiZSByZXF1ZXN0ZWQuXG4gICAgICovXG4gIH0sIHtcbiAgICBrZXk6IFwicmVxdWVzdENhcGFiaWxpdHlUb1JlY2VpdmVTdGF0ZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiByZXF1ZXN0Q2FwYWJpbGl0eVRvUmVjZWl2ZVN0YXRlKGV2ZW50VHlwZSwgc3RhdGVLZXkpIHtcbiAgICAgIHRoaXMucmVxdWVzdENhcGFiaWxpdHkoX1dpZGdldEV2ZW50Q2FwYWJpbGl0eS5XaWRnZXRFdmVudENhcGFiaWxpdHkuZm9yU3RhdGVFdmVudChfV2lkZ2V0RXZlbnRDYXBhYmlsaXR5LkV2ZW50RGlyZWN0aW9uLlJlY2VpdmUsIGV2ZW50VHlwZSwgc3RhdGVLZXkpLnJhdyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVxdWVzdHMgdGhlIGNhcGFiaWxpdHkgdG8gc2VuZCBhIGdpdmVuIHRvLWRldmljZSBldmVudC4gSXQgaXMgbm90XG4gICAgICogZ3VhcmFudGVlZCB0byBiZSBhbGxvd2VkLCBidXQgd2lsbCBiZSBhc2tlZCBmb3IgaWYgdGhlIG5lZ290aWF0aW9uIGhhc1xuICAgICAqIG5vdCBhbHJlYWR5IGhhcHBlbmVkLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFR5cGUgVGhlIHJvb20gZXZlbnQgdHlwZSB0byBhc2sgZm9yLlxuICAgICAqL1xuICB9LCB7XG4gICAga2V5OiBcInJlcXVlc3RDYXBhYmlsaXR5VG9TZW5kVG9EZXZpY2VcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gcmVxdWVzdENhcGFiaWxpdHlUb1NlbmRUb0RldmljZShldmVudFR5cGUpIHtcbiAgICAgIHRoaXMucmVxdWVzdENhcGFiaWxpdHkoX1dpZGdldEV2ZW50Q2FwYWJpbGl0eS5XaWRnZXRFdmVudENhcGFiaWxpdHkuZm9yVG9EZXZpY2VFdmVudChfV2lkZ2V0RXZlbnRDYXBhYmlsaXR5LkV2ZW50RGlyZWN0aW9uLlNlbmQsIGV2ZW50VHlwZSkucmF3KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0cyB0aGUgY2FwYWJpbGl0eSB0byByZWNlaXZlIGEgZ2l2ZW4gdG8tZGV2aWNlIGV2ZW50LiBJdCBpcyBub3RcbiAgICAgKiBndWFyYW50ZWVkIHRvIGJlIGFsbG93ZWQsIGJ1dCB3aWxsIGJlIGFza2VkIGZvciBpZiB0aGUgbmVnb3RpYXRpb24gaGFzXG4gICAgICogbm90IGFscmVhZHkgaGFwcGVuZWQuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50VHlwZSBUaGUgcm9vbSBldmVudCB0eXBlIHRvIGFzayBmb3IuXG4gICAgICovXG4gIH0sIHtcbiAgICBrZXk6IFwicmVxdWVzdENhcGFiaWxpdHlUb1JlY2VpdmVUb0RldmljZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiByZXF1ZXN0Q2FwYWJpbGl0eVRvUmVjZWl2ZVRvRGV2aWNlKGV2ZW50VHlwZSkge1xuICAgICAgdGhpcy5yZXF1ZXN0Q2FwYWJpbGl0eShfV2lkZ2V0RXZlbnRDYXBhYmlsaXR5LldpZGdldEV2ZW50Q2FwYWJpbGl0eS5mb3JUb0RldmljZUV2ZW50KF9XaWRnZXRFdmVudENhcGFiaWxpdHkuRXZlbnREaXJlY3Rpb24uUmVjZWl2ZSwgZXZlbnRUeXBlKS5yYXcpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlcXVlc3RzIHRoZSBjYXBhYmlsaXR5IHRvIHNlbmQgYSBnaXZlbiByb29tIGV2ZW50LiBJdCBpcyBub3QgZ3VhcmFudGVlZCB0byBiZVxuICAgICAqIGFsbG93ZWQsIGJ1dCB3aWxsIGJlIGFza2VkIGZvciBpZiB0aGUgbmVnb3RpYXRpb24gaGFzIG5vdCBhbHJlYWR5IGhhcHBlbmVkLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFR5cGUgVGhlIHJvb20gZXZlbnQgdHlwZSB0byBhc2sgZm9yLlxuICAgICAqL1xuICB9LCB7XG4gICAga2V5OiBcInJlcXVlc3RDYXBhYmlsaXR5VG9TZW5kRXZlbnRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gcmVxdWVzdENhcGFiaWxpdHlUb1NlbmRFdmVudChldmVudFR5cGUpIHtcbiAgICAgIHRoaXMucmVxdWVzdENhcGFiaWxpdHkoX1dpZGdldEV2ZW50Q2FwYWJpbGl0eS5XaWRnZXRFdmVudENhcGFiaWxpdHkuZm9yUm9vbUV2ZW50KF9XaWRnZXRFdmVudENhcGFiaWxpdHkuRXZlbnREaXJlY3Rpb24uU2VuZCwgZXZlbnRUeXBlKS5yYXcpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlcXVlc3RzIHRoZSBjYXBhYmlsaXR5IHRvIHJlY2VpdmUgYSBnaXZlbiByb29tIGV2ZW50LiBJdCBpcyBub3QgZ3VhcmFudGVlZCB0byBiZVxuICAgICAqIGFsbG93ZWQsIGJ1dCB3aWxsIGJlIGFza2VkIGZvciBpZiB0aGUgbmVnb3RpYXRpb24gaGFzIG5vdCBhbHJlYWR5IGhhcHBlbmVkLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFR5cGUgVGhlIHJvb20gZXZlbnQgdHlwZSB0byBhc2sgZm9yLlxuICAgICAqL1xuICB9LCB7XG4gICAga2V5OiBcInJlcXVlc3RDYXBhYmlsaXR5VG9SZWNlaXZlRXZlbnRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gcmVxdWVzdENhcGFiaWxpdHlUb1JlY2VpdmVFdmVudChldmVudFR5cGUpIHtcbiAgICAgIHRoaXMucmVxdWVzdENhcGFiaWxpdHkoX1dpZGdldEV2ZW50Q2FwYWJpbGl0eS5XaWRnZXRFdmVudENhcGFiaWxpdHkuZm9yUm9vbUV2ZW50KF9XaWRnZXRFdmVudENhcGFiaWxpdHkuRXZlbnREaXJlY3Rpb24uUmVjZWl2ZSwgZXZlbnRUeXBlKS5yYXcpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlcXVlc3RzIHRoZSBjYXBhYmlsaXR5IHRvIHNlbmQgYSBnaXZlbiBtZXNzYWdlIGV2ZW50IHdpdGggb3B0aW9uYWwgZXhwbGljaXRcbiAgICAgKiBgbXNndHlwZWAuIEl0IGlzIG5vdCBndWFyYW50ZWVkIHRvIGJlIGFsbG93ZWQsIGJ1dCB3aWxsIGJlIGFza2VkIGZvciBpZiB0aGVcbiAgICAgKiBuZWdvdGlhdGlvbiBoYXMgbm90IGFscmVhZHkgaGFwcGVuZWQuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG1zZ3R5cGUgSWYgc3BlY2lmaWVkLCB0aGUgc3BlY2lmaWMgbXNndHlwZSB0byByZXF1ZXN0LlxuICAgICAqIE90aGVyd2lzZSBhbGwgbWVzc2FnZSB0eXBlcyB3aWxsIGJlIHJlcXVlc3RlZC5cbiAgICAgKi9cbiAgfSwge1xuICAgIGtleTogXCJyZXF1ZXN0Q2FwYWJpbGl0eVRvU2VuZE1lc3NhZ2VcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gcmVxdWVzdENhcGFiaWxpdHlUb1NlbmRNZXNzYWdlKG1zZ3R5cGUpIHtcbiAgICAgIHRoaXMucmVxdWVzdENhcGFiaWxpdHkoX1dpZGdldEV2ZW50Q2FwYWJpbGl0eS5XaWRnZXRFdmVudENhcGFiaWxpdHkuZm9yUm9vbU1lc3NhZ2VFdmVudChfV2lkZ2V0RXZlbnRDYXBhYmlsaXR5LkV2ZW50RGlyZWN0aW9uLlNlbmQsIG1zZ3R5cGUpLnJhdyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVxdWVzdHMgdGhlIGNhcGFiaWxpdHkgdG8gcmVjZWl2ZSBhIGdpdmVuIG1lc3NhZ2UgZXZlbnQgd2l0aCBvcHRpb25hbCBleHBsaWNpdFxuICAgICAqIGBtc2d0eXBlYC4gSXQgaXMgbm90IGd1YXJhbnRlZWQgdG8gYmUgYWxsb3dlZCwgYnV0IHdpbGwgYmUgYXNrZWQgZm9yIGlmIHRoZVxuICAgICAqIG5lZ290aWF0aW9uIGhhcyBub3QgYWxyZWFkeSBoYXBwZW5lZC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbXNndHlwZSBJZiBzcGVjaWZpZWQsIHRoZSBzcGVjaWZpYyBtc2d0eXBlIHRvIHJlcXVlc3QuXG4gICAgICogT3RoZXJ3aXNlIGFsbCBtZXNzYWdlIHR5cGVzIHdpbGwgYmUgcmVxdWVzdGVkLlxuICAgICAqL1xuICB9LCB7XG4gICAga2V5OiBcInJlcXVlc3RDYXBhYmlsaXR5VG9SZWNlaXZlTWVzc2FnZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiByZXF1ZXN0Q2FwYWJpbGl0eVRvUmVjZWl2ZU1lc3NhZ2UobXNndHlwZSkge1xuICAgICAgdGhpcy5yZXF1ZXN0Q2FwYWJpbGl0eShfV2lkZ2V0RXZlbnRDYXBhYmlsaXR5LldpZGdldEV2ZW50Q2FwYWJpbGl0eS5mb3JSb29tTWVzc2FnZUV2ZW50KF9XaWRnZXRFdmVudENhcGFiaWxpdHkuRXZlbnREaXJlY3Rpb24uUmVjZWl2ZSwgbXNndHlwZSkucmF3KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0cyB0aGUgY2FwYWJpbGl0eSB0byByZWNlaXZlIGEgZ2l2ZW4gaXRlbSBpbiByb29tIGFjY291bnQgZGF0YS4gSXQgaXMgbm90IGd1YXJhbnRlZWQgdG8gYmVcbiAgICAgKiBhbGxvd2VkLCBidXQgd2lsbCBiZSBhc2tlZCBmb3IgaWYgdGhlIG5lZ290aWF0aW9uIGhhcyBub3QgYWxyZWFkeSBoYXBwZW5lZC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRUeXBlIFRoZSBzdGF0ZSBldmVudCB0eXBlIHRvIGFzayBmb3IuXG4gICAgICovXG4gIH0sIHtcbiAgICBrZXk6IFwicmVxdWVzdENhcGFiaWxpdHlUb1JlY2VpdmVSb29tQWNjb3VudERhdGFcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gcmVxdWVzdENhcGFiaWxpdHlUb1JlY2VpdmVSb29tQWNjb3VudERhdGEoZXZlbnRUeXBlKSB7XG4gICAgICB0aGlzLnJlcXVlc3RDYXBhYmlsaXR5KF9XaWRnZXRFdmVudENhcGFiaWxpdHkuV2lkZ2V0RXZlbnRDYXBhYmlsaXR5LmZvclJvb21BY2NvdW50RGF0YShfV2lkZ2V0RXZlbnRDYXBhYmlsaXR5LkV2ZW50RGlyZWN0aW9uLlJlY2VpdmUsIGV2ZW50VHlwZSkucmF3KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0cyBhbiBPcGVuSUQgQ29ubmVjdCB0b2tlbiBmcm9tIHRoZSBjbGllbnQgZm9yIHRoZSBjdXJyZW50bHkgbG9nZ2VkIGluXG4gICAgICogdXNlci4gVGhpcyB0b2tlbiBjYW4gYmUgdmFsaWRhdGVkIHNlcnZlci1zaWRlIHdpdGggdGhlIGZlZGVyYXRpb24gQVBJLiBOb3RlXG4gICAgICogdGhhdCB0aGUgd2lkZ2V0IGlzIHJlc3BvbnNpYmxlIGZvciB2YWxpZGF0aW5nIHRoZSB0b2tlbiBhbmQgY2FjaGluZyBhbnkgcmVzdWx0c1xuICAgICAqIGl0IG5lZWRzLlxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPElPcGVuSURDcmVkZW50aWFscz59IFJlc29sdmVzIHRvIGEgdG9rZW4gZm9yIHZlcmlmaWNhdGlvbi5cbiAgICAgKiBAdGhyb3dzIFRocm93cyBpZiB0aGUgdXNlciByZWplY3RlZCB0aGUgcmVxdWVzdCBvciB0aGUgcmVxdWVzdCBmYWlsZWQuXG4gICAgICovXG4gIH0sIHtcbiAgICBrZXk6IFwicmVxdWVzdE9wZW5JRENvbm5lY3RUb2tlblwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiByZXF1ZXN0T3BlbklEQ29ubmVjdFRva2VuKCkge1xuICAgICAgdmFyIF90aGlzNSA9IHRoaXM7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBfdGhpczUudHJhbnNwb3J0LnNlbmRDb21wbGV0ZShfV2lkZ2V0QXBpQWN0aW9uLldpZGdldEFwaUZyb21XaWRnZXRBY3Rpb24uR2V0T3BlbklEQ3JlZGVudGlhbHMsIHt9KS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgIHZhciByZGF0YSA9IHJlc3BvbnNlLnJlc3BvbnNlO1xuICAgICAgICAgIGlmIChyZGF0YS5zdGF0ZSA9PT0gX0dldE9wZW5JREFjdGlvbi5PcGVuSURSZXF1ZXN0U3RhdGUuQWxsb3dlZCkge1xuICAgICAgICAgICAgcmVzb2x2ZShyZGF0YSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChyZGF0YS5zdGF0ZSA9PT0gX0dldE9wZW5JREFjdGlvbi5PcGVuSURSZXF1ZXN0U3RhdGUuQmxvY2tlZCkge1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIlVzZXIgZGVjbGluZWQgdG8gdmVyaWZ5IHRoZWlyIGlkZW50aXR5XCIpKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHJkYXRhLnN0YXRlID09PSBfR2V0T3BlbklEQWN0aW9uLk9wZW5JRFJlcXVlc3RTdGF0ZS5QZW5kaW5nVXNlckNvbmZpcm1hdGlvbikge1xuICAgICAgICAgICAgdmFyIGhhbmRsZXJGbiA9IGZ1bmN0aW9uIGhhbmRsZXJGbihldikge1xuICAgICAgICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICB2YXIgcmVxdWVzdCA9IGV2LmRldGFpbDtcbiAgICAgICAgICAgICAgaWYgKHJlcXVlc3QuZGF0YS5vcmlnaW5hbF9yZXF1ZXN0X2lkICE9PSByZXNwb25zZS5yZXF1ZXN0SWQpIHJldHVybjtcbiAgICAgICAgICAgICAgaWYgKHJlcXVlc3QuZGF0YS5zdGF0ZSA9PT0gX0dldE9wZW5JREFjdGlvbi5PcGVuSURSZXF1ZXN0U3RhdGUuQWxsb3dlZCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUocmVxdWVzdC5kYXRhKTtcbiAgICAgICAgICAgICAgICBfdGhpczUudHJhbnNwb3J0LnJlcGx5KHJlcXVlc3QsIHt9KTsgLy8gYWNrXG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAocmVxdWVzdC5kYXRhLnN0YXRlID09PSBfR2V0T3BlbklEQWN0aW9uLk9wZW5JRFJlcXVlc3RTdGF0ZS5CbG9ja2VkKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIlVzZXIgZGVjbGluZWQgdG8gdmVyaWZ5IHRoZWlyIGlkZW50aXR5XCIpKTtcbiAgICAgICAgICAgICAgICBfdGhpczUudHJhbnNwb3J0LnJlcGx5KHJlcXVlc3QsIHt9KTsgLy8gYWNrXG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIkludmFsaWQgc3RhdGUgb24gcmVwbHk6IFwiICsgcmRhdGEuc3RhdGUpKTtcbiAgICAgICAgICAgICAgICBfdGhpczUudHJhbnNwb3J0LnJlcGx5KHJlcXVlc3QsIHtcbiAgICAgICAgICAgICAgICAgIGVycm9yOiB7XG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IFwiSW52YWxpZCBzdGF0ZVwiXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgX3RoaXM1Lm9mZihcImFjdGlvbjpcIi5jb25jYXQoX1dpZGdldEFwaUFjdGlvbi5XaWRnZXRBcGlUb1dpZGdldEFjdGlvbi5PcGVuSURDcmVkZW50aWFscyksIGhhbmRsZXJGbik7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgX3RoaXM1Lm9uKFwiYWN0aW9uOlwiLmNvbmNhdChfV2lkZ2V0QXBpQWN0aW9uLldpZGdldEFwaVRvV2lkZ2V0QWN0aW9uLk9wZW5JRENyZWRlbnRpYWxzKSwgaGFuZGxlckZuKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIkludmFsaWQgc3RhdGU6IFwiICsgcmRhdGEuc3RhdGUpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pW1wiY2F0Y2hcIl0ocmVqZWN0KTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFza3MgdGhlIGNsaWVudCBmb3IgYWRkaXRpb25hbCBjYXBhYmlsaXRpZXMuIENhcGFiaWxpdGllcyBjYW4gYmUgcXVldWVkIGZvciB0aGlzXG4gICAgICogcmVxdWVzdCB3aXRoIHRoZSByZXF1ZXN0Q2FwYWJpbGl0eSgpIGZ1bmN0aW9ucy5cbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn0gUmVzb2x2ZXMgd2hlbiBjb21wbGV0ZS4gTm90ZSB0aGF0IHRoZSBwcm9taXNlIHJlc29sdmVzIHdoZW5cbiAgICAgKiB0aGUgY2FwYWJpbGl0aWVzIHJlcXVlc3QgaGFzIGdvbmUgdGhyb3VnaCwgbm90IHdoZW4gdGhlIGNhcGFiaWxpdGllcyBhcmUgYXBwcm92ZWQvZGVuaWVkLlxuICAgICAqIFVzZSB0aGUgV2lkZ2V0QXBpVG9XaWRnZXRBY3Rpb24uTm90aWZ5Q2FwYWJpbGl0aWVzIGFjdGlvbiB0byBkZXRlY3QgY2hhbmdlcy5cbiAgICAgKi9cbiAgfSwge1xuICAgIGtleTogXCJ1cGRhdGVSZXF1ZXN0ZWRDYXBhYmlsaXRpZXNcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gdXBkYXRlUmVxdWVzdGVkQ2FwYWJpbGl0aWVzKCkge1xuICAgICAgcmV0dXJuIHRoaXMudHJhbnNwb3J0LnNlbmQoX1dpZGdldEFwaUFjdGlvbi5XaWRnZXRBcGlGcm9tV2lkZ2V0QWN0aW9uLk1TQzI5NzRSZW5lZ290aWF0ZUNhcGFiaWxpdGllcywge1xuICAgICAgICBjYXBhYmlsaXRpZXM6IHRoaXMucmVxdWVzdGVkQ2FwYWJpbGl0aWVzXG4gICAgICB9KS50aGVuKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGVsbCB0aGUgY2xpZW50IHRoYXQgdGhlIGNvbnRlbnQgaGFzIGJlZW4gbG9hZGVkLlxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfSBSZXNvbHZlcyB3aGVuIHRoZSBjbGllbnQgYWNrbm93bGVkZ2VzIHRoZSByZXF1ZXN0LlxuICAgICAqL1xuICB9LCB7XG4gICAga2V5OiBcInNlbmRDb250ZW50TG9hZGVkXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHNlbmRDb250ZW50TG9hZGVkKCkge1xuICAgICAgcmV0dXJuIHRoaXMudHJhbnNwb3J0LnNlbmQoX1dpZGdldEFwaUFjdGlvbi5XaWRnZXRBcGlGcm9tV2lkZ2V0QWN0aW9uLkNvbnRlbnRMb2FkZWQsIHt9KS50aGVuKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2VuZHMgYSBzdGlja2VyIHRvIHRoZSBjbGllbnQuXG4gICAgICogQHBhcmFtIHtJU3RpY2tlckFjdGlvblJlcXVlc3REYXRhfSBzdGlja2VyIFRoZSBzdGlja2VyIHRvIHNlbmQuXG4gICAgICogQHJldHVybnMge1Byb21pc2V9IFJlc29sdmVzIHdoZW4gdGhlIGNsaWVudCBhY2tub3dsZWRnZXMgdGhlIHJlcXVlc3QuXG4gICAgICovXG4gIH0sIHtcbiAgICBrZXk6IFwic2VuZFN0aWNrZXJcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gc2VuZFN0aWNrZXIoc3RpY2tlcikge1xuICAgICAgcmV0dXJuIHRoaXMudHJhbnNwb3J0LnNlbmQoX1dpZGdldEFwaUFjdGlvbi5XaWRnZXRBcGlGcm9tV2lkZ2V0QWN0aW9uLlNlbmRTdGlja2VyLCBzdGlja2VyKS50aGVuKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQXNrcyB0aGUgY2xpZW50IHRvIHNldCB0aGUgYWx3YXlzLW9uLXNjcmVlbiBzdGF0dXMgZm9yIHRoaXMgd2lkZ2V0LlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gdmFsdWUgVGhlIG5ldyBzdGF0ZSB0byByZXF1ZXN0LlxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPGJvb2xlYW4+fSBSZXNvbHZlIHdpdGggdHJ1ZSBpZiB0aGUgY2xpZW50IHdhcyBhYmxlIHRvIGZ1bGZpbGxcbiAgICAgKiB0aGUgcmVxdWVzdCwgcmVzb2x2ZXMgdG8gZmFsc2Ugb3RoZXJ3aXNlLiBSZWplY3RzIGlmIGFuIGVycm9yIG9jY3VycmVkLlxuICAgICAqL1xuICB9LCB7XG4gICAga2V5OiBcInNldEFsd2F5c09uU2NyZWVuXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHNldEFsd2F5c09uU2NyZWVuKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdGhpcy50cmFuc3BvcnQuc2VuZChfV2lkZ2V0QXBpQWN0aW9uLldpZGdldEFwaUZyb21XaWRnZXRBY3Rpb24uVXBkYXRlQWx3YXlzT25TY3JlZW4sIHtcbiAgICAgICAgdmFsdWU6IHZhbHVlXG4gICAgICB9KS50aGVuKGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgICAgcmV0dXJuIHJlcy5zdWNjZXNzO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT3BlbnMgYSBtb2RhbCB3aWRnZXQuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBUaGUgVVJMIHRvIHRoZSBtb2RhbCB3aWRnZXQuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhlIHdpZGdldC5cbiAgICAgKiBAcGFyYW0ge0lNb2RhbFdpZGdldE9wZW5SZXF1ZXN0RGF0YUJ1dHRvbltdfSBidXR0b25zIFRoZSBidXR0b25zIHRvIGhhdmUgb24gdGhlIHdpZGdldC5cbiAgICAgKiBAcGFyYW0ge0lNb2RhbFdpZGdldENyZWF0ZURhdGF9IGRhdGEgRGF0YSB0byBzdXBwbHkgdG8gdGhlIG1vZGFsIHdpZGdldC5cbiAgICAgKiBAcGFyYW0ge1dpZGdldFR5cGV9IHR5cGUgVGhlIHR5cGUgb2YgbW9kYWwgd2lkZ2V0LlxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fSBSZXNvbHZlcyB3aGVuIHRoZSBtb2RhbCB3aWRnZXQgaGFzIGJlZW4gb3BlbmVkLlxuICAgICAqL1xuICB9LCB7XG4gICAga2V5OiBcIm9wZW5Nb2RhbFdpZGdldFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBvcGVuTW9kYWxXaWRnZXQodXJsLCBuYW1lKSB7XG4gICAgICB2YXIgYnV0dG9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzJdIDogW107XG4gICAgICB2YXIgZGF0YSA9IGFyZ3VtZW50cy5sZW5ndGggPiAzICYmIGFyZ3VtZW50c1szXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzNdIDoge307XG4gICAgICB2YXIgdHlwZSA9IGFyZ3VtZW50cy5sZW5ndGggPiA0ICYmIGFyZ3VtZW50c1s0XSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzRdIDogX1dpZGdldFR5cGUuTWF0cml4V2lkZ2V0VHlwZS5DdXN0b207XG4gICAgICByZXR1cm4gdGhpcy50cmFuc3BvcnQuc2VuZChfV2lkZ2V0QXBpQWN0aW9uLldpZGdldEFwaUZyb21XaWRnZXRBY3Rpb24uT3Blbk1vZGFsV2lkZ2V0LCB7XG4gICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgIHVybDogdXJsLFxuICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICBidXR0b25zOiBidXR0b25zLFxuICAgICAgICBkYXRhOiBkYXRhXG4gICAgICB9KS50aGVuKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2xvc2VzIHRoZSBtb2RhbCB3aWRnZXQuIFRoZSB3aWRnZXQncyBzZXNzaW9uIHdpbGwgYmUgdGVybWluYXRlZCBzaG9ydGx5IGFmdGVyLlxuICAgICAqIEBwYXJhbSB7SU1vZGFsV2lkZ2V0UmV0dXJuRGF0YX0gZGF0YSBPcHRpb25hbCBkYXRhIHRvIGNsb3NlIHRoZSBtb2RhbCB3aWRnZXQgd2l0aC5cbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn0gUmVzb2x2ZXMgd2hlbiBjb21wbGV0ZS5cbiAgICAgKi9cbiAgfSwge1xuICAgIGtleTogXCJjbG9zZU1vZGFsV2lkZ2V0XCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGNsb3NlTW9kYWxXaWRnZXQoKSB7XG4gICAgICB2YXIgZGF0YSA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDoge307XG4gICAgICByZXR1cm4gdGhpcy50cmFuc3BvcnQuc2VuZChfV2lkZ2V0QXBpQWN0aW9uLldpZGdldEFwaUZyb21XaWRnZXRBY3Rpb24uQ2xvc2VNb2RhbFdpZGdldCwgZGF0YSkudGhlbigpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJzZW5kUm9vbUV2ZW50XCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHNlbmRSb29tRXZlbnQoZXZlbnRUeXBlLCBjb250ZW50LCByb29tSWQsIGRlbGF5LCBwYXJlbnREZWxheUlkKSB7XG4gICAgICByZXR1cm4gdGhpcy5zZW5kRXZlbnQoZXZlbnRUeXBlLCB1bmRlZmluZWQsIGNvbnRlbnQsIHJvb21JZCwgZGVsYXksIHBhcmVudERlbGF5SWQpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJzZW5kU3RhdGVFdmVudFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzZW5kU3RhdGVFdmVudChldmVudFR5cGUsIHN0YXRlS2V5LCBjb250ZW50LCByb29tSWQsIGRlbGF5LCBwYXJlbnREZWxheUlkKSB7XG4gICAgICByZXR1cm4gdGhpcy5zZW5kRXZlbnQoZXZlbnRUeXBlLCBzdGF0ZUtleSwgY29udGVudCwgcm9vbUlkLCBkZWxheSwgcGFyZW50RGVsYXlJZCk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInNlbmRFdmVudFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzZW5kRXZlbnQoZXZlbnRUeXBlLCBzdGF0ZUtleSwgY29udGVudCwgcm9vbUlkLCBkZWxheSwgcGFyZW50RGVsYXlJZCkge1xuICAgICAgcmV0dXJuIHRoaXMudHJhbnNwb3J0LnNlbmQoX1dpZGdldEFwaUFjdGlvbi5XaWRnZXRBcGlGcm9tV2lkZ2V0QWN0aW9uLlNlbmRFdmVudCwgX29iamVjdFNwcmVhZChfb2JqZWN0U3ByZWFkKF9vYmplY3RTcHJlYWQoX29iamVjdFNwcmVhZCh7XG4gICAgICAgIHR5cGU6IGV2ZW50VHlwZSxcbiAgICAgICAgY29udGVudDogY29udGVudFxuICAgICAgfSwgc3RhdGVLZXkgIT09IHVuZGVmaW5lZCAmJiB7XG4gICAgICAgIHN0YXRlX2tleTogc3RhdGVLZXlcbiAgICAgIH0pLCByb29tSWQgIT09IHVuZGVmaW5lZCAmJiB7XG4gICAgICAgIHJvb21faWQ6IHJvb21JZFxuICAgICAgfSksIGRlbGF5ICE9PSB1bmRlZmluZWQgJiYge1xuICAgICAgICBkZWxheTogZGVsYXlcbiAgICAgIH0pLCBwYXJlbnREZWxheUlkICE9PSB1bmRlZmluZWQgJiYge1xuICAgICAgICBwYXJlbnRfZGVsYXlfaWQ6IHBhcmVudERlbGF5SWRcbiAgICAgIH0pKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAZGVwcmVjYXRlZCBUaGlzIGN1cnJlbnRseSByZWxpZXMgb24gYW4gdW5zdGFibGUgTVNDIChNU0M0MTU3KS5cbiAgICAgKi9cbiAgfSwge1xuICAgIGtleTogXCJ1cGRhdGVEZWxheWVkRXZlbnRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gdXBkYXRlRGVsYXllZEV2ZW50KGRlbGF5SWQsIGFjdGlvbikge1xuICAgICAgcmV0dXJuIHRoaXMudHJhbnNwb3J0LnNlbmQoX1dpZGdldEFwaUFjdGlvbi5XaWRnZXRBcGlGcm9tV2lkZ2V0QWN0aW9uLk1TQzQxNTdVcGRhdGVEZWxheWVkRXZlbnQsIHtcbiAgICAgICAgZGVsYXlfaWQ6IGRlbGF5SWQsXG4gICAgICAgIGFjdGlvbjogYWN0aW9uXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZW5kcyBhIHRvLWRldmljZSBldmVudC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRUeXBlIFRoZSB0eXBlIG9mIGV2ZW50cyBiZWluZyBzZW50LlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gZW5jcnlwdGVkIFdoZXRoZXIgdG8gZW5jcnlwdCB0aGUgbWVzc2FnZSBjb250ZW50cy5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY29udGVudE1hcCBBIG1hcCBmcm9tIHVzZXIgSURzIHRvIGRldmljZSBJRHMgdG8gbWVzc2FnZSBjb250ZW50cy5cbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxJU2VuZFRvRGV2aWNlRnJvbVdpZGdldFJlc3BvbnNlRGF0YT59IFJlc29sdmVzIHdoZW4gY29tcGxldGUuXG4gICAgICovXG4gIH0sIHtcbiAgICBrZXk6IFwic2VuZFRvRGV2aWNlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHNlbmRUb0RldmljZShldmVudFR5cGUsIGVuY3J5cHRlZCwgY29udGVudE1hcCkge1xuICAgICAgcmV0dXJuIHRoaXMudHJhbnNwb3J0LnNlbmQoX1dpZGdldEFwaUFjdGlvbi5XaWRnZXRBcGlGcm9tV2lkZ2V0QWN0aW9uLlNlbmRUb0RldmljZSwge1xuICAgICAgICB0eXBlOiBldmVudFR5cGUsXG4gICAgICAgIGVuY3J5cHRlZDogZW5jcnlwdGVkLFxuICAgICAgICBtZXNzYWdlczogY29udGVudE1hcFxuICAgICAgfSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInJlYWRSb29tQWNjb3VudERhdGFcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gcmVhZFJvb21BY2NvdW50RGF0YShldmVudFR5cGUsIHJvb21JZHMpIHtcbiAgICAgIHZhciBkYXRhID0ge1xuICAgICAgICB0eXBlOiBldmVudFR5cGVcbiAgICAgIH07XG4gICAgICBpZiAocm9vbUlkcykge1xuICAgICAgICBpZiAocm9vbUlkcy5pbmNsdWRlcyhfU3ltYm9scy5TeW1ib2xzLkFueVJvb20pKSB7XG4gICAgICAgICAgZGF0YS5yb29tX2lkcyA9IF9TeW1ib2xzLlN5bWJvbHMuQW55Um9vbTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkYXRhLnJvb21faWRzID0gcm9vbUlkcztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMudHJhbnNwb3J0LnNlbmQoX1dpZGdldEFwaUFjdGlvbi5XaWRnZXRBcGlGcm9tV2lkZ2V0QWN0aW9uLkJlZXBlclJlYWRSb29tQWNjb3VudERhdGEsIGRhdGEpLnRoZW4oZnVuY3Rpb24gKHIpIHtcbiAgICAgICAgcmV0dXJuIHIuZXZlbnRzO1xuICAgICAgfSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInJlYWRSb29tRXZlbnRzXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHJlYWRSb29tRXZlbnRzKGV2ZW50VHlwZSwgbGltaXQsIG1zZ3R5cGUsIHJvb21JZHMsIHNpbmNlKSB7XG4gICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgdHlwZTogZXZlbnRUeXBlLFxuICAgICAgICBtc2d0eXBlOiBtc2d0eXBlXG4gICAgICB9O1xuICAgICAgaWYgKGxpbWl0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgZGF0YS5saW1pdCA9IGxpbWl0O1xuICAgICAgfVxuICAgICAgaWYgKHJvb21JZHMpIHtcbiAgICAgICAgaWYgKHJvb21JZHMuaW5jbHVkZXMoX1N5bWJvbHMuU3ltYm9scy5BbnlSb29tKSkge1xuICAgICAgICAgIGRhdGEucm9vbV9pZHMgPSBfU3ltYm9scy5TeW1ib2xzLkFueVJvb207XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGF0YS5yb29tX2lkcyA9IHJvb21JZHM7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChzaW5jZSkge1xuICAgICAgICBkYXRhLnNpbmNlID0gc2luY2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy50cmFuc3BvcnQuc2VuZChfV2lkZ2V0QXBpQWN0aW9uLldpZGdldEFwaUZyb21XaWRnZXRBY3Rpb24uTVNDMjg3NlJlYWRFdmVudHMsIGRhdGEpLnRoZW4oZnVuY3Rpb24gKHIpIHtcbiAgICAgICAgcmV0dXJuIHIuZXZlbnRzO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVhZHMgYWxsIHJlbGF0ZWQgZXZlbnRzIGdpdmVuIGEga25vd24gZXZlbnRJZC5cbiAgICAgKiBAcGFyYW0gZXZlbnRJZCBUaGUgaWQgb2YgdGhlIHBhcmVudCBldmVudCB0byBiZSByZWFkLlxuICAgICAqIEBwYXJhbSByb29tSWQgVGhlIHJvb20gdG8gbG9vayB3aXRoaW4uIFdoZW4gdW5kZWZpbmVkLCB0aGUgdXNlcidzIGN1cnJlbnRseVxuICAgICAqIHZpZXdlZCByb29tLlxuICAgICAqIEBwYXJhbSByZWxhdGlvblR5cGUgVGhlIHJlbGF0aW9uc2hpcCB0eXBlIG9mIGNoaWxkIGV2ZW50cyB0byBzZWFyY2ggZm9yLlxuICAgICAqIFdoZW4gdW5kZWZpbmVkLCBhbGwgcmVsYXRpb25zIGFyZSByZXR1cm5lZC5cbiAgICAgKiBAcGFyYW0gZXZlbnRUeXBlIFRoZSBldmVudCB0eXBlIG9mIGNoaWxkIGV2ZW50cyB0byBzZWFyY2ggZm9yLiBXaGVuIHVuZGVmaW5lZCxcbiAgICAgKiBhbGwgcmVsYXRlZCBldmVudHMgYXJlIHJldHVybmVkLlxuICAgICAqIEBwYXJhbSBsaW1pdCBUaGUgbWF4aW11bSBudW1iZXIgb2YgZXZlbnRzIHRvIHJldHJpZXZlIHBlciByb29tLiBJZiBub3RcbiAgICAgKiBzdXBwbGllZCwgdGhlIHNlcnZlciB3aWxsIGFwcGx5IGEgZGVmYXVsdCBsaW1pdC5cbiAgICAgKiBAcGFyYW0gZnJvbSBUaGUgcGFnaW5hdGlvbiB0b2tlbiB0byBzdGFydCByZXR1cm5pbmcgcmVzdWx0cyBmcm9tLCBhc1xuICAgICAqIHJlY2VpdmVkIGZyb20gYSBwcmV2aW91cyBjYWxsLiBJZiBub3Qgc3VwcGxpZWQsIHJlc3VsdHMgc3RhcnQgYXQgdGhlIG1vc3RcbiAgICAgKiByZWNlbnQgdG9wb2xvZ2ljYWwgZXZlbnQga25vd24gdG8gdGhlIHNlcnZlci5cbiAgICAgKiBAcGFyYW0gdG8gVGhlIHBhZ2luYXRpb24gdG9rZW4gdG8gc3RvcCByZXR1cm5pbmcgcmVzdWx0cyBhdC4gSWYgbm90XG4gICAgICogc3VwcGxpZWQsIHJlc3VsdHMgY29udGludWUgdXAgdG8gbGltaXQgb3IgdW50aWwgdGhlcmUgYXJlIG5vIG1vcmUgZXZlbnRzLlxuICAgICAqIEBwYXJhbSBkaXJlY3Rpb24gVGhlIGRpcmVjdGlvbiB0byBzZWFyY2ggZm9yIGFjY29yZGluZyB0byBNU0MzNzE1LlxuICAgICAqIEByZXR1cm5zIFJlc29sdmVzIHRvIHRoZSByb29tIHJlbGF0aW9ucy5cbiAgICAgKi9cbiAgfSwge1xuICAgIGtleTogXCJyZWFkRXZlbnRSZWxhdGlvbnNcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIF9yZWFkRXZlbnRSZWxhdGlvbnMgPSBfYXN5bmNUb0dlbmVyYXRvciggLyojX19QVVJFX18qL19yZWdlbmVyYXRvclJ1bnRpbWUoKS5tYXJrKGZ1bmN0aW9uIF9jYWxsZWUoZXZlbnRJZCwgcm9vbUlkLCByZWxhdGlvblR5cGUsIGV2ZW50VHlwZSwgbGltaXQsIGZyb20sIHRvLCBkaXJlY3Rpb24pIHtcbiAgICAgICAgdmFyIHZlcnNpb25zLCBkYXRhO1xuICAgICAgICByZXR1cm4gX3JlZ2VuZXJhdG9yUnVudGltZSgpLndyYXAoZnVuY3Rpb24gX2NhbGxlZSQoX2NvbnRleHQpIHtcbiAgICAgICAgICB3aGlsZSAoMSkgc3dpdGNoIChfY29udGV4dC5wcmV2ID0gX2NvbnRleHQubmV4dCkge1xuICAgICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgICBfY29udGV4dC5uZXh0ID0gMjtcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q2xpZW50VmVyc2lvbnMoKTtcbiAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgdmVyc2lvbnMgPSBfY29udGV4dC5zZW50O1xuICAgICAgICAgICAgICBpZiAodmVyc2lvbnMuaW5jbHVkZXMoX0FwaVZlcnNpb24uVW5zdGFibGVBcGlWZXJzaW9uLk1TQzM4NjkpKSB7XG4gICAgICAgICAgICAgICAgX2NvbnRleHQubmV4dCA9IDU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlIHJlYWRfcmVsYXRpb25zIGFjdGlvbiBpcyBub3Qgc3VwcG9ydGVkIGJ5IHRoZSBjbGllbnQuXCIpO1xuICAgICAgICAgICAgY2FzZSA1OlxuICAgICAgICAgICAgICBkYXRhID0ge1xuICAgICAgICAgICAgICAgIGV2ZW50X2lkOiBldmVudElkLFxuICAgICAgICAgICAgICAgIHJlbF90eXBlOiByZWxhdGlvblR5cGUsXG4gICAgICAgICAgICAgICAgZXZlbnRfdHlwZTogZXZlbnRUeXBlLFxuICAgICAgICAgICAgICAgIHJvb21faWQ6IHJvb21JZCxcbiAgICAgICAgICAgICAgICB0bzogdG8sXG4gICAgICAgICAgICAgICAgZnJvbTogZnJvbSxcbiAgICAgICAgICAgICAgICBsaW1pdDogbGltaXQsXG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBkaXJlY3Rpb25cbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgcmV0dXJuIF9jb250ZXh0LmFicnVwdChcInJldHVyblwiLCB0aGlzLnRyYW5zcG9ydC5zZW5kKF9XaWRnZXRBcGlBY3Rpb24uV2lkZ2V0QXBpRnJvbVdpZGdldEFjdGlvbi5NU0MzODY5UmVhZFJlbGF0aW9ucywgZGF0YSkpO1xuICAgICAgICAgICAgY2FzZSA3OlxuICAgICAgICAgICAgY2FzZSBcImVuZFwiOlxuICAgICAgICAgICAgICByZXR1cm4gX2NvbnRleHQuc3RvcCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgX2NhbGxlZSwgdGhpcyk7XG4gICAgICB9KSk7XG4gICAgICBmdW5jdGlvbiByZWFkRXZlbnRSZWxhdGlvbnMoX3gsIF94MiwgX3gzLCBfeDQsIF94NSwgX3g2LCBfeDcsIF94OCkge1xuICAgICAgICByZXR1cm4gX3JlYWRFdmVudFJlbGF0aW9ucy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlYWRFdmVudFJlbGF0aW9ucztcbiAgICB9KClcbiAgfSwge1xuICAgIGtleTogXCJyZWFkU3RhdGVFdmVudHNcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gcmVhZFN0YXRlRXZlbnRzKGV2ZW50VHlwZSwgbGltaXQsIHN0YXRlS2V5LCByb29tSWRzKSB7XG4gICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgdHlwZTogZXZlbnRUeXBlLFxuICAgICAgICBzdGF0ZV9rZXk6IHN0YXRlS2V5ID09PSB1bmRlZmluZWQgPyB0cnVlIDogc3RhdGVLZXlcbiAgICAgIH07XG4gICAgICBpZiAobGltaXQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBkYXRhLmxpbWl0ID0gbGltaXQ7XG4gICAgICB9XG4gICAgICBpZiAocm9vbUlkcykge1xuICAgICAgICBpZiAocm9vbUlkcy5pbmNsdWRlcyhfU3ltYm9scy5TeW1ib2xzLkFueVJvb20pKSB7XG4gICAgICAgICAgZGF0YS5yb29tX2lkcyA9IF9TeW1ib2xzLlN5bWJvbHMuQW55Um9vbTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkYXRhLnJvb21faWRzID0gcm9vbUlkcztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMudHJhbnNwb3J0LnNlbmQoX1dpZGdldEFwaUFjdGlvbi5XaWRnZXRBcGlGcm9tV2lkZ2V0QWN0aW9uLk1TQzI4NzZSZWFkRXZlbnRzLCBkYXRhKS50aGVuKGZ1bmN0aW9uIChyKSB7XG4gICAgICAgIHJldHVybiByLmV2ZW50cztcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldHMgYSBidXR0b24gYXMgZGlzYWJsZWQgb3IgZW5hYmxlZCBvbiB0aGUgbW9kYWwgd2lkZ2V0LiBCdXR0b25zIGFyZSBlbmFibGVkIGJ5IGRlZmF1bHQuXG4gICAgICogQHBhcmFtIHtNb2RhbEJ1dHRvbklEfSBidXR0b25JZCBUaGUgYnV0dG9uIElEIHRvIGVuYWJsZS9kaXNhYmxlLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNFbmFibGVkIFdoZXRoZXIgb3Igbm90IHRoZSBidXR0b24gaXMgZW5hYmxlZC5cbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn0gUmVzb2x2ZXMgd2hlbiBjb21wbGV0ZS5cbiAgICAgKiBAdGhyb3dzIFRocm93cyBpZiB0aGUgYnV0dG9uIGNhbm5vdCBiZSBkaXNhYmxlZCwgb3IgdGhlIGNsaWVudCByZWZ1c2VzIHRvIGRpc2FibGUgdGhlIGJ1dHRvbi5cbiAgICAgKi9cbiAgfSwge1xuICAgIGtleTogXCJzZXRNb2RhbEJ1dHRvbkVuYWJsZWRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gc2V0TW9kYWxCdXR0b25FbmFibGVkKGJ1dHRvbklkLCBpc0VuYWJsZWQpIHtcbiAgICAgIGlmIChidXR0b25JZCA9PT0gX01vZGFsV2lkZ2V0QWN0aW9ucy5CdWlsdEluTW9kYWxCdXR0b25JRC5DbG9zZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgY2xvc2UgYnV0dG9uIGNhbm5vdCBiZSBkaXNhYmxlZFwiKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLnRyYW5zcG9ydC5zZW5kKF9XaWRnZXRBcGlBY3Rpb24uV2lkZ2V0QXBpRnJvbVdpZGdldEFjdGlvbi5TZXRNb2RhbEJ1dHRvbkVuYWJsZWQsIHtcbiAgICAgICAgYnV0dG9uOiBidXR0b25JZCxcbiAgICAgICAgZW5hYmxlZDogaXNFbmFibGVkXG4gICAgICB9KS50aGVuKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQXR0ZW1wdHMgdG8gbmF2aWdhdGUgdGhlIGNsaWVudCB0byB0aGUgZ2l2ZW4gVVJJLiBUaGlzIGNhbiBvbmx5IGJlIGNhbGxlZCB3aXRoIE1hdHJpeCBVUklzXG4gICAgICogKGN1cnJlbnRseSBvbmx5IG1hdHJpeC50bywgYnV0IGluIGZ1dHVyZSBhIE1hdHJpeCBVUkkgc2NoZW1lIHdpbGwgYmUgZGVmaW5lZCkuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVyaSBUaGUgVVJJIHRvIG5hdmlnYXRlIHRvLlxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fSBSZXNvbHZlcyB3aGVuIGNvbXBsZXRlLlxuICAgICAqIEB0aHJvd3MgVGhyb3dzIGlmIHRoZSBVUkkgaXMgaW52YWxpZCBvciBjYW5ub3QgYmUgcHJvY2Vzc2VkLlxuICAgICAqIEBkZXByZWNhdGVkIFRoaXMgY3VycmVudGx5IHJlbGllcyBvbiBhbiB1bnN0YWJsZSBNU0MgKE1TQzI5MzEpLlxuICAgICAqL1xuICB9LCB7XG4gICAga2V5OiBcIm5hdmlnYXRlVG9cIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gbmF2aWdhdGVUbyh1cmkpIHtcbiAgICAgIGlmICghdXJpIHx8ICF1cmkuc3RhcnRzV2l0aChcImh0dHBzOi8vbWF0cml4LnRvLyNcIikpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBtYXRyaXgudG8gVVJJXCIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMudHJhbnNwb3J0LnNlbmQoX1dpZGdldEFwaUFjdGlvbi5XaWRnZXRBcGlGcm9tV2lkZ2V0QWN0aW9uLk1TQzI5MzFOYXZpZ2F0ZSwge1xuICAgICAgICB1cmk6IHVyaVxuICAgICAgfSkudGhlbigpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN0YXJ0cyB3YXRjaGluZyBmb3IgVFVSTiBzZXJ2ZXJzLCB5aWVsZGluZyBhbiBpbml0aWFsIHNldCBvZiBjcmVkZW50aWFscyBhcyBzb29uIGFzIHBvc3NpYmxlLFxuICAgICAqIGFuZCB0aGVyZWFmdGVyIHlpZWxkaW5nIG5ldyBjcmVkZW50aWFscyB3aGVuZXZlciB0aGUgcHJldmlvdXMgb25lcyBleHBpcmUuXG4gICAgICogQHlpZWxkcyB7SVR1cm5TZXJ2ZXJ9IFRoZSBUVVJOIHNlcnZlciBVUklzIGFuZCBjcmVkZW50aWFscyBjdXJyZW50bHkgYXZhaWxhYmxlIHRvIHRoZSB3aWRnZXQuXG4gICAgICovXG4gIH0sIHtcbiAgICBrZXk6IFwiZ2V0VHVyblNlcnZlcnNcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0VHVyblNlcnZlcnMoKSB7XG4gICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgcmV0dXJuIF93cmFwQXN5bmNHZW5lcmF0b3IoIC8qI19fUFVSRV9fKi9fcmVnZW5lcmF0b3JSdW50aW1lKCkubWFyayhmdW5jdGlvbiBfY2FsbGVlMygpIHtcbiAgICAgICAgdmFyIHNldFR1cm5TZXJ2ZXIsIG9uVXBkYXRlVHVyblNlcnZlcnM7XG4gICAgICAgIHJldHVybiBfcmVnZW5lcmF0b3JSdW50aW1lKCkud3JhcChmdW5jdGlvbiBfY2FsbGVlMyQoX2NvbnRleHQzKSB7XG4gICAgICAgICAgd2hpbGUgKDEpIHN3aXRjaCAoX2NvbnRleHQzLnByZXYgPSBfY29udGV4dDMubmV4dCkge1xuICAgICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgICBvblVwZGF0ZVR1cm5TZXJ2ZXJzID0gLyojX19QVVJFX18qL2Z1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgX3JlZiA9IF9hc3luY1RvR2VuZXJhdG9yKCAvKiNfX1BVUkVfXyovX3JlZ2VuZXJhdG9yUnVudGltZSgpLm1hcmsoZnVuY3Rpb24gX2NhbGxlZTIoZXYpIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBfcmVnZW5lcmF0b3JSdW50aW1lKCkud3JhcChmdW5jdGlvbiBfY2FsbGVlMiQoX2NvbnRleHQyKSB7XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlICgxKSBzd2l0Y2ggKF9jb250ZXh0Mi5wcmV2ID0gX2NvbnRleHQyLm5leHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgICAgICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0VHVyblNlcnZlcihldi5kZXRhaWwuZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBfY29udGV4dDIubmV4dCA9IDQ7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gX3RoaXMudHJhbnNwb3J0LnJlcGx5KGV2LmRldGFpbCwge30pO1xuICAgICAgICAgICAgICAgICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiZW5kXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gX2NvbnRleHQyLnN0b3AoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSwgX2NhbGxlZTIpO1xuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gb25VcGRhdGVUdXJuU2VydmVycyhfeDkpIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBfcmVmLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgfSgpOyAvLyBTdGFydCBsaXN0ZW5pbmcgZm9yIHVwZGF0ZXMgYmVmb3JlIHdlIGV2ZW4gc3RhcnQgd2F0Y2hpbmcsIHRvIGNhdGNoXG4gICAgICAgICAgICAgIC8vIFRVUk4gZGF0YSB0aGF0IGlzIHNlbnQgaW1tZWRpYXRlbHlcbiAgICAgICAgICAgICAgX3RoaXMub24oXCJhY3Rpb246XCIuY29uY2F0KF9XaWRnZXRBcGlBY3Rpb24uV2lkZ2V0QXBpVG9XaWRnZXRBY3Rpb24uVXBkYXRlVHVyblNlcnZlcnMpLCBvblVwZGF0ZVR1cm5TZXJ2ZXJzKTtcblxuICAgICAgICAgICAgICAvLyBPbmx5IHNlbmQgdGhlICd3YXRjaCcgYWN0aW9uIGlmIHdlIGFyZW4ndCBhbHJlYWR5IHdhdGNoaW5nXG4gICAgICAgICAgICAgIGlmICghKF90aGlzLnR1cm5TZXJ2ZXJXYXRjaGVycyA9PT0gMCkpIHtcbiAgICAgICAgICAgICAgICBfY29udGV4dDMubmV4dCA9IDEyO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIF9jb250ZXh0My5wcmV2ID0gMztcbiAgICAgICAgICAgICAgX2NvbnRleHQzLm5leHQgPSA2O1xuICAgICAgICAgICAgICByZXR1cm4gX2F3YWl0QXN5bmNHZW5lcmF0b3IoX3RoaXMudHJhbnNwb3J0LnNlbmQoX1dpZGdldEFwaUFjdGlvbi5XaWRnZXRBcGlGcm9tV2lkZ2V0QWN0aW9uLldhdGNoVHVyblNlcnZlcnMsIHt9KSk7XG4gICAgICAgICAgICBjYXNlIDY6XG4gICAgICAgICAgICAgIF9jb250ZXh0My5uZXh0ID0gMTI7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSA4OlxuICAgICAgICAgICAgICBfY29udGV4dDMucHJldiA9IDg7XG4gICAgICAgICAgICAgIF9jb250ZXh0My50MCA9IF9jb250ZXh0M1tcImNhdGNoXCJdKDMpO1xuICAgICAgICAgICAgICBfdGhpcy5vZmYoXCJhY3Rpb246XCIuY29uY2F0KF9XaWRnZXRBcGlBY3Rpb24uV2lkZ2V0QXBpVG9XaWRnZXRBY3Rpb24uVXBkYXRlVHVyblNlcnZlcnMpLCBvblVwZGF0ZVR1cm5TZXJ2ZXJzKTtcbiAgICAgICAgICAgICAgdGhyb3cgX2NvbnRleHQzLnQwO1xuICAgICAgICAgICAgY2FzZSAxMjpcbiAgICAgICAgICAgICAgX3RoaXMudHVyblNlcnZlcldhdGNoZXJzKys7XG4gICAgICAgICAgICAgIF9jb250ZXh0My5wcmV2ID0gMTM7XG4gICAgICAgICAgICBjYXNlIDE0OlxuICAgICAgICAgICAgICBpZiAoIXRydWUpIHtcbiAgICAgICAgICAgICAgICBfY29udGV4dDMubmV4dCA9IDIxO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIF9jb250ZXh0My5uZXh0ID0gMTc7XG4gICAgICAgICAgICAgIHJldHVybiBfYXdhaXRBc3luY0dlbmVyYXRvcihuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzZXRUdXJuU2VydmVyID0gcmVzb2x2ZTtcbiAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgY2FzZSAxNzpcbiAgICAgICAgICAgICAgX2NvbnRleHQzLm5leHQgPSAxOTtcbiAgICAgICAgICAgICAgcmV0dXJuIF9jb250ZXh0My5zZW50O1xuICAgICAgICAgICAgY2FzZSAxOTpcbiAgICAgICAgICAgICAgX2NvbnRleHQzLm5leHQgPSAxNDtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDIxOlxuICAgICAgICAgICAgICBfY29udGV4dDMucHJldiA9IDIxO1xuICAgICAgICAgICAgICAvLyBUaGUgbG9vcCB3YXMgYnJva2VuIGJ5IHRoZSBjYWxsZXIgLSBjbGVhbiB1cFxuICAgICAgICAgICAgICBfdGhpcy5vZmYoXCJhY3Rpb246XCIuY29uY2F0KF9XaWRnZXRBcGlBY3Rpb24uV2lkZ2V0QXBpVG9XaWRnZXRBY3Rpb24uVXBkYXRlVHVyblNlcnZlcnMpLCBvblVwZGF0ZVR1cm5TZXJ2ZXJzKTtcblxuICAgICAgICAgICAgICAvLyBTaW5jZSBzZW5kaW5nIHRoZSAndW53YXRjaCcgYWN0aW9uIHdpbGwgZW5kIHVwZGF0ZXMgZm9yIGFsbCBvdGhlclxuICAgICAgICAgICAgICAvLyBjb25zdW1lcnMsIG9ubHkgc2VuZCBpdCBpZiB3ZSdyZSB0aGUgb25seSBjb25zdW1lciByZW1haW5pbmdcbiAgICAgICAgICAgICAgX3RoaXMudHVyblNlcnZlcldhdGNoZXJzLS07XG4gICAgICAgICAgICAgIGlmICghKF90aGlzLnR1cm5TZXJ2ZXJXYXRjaGVycyA9PT0gMCkpIHtcbiAgICAgICAgICAgICAgICBfY29udGV4dDMubmV4dCA9IDI3O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIF9jb250ZXh0My5uZXh0ID0gMjc7XG4gICAgICAgICAgICAgIHJldHVybiBfYXdhaXRBc3luY0dlbmVyYXRvcihfdGhpcy50cmFuc3BvcnQuc2VuZChfV2lkZ2V0QXBpQWN0aW9uLldpZGdldEFwaUZyb21XaWRnZXRBY3Rpb24uVW53YXRjaFR1cm5TZXJ2ZXJzLCB7fSkpO1xuICAgICAgICAgICAgY2FzZSAyNzpcbiAgICAgICAgICAgICAgcmV0dXJuIF9jb250ZXh0My5maW5pc2goMjEpO1xuICAgICAgICAgICAgY2FzZSAyODpcbiAgICAgICAgICAgIGNhc2UgXCJlbmRcIjpcbiAgICAgICAgICAgICAgcmV0dXJuIF9jb250ZXh0My5zdG9wKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LCBfY2FsbGVlMywgbnVsbCwgW1szLCA4XSwgWzEzLCwgMjEsIDI4XV0pO1xuICAgICAgfSkpKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2VhcmNoIGZvciB1c2VycyBpbiB0aGUgdXNlciBkaXJlY3RvcnkuXG4gICAgICogQHBhcmFtIHNlYXJjaFRlcm0gVGhlIHRlcm0gdG8gc2VhcmNoIGZvci5cbiAgICAgKiBAcGFyYW0gbGltaXQgVGhlIG1heGltdW0gbnVtYmVyIG9mIHJlc3VsdHMgdG8gcmV0dXJuLiBJZiBub3Qgc3VwcGxpZWQsIHRoZVxuICAgICAqIEByZXR1cm5zIFJlc29sdmVzIHRvIHRoZSBzZWFyY2ggcmVzdWx0cy5cbiAgICAgKi9cbiAgfSwge1xuICAgIGtleTogXCJzZWFyY2hVc2VyRGlyZWN0b3J5XCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBfc2VhcmNoVXNlckRpcmVjdG9yeSA9IF9hc3luY1RvR2VuZXJhdG9yKCAvKiNfX1BVUkVfXyovX3JlZ2VuZXJhdG9yUnVudGltZSgpLm1hcmsoZnVuY3Rpb24gX2NhbGxlZTQoc2VhcmNoVGVybSwgbGltaXQpIHtcbiAgICAgICAgdmFyIHZlcnNpb25zLCBkYXRhO1xuICAgICAgICByZXR1cm4gX3JlZ2VuZXJhdG9yUnVudGltZSgpLndyYXAoZnVuY3Rpb24gX2NhbGxlZTQkKF9jb250ZXh0NCkge1xuICAgICAgICAgIHdoaWxlICgxKSBzd2l0Y2ggKF9jb250ZXh0NC5wcmV2ID0gX2NvbnRleHQ0Lm5leHQpIHtcbiAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgICAgX2NvbnRleHQ0Lm5leHQgPSAyO1xuICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRDbGllbnRWZXJzaW9ucygpO1xuICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICB2ZXJzaW9ucyA9IF9jb250ZXh0NC5zZW50O1xuICAgICAgICAgICAgICBpZiAodmVyc2lvbnMuaW5jbHVkZXMoX0FwaVZlcnNpb24uVW5zdGFibGVBcGlWZXJzaW9uLk1TQzM5NzMpKSB7XG4gICAgICAgICAgICAgICAgX2NvbnRleHQ0Lm5leHQgPSA1O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSB1c2VyX2RpcmVjdG9yeV9zZWFyY2ggYWN0aW9uIGlzIG5vdCBzdXBwb3J0ZWQgYnkgdGhlIGNsaWVudC5cIik7XG4gICAgICAgICAgICBjYXNlIDU6XG4gICAgICAgICAgICAgIGRhdGEgPSB7XG4gICAgICAgICAgICAgICAgc2VhcmNoX3Rlcm06IHNlYXJjaFRlcm0sXG4gICAgICAgICAgICAgICAgbGltaXQ6IGxpbWl0XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIHJldHVybiBfY29udGV4dDQuYWJydXB0KFwicmV0dXJuXCIsIHRoaXMudHJhbnNwb3J0LnNlbmQoX1dpZGdldEFwaUFjdGlvbi5XaWRnZXRBcGlGcm9tV2lkZ2V0QWN0aW9uLk1TQzM5NzNVc2VyRGlyZWN0b3J5U2VhcmNoLCBkYXRhKSk7XG4gICAgICAgICAgICBjYXNlIDc6XG4gICAgICAgICAgICBjYXNlIFwiZW5kXCI6XG4gICAgICAgICAgICAgIHJldHVybiBfY29udGV4dDQuc3RvcCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgX2NhbGxlZTQsIHRoaXMpO1xuICAgICAgfSkpO1xuICAgICAgZnVuY3Rpb24gc2VhcmNoVXNlckRpcmVjdG9yeShfeDEwLCBfeDExKSB7XG4gICAgICAgIHJldHVybiBfc2VhcmNoVXNlckRpcmVjdG9yeS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHNlYXJjaFVzZXJEaXJlY3Rvcnk7XG4gICAgfSgpXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBjb25maWcgZm9yIHRoZSBtZWRpYSByZXBvc2l0b3J5LlxuICAgICAqIEByZXR1cm5zIFByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgd2l0aCBhbiBvYmplY3QgY29udGFpbmluZyB0aGUgY29uZmlnLlxuICAgICAqL1xuICB9LCB7XG4gICAga2V5OiBcImdldE1lZGlhQ29uZmlnXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBfZ2V0TWVkaWFDb25maWcgPSBfYXN5bmNUb0dlbmVyYXRvciggLyojX19QVVJFX18qL19yZWdlbmVyYXRvclJ1bnRpbWUoKS5tYXJrKGZ1bmN0aW9uIF9jYWxsZWU1KCkge1xuICAgICAgICB2YXIgdmVyc2lvbnMsIGRhdGE7XG4gICAgICAgIHJldHVybiBfcmVnZW5lcmF0b3JSdW50aW1lKCkud3JhcChmdW5jdGlvbiBfY2FsbGVlNSQoX2NvbnRleHQ1KSB7XG4gICAgICAgICAgd2hpbGUgKDEpIHN3aXRjaCAoX2NvbnRleHQ1LnByZXYgPSBfY29udGV4dDUubmV4dCkge1xuICAgICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgICBfY29udGV4dDUubmV4dCA9IDI7XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldENsaWVudFZlcnNpb25zKCk7XG4gICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgIHZlcnNpb25zID0gX2NvbnRleHQ1LnNlbnQ7XG4gICAgICAgICAgICAgIGlmICh2ZXJzaW9ucy5pbmNsdWRlcyhfQXBpVmVyc2lvbi5VbnN0YWJsZUFwaVZlcnNpb24uTVNDNDAzOSkpIHtcbiAgICAgICAgICAgICAgICBfY29udGV4dDUubmV4dCA9IDU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlIGdldF9tZWRpYV9jb25maWcgYWN0aW9uIGlzIG5vdCBzdXBwb3J0ZWQgYnkgdGhlIGNsaWVudC5cIik7XG4gICAgICAgICAgICBjYXNlIDU6XG4gICAgICAgICAgICAgIGRhdGEgPSB7fTtcbiAgICAgICAgICAgICAgcmV0dXJuIF9jb250ZXh0NS5hYnJ1cHQoXCJyZXR1cm5cIiwgdGhpcy50cmFuc3BvcnQuc2VuZChfV2lkZ2V0QXBpQWN0aW9uLldpZGdldEFwaUZyb21XaWRnZXRBY3Rpb24uTVNDNDAzOUdldE1lZGlhQ29uZmlnQWN0aW9uLCBkYXRhKSk7XG4gICAgICAgICAgICBjYXNlIDc6XG4gICAgICAgICAgICBjYXNlIFwiZW5kXCI6XG4gICAgICAgICAgICAgIHJldHVybiBfY29udGV4dDUuc3RvcCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgX2NhbGxlZTUsIHRoaXMpO1xuICAgICAgfSkpO1xuICAgICAgZnVuY3Rpb24gZ2V0TWVkaWFDb25maWcoKSB7XG4gICAgICAgIHJldHVybiBfZ2V0TWVkaWFDb25maWcuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBnZXRNZWRpYUNvbmZpZztcbiAgICB9KClcbiAgICAvKipcbiAgICAgKiBVcGxvYWQgYSBmaWxlIHRvIHRoZSBtZWRpYSByZXBvc2l0b3J5IG9uIHRoZSBob21lc2VydmVyLlxuICAgICAqIEBwYXJhbSBmaWxlIC0gVGhlIG9iamVjdCB0byB1cGxvYWQuIFNvbWV0aGluZyB0aGF0IGNhbiBiZSBzZW50IHRvXG4gICAgICogICAgICAgICAgICAgICBYTUxIdHRwUmVxdWVzdC5zZW5kICh0eXBpY2FsbHkgYSBGaWxlKS5cbiAgICAgKiBAcmV0dXJucyBSZXNvbHZlcyB0byB0aGUgbG9jYXRpb24gb2YgdGhlIHVwbG9hZGVkIGZpbGUuXG4gICAgICovXG4gIH0sIHtcbiAgICBrZXk6IFwidXBsb2FkRmlsZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgX3VwbG9hZEZpbGUgPSBfYXN5bmNUb0dlbmVyYXRvciggLyojX19QVVJFX18qL19yZWdlbmVyYXRvclJ1bnRpbWUoKS5tYXJrKGZ1bmN0aW9uIF9jYWxsZWU2KGZpbGUpIHtcbiAgICAgICAgdmFyIHZlcnNpb25zLCBkYXRhO1xuICAgICAgICByZXR1cm4gX3JlZ2VuZXJhdG9yUnVudGltZSgpLndyYXAoZnVuY3Rpb24gX2NhbGxlZTYkKF9jb250ZXh0Nikge1xuICAgICAgICAgIHdoaWxlICgxKSBzd2l0Y2ggKF9jb250ZXh0Ni5wcmV2ID0gX2NvbnRleHQ2Lm5leHQpIHtcbiAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgICAgX2NvbnRleHQ2Lm5leHQgPSAyO1xuICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRDbGllbnRWZXJzaW9ucygpO1xuICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICB2ZXJzaW9ucyA9IF9jb250ZXh0Ni5zZW50O1xuICAgICAgICAgICAgICBpZiAodmVyc2lvbnMuaW5jbHVkZXMoX0FwaVZlcnNpb24uVW5zdGFibGVBcGlWZXJzaW9uLk1TQzQwMzkpKSB7XG4gICAgICAgICAgICAgICAgX2NvbnRleHQ2Lm5leHQgPSA1O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSB1cGxvYWRfZmlsZSBhY3Rpb24gaXMgbm90IHN1cHBvcnRlZCBieSB0aGUgY2xpZW50LlwiKTtcbiAgICAgICAgICAgIGNhc2UgNTpcbiAgICAgICAgICAgICAgZGF0YSA9IHtcbiAgICAgICAgICAgICAgICBmaWxlOiBmaWxlXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIHJldHVybiBfY29udGV4dDYuYWJydXB0KFwicmV0dXJuXCIsIHRoaXMudHJhbnNwb3J0LnNlbmQoX1dpZGdldEFwaUFjdGlvbi5XaWRnZXRBcGlGcm9tV2lkZ2V0QWN0aW9uLk1TQzQwMzlVcGxvYWRGaWxlQWN0aW9uLCBkYXRhKSk7XG4gICAgICAgICAgICBjYXNlIDc6XG4gICAgICAgICAgICBjYXNlIFwiZW5kXCI6XG4gICAgICAgICAgICAgIHJldHVybiBfY29udGV4dDYuc3RvcCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgX2NhbGxlZTYsIHRoaXMpO1xuICAgICAgfSkpO1xuICAgICAgZnVuY3Rpb24gdXBsb2FkRmlsZShfeDEyKSB7XG4gICAgICAgIHJldHVybiBfdXBsb2FkRmlsZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHVwbG9hZEZpbGU7XG4gICAgfSgpXG4gICAgLyoqXG4gICAgICogRG93bmxvYWQgYSBmaWxlIGZyb20gdGhlIG1lZGlhIHJlcG9zaXRvcnkgb24gdGhlIGhvbWVzZXJ2ZXIuXG4gICAgICogQHBhcmFtIGNvbnRlbnRVcmkgLSBNWEMgVVJJIG9mIHRoZSBmaWxlIHRvIGRvd25sb2FkLlxuICAgICAqIEByZXR1cm5zIFJlc29sdmVzIHRvIHRoZSBjb250ZW50cyBvZiB0aGUgZmlsZS5cbiAgICAgKi9cbiAgfSwge1xuICAgIGtleTogXCJkb3dubG9hZEZpbGVcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIF9kb3dubG9hZEZpbGUgPSBfYXN5bmNUb0dlbmVyYXRvciggLyojX19QVVJFX18qL19yZWdlbmVyYXRvclJ1bnRpbWUoKS5tYXJrKGZ1bmN0aW9uIF9jYWxsZWU3KGNvbnRlbnRVcmkpIHtcbiAgICAgICAgdmFyIHZlcnNpb25zLCBkYXRhO1xuICAgICAgICByZXR1cm4gX3JlZ2VuZXJhdG9yUnVudGltZSgpLndyYXAoZnVuY3Rpb24gX2NhbGxlZTckKF9jb250ZXh0Nykge1xuICAgICAgICAgIHdoaWxlICgxKSBzd2l0Y2ggKF9jb250ZXh0Ny5wcmV2ID0gX2NvbnRleHQ3Lm5leHQpIHtcbiAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgICAgX2NvbnRleHQ3Lm5leHQgPSAyO1xuICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRDbGllbnRWZXJzaW9ucygpO1xuICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICB2ZXJzaW9ucyA9IF9jb250ZXh0Ny5zZW50O1xuICAgICAgICAgICAgICBpZiAodmVyc2lvbnMuaW5jbHVkZXMoX0FwaVZlcnNpb24uVW5zdGFibGVBcGlWZXJzaW9uLk1TQzQwMzkpKSB7XG4gICAgICAgICAgICAgICAgX2NvbnRleHQ3Lm5leHQgPSA1O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSBkb3dubG9hZF9maWxlIGFjdGlvbiBpcyBub3Qgc3VwcG9ydGVkIGJ5IHRoZSBjbGllbnQuXCIpO1xuICAgICAgICAgICAgY2FzZSA1OlxuICAgICAgICAgICAgICBkYXRhID0ge1xuICAgICAgICAgICAgICAgIGNvbnRlbnRfdXJpOiBjb250ZW50VXJpXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIHJldHVybiBfY29udGV4dDcuYWJydXB0KFwicmV0dXJuXCIsIHRoaXMudHJhbnNwb3J0LnNlbmQoX1dpZGdldEFwaUFjdGlvbi5XaWRnZXRBcGlGcm9tV2lkZ2V0QWN0aW9uLk1TQzQwMzlEb3dubG9hZEZpbGVBY3Rpb24sIGRhdGEpKTtcbiAgICAgICAgICAgIGNhc2UgNzpcbiAgICAgICAgICAgIGNhc2UgXCJlbmRcIjpcbiAgICAgICAgICAgICAgcmV0dXJuIF9jb250ZXh0Ny5zdG9wKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LCBfY2FsbGVlNywgdGhpcyk7XG4gICAgICB9KSk7XG4gICAgICBmdW5jdGlvbiBkb3dubG9hZEZpbGUoX3gxMykge1xuICAgICAgICByZXR1cm4gX2Rvd25sb2FkRmlsZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGRvd25sb2FkRmlsZTtcbiAgICB9KClcbiAgICAvKipcbiAgICAgKiBTdGFydHMgdGhlIGNvbW11bmljYXRpb24gY2hhbm5lbC4gVGhpcyBzaG91bGQgYmUgZG9uZSBlYXJseSB0byBlbnN1cmVcbiAgICAgKiB0aGF0IG1lc3NhZ2VzIGFyZSBub3QgbWlzc2VkLiBDb21tdW5pY2F0aW9uIGNhbiBvbmx5IGJlIHN0b3BwZWQgYnkgdGhlIGNsaWVudC5cbiAgICAgKi9cbiAgfSwge1xuICAgIGtleTogXCJzdGFydFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzdGFydCgpIHtcbiAgICAgIHZhciBfdGhpczYgPSB0aGlzO1xuICAgICAgdGhpcy50cmFuc3BvcnQuc3RhcnQoKTtcbiAgICAgIHRoaXMuZ2V0Q2xpZW50VmVyc2lvbnMoKS50aGVuKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgIGlmICh2LmluY2x1ZGVzKF9BcGlWZXJzaW9uLlVuc3RhYmxlQXBpVmVyc2lvbi5NU0MyOTc0KSkge1xuICAgICAgICAgIF90aGlzNi5zdXBwb3J0c01TQzI5NzRSZW5lZ290aWF0ZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJoYW5kbGVNZXNzYWdlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGhhbmRsZU1lc3NhZ2UoZXYpIHtcbiAgICAgIHZhciBhY3Rpb25FdiA9IG5ldyBDdXN0b21FdmVudChcImFjdGlvbjpcIi5jb25jYXQoZXYuZGV0YWlsLmFjdGlvbiksIHtcbiAgICAgICAgZGV0YWlsOiBldi5kZXRhaWwsXG4gICAgICAgIGNhbmNlbGFibGU6IHRydWVcbiAgICAgIH0pO1xuICAgICAgdGhpcy5lbWl0KFwiYWN0aW9uOlwiLmNvbmNhdChldi5kZXRhaWwuYWN0aW9uKSwgYWN0aW9uRXYpO1xuICAgICAgaWYgKCFhY3Rpb25Fdi5kZWZhdWx0UHJldmVudGVkKSB7XG4gICAgICAgIHN3aXRjaCAoZXYuZGV0YWlsLmFjdGlvbikge1xuICAgICAgICAgIGNhc2UgX1dpZGdldEFwaUFjdGlvbi5XaWRnZXRBcGlUb1dpZGdldEFjdGlvbi5TdXBwb3J0ZWRBcGlWZXJzaW9uczpcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlcGx5VmVyc2lvbnMoZXYuZGV0YWlsKTtcbiAgICAgICAgICBjYXNlIF9XaWRnZXRBcGlBY3Rpb24uV2lkZ2V0QXBpVG9XaWRnZXRBY3Rpb24uQ2FwYWJpbGl0aWVzOlxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlQ2FwYWJpbGl0aWVzKGV2LmRldGFpbCk7XG4gICAgICAgICAgY2FzZSBfV2lkZ2V0QXBpQWN0aW9uLldpZGdldEFwaVRvV2lkZ2V0QWN0aW9uLlVwZGF0ZVZpc2liaWxpdHk6XG4gICAgICAgICAgICByZXR1cm4gdGhpcy50cmFuc3BvcnQucmVwbHkoZXYuZGV0YWlsLCB7fSk7XG4gICAgICAgICAgLy8gYWNrIHRvIGF2b2lkIGVycm9yIHNwYW1cbiAgICAgICAgICBjYXNlIF9XaWRnZXRBcGlBY3Rpb24uV2lkZ2V0QXBpVG9XaWRnZXRBY3Rpb24uTm90aWZ5Q2FwYWJpbGl0aWVzOlxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudHJhbnNwb3J0LnJlcGx5KGV2LmRldGFpbCwge30pO1xuICAgICAgICAgIC8vIGFjayB0byBhdm9pZCBlcnJvciBzcGFtXG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnRyYW5zcG9ydC5yZXBseShldi5kZXRhaWwsIHtcbiAgICAgICAgICAgICAgZXJyb3I6IHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBcIlVua25vd24gb3IgdW5zdXBwb3J0ZWQgYWN0aW9uOiBcIiArIGV2LmRldGFpbC5hY3Rpb25cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwicmVwbHlWZXJzaW9uc1wiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiByZXBseVZlcnNpb25zKHJlcXVlc3QpIHtcbiAgICAgIHRoaXMudHJhbnNwb3J0LnJlcGx5KHJlcXVlc3QsIHtcbiAgICAgICAgc3VwcG9ydGVkX3ZlcnNpb25zOiBfQXBpVmVyc2lvbi5DdXJyZW50QXBpVmVyc2lvbnNcbiAgICAgIH0pO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJnZXRDbGllbnRWZXJzaW9uc1wiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRDbGllbnRWZXJzaW9ucygpIHtcbiAgICAgIHZhciBfdGhpczcgPSB0aGlzO1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkodGhpcy5jYWNoZWRDbGllbnRWZXJzaW9ucykpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLmNhY2hlZENsaWVudFZlcnNpb25zKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLnRyYW5zcG9ydC5zZW5kKF9XaWRnZXRBcGlBY3Rpb24uV2lkZ2V0QXBpRnJvbVdpZGdldEFjdGlvbi5TdXBwb3J0ZWRBcGlWZXJzaW9ucywge30pLnRoZW4oZnVuY3Rpb24gKHIpIHtcbiAgICAgICAgX3RoaXM3LmNhY2hlZENsaWVudFZlcnNpb25zID0gci5zdXBwb3J0ZWRfdmVyc2lvbnM7XG4gICAgICAgIHJldHVybiByLnN1cHBvcnRlZF92ZXJzaW9ucztcbiAgICAgIH0pW1wiY2F0Y2hcIl0oZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgY29uc29sZS53YXJuKFwibm9uLWZhdGFsIGVycm9yIGdldHRpbmcgc3VwcG9ydGVkIGNsaWVudCB2ZXJzaW9uczogXCIsIGUpO1xuICAgICAgICByZXR1cm4gW107XG4gICAgICB9KTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiaGFuZGxlQ2FwYWJpbGl0aWVzXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGhhbmRsZUNhcGFiaWxpdGllcyhyZXF1ZXN0KSB7XG4gICAgICB2YXIgX3RoaXM4ID0gdGhpcztcbiAgICAgIGlmICh0aGlzLmNhcGFiaWxpdGllc0ZpbmlzaGVkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRyYW5zcG9ydC5yZXBseShyZXF1ZXN0LCB7XG4gICAgICAgICAgZXJyb3I6IHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IFwiQ2FwYWJpbGl0eSBuZWdvdGlhdGlvbiBhbHJlYWR5IGNvbXBsZXRlZFwiXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gU2VlIGlmIHdlIGNhbiBleHBlY3QgYSBjYXBhYmlsaXRpZXMgbm90aWZpY2F0aW9uIG9yIG5vdFxuICAgICAgcmV0dXJuIHRoaXMuZ2V0Q2xpZW50VmVyc2lvbnMoKS50aGVuKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgIGlmICh2LmluY2x1ZGVzKF9BcGlWZXJzaW9uLlVuc3RhYmxlQXBpVmVyc2lvbi5NU0MyODcxKSkge1xuICAgICAgICAgIF90aGlzOC5vbmNlKFwiYWN0aW9uOlwiLmNvbmNhdChfV2lkZ2V0QXBpQWN0aW9uLldpZGdldEFwaVRvV2lkZ2V0QWN0aW9uLk5vdGlmeUNhcGFiaWxpdGllcyksIGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgX3RoaXM4LmFwcHJvdmVkQ2FwYWJpbGl0aWVzID0gZXYuZGV0YWlsLmRhdGEuYXBwcm92ZWQ7XG4gICAgICAgICAgICBfdGhpczguZW1pdChcInJlYWR5XCIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGlmIHdlIGNhbid0IGV4cGVjdCBub3RpZmljYXRpb24sIHdlJ3JlIGFzIGRvbmUgYXMgd2UgY2FuIGJlXG4gICAgICAgICAgX3RoaXM4LmVtaXQoXCJyZWFkeVwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGluIGVpdGhlciBjYXNlLCByZXBseSB0byB0aGF0IGNhcGFiaWxpdGllcyByZXF1ZXN0XG4gICAgICAgIF90aGlzOC5jYXBhYmlsaXRpZXNGaW5pc2hlZCA9IHRydWU7XG4gICAgICAgIHJldHVybiBfdGhpczgudHJhbnNwb3J0LnJlcGx5KHJlcXVlc3QsIHtcbiAgICAgICAgICBjYXBhYmlsaXRpZXM6IF90aGlzOC5yZXF1ZXN0ZWRDYXBhYmlsaXRpZXNcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1dKTtcbiAgcmV0dXJuIFdpZGdldEFwaTtcbn0oX2V2ZW50cy5FdmVudEVtaXR0ZXIpO1xuZXhwb3J0cy5XaWRnZXRBcGkgPSBXaWRnZXRBcGk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1XaWRnZXRBcGkuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLldpZGdldERyaXZlciA9IHZvaWQgMDtcbnZhciBfID0gcmVxdWlyZShcIi4uXCIpO1xuZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgXCJAYmFiZWwvaGVscGVycyAtIHR5cGVvZlwiOyByZXR1cm4gX3R5cGVvZiA9IFwiZnVuY3Rpb25cIiA9PSB0eXBlb2YgU3ltYm9sICYmIFwic3ltYm9sXCIgPT0gdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA/IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIHR5cGVvZiBvYmo7IH0gOiBmdW5jdGlvbiAob2JqKSB7IHJldHVybiBvYmogJiYgXCJmdW5jdGlvblwiID09IHR5cGVvZiBTeW1ib2wgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgJiYgb2JqICE9PSBTeW1ib2wucHJvdG90eXBlID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7IH0sIF90eXBlb2Yob2JqKTsgfVxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cbmZ1bmN0aW9uIF9kZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgX3RvUHJvcGVydHlLZXkoZGVzY3JpcHRvci5rZXkpLCBkZXNjcmlwdG9yKTsgfSB9XG5mdW5jdGlvbiBfY3JlYXRlQ2xhc3MoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIF9kZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDb25zdHJ1Y3RvciwgXCJwcm90b3R5cGVcIiwgeyB3cml0YWJsZTogZmFsc2UgfSk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfVxuZnVuY3Rpb24gX3RvUHJvcGVydHlLZXkoYXJnKSB7IHZhciBrZXkgPSBfdG9QcmltaXRpdmUoYXJnLCBcInN0cmluZ1wiKTsgcmV0dXJuIF90eXBlb2Yoa2V5KSA9PT0gXCJzeW1ib2xcIiA/IGtleSA6IFN0cmluZyhrZXkpOyB9XG5mdW5jdGlvbiBfdG9QcmltaXRpdmUoaW5wdXQsIGhpbnQpIHsgaWYgKF90eXBlb2YoaW5wdXQpICE9PSBcIm9iamVjdFwiIHx8IGlucHV0ID09PSBudWxsKSByZXR1cm4gaW5wdXQ7IHZhciBwcmltID0gaW5wdXRbU3ltYm9sLnRvUHJpbWl0aXZlXTsgaWYgKHByaW0gIT09IHVuZGVmaW5lZCkgeyB2YXIgcmVzID0gcHJpbS5jYWxsKGlucHV0LCBoaW50IHx8IFwiZGVmYXVsdFwiKTsgaWYgKF90eXBlb2YocmVzKSAhPT0gXCJvYmplY3RcIikgcmV0dXJuIHJlczsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkBAdG9QcmltaXRpdmUgbXVzdCByZXR1cm4gYSBwcmltaXRpdmUgdmFsdWUuXCIpOyB9IHJldHVybiAoaGludCA9PT0gXCJzdHJpbmdcIiA/IFN0cmluZyA6IE51bWJlcikoaW5wdXQpOyB9IC8qXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICogQ29weXJpZ2h0IDIwMjAgLSAyMDI0IFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqICAgICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKi9cbi8qKlxuICogUmVwcmVzZW50cyB0aGUgZnVuY3Rpb25zIGFuZCBiZWhhdmlvdXIgdGhlIHdpZGdldC1hcGkgaXMgdW5hYmxlIHRvXG4gKiBkbywgc3VjaCBhcyBwcm9tcHRpbmcgdGhlIHVzZXIgZm9yIGluZm9ybWF0aW9uIG9yIGludGVyYWN0aW5nIHdpdGhcbiAqIHRoZSBVSS4gQ2xpZW50cyBhcmUgZXhwZWN0ZWQgdG8gaW1wbGVtZW50IHRoaXMgY2xhc3MgYW5kIG92ZXJyaWRlXG4gKiBhbnkgZnVuY3Rpb25zIHRoZXkgbmVlZC93YW50IHRvIHN1cHBvcnQuXG4gKlxuICogVGhpcyBjbGFzcyBhc3N1bWVzIHRoZSBjbGllbnQgd2lsbCBoYXZlIGEgY29udGV4dCBvZiBhIFdpZGdldFxuICogaW5zdGFuY2UgYWxyZWFkeS5cbiAqL1xudmFyIFdpZGdldERyaXZlciA9IC8qI19fUFVSRV9fKi9mdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIFdpZGdldERyaXZlcigpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgV2lkZ2V0RHJpdmVyKTtcbiAgfVxuICBfY3JlYXRlQ2xhc3MoV2lkZ2V0RHJpdmVyLCBbe1xuICAgIGtleTogXCJ2YWxpZGF0ZUNhcGFiaWxpdGllc1wiLFxuICAgIHZhbHVlOlxuICAgIC8qKlxuICAgICAqIFZlcmlmaWVzIHRoZSB3aWRnZXQncyByZXF1ZXN0ZWQgY2FwYWJpbGl0aWVzLCByZXR1cm5pbmcgdGhlIG9uZXNcbiAgICAgKiBpdCBpcyBhcHByb3ZlZCB0byB1c2UuIE11dGF0aW5nIHRoZSByZXF1ZXN0ZWQgY2FwYWJpbGl0aWVzIHdpbGxcbiAgICAgKiBoYXZlIG5vIGVmZmVjdC5cbiAgICAgKlxuICAgICAqIFRoaXMgU0hPVUxEIHJlc3VsdCBpbiB0aGUgdXNlciBiZWluZyBwcm9tcHRlZCB0byBhcHByb3ZlL2RlbnlcbiAgICAgKiBjYXBhYmlsaXRpZXMuXG4gICAgICpcbiAgICAgKiBCeSBkZWZhdWx0IHRoaXMgcmVqZWN0cyBhbGwgY2FwYWJpbGl0aWVzIChyZXR1cm5zIGFuIGVtcHR5IHNldCkuXG4gICAgICogQHBhcmFtIHtTZXQ8Q2FwYWJpbGl0eT59IHJlcXVlc3RlZCBUaGUgc2V0IG9mIHJlcXVlc3RlZCBjYXBhYmlsaXRpZXMuXG4gICAgICogQHJldHVybnMge1Byb21pc2U8U2V0PENhcGFiaWxpdHk+Pn0gUmVzb2x2ZXMgdG8gdGhlIGFsbG93ZWQgY2FwYWJpbGl0aWVzLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHZhbGlkYXRlQ2FwYWJpbGl0aWVzKHJlcXVlc3RlZCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShuZXcgU2V0KCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNlbmRzIGFuIGV2ZW50IGludG8gYSByb29tLiBJZiBgcm9vbUlkYCBpcyBmYWxzeSwgdGhlIGNsaWVudCBzaG91bGQgc2VuZCB0aGUgZXZlbnRcbiAgICAgKiBpbnRvIHRoZSByb29tIHRoZSB1c2VyIGlzIGN1cnJlbnRseSBsb29raW5nIGF0LiBUaGUgd2lkZ2V0IEFQSSB3aWxsIGhhdmUgYWxyZWFkeVxuICAgICAqIHZlcmlmaWVkIHRoYXQgdGhlIHdpZGdldCBpcyBjYXBhYmxlIG9mIHNlbmRpbmcgdGhlIGV2ZW50IHRvIHRoYXQgcm9vbS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRUeXBlIFRoZSBldmVudCB0eXBlIHRvIGJlIHNlbnQuXG4gICAgICogQHBhcmFtIHsqfSBjb250ZW50IFRoZSBjb250ZW50IGZvciB0aGUgZXZlbnQuXG4gICAgICogQHBhcmFtIHtzdHJpbmd8bnVsbH0gc3RhdGVLZXkgVGhlIHN0YXRlIGtleSBpZiB0aGlzIGlzIGEgc3RhdGUgZXZlbnQsIG90aGVyd2lzZSBudWxsLlxuICAgICAqIE1heSBiZSBhbiBlbXB0eSBzdHJpbmcuXG4gICAgICogQHBhcmFtIHtzdHJpbmd8bnVsbH0gcm9vbUlkIFRoZSByb29tIElEIHRvIHNlbmQgdGhlIGV2ZW50IHRvLiBJZiBmYWxzeSwgdGhlIHJvb20gdGhlXG4gICAgICogdXNlciBpcyBjdXJyZW50bHkgbG9va2luZyBhdC5cbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxJU2VuZEV2ZW50RGV0YWlscz59IFJlc29sdmVzIHdoZW4gdGhlIGV2ZW50IGhhcyBiZWVuIHNlbnQgd2l0aFxuICAgICAqIGRldGFpbHMgb2YgdGhhdCBldmVudC5cbiAgICAgKiBAdGhyb3dzIFJlamVjdGVkIHdoZW4gdGhlIGV2ZW50IGNvdWxkIG5vdCBiZSBzZW50LlxuICAgICAqL1xuICB9LCB7XG4gICAga2V5OiBcInNlbmRFdmVudFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzZW5kRXZlbnQoZXZlbnRUeXBlLCBjb250ZW50KSB7XG4gICAgICB2YXIgc3RhdGVLZXkgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6IG51bGw7XG4gICAgICB2YXIgcm9vbUlkID0gYXJndW1lbnRzLmxlbmd0aCA+IDMgJiYgYXJndW1lbnRzWzNdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbM10gOiBudWxsO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcIkZhaWxlZCB0byBvdmVycmlkZSBmdW5jdGlvblwiKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGV4cGVyaW1lbnRhbCBQYXJ0IG9mIE1TQzQxNDAgJiBNU0M0MTU3XG4gICAgICogU2VuZHMgYSBkZWxheWVkIGV2ZW50IGludG8gYSByb29tLiBJZiBgcm9vbUlkYCBpcyBmYWxzeSwgdGhlIGNsaWVudCBzaG91bGQgc2VuZCBpdFxuICAgICAqIGludG8gdGhlIHJvb20gdGhlIHVzZXIgaXMgY3VycmVudGx5IGxvb2tpbmcgYXQuIFRoZSB3aWRnZXQgQVBJIHdpbGwgaGF2ZSBhbHJlYWR5XG4gICAgICogdmVyaWZpZWQgdGhhdCB0aGUgd2lkZ2V0IGlzIGNhcGFibGUgb2Ygc2VuZGluZyB0aGUgZXZlbnQgdG8gdGhhdCByb29tLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfG51bGx9IGRlbGF5IEhvdyBtdWNoIGxhdGVyIHRvIHNlbmQgdGhlIGV2ZW50LCBvciBudWxsIHRvIG5vdCBzZW5kIHRoZVxuICAgICAqIGV2ZW50IGF1dG9tYXRpY2FsbHkuIE1heSBub3QgYmUgbnVsbCBpZiB7QGxpbmsgcGFyZW50RGVsYXlJZH0gaXMgbnVsbC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xudWxsfSBwYXJlbnREZWxheUlkIFRoZSBJRCBvZiB0aGUgZGVsYXllZCBldmVudCB0aGlzIG9uZSBpcyBncm91cGVkIHdpdGgsXG4gICAgICogb3IgbnVsbCBpZiBpdCB3aWxsIGJlIHB1dCBpbiBhIG5ldyBncm91cC4gTWF5IG5vdCBiZSBudWxsIGlmIHtAbGluayBkZWxheX0gaXMgbnVsbC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRUeXBlIFRoZSBldmVudCB0eXBlIG9mIHRoZSBldmVudCB0byBiZSBzZW50LlxuICAgICAqIEBwYXJhbSB7Kn0gY29udGVudCBUaGUgY29udGVudCBmb3IgdGhlIGV2ZW50IHRvIGJlIHNlbnQuXG4gICAgICogQHBhcmFtIHtzdHJpbmd8bnVsbH0gc3RhdGVLZXkgVGhlIHN0YXRlIGtleSBpZiB0aGUgZXZlbnQgdG8gYmUgc2VudCBhIHN0YXRlIGV2ZW50LFxuICAgICAqIG90aGVyd2lzZSBudWxsLiBNYXkgYmUgYW4gZW1wdHkgc3RyaW5nLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfG51bGx9IHJvb21JZCBUaGUgcm9vbSBJRCB0byBzZW5kIHRoZSBldmVudCB0by4gSWYgZmFsc3ksIHRoZSByb29tIHRoZVxuICAgICAqIHVzZXIgaXMgY3VycmVudGx5IGxvb2tpbmcgYXQuXG4gICAgICogQHJldHVybnMge1Byb21pc2U8SVNlbmREZWxheWVkRXZlbnREZXRhaWxzPn0gUmVzb2x2ZXMgd2hlbiB0aGUgZGVsYXllZCBldmVudCBoYXMgYmVlblxuICAgICAqIHByZXBhcmVkIHdpdGggZGV0YWlscyBvZiBob3cgdG8gcmVmZXIgdG8gaXQgZm9yIHVwZGF0aW5nL3NlbmRpbmcvY2FuY2VsaW5nIGl0IGxhdGVyLlxuICAgICAqIEB0aHJvd3MgUmVqZWN0ZWQgd2hlbiB0aGUgZGVsYXllZCBldmVudCBjb3VsZCBub3QgYmUgc2VudC5cbiAgICAgKi9cbiAgfSwge1xuICAgIGtleTogXCJzZW5kRGVsYXllZEV2ZW50XCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHNlbmREZWxheWVkRXZlbnQoZGVsYXksIHBhcmVudERlbGF5SWQsIGV2ZW50VHlwZSwgY29udGVudCkge1xuICAgICAgdmFyIHN0YXRlS2V5ID0gYXJndW1lbnRzLmxlbmd0aCA+IDQgJiYgYXJndW1lbnRzWzRdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbNF0gOiBudWxsO1xuICAgICAgdmFyIHJvb21JZCA9IGFyZ3VtZW50cy5sZW5ndGggPiA1ICYmIGFyZ3VtZW50c1s1XSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzVdIDogbnVsbDtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoXCJGYWlsZWQgdG8gb3ZlcnJpZGUgZnVuY3Rpb25cIikpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBleHBlcmltZW50YWwgUGFydCBvZiBNU0M0MTQwICYgTVNDNDE1N1xuICAgICAqIFJ1biB0aGUgc3BlY2lmaWVkIHtAbGluayBhY3Rpb259IGZvciB0aGUgZGVsYXllZCBldmVudCBtYXRjaGluZyB0aGUgcHJvdmlkZWQge0BsaW5rIGRlbGF5SWR9LlxuICAgICAqIEB0aHJvd3MgUmVqZWN0ZWQgd2hlbiB0aGVyZSBpcyBubyBtYXRjaGluZyBkZWxheWVkIGV2ZW50LCBvciB3aGVuIHRoZSBhY3Rpb24gZmFpbGVkIHRvIHJ1bi5cbiAgICAgKi9cbiAgfSwge1xuICAgIGtleTogXCJ1cGRhdGVEZWxheWVkRXZlbnRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gdXBkYXRlRGVsYXllZEV2ZW50KGRlbGF5SWQsIGFjdGlvbikge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcIkZhaWxlZCB0byBvdmVycmlkZSBmdW5jdGlvblwiKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2VuZHMgYSB0by1kZXZpY2UgZXZlbnQuIFRoZSB3aWRnZXQgQVBJIHdpbGwgaGF2ZSBhbHJlYWR5IHZlcmlmaWVkIHRoYXQgdGhlIHdpZGdldFxuICAgICAqIGlzIGNhcGFibGUgb2Ygc2VuZGluZyB0aGUgZXZlbnQuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50VHlwZSBUaGUgZXZlbnQgdHlwZSB0byBiZSBzZW50LlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gZW5jcnlwdGVkIFdoZXRoZXIgdG8gZW5jcnlwdCB0aGUgbWVzc2FnZSBjb250ZW50cy5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY29udGVudE1hcCBBIG1hcCBmcm9tIHVzZXIgSUQgYW5kIGRldmljZSBJRCB0byBldmVudCBjb250ZW50LlxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fSBSZXNvbHZlcyB3aGVuIHRoZSBldmVudCBoYXMgYmVlbiBzZW50LlxuICAgICAqIEB0aHJvd3MgUmVqZWN0ZWQgd2hlbiB0aGUgZXZlbnQgY291bGQgbm90IGJlIHNlbnQuXG4gICAgICovXG4gIH0sIHtcbiAgICBrZXk6IFwic2VuZFRvRGV2aWNlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHNlbmRUb0RldmljZShldmVudFR5cGUsIGVuY3J5cHRlZCwgY29udGVudE1hcCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcIkZhaWxlZCB0byBvdmVycmlkZSBmdW5jdGlvblwiKSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlYWRzIGFuIGVsZW1lbnQgb2Ygcm9vbSBhY2NvdW50IGRhdGEuIFRoZSB3aWRnZXQgQVBJIHdpbGwgaGF2ZSBhbHJlYWR5IHZlcmlmaWVkIHRoYXQgdGhlIHdpZGdldCBpc1xuICAgICAqIGNhcGFibGUgb2YgcmVjZWl2aW5nIHRoZSBgZXZlbnRUeXBlYCBvZiB0aGUgcmVxdWVzdGVkIGluZm9ybWF0aW9uLiBJZiBgcm9vbUlkc2AgaXMgc3VwcGxpZWQsIGl0IG1heVxuICAgICAqIGNvbnRhaW4gYFN5bWJvbHMuQW55Um9vbWAgdG8gZGVub3RlIHRoYXQgdGhlIHBpZWNlIG9mIHJvb20gYWNjb3VudCBkYXRhIGluIGVhY2ggb2YgdGhlIGNsaWVudCdzIGtub3duXG4gICAgICogcm9vbXMgc2hvdWxkIGJlIHJldHVybmVkLiBXaGVuIGBudWxsYCwgb25seSB0aGUgcm9vbSB0aGUgdXNlciBpcyBjdXJyZW50bHkgbG9va2luZyBhdCBzaG91bGQgYmUgY29uc2lkZXJlZC5cbiAgICAgKiBAcGFyYW0gZXZlbnRUeXBlIFRoZSBldmVudCB0eXBlIHRvIGJlIHJlYWQuXG4gICAgICogQHBhcmFtIHJvb21JZHMgV2hlbiBudWxsLCB0aGUgdXNlcidzIGN1cnJlbnRseSB2aWV3ZWQgcm9vbS4gT3RoZXJ3aXNlLCB0aGUgbGlzdCBvZiByb29tIElEc1xuICAgICAqIHRvIGxvb2sgd2l0aGluLCBwb3NzaWJseSBjb250YWluaW5nIFN5bWJvbHMuQW55Um9vbSB0byBkZW5vdGUgYWxsIGtub3duIHJvb21zLlxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPElSb29tQWNjb3VudERhdGFbXT59IFJlc29sdmVzIHRvIHRoZSBlbGVtZW50IG9mIHJvb20gYWNjb3VudCBkYXRhLCBvciBhbiBlbXB0eSBhcnJheS5cbiAgICAgKi9cbiAgfSwge1xuICAgIGtleTogXCJyZWFkUm9vbUFjY291bnREYXRhXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHJlYWRSb29tQWNjb3VudERhdGEoZXZlbnRUeXBlKSB7XG4gICAgICB2YXIgcm9vbUlkcyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDogbnVsbDtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlYWRzIGFsbCBldmVudHMgb2YgdGhlIGdpdmVuIHR5cGUsIGFuZCBvcHRpb25hbGx5IGBtc2d0eXBlYCAoaWYgYXBwbGljYWJsZS9kZWZpbmVkKSxcbiAgICAgKiB0aGUgdXNlciBoYXMgYWNjZXNzIHRvLiBUaGUgd2lkZ2V0IEFQSSB3aWxsIGhhdmUgYWxyZWFkeSB2ZXJpZmllZCB0aGF0IHRoZSB3aWRnZXQgaXNcbiAgICAgKiBjYXBhYmxlIG9mIHJlY2VpdmluZyB0aGUgZXZlbnRzLiBMZXNzIGV2ZW50cyB0aGFuIHRoZSBsaW1pdCBhcmUgYWxsb3dlZCB0byBiZSByZXR1cm5lZCxcbiAgICAgKiBidXQgbm90IG1vcmUuIElmIGByb29tSWRzYCBpcyBzdXBwbGllZCwgaXQgbWF5IGNvbnRhaW4gYFN5bWJvbHMuQW55Um9vbWAgdG8gZGVub3RlIHRoYXRcbiAgICAgKiBgbGltaXRgIGluIGVhY2ggb2YgdGhlIGNsaWVudCdzIGtub3duIHJvb21zIHNob3VsZCBiZSByZXR1cm5lZC4gV2hlbiBgbnVsbGAsIG9ubHkgdGhlXG4gICAgICogcm9vbSB0aGUgdXNlciBpcyBjdXJyZW50bHkgbG9va2luZyBhdCBzaG91bGQgYmUgY29uc2lkZXJlZC4gSWYgYHNpbmNlYCBpcyBzcGVjaWZpZWQgYnV0XG4gICAgICogdGhlIGV2ZW50IElEIGlzbid0IHByZXNlbnQgaW4gdGhlIG51bWJlciBvZiBldmVudHMgZmV0Y2hlZCBieSB0aGUgY2xpZW50IGR1ZSB0byBgbGltaXRgLFxuICAgICAqIHRoZSBjbGllbnQgd2lsbCByZXR1cm4gYWxsIHRoZSBldmVudHMuXG4gICAgICogQHBhcmFtIGV2ZW50VHlwZSBUaGUgZXZlbnQgdHlwZSB0byBiZSByZWFkLlxuICAgICAqIEBwYXJhbSBtc2d0eXBlIFRoZSBtc2d0eXBlIG9mIHRoZSBldmVudHMgdG8gYmUgcmVhZCwgaWYgYXBwbGljYWJsZS9kZWZpbmVkLlxuICAgICAqIEBwYXJhbSBsaW1pdCBUaGUgbWF4aW11bSBudW1iZXIgb2YgZXZlbnRzIHRvIHJldHJpZXZlIHBlciByb29tLiBXaWxsIGJlIHplcm8gdG8gZGVub3RlIFwiYXMgbWFueVxuICAgICAqIGFzIHBvc3NpYmxlXCIuXG4gICAgICogQHBhcmFtIHJvb21JZHMgV2hlbiBudWxsLCB0aGUgdXNlcidzIGN1cnJlbnRseSB2aWV3ZWQgcm9vbS4gT3RoZXJ3aXNlLCB0aGUgbGlzdCBvZiByb29tIElEc1xuICAgICAqIHRvIGxvb2sgd2l0aGluLCBwb3NzaWJseSBjb250YWluaW5nIFN5bWJvbHMuQW55Um9vbSB0byBkZW5vdGUgYWxsIGtub3duIHJvb21zLlxuICAgICAqIEBwYXJhbSBzaW5jZSBXaGVuIG51bGwsIHJldHJpZXZlcyB0aGUgbnVtYmVyIG9mIGV2ZW50cyBzcGVjaWZpZWQgYnkgdGhlIFwibGltaXRcIiBwYXJhbWV0ZXIuXG4gICAgICogT3RoZXJ3aXNlLCB0aGUgZXZlbnQgSUQgYXQgd2hpY2ggb25seSBzdWJzZXF1ZW50IGV2ZW50cyB3aWxsIGJlIHJldHVybmVkLCBhcyBtYW55IGFzIHNwZWNpZmllZFxuICAgICAqIGluIFwibGltaXRcIi5cbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxJUm9vbUV2ZW50W10+fSBSZXNvbHZlcyB0byB0aGUgcm9vbSBldmVudHMsIG9yIGFuIGVtcHR5IGFycmF5LlxuICAgICAqL1xuICB9LCB7XG4gICAga2V5OiBcInJlYWRSb29tRXZlbnRzXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHJlYWRSb29tRXZlbnRzKGV2ZW50VHlwZSwgbXNndHlwZSwgbGltaXQpIHtcbiAgICAgIHZhciByb29tSWRzID0gYXJndW1lbnRzLmxlbmd0aCA+IDMgJiYgYXJndW1lbnRzWzNdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbM10gOiBudWxsO1xuICAgICAgdmFyIHNpbmNlID0gYXJndW1lbnRzLmxlbmd0aCA+IDQgPyBhcmd1bWVudHNbNF0gOiB1bmRlZmluZWQ7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWFkcyBhbGwgZXZlbnRzIG9mIHRoZSBnaXZlbiB0eXBlLCBhbmQgb3B0aW9uYWxseSBzdGF0ZSBrZXkgKGlmIGFwcGxpY2FibGUvZGVmaW5lZCksXG4gICAgICogdGhlIHVzZXIgaGFzIGFjY2VzcyB0by4gVGhlIHdpZGdldCBBUEkgd2lsbCBoYXZlIGFscmVhZHkgdmVyaWZpZWQgdGhhdCB0aGUgd2lkZ2V0IGlzXG4gICAgICogY2FwYWJsZSBvZiByZWNlaXZpbmcgdGhlIGV2ZW50cy4gTGVzcyBldmVudHMgdGhhbiB0aGUgbGltaXQgYXJlIGFsbG93ZWQgdG8gYmUgcmV0dXJuZWQsXG4gICAgICogYnV0IG5vdCBtb3JlLiBJZiBgcm9vbUlkc2AgaXMgc3VwcGxpZWQsIGl0IG1heSBjb250YWluIGBTeW1ib2xzLkFueVJvb21gIHRvIGRlbm90ZSB0aGF0XG4gICAgICogYGxpbWl0YCBpbiBlYWNoIG9mIHRoZSBjbGllbnQncyBrbm93biByb29tcyBzaG91bGQgYmUgcmV0dXJuZWQuIFdoZW4gYG51bGxgLCBvbmx5IHRoZVxuICAgICAqIHJvb20gdGhlIHVzZXIgaXMgY3VycmVudGx5IGxvb2tpbmcgYXQgc2hvdWxkIGJlIGNvbnNpZGVyZWQuXG4gICAgICogQHBhcmFtIGV2ZW50VHlwZSBUaGUgZXZlbnQgdHlwZSB0byBiZSByZWFkLlxuICAgICAqIEBwYXJhbSBzdGF0ZUtleSBUaGUgc3RhdGUga2V5IG9mIHRoZSBldmVudHMgdG8gYmUgcmVhZCwgaWYgYXBwbGljYWJsZS9kZWZpbmVkLlxuICAgICAqIEBwYXJhbSBsaW1pdCBUaGUgbWF4aW11bSBudW1iZXIgb2YgZXZlbnRzIHRvIHJldHJpZXZlLiBXaWxsIGJlIHplcm8gdG8gZGVub3RlIFwiYXMgbWFueVxuICAgICAqIGFzIHBvc3NpYmxlXCIuXG4gICAgICogQHBhcmFtIHJvb21JZHMgV2hlbiBudWxsLCB0aGUgdXNlcidzIGN1cnJlbnRseSB2aWV3ZWQgcm9vbS4gT3RoZXJ3aXNlLCB0aGUgbGlzdCBvZiByb29tIElEc1xuICAgICAqIHRvIGxvb2sgd2l0aGluLCBwb3NzaWJseSBjb250YWluaW5nIFN5bWJvbHMuQW55Um9vbSB0byBkZW5vdGUgYWxsIGtub3duIHJvb21zLlxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPElSb29tRXZlbnRbXT59IFJlc29sdmVzIHRvIHRoZSBzdGF0ZSBldmVudHMsIG9yIGFuIGVtcHR5IGFycmF5LlxuICAgICAqL1xuICB9LCB7XG4gICAga2V5OiBcInJlYWRTdGF0ZUV2ZW50c1wiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiByZWFkU3RhdGVFdmVudHMoZXZlbnRUeXBlLCBzdGF0ZUtleSwgbGltaXQpIHtcbiAgICAgIHZhciByb29tSWRzID0gYXJndW1lbnRzLmxlbmd0aCA+IDMgJiYgYXJndW1lbnRzWzNdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbM10gOiBudWxsO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVhZHMgYWxsIGV2ZW50cyB0aGF0IGFyZSByZWxhdGVkIHRvIGEgZ2l2ZW4gZXZlbnQuIFRoZSB3aWRnZXQgQVBJIHdpbGxcbiAgICAgKiBoYXZlIGFscmVhZHkgdmVyaWZpZWQgdGhhdCB0aGUgd2lkZ2V0IGlzIGNhcGFibGUgb2YgcmVjZWl2aW5nIHRoZSBldmVudCxcbiAgICAgKiBvciB3aWxsIG1ha2Ugc3VyZSB0byByZWplY3QgYWNjZXNzIHRvIGV2ZW50cyB3aGljaCBhcmUgcmV0dXJuZWQgZnJvbSB0aGlzXG4gICAgICogZnVuY3Rpb24sIGJ1dCBhcmUgbm90IGNhcGFibGUgb2YgcmVjZWl2aW5nLiBJZiBgcmVsYXRpb25UeXBlYCBvciBgZXZlbnRUeXBlYFxuICAgICAqIGFyZSBzZXQsIHRoZSByZXR1cm5lZCBldmVudHMgc2hvdWxkIGFscmVhZHkgYmUgZmlsdGVyZWQuIExlc3MgZXZlbnRzIHRoYW5cbiAgICAgKiB0aGUgbGltaXQgYXJlIGFsbG93ZWQgdG8gYmUgcmV0dXJuZWQsIGJ1dCBub3QgbW9yZS5cbiAgICAgKiBAcGFyYW0gZXZlbnRJZCBUaGUgaWQgb2YgdGhlIHBhcmVudCBldmVudCB0byBiZSByZWFkLlxuICAgICAqIEBwYXJhbSByb29tSWQgVGhlIHJvb20gdG8gbG9vayB3aXRoaW4uIFdoZW4gdW5kZWZpbmVkLCB0aGUgdXNlcidzXG4gICAgICogY3VycmVudGx5IHZpZXdlZCByb29tLlxuICAgICAqIEBwYXJhbSByZWxhdGlvblR5cGUgVGhlIHJlbGF0aW9uc2hpcCB0eXBlIG9mIGNoaWxkIGV2ZW50cyB0byBzZWFyY2ggZm9yLlxuICAgICAqIFdoZW4gdW5kZWZpbmVkLCBhbGwgcmVsYXRpb25zIGFyZSByZXR1cm5lZC5cbiAgICAgKiBAcGFyYW0gZXZlbnRUeXBlIFRoZSBldmVudCB0eXBlIG9mIGNoaWxkIGV2ZW50cyB0byBzZWFyY2ggZm9yLiBXaGVuIHVuZGVmaW5lZCxcbiAgICAgKiBhbGwgcmVsYXRlZCBldmVudHMgYXJlIHJldHVybmVkLlxuICAgICAqIEBwYXJhbSBmcm9tIFRoZSBwYWdpbmF0aW9uIHRva2VuIHRvIHN0YXJ0IHJldHVybmluZyByZXN1bHRzIGZyb20sIGFzXG4gICAgICogcmVjZWl2ZWQgZnJvbSBhIHByZXZpb3VzIGNhbGwuIElmIG5vdCBzdXBwbGllZCwgcmVzdWx0cyBzdGFydCBhdCB0aGUgbW9zdFxuICAgICAqIHJlY2VudCB0b3BvbG9naWNhbCBldmVudCBrbm93biB0byB0aGUgc2VydmVyLlxuICAgICAqIEBwYXJhbSB0byBUaGUgcGFnaW5hdGlvbiB0b2tlbiB0byBzdG9wIHJldHVybmluZyByZXN1bHRzIGF0LiBJZiBub3RcbiAgICAgKiBzdXBwbGllZCwgcmVzdWx0cyBjb250aW51ZSB1cCB0byBsaW1pdCBvciB1bnRpbCB0aGVyZSBhcmUgbm8gbW9yZSBldmVudHMuXG4gICAgICogQHBhcmFtIGxpbWl0IFRoZSBtYXhpbXVtIG51bWJlciBvZiBldmVudHMgdG8gcmV0cmlldmUgcGVyIHJvb20uIElmIG5vdFxuICAgICAqIHN1cHBsaWVkLCB0aGUgc2VydmVyIHdpbGwgYXBwbHkgYSBkZWZhdWx0IGxpbWl0LlxuICAgICAqIEBwYXJhbSBkaXJlY3Rpb24gVGhlIGRpcmVjdGlvbiB0byBzZWFyY2ggZm9yIGFjY29yZGluZyB0byBNU0MzNzE1XG4gICAgICogQHJldHVybnMgUmVzb2x2ZXMgdG8gdGhlIHJvb20gcmVsYXRpb25zLlxuICAgICAqL1xuICB9LCB7XG4gICAga2V5OiBcInJlYWRFdmVudFJlbGF0aW9uc1wiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiByZWFkRXZlbnRSZWxhdGlvbnMoZXZlbnRJZCwgcm9vbUlkLCByZWxhdGlvblR5cGUsIGV2ZW50VHlwZSwgZnJvbSwgdG8sIGxpbWl0LCBkaXJlY3Rpb24pIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xuICAgICAgICBjaHVuazogW11cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFza3MgdGhlIHVzZXIgZm9yIHBlcm1pc3Npb24gdG8gdmFsaWRhdGUgdGhlaXIgaWRlbnRpdHkgdGhyb3VnaCBPcGVuSUQgQ29ubmVjdC4gVGhlXG4gICAgICogaW50ZXJmYWNlIGZvciB0aGlzIGZ1bmN0aW9uIGlzIGFuIG9ic2VydmFibGUgd2hpY2ggYWNjZXB0cyB0aGUgc3RhdGUgbWFjaGluZSBvZiB0aGVcbiAgICAgKiBPSURDIGV4Y2hhbmdlIGZsb3cuIEZvciBleGFtcGxlLCBpZiB0aGUgY2xpZW50L3VzZXIgYmxvY2tzIHRoZSByZXF1ZXN0IHRoZW4gaXQgd291bGRcbiAgICAgKiBmZWVkIGJhY2sgYSBge3N0YXRlOiBCbG9ja2VkfWAgaW50byB0aGUgb2JzZXJ2YWJsZS4gU2ltaWxhcmx5LCBpZiB0aGUgdXNlciBhbHJlYWR5XG4gICAgICogYXBwcm92ZWQgdGhlIHdpZGdldCB0aGVuIGEgYHtzdGF0ZTogQWxsb3dlZH1gIHdvdWxkIGJlIGZlZCBpbnRvIHRoZSBvYnNlcnZhYmxlIGFsb25nc2lkZVxuICAgICAqIHRoZSB0b2tlbiBpdHNlbGYuIElmIHRoZSBjbGllbnQgaXMgYXNraW5nIGZvciBwZXJtaXNzaW9uLCBpdCBzaG91bGQgZmVlZCBpbiBhXG4gICAgICogYHtzdGF0ZTogUGVuZGluZ1VzZXJDb25maXJtYXRpb259YCBmb2xsb3dlZCBieSB0aGUgcmVsZXZhbnQgQWxsb3dlZCBvciBCbG9ja2VkIHN0YXRlLlxuICAgICAqXG4gICAgICogVGhlIHdpZGdldCBBUEkgd2lsbCByZWplY3QgdGhlIHdpZGdldCdzIHJlcXVlc3Qgd2l0aCBhbiBlcnJvciBpZiB0aGlzIGNvbnRyYWN0IGlzIG5vdFxuICAgICAqIG1ldCBwcm9wZXJseS4gQnkgZGVmYXVsdCwgdGhlIHdpZGdldCBkcml2ZXIgd2lsbCBibG9jayBhbGwgT0lEQyByZXF1ZXN0cy5cbiAgICAgKiBAcGFyYW0ge1NpbXBsZU9ic2VydmFibGU8SU9wZW5JRFVwZGF0ZT59IG9ic2VydmVyIFRoZSBvYnNlcnZhYmxlIHRvIGZlZWQgdXBkYXRlcyBpbnRvLlxuICAgICAqL1xuICB9LCB7XG4gICAga2V5OiBcImFza09wZW5JRFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBhc2tPcGVuSUQob2JzZXJ2ZXIpIHtcbiAgICAgIG9ic2VydmVyLnVwZGF0ZSh7XG4gICAgICAgIHN0YXRlOiBfLk9wZW5JRFJlcXVlc3RTdGF0ZS5CbG9ja2VkXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBOYXZpZ2F0ZXMgdGhlIGNsaWVudCB3aXRoIGEgbWF0cml4LnRvIFVSSS4gSW4gZnV0dXJlIHRoaXMgZnVuY3Rpb24gd2lsbCBhbHNvIGJlIHByb3ZpZGVkXG4gICAgICogd2l0aCB0aGUgTWF0cml4IFVSSXMgb25jZSBtYXRyaXgudG8gaXMgcmVwbGFjZWQuIFRoZSBnaXZlbiBVUkkgd2lsbCBoYXZlIGFscmVhZHkgYmVlblxuICAgICAqIGxpZ2h0bHkgY2hlY2tlZCB0byBlbnN1cmUgaXQgbG9va3MgbGlrZSBhIHZhbGlkIFVSSSwgdGhvdWdoIHRoZSBpbXBsZW1lbnRhdGlvbiBpcyByZWNvbW1lbmRlZFxuICAgICAqIHRvIGRvIGZ1cnRoZXIgY2hlY2tzIG9uIHRoZSBVUkkuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVyaSBUaGUgVVJJIHRvIG5hdmlnYXRlIHRvLlxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fSBSZXNvbHZlcyB3aGVuIGNvbXBsZXRlLlxuICAgICAqIEB0aHJvd3MgVGhyb3dzIGlmIHRoZXJlJ3MgYSBwcm9ibGVtIHdpdGggdGhlIG5hdmlnYXRpb24sIHN1Y2ggYXMgaW52YWxpZCBmb3JtYXQuXG4gICAgICovXG4gIH0sIHtcbiAgICBrZXk6IFwibmF2aWdhdGVcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gbmF2aWdhdGUodXJpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOYXZpZ2F0aW9uIGlzIG5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQb2xscyBmb3IgVFVSTiBzZXJ2ZXIgZGF0YSwgeWllbGRpbmcgYW4gaW5pdGlhbCBzZXQgb2YgY3JlZGVudGlhbHMgYXMgc29vbiBhcyBwb3NzaWJsZSwgYW5kXG4gICAgICogdGhlcmVhZnRlciB5aWVsZGluZyBuZXcgY3JlZGVudGlhbHMgd2hlbmV2ZXIgdGhlIHByZXZpb3VzIG9uZXMgZXhwaXJlLiBUaGUgd2lkZ2V0IEFQSSB3aWxsXG4gICAgICogaGF2ZSBhbHJlYWR5IHZlcmlmaWVkIHRoYXQgdGhlIHdpZGdldCBoYXMgcGVybWlzc2lvbiB0byBhY2Nlc3MgVFVSTiBzZXJ2ZXJzLlxuICAgICAqIEB5aWVsZHMge0lUdXJuU2VydmVyfSBUaGUgVFVSTiBzZXJ2ZXIgVVJJcyBhbmQgY3JlZGVudGlhbHMgY3VycmVudGx5IGF2YWlsYWJsZSB0byB0aGUgY2xpZW50LlxuICAgICAqL1xuICB9LCB7XG4gICAga2V5OiBcImdldFR1cm5TZXJ2ZXJzXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGdldFR1cm5TZXJ2ZXJzKCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVFVSTiBzZXJ2ZXIgc3VwcG9ydCBpcyBub3QgaW1wbGVtZW50ZWRcIik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2VhcmNoIGZvciB1c2VycyBpbiB0aGUgdXNlciBkaXJlY3RvcnkuXG4gICAgICogQHBhcmFtIHNlYXJjaFRlcm0gVGhlIHRlcm0gdG8gc2VhcmNoIGZvci5cbiAgICAgKiBAcGFyYW0gbGltaXQgVGhlIG1heGltdW0gbnVtYmVyIG9mIHJlc3VsdHMgdG8gcmV0dXJuLiBJZiBub3Qgc3VwcGxpZWQsIHRoZVxuICAgICAqIEByZXR1cm5zIFJlc29sdmVzIHRvIHRoZSBzZWFyY2ggcmVzdWx0cy5cbiAgICAgKi9cbiAgfSwge1xuICAgIGtleTogXCJzZWFyY2hVc2VyRGlyZWN0b3J5XCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHNlYXJjaFVzZXJEaXJlY3Rvcnkoc2VhcmNoVGVybSwgbGltaXQpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xuICAgICAgICBsaW1pdGVkOiBmYWxzZSxcbiAgICAgICAgcmVzdWx0czogW11cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgY29uZmlnIGZvciB0aGUgbWVkaWEgcmVwb3NpdG9yeS5cbiAgICAgKiBAcmV0dXJucyBQcm9taXNlIHdoaWNoIHJlc29sdmVzIHdpdGggYW4gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIGNvbmZpZy5cbiAgICAgKi9cbiAgfSwge1xuICAgIGtleTogXCJnZXRNZWRpYUNvbmZpZ1wiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRNZWRpYUNvbmZpZygpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkdldCBtZWRpYSBjb25maWcgaXMgbm90IGltcGxlbWVudGVkXCIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVwbG9hZCBhIGZpbGUgdG8gdGhlIG1lZGlhIHJlcG9zaXRvcnkgb24gdGhlIGhvbWVzZXJ2ZXIuXG4gICAgICogQHBhcmFtIGZpbGUgLSBUaGUgb2JqZWN0IHRvIHVwbG9hZC4gU29tZXRoaW5nIHRoYXQgY2FuIGJlIHNlbnQgdG9cbiAgICAgKiAgICAgICAgICAgICAgIFhNTEh0dHBSZXF1ZXN0LnNlbmQgKHR5cGljYWxseSBhIEZpbGUpLlxuICAgICAqIEByZXR1cm5zIFJlc29sdmVzIHRvIHRoZSBsb2NhdGlvbiBvZiB0aGUgdXBsb2FkZWQgZmlsZS5cbiAgICAgKi9cbiAgfSwge1xuICAgIGtleTogXCJ1cGxvYWRGaWxlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHVwbG9hZEZpbGUoZmlsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVXBsb2FkIGZpbGUgaXMgbm90IGltcGxlbWVudGVkXCIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERvd25sb2FkIGEgZmlsZSBmcm9tIHRoZSBtZWRpYSByZXBvc2l0b3J5IG9uIHRoZSBob21lc2VydmVyLlxuICAgICAqIEBwYXJhbSBjb250ZW50VXJpIC0gTVhDIFVSSSBvZiB0aGUgZmlsZSB0byBkb3dubG9hZC5cbiAgICAgKiBAcmV0dXJucyBSZXNvbHZlcyB0byB0aGUgY29udGVudHMgb2YgdGhlIGZpbGUuXG4gICAgICovXG4gIH0sIHtcbiAgICBrZXk6IFwiZG93bmxvYWRGaWxlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGRvd25sb2FkRmlsZShjb250ZW50VXJpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJEb3dubG9hZCBmaWxlIGlzIG5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFeHByZXNzZXMgYW4gZXJyb3IgdGhyb3duIGJ5IHRoaXMgZHJpdmVyIGluIGEgZm9ybWF0IGNvbXBhdGlibGUgd2l0aCB0aGUgV2lkZ2V0IEFQSS5cbiAgICAgKiBAcGFyYW0gZXJyb3IgVGhlIGVycm9yIHRvIGhhbmRsZS5cbiAgICAgKiBAcmV0dXJucyBUaGUgZXJyb3IgZXhwcmVzc2VkIGFzIGEge0BsaW5rIElXaWRnZXRBcGlFcnJvclJlc3BvbnNlRGF0YURldGFpbHN9LFxuICAgICAqIG9yIHVuZGVmaW5lZCBpZiBpdCBjYW5ub3QgYmUgZXhwcmVzc2VkIGFzIG9uZS5cbiAgICAgKi9cbiAgfSwge1xuICAgIGtleTogXCJwcm9jZXNzRXJyb3JcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gcHJvY2Vzc0Vycm9yKGVycm9yKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgfV0pO1xuICByZXR1cm4gV2lkZ2V0RHJpdmVyO1xufSgpO1xuZXhwb3J0cy5XaWRnZXREcml2ZXIgPSBXaWRnZXREcml2ZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1XaWRnZXREcml2ZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG52YXIgX1dpZGdldEFwaSA9IHJlcXVpcmUoXCIuL1dpZGdldEFwaVwiKTtcbk9iamVjdC5rZXlzKF9XaWRnZXRBcGkpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICBpZiAoa2V5ID09PSBcImRlZmF1bHRcIiB8fCBrZXkgPT09IFwiX19lc01vZHVsZVwiKSByZXR1cm47XG4gIGlmIChrZXkgaW4gZXhwb3J0cyAmJiBleHBvcnRzW2tleV0gPT09IF9XaWRnZXRBcGlba2V5XSkgcmV0dXJuO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7XG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiBfV2lkZ2V0QXBpW2tleV07XG4gICAgfVxuICB9KTtcbn0pO1xudmFyIF9DbGllbnRXaWRnZXRBcGkgPSByZXF1aXJlKFwiLi9DbGllbnRXaWRnZXRBcGlcIik7XG5PYmplY3Qua2V5cyhfQ2xpZW50V2lkZ2V0QXBpKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgaWYgKGtleSA9PT0gXCJkZWZhdWx0XCIgfHwga2V5ID09PSBcIl9fZXNNb2R1bGVcIikgcmV0dXJuO1xuICBpZiAoa2V5IGluIGV4cG9ydHMgJiYgZXhwb3J0c1trZXldID09PSBfQ2xpZW50V2lkZ2V0QXBpW2tleV0pIHJldHVybjtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gX0NsaWVudFdpZGdldEFwaVtrZXldO1xuICAgIH1cbiAgfSk7XG59KTtcbnZhciBfU3ltYm9scyA9IHJlcXVpcmUoXCIuL1N5bWJvbHNcIik7XG5PYmplY3Qua2V5cyhfU3ltYm9scykuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gIGlmIChrZXkgPT09IFwiZGVmYXVsdFwiIHx8IGtleSA9PT0gXCJfX2VzTW9kdWxlXCIpIHJldHVybjtcbiAgaWYgKGtleSBpbiBleHBvcnRzICYmIGV4cG9ydHNba2V5XSA9PT0gX1N5bWJvbHNba2V5XSkgcmV0dXJuO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7XG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiBfU3ltYm9sc1trZXldO1xuICAgIH1cbiAgfSk7XG59KTtcbnZhciBfSVRyYW5zcG9ydCA9IHJlcXVpcmUoXCIuL3RyYW5zcG9ydC9JVHJhbnNwb3J0XCIpO1xuT2JqZWN0LmtleXMoX0lUcmFuc3BvcnQpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICBpZiAoa2V5ID09PSBcImRlZmF1bHRcIiB8fCBrZXkgPT09IFwiX19lc01vZHVsZVwiKSByZXR1cm47XG4gIGlmIChrZXkgaW4gZXhwb3J0cyAmJiBleHBvcnRzW2tleV0gPT09IF9JVHJhbnNwb3J0W2tleV0pIHJldHVybjtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gX0lUcmFuc3BvcnRba2V5XTtcbiAgICB9XG4gIH0pO1xufSk7XG52YXIgX1Bvc3RtZXNzYWdlVHJhbnNwb3J0ID0gcmVxdWlyZShcIi4vdHJhbnNwb3J0L1Bvc3RtZXNzYWdlVHJhbnNwb3J0XCIpO1xuT2JqZWN0LmtleXMoX1Bvc3RtZXNzYWdlVHJhbnNwb3J0KS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgaWYgKGtleSA9PT0gXCJkZWZhdWx0XCIgfHwga2V5ID09PSBcIl9fZXNNb2R1bGVcIikgcmV0dXJuO1xuICBpZiAoa2V5IGluIGV4cG9ydHMgJiYgZXhwb3J0c1trZXldID09PSBfUG9zdG1lc3NhZ2VUcmFuc3BvcnRba2V5XSkgcmV0dXJuO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7XG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiBfUG9zdG1lc3NhZ2VUcmFuc3BvcnRba2V5XTtcbiAgICB9XG4gIH0pO1xufSk7XG52YXIgX0lDdXN0b21XaWRnZXREYXRhID0gcmVxdWlyZShcIi4vaW50ZXJmYWNlcy9JQ3VzdG9tV2lkZ2V0RGF0YVwiKTtcbk9iamVjdC5rZXlzKF9JQ3VzdG9tV2lkZ2V0RGF0YSkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gIGlmIChrZXkgPT09IFwiZGVmYXVsdFwiIHx8IGtleSA9PT0gXCJfX2VzTW9kdWxlXCIpIHJldHVybjtcbiAgaWYgKGtleSBpbiBleHBvcnRzICYmIGV4cG9ydHNba2V5XSA9PT0gX0lDdXN0b21XaWRnZXREYXRhW2tleV0pIHJldHVybjtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gX0lDdXN0b21XaWRnZXREYXRhW2tleV07XG4gICAgfVxuICB9KTtcbn0pO1xudmFyIF9JSml0c2lXaWRnZXREYXRhID0gcmVxdWlyZShcIi4vaW50ZXJmYWNlcy9JSml0c2lXaWRnZXREYXRhXCIpO1xuT2JqZWN0LmtleXMoX0lKaXRzaVdpZGdldERhdGEpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICBpZiAoa2V5ID09PSBcImRlZmF1bHRcIiB8fCBrZXkgPT09IFwiX19lc01vZHVsZVwiKSByZXR1cm47XG4gIGlmIChrZXkgaW4gZXhwb3J0cyAmJiBleHBvcnRzW2tleV0gPT09IF9JSml0c2lXaWRnZXREYXRhW2tleV0pIHJldHVybjtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gX0lKaXRzaVdpZGdldERhdGFba2V5XTtcbiAgICB9XG4gIH0pO1xufSk7XG52YXIgX0lTdGlja2VycGlja2VyV2lkZ2V0RGF0YSA9IHJlcXVpcmUoXCIuL2ludGVyZmFjZXMvSVN0aWNrZXJwaWNrZXJXaWRnZXREYXRhXCIpO1xuT2JqZWN0LmtleXMoX0lTdGlja2VycGlja2VyV2lkZ2V0RGF0YSkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gIGlmIChrZXkgPT09IFwiZGVmYXVsdFwiIHx8IGtleSA9PT0gXCJfX2VzTW9kdWxlXCIpIHJldHVybjtcbiAgaWYgKGtleSBpbiBleHBvcnRzICYmIGV4cG9ydHNba2V5XSA9PT0gX0lTdGlja2VycGlja2VyV2lkZ2V0RGF0YVtrZXldKSByZXR1cm47XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHtcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIF9JU3RpY2tlcnBpY2tlcldpZGdldERhdGFba2V5XTtcbiAgICB9XG4gIH0pO1xufSk7XG52YXIgX0lXaWRnZXQgPSByZXF1aXJlKFwiLi9pbnRlcmZhY2VzL0lXaWRnZXRcIik7XG5PYmplY3Qua2V5cyhfSVdpZGdldCkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gIGlmIChrZXkgPT09IFwiZGVmYXVsdFwiIHx8IGtleSA9PT0gXCJfX2VzTW9kdWxlXCIpIHJldHVybjtcbiAgaWYgKGtleSBpbiBleHBvcnRzICYmIGV4cG9ydHNba2V5XSA9PT0gX0lXaWRnZXRba2V5XSkgcmV0dXJuO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7XG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiBfSVdpZGdldFtrZXldO1xuICAgIH1cbiAgfSk7XG59KTtcbnZhciBfV2lkZ2V0VHlwZSA9IHJlcXVpcmUoXCIuL2ludGVyZmFjZXMvV2lkZ2V0VHlwZVwiKTtcbk9iamVjdC5rZXlzKF9XaWRnZXRUeXBlKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgaWYgKGtleSA9PT0gXCJkZWZhdWx0XCIgfHwga2V5ID09PSBcIl9fZXNNb2R1bGVcIikgcmV0dXJuO1xuICBpZiAoa2V5IGluIGV4cG9ydHMgJiYgZXhwb3J0c1trZXldID09PSBfV2lkZ2V0VHlwZVtrZXldKSByZXR1cm47XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHtcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIF9XaWRnZXRUeXBlW2tleV07XG4gICAgfVxuICB9KTtcbn0pO1xudmFyIF9JV2lkZ2V0QXBpRXJyb3JSZXNwb25zZSA9IHJlcXVpcmUoXCIuL2ludGVyZmFjZXMvSVdpZGdldEFwaUVycm9yUmVzcG9uc2VcIik7XG5PYmplY3Qua2V5cyhfSVdpZGdldEFwaUVycm9yUmVzcG9uc2UpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICBpZiAoa2V5ID09PSBcImRlZmF1bHRcIiB8fCBrZXkgPT09IFwiX19lc01vZHVsZVwiKSByZXR1cm47XG4gIGlmIChrZXkgaW4gZXhwb3J0cyAmJiBleHBvcnRzW2tleV0gPT09IF9JV2lkZ2V0QXBpRXJyb3JSZXNwb25zZVtrZXldKSByZXR1cm47XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHtcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIF9JV2lkZ2V0QXBpRXJyb3JSZXNwb25zZVtrZXldO1xuICAgIH1cbiAgfSk7XG59KTtcbnZhciBfSVdpZGdldEFwaVJlcXVlc3QgPSByZXF1aXJlKFwiLi9pbnRlcmZhY2VzL0lXaWRnZXRBcGlSZXF1ZXN0XCIpO1xuT2JqZWN0LmtleXMoX0lXaWRnZXRBcGlSZXF1ZXN0KS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgaWYgKGtleSA9PT0gXCJkZWZhdWx0XCIgfHwga2V5ID09PSBcIl9fZXNNb2R1bGVcIikgcmV0dXJuO1xuICBpZiAoa2V5IGluIGV4cG9ydHMgJiYgZXhwb3J0c1trZXldID09PSBfSVdpZGdldEFwaVJlcXVlc3Rba2V5XSkgcmV0dXJuO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7XG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiBfSVdpZGdldEFwaVJlcXVlc3Rba2V5XTtcbiAgICB9XG4gIH0pO1xufSk7XG52YXIgX0lXaWRnZXRBcGlSZXNwb25zZSA9IHJlcXVpcmUoXCIuL2ludGVyZmFjZXMvSVdpZGdldEFwaVJlc3BvbnNlXCIpO1xuT2JqZWN0LmtleXMoX0lXaWRnZXRBcGlSZXNwb25zZSkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gIGlmIChrZXkgPT09IFwiZGVmYXVsdFwiIHx8IGtleSA9PT0gXCJfX2VzTW9kdWxlXCIpIHJldHVybjtcbiAgaWYgKGtleSBpbiBleHBvcnRzICYmIGV4cG9ydHNba2V5XSA9PT0gX0lXaWRnZXRBcGlSZXNwb25zZVtrZXldKSByZXR1cm47XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHtcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIF9JV2lkZ2V0QXBpUmVzcG9uc2Vba2V5XTtcbiAgICB9XG4gIH0pO1xufSk7XG52YXIgX1dpZGdldEFwaUFjdGlvbiA9IHJlcXVpcmUoXCIuL2ludGVyZmFjZXMvV2lkZ2V0QXBpQWN0aW9uXCIpO1xuT2JqZWN0LmtleXMoX1dpZGdldEFwaUFjdGlvbikuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gIGlmIChrZXkgPT09IFwiZGVmYXVsdFwiIHx8IGtleSA9PT0gXCJfX2VzTW9kdWxlXCIpIHJldHVybjtcbiAgaWYgKGtleSBpbiBleHBvcnRzICYmIGV4cG9ydHNba2V5XSA9PT0gX1dpZGdldEFwaUFjdGlvbltrZXldKSByZXR1cm47XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHtcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIF9XaWRnZXRBcGlBY3Rpb25ba2V5XTtcbiAgICB9XG4gIH0pO1xufSk7XG52YXIgX1dpZGdldEFwaURpcmVjdGlvbiA9IHJlcXVpcmUoXCIuL2ludGVyZmFjZXMvV2lkZ2V0QXBpRGlyZWN0aW9uXCIpO1xuT2JqZWN0LmtleXMoX1dpZGdldEFwaURpcmVjdGlvbikuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gIGlmIChrZXkgPT09IFwiZGVmYXVsdFwiIHx8IGtleSA9PT0gXCJfX2VzTW9kdWxlXCIpIHJldHVybjtcbiAgaWYgKGtleSBpbiBleHBvcnRzICYmIGV4cG9ydHNba2V5XSA9PT0gX1dpZGdldEFwaURpcmVjdGlvbltrZXldKSByZXR1cm47XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHtcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIF9XaWRnZXRBcGlEaXJlY3Rpb25ba2V5XTtcbiAgICB9XG4gIH0pO1xufSk7XG52YXIgX0FwaVZlcnNpb24gPSByZXF1aXJlKFwiLi9pbnRlcmZhY2VzL0FwaVZlcnNpb25cIik7XG5PYmplY3Qua2V5cyhfQXBpVmVyc2lvbikuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gIGlmIChrZXkgPT09IFwiZGVmYXVsdFwiIHx8IGtleSA9PT0gXCJfX2VzTW9kdWxlXCIpIHJldHVybjtcbiAgaWYgKGtleSBpbiBleHBvcnRzICYmIGV4cG9ydHNba2V5XSA9PT0gX0FwaVZlcnNpb25ba2V5XSkgcmV0dXJuO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7XG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiBfQXBpVmVyc2lvbltrZXldO1xuICAgIH1cbiAgfSk7XG59KTtcbnZhciBfQ2FwYWJpbGl0aWVzID0gcmVxdWlyZShcIi4vaW50ZXJmYWNlcy9DYXBhYmlsaXRpZXNcIik7XG5PYmplY3Qua2V5cyhfQ2FwYWJpbGl0aWVzKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgaWYgKGtleSA9PT0gXCJkZWZhdWx0XCIgfHwga2V5ID09PSBcIl9fZXNNb2R1bGVcIikgcmV0dXJuO1xuICBpZiAoa2V5IGluIGV4cG9ydHMgJiYgZXhwb3J0c1trZXldID09PSBfQ2FwYWJpbGl0aWVzW2tleV0pIHJldHVybjtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gX0NhcGFiaWxpdGllc1trZXldO1xuICAgIH1cbiAgfSk7XG59KTtcbnZhciBfQ2FwYWJpbGl0aWVzQWN0aW9uID0gcmVxdWlyZShcIi4vaW50ZXJmYWNlcy9DYXBhYmlsaXRpZXNBY3Rpb25cIik7XG5PYmplY3Qua2V5cyhfQ2FwYWJpbGl0aWVzQWN0aW9uKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgaWYgKGtleSA9PT0gXCJkZWZhdWx0XCIgfHwga2V5ID09PSBcIl9fZXNNb2R1bGVcIikgcmV0dXJuO1xuICBpZiAoa2V5IGluIGV4cG9ydHMgJiYgZXhwb3J0c1trZXldID09PSBfQ2FwYWJpbGl0aWVzQWN0aW9uW2tleV0pIHJldHVybjtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gX0NhcGFiaWxpdGllc0FjdGlvbltrZXldO1xuICAgIH1cbiAgfSk7XG59KTtcbnZhciBfQ29udGVudExvYWRlZEFjdGlvbiA9IHJlcXVpcmUoXCIuL2ludGVyZmFjZXMvQ29udGVudExvYWRlZEFjdGlvblwiKTtcbk9iamVjdC5rZXlzKF9Db250ZW50TG9hZGVkQWN0aW9uKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgaWYgKGtleSA9PT0gXCJkZWZhdWx0XCIgfHwga2V5ID09PSBcIl9fZXNNb2R1bGVcIikgcmV0dXJuO1xuICBpZiAoa2V5IGluIGV4cG9ydHMgJiYgZXhwb3J0c1trZXldID09PSBfQ29udGVudExvYWRlZEFjdGlvbltrZXldKSByZXR1cm47XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHtcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIF9Db250ZW50TG9hZGVkQWN0aW9uW2tleV07XG4gICAgfVxuICB9KTtcbn0pO1xudmFyIF9TY3JlZW5zaG90QWN0aW9uID0gcmVxdWlyZShcIi4vaW50ZXJmYWNlcy9TY3JlZW5zaG90QWN0aW9uXCIpO1xuT2JqZWN0LmtleXMoX1NjcmVlbnNob3RBY3Rpb24pLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICBpZiAoa2V5ID09PSBcImRlZmF1bHRcIiB8fCBrZXkgPT09IFwiX19lc01vZHVsZVwiKSByZXR1cm47XG4gIGlmIChrZXkgaW4gZXhwb3J0cyAmJiBleHBvcnRzW2tleV0gPT09IF9TY3JlZW5zaG90QWN0aW9uW2tleV0pIHJldHVybjtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gX1NjcmVlbnNob3RBY3Rpb25ba2V5XTtcbiAgICB9XG4gIH0pO1xufSk7XG52YXIgX1N0aWNrZXJBY3Rpb24gPSByZXF1aXJlKFwiLi9pbnRlcmZhY2VzL1N0aWNrZXJBY3Rpb25cIik7XG5PYmplY3Qua2V5cyhfU3RpY2tlckFjdGlvbikuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gIGlmIChrZXkgPT09IFwiZGVmYXVsdFwiIHx8IGtleSA9PT0gXCJfX2VzTW9kdWxlXCIpIHJldHVybjtcbiAgaWYgKGtleSBpbiBleHBvcnRzICYmIGV4cG9ydHNba2V5XSA9PT0gX1N0aWNrZXJBY3Rpb25ba2V5XSkgcmV0dXJuO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7XG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiBfU3RpY2tlckFjdGlvbltrZXldO1xuICAgIH1cbiAgfSk7XG59KTtcbnZhciBfU3RpY2t5QWN0aW9uID0gcmVxdWlyZShcIi4vaW50ZXJmYWNlcy9TdGlja3lBY3Rpb25cIik7XG5PYmplY3Qua2V5cyhfU3RpY2t5QWN0aW9uKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgaWYgKGtleSA9PT0gXCJkZWZhdWx0XCIgfHwga2V5ID09PSBcIl9fZXNNb2R1bGVcIikgcmV0dXJuO1xuICBpZiAoa2V5IGluIGV4cG9ydHMgJiYgZXhwb3J0c1trZXldID09PSBfU3RpY2t5QWN0aW9uW2tleV0pIHJldHVybjtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gX1N0aWNreUFjdGlvbltrZXldO1xuICAgIH1cbiAgfSk7XG59KTtcbnZhciBfU3VwcG9ydGVkVmVyc2lvbnNBY3Rpb24gPSByZXF1aXJlKFwiLi9pbnRlcmZhY2VzL1N1cHBvcnRlZFZlcnNpb25zQWN0aW9uXCIpO1xuT2JqZWN0LmtleXMoX1N1cHBvcnRlZFZlcnNpb25zQWN0aW9uKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgaWYgKGtleSA9PT0gXCJkZWZhdWx0XCIgfHwga2V5ID09PSBcIl9fZXNNb2R1bGVcIikgcmV0dXJuO1xuICBpZiAoa2V5IGluIGV4cG9ydHMgJiYgZXhwb3J0c1trZXldID09PSBfU3VwcG9ydGVkVmVyc2lvbnNBY3Rpb25ba2V5XSkgcmV0dXJuO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7XG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiBfU3VwcG9ydGVkVmVyc2lvbnNBY3Rpb25ba2V5XTtcbiAgICB9XG4gIH0pO1xufSk7XG52YXIgX1Zpc2liaWxpdHlBY3Rpb24gPSByZXF1aXJlKFwiLi9pbnRlcmZhY2VzL1Zpc2liaWxpdHlBY3Rpb25cIik7XG5PYmplY3Qua2V5cyhfVmlzaWJpbGl0eUFjdGlvbikuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gIGlmIChrZXkgPT09IFwiZGVmYXVsdFwiIHx8IGtleSA9PT0gXCJfX2VzTW9kdWxlXCIpIHJldHVybjtcbiAgaWYgKGtleSBpbiBleHBvcnRzICYmIGV4cG9ydHNba2V5XSA9PT0gX1Zpc2liaWxpdHlBY3Rpb25ba2V5XSkgcmV0dXJuO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7XG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiBfVmlzaWJpbGl0eUFjdGlvbltrZXldO1xuICAgIH1cbiAgfSk7XG59KTtcbnZhciBfR2V0T3BlbklEQWN0aW9uID0gcmVxdWlyZShcIi4vaW50ZXJmYWNlcy9HZXRPcGVuSURBY3Rpb25cIik7XG5PYmplY3Qua2V5cyhfR2V0T3BlbklEQWN0aW9uKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgaWYgKGtleSA9PT0gXCJkZWZhdWx0XCIgfHwga2V5ID09PSBcIl9fZXNNb2R1bGVcIikgcmV0dXJuO1xuICBpZiAoa2V5IGluIGV4cG9ydHMgJiYgZXhwb3J0c1trZXldID09PSBfR2V0T3BlbklEQWN0aW9uW2tleV0pIHJldHVybjtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gX0dldE9wZW5JREFjdGlvbltrZXldO1xuICAgIH1cbiAgfSk7XG59KTtcbnZhciBfT3BlbklEQ3JlZGVudGlhbHNBY3Rpb24gPSByZXF1aXJlKFwiLi9pbnRlcmZhY2VzL09wZW5JRENyZWRlbnRpYWxzQWN0aW9uXCIpO1xuT2JqZWN0LmtleXMoX09wZW5JRENyZWRlbnRpYWxzQWN0aW9uKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgaWYgKGtleSA9PT0gXCJkZWZhdWx0XCIgfHwga2V5ID09PSBcIl9fZXNNb2R1bGVcIikgcmV0dXJuO1xuICBpZiAoa2V5IGluIGV4cG9ydHMgJiYgZXhwb3J0c1trZXldID09PSBfT3BlbklEQ3JlZGVudGlhbHNBY3Rpb25ba2V5XSkgcmV0dXJuO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7XG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiBfT3BlbklEQ3JlZGVudGlhbHNBY3Rpb25ba2V5XTtcbiAgICB9XG4gIH0pO1xufSk7XG52YXIgX1dpZGdldEtpbmQgPSByZXF1aXJlKFwiLi9pbnRlcmZhY2VzL1dpZGdldEtpbmRcIik7XG5PYmplY3Qua2V5cyhfV2lkZ2V0S2luZCkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gIGlmIChrZXkgPT09IFwiZGVmYXVsdFwiIHx8IGtleSA9PT0gXCJfX2VzTW9kdWxlXCIpIHJldHVybjtcbiAgaWYgKGtleSBpbiBleHBvcnRzICYmIGV4cG9ydHNba2V5XSA9PT0gX1dpZGdldEtpbmRba2V5XSkgcmV0dXJuO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7XG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiBfV2lkZ2V0S2luZFtrZXldO1xuICAgIH1cbiAgfSk7XG59KTtcbnZhciBfTW9kYWxCdXR0b25LaW5kID0gcmVxdWlyZShcIi4vaW50ZXJmYWNlcy9Nb2RhbEJ1dHRvbktpbmRcIik7XG5PYmplY3Qua2V5cyhfTW9kYWxCdXR0b25LaW5kKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgaWYgKGtleSA9PT0gXCJkZWZhdWx0XCIgfHwga2V5ID09PSBcIl9fZXNNb2R1bGVcIikgcmV0dXJuO1xuICBpZiAoa2V5IGluIGV4cG9ydHMgJiYgZXhwb3J0c1trZXldID09PSBfTW9kYWxCdXR0b25LaW5kW2tleV0pIHJldHVybjtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gX01vZGFsQnV0dG9uS2luZFtrZXldO1xuICAgIH1cbiAgfSk7XG59KTtcbnZhciBfTW9kYWxXaWRnZXRBY3Rpb25zID0gcmVxdWlyZShcIi4vaW50ZXJmYWNlcy9Nb2RhbFdpZGdldEFjdGlvbnNcIik7XG5PYmplY3Qua2V5cyhfTW9kYWxXaWRnZXRBY3Rpb25zKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgaWYgKGtleSA9PT0gXCJkZWZhdWx0XCIgfHwga2V5ID09PSBcIl9fZXNNb2R1bGVcIikgcmV0dXJuO1xuICBpZiAoa2V5IGluIGV4cG9ydHMgJiYgZXhwb3J0c1trZXldID09PSBfTW9kYWxXaWRnZXRBY3Rpb25zW2tleV0pIHJldHVybjtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gX01vZGFsV2lkZ2V0QWN0aW9uc1trZXldO1xuICAgIH1cbiAgfSk7XG59KTtcbnZhciBfU2V0TW9kYWxCdXR0b25FbmFibGVkQWN0aW9uID0gcmVxdWlyZShcIi4vaW50ZXJmYWNlcy9TZXRNb2RhbEJ1dHRvbkVuYWJsZWRBY3Rpb25cIik7XG5PYmplY3Qua2V5cyhfU2V0TW9kYWxCdXR0b25FbmFibGVkQWN0aW9uKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgaWYgKGtleSA9PT0gXCJkZWZhdWx0XCIgfHwga2V5ID09PSBcIl9fZXNNb2R1bGVcIikgcmV0dXJuO1xuICBpZiAoa2V5IGluIGV4cG9ydHMgJiYgZXhwb3J0c1trZXldID09PSBfU2V0TW9kYWxCdXR0b25FbmFibGVkQWN0aW9uW2tleV0pIHJldHVybjtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gX1NldE1vZGFsQnV0dG9uRW5hYmxlZEFjdGlvbltrZXldO1xuICAgIH1cbiAgfSk7XG59KTtcbnZhciBfV2lkZ2V0Q29uZmlnQWN0aW9uID0gcmVxdWlyZShcIi4vaW50ZXJmYWNlcy9XaWRnZXRDb25maWdBY3Rpb25cIik7XG5PYmplY3Qua2V5cyhfV2lkZ2V0Q29uZmlnQWN0aW9uKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgaWYgKGtleSA9PT0gXCJkZWZhdWx0XCIgfHwga2V5ID09PSBcIl9fZXNNb2R1bGVcIikgcmV0dXJuO1xuICBpZiAoa2V5IGluIGV4cG9ydHMgJiYgZXhwb3J0c1trZXldID09PSBfV2lkZ2V0Q29uZmlnQWN0aW9uW2tleV0pIHJldHVybjtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gX1dpZGdldENvbmZpZ0FjdGlvbltrZXldO1xuICAgIH1cbiAgfSk7XG59KTtcbnZhciBfU2VuZEV2ZW50QWN0aW9uID0gcmVxdWlyZShcIi4vaW50ZXJmYWNlcy9TZW5kRXZlbnRBY3Rpb25cIik7XG5PYmplY3Qua2V5cyhfU2VuZEV2ZW50QWN0aW9uKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgaWYgKGtleSA9PT0gXCJkZWZhdWx0XCIgfHwga2V5ID09PSBcIl9fZXNNb2R1bGVcIikgcmV0dXJuO1xuICBpZiAoa2V5IGluIGV4cG9ydHMgJiYgZXhwb3J0c1trZXldID09PSBfU2VuZEV2ZW50QWN0aW9uW2tleV0pIHJldHVybjtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gX1NlbmRFdmVudEFjdGlvbltrZXldO1xuICAgIH1cbiAgfSk7XG59KTtcbnZhciBfU2VuZFRvRGV2aWNlQWN0aW9uID0gcmVxdWlyZShcIi4vaW50ZXJmYWNlcy9TZW5kVG9EZXZpY2VBY3Rpb25cIik7XG5PYmplY3Qua2V5cyhfU2VuZFRvRGV2aWNlQWN0aW9uKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgaWYgKGtleSA9PT0gXCJkZWZhdWx0XCIgfHwga2V5ID09PSBcIl9fZXNNb2R1bGVcIikgcmV0dXJuO1xuICBpZiAoa2V5IGluIGV4cG9ydHMgJiYgZXhwb3J0c1trZXldID09PSBfU2VuZFRvRGV2aWNlQWN0aW9uW2tleV0pIHJldHVybjtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gX1NlbmRUb0RldmljZUFjdGlvbltrZXldO1xuICAgIH1cbiAgfSk7XG59KTtcbnZhciBfUmVhZEV2ZW50QWN0aW9uID0gcmVxdWlyZShcIi4vaW50ZXJmYWNlcy9SZWFkRXZlbnRBY3Rpb25cIik7XG5PYmplY3Qua2V5cyhfUmVhZEV2ZW50QWN0aW9uKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgaWYgKGtleSA9PT0gXCJkZWZhdWx0XCIgfHwga2V5ID09PSBcIl9fZXNNb2R1bGVcIikgcmV0dXJuO1xuICBpZiAoa2V5IGluIGV4cG9ydHMgJiYgZXhwb3J0c1trZXldID09PSBfUmVhZEV2ZW50QWN0aW9uW2tleV0pIHJldHVybjtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gX1JlYWRFdmVudEFjdGlvbltrZXldO1xuICAgIH1cbiAgfSk7XG59KTtcbnZhciBfSVJvb21FdmVudCA9IHJlcXVpcmUoXCIuL2ludGVyZmFjZXMvSVJvb21FdmVudFwiKTtcbk9iamVjdC5rZXlzKF9JUm9vbUV2ZW50KS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgaWYgKGtleSA9PT0gXCJkZWZhdWx0XCIgfHwga2V5ID09PSBcIl9fZXNNb2R1bGVcIikgcmV0dXJuO1xuICBpZiAoa2V5IGluIGV4cG9ydHMgJiYgZXhwb3J0c1trZXldID09PSBfSVJvb21FdmVudFtrZXldKSByZXR1cm47XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHtcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIF9JUm9vbUV2ZW50W2tleV07XG4gICAgfVxuICB9KTtcbn0pO1xudmFyIF9JUm9vbUFjY291bnREYXRhID0gcmVxdWlyZShcIi4vaW50ZXJmYWNlcy9JUm9vbUFjY291bnREYXRhXCIpO1xuT2JqZWN0LmtleXMoX0lSb29tQWNjb3VudERhdGEpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICBpZiAoa2V5ID09PSBcImRlZmF1bHRcIiB8fCBrZXkgPT09IFwiX19lc01vZHVsZVwiKSByZXR1cm47XG4gIGlmIChrZXkgaW4gZXhwb3J0cyAmJiBleHBvcnRzW2tleV0gPT09IF9JUm9vbUFjY291bnREYXRhW2tleV0pIHJldHVybjtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gX0lSb29tQWNjb3VudERhdGFba2V5XTtcbiAgICB9XG4gIH0pO1xufSk7XG52YXIgX05hdmlnYXRlQWN0aW9uID0gcmVxdWlyZShcIi4vaW50ZXJmYWNlcy9OYXZpZ2F0ZUFjdGlvblwiKTtcbk9iamVjdC5rZXlzKF9OYXZpZ2F0ZUFjdGlvbikuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gIGlmIChrZXkgPT09IFwiZGVmYXVsdFwiIHx8IGtleSA9PT0gXCJfX2VzTW9kdWxlXCIpIHJldHVybjtcbiAgaWYgKGtleSBpbiBleHBvcnRzICYmIGV4cG9ydHNba2V5XSA9PT0gX05hdmlnYXRlQWN0aW9uW2tleV0pIHJldHVybjtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gX05hdmlnYXRlQWN0aW9uW2tleV07XG4gICAgfVxuICB9KTtcbn0pO1xudmFyIF9UdXJuU2VydmVyQWN0aW9ucyA9IHJlcXVpcmUoXCIuL2ludGVyZmFjZXMvVHVyblNlcnZlckFjdGlvbnNcIik7XG5PYmplY3Qua2V5cyhfVHVyblNlcnZlckFjdGlvbnMpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICBpZiAoa2V5ID09PSBcImRlZmF1bHRcIiB8fCBrZXkgPT09IFwiX19lc01vZHVsZVwiKSByZXR1cm47XG4gIGlmIChrZXkgaW4gZXhwb3J0cyAmJiBleHBvcnRzW2tleV0gPT09IF9UdXJuU2VydmVyQWN0aW9uc1trZXldKSByZXR1cm47XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHtcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIF9UdXJuU2VydmVyQWN0aW9uc1trZXldO1xuICAgIH1cbiAgfSk7XG59KTtcbnZhciBfUmVhZFJlbGF0aW9uc0FjdGlvbiA9IHJlcXVpcmUoXCIuL2ludGVyZmFjZXMvUmVhZFJlbGF0aW9uc0FjdGlvblwiKTtcbk9iamVjdC5rZXlzKF9SZWFkUmVsYXRpb25zQWN0aW9uKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgaWYgKGtleSA9PT0gXCJkZWZhdWx0XCIgfHwga2V5ID09PSBcIl9fZXNNb2R1bGVcIikgcmV0dXJuO1xuICBpZiAoa2V5IGluIGV4cG9ydHMgJiYgZXhwb3J0c1trZXldID09PSBfUmVhZFJlbGF0aW9uc0FjdGlvbltrZXldKSByZXR1cm47XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHtcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIF9SZWFkUmVsYXRpb25zQWN0aW9uW2tleV07XG4gICAgfVxuICB9KTtcbn0pO1xudmFyIF9HZXRNZWRpYUNvbmZpZ0FjdGlvbiA9IHJlcXVpcmUoXCIuL2ludGVyZmFjZXMvR2V0TWVkaWFDb25maWdBY3Rpb25cIik7XG5PYmplY3Qua2V5cyhfR2V0TWVkaWFDb25maWdBY3Rpb24pLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICBpZiAoa2V5ID09PSBcImRlZmF1bHRcIiB8fCBrZXkgPT09IFwiX19lc01vZHVsZVwiKSByZXR1cm47XG4gIGlmIChrZXkgaW4gZXhwb3J0cyAmJiBleHBvcnRzW2tleV0gPT09IF9HZXRNZWRpYUNvbmZpZ0FjdGlvbltrZXldKSByZXR1cm47XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHtcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIF9HZXRNZWRpYUNvbmZpZ0FjdGlvbltrZXldO1xuICAgIH1cbiAgfSk7XG59KTtcbnZhciBfVXBkYXRlRGVsYXllZEV2ZW50QWN0aW9uID0gcmVxdWlyZShcIi4vaW50ZXJmYWNlcy9VcGRhdGVEZWxheWVkRXZlbnRBY3Rpb25cIik7XG5PYmplY3Qua2V5cyhfVXBkYXRlRGVsYXllZEV2ZW50QWN0aW9uKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgaWYgKGtleSA9PT0gXCJkZWZhdWx0XCIgfHwga2V5ID09PSBcIl9fZXNNb2R1bGVcIikgcmV0dXJuO1xuICBpZiAoa2V5IGluIGV4cG9ydHMgJiYgZXhwb3J0c1trZXldID09PSBfVXBkYXRlRGVsYXllZEV2ZW50QWN0aW9uW2tleV0pIHJldHVybjtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gX1VwZGF0ZURlbGF5ZWRFdmVudEFjdGlvbltrZXldO1xuICAgIH1cbiAgfSk7XG59KTtcbnZhciBfVXBsb2FkRmlsZUFjdGlvbiA9IHJlcXVpcmUoXCIuL2ludGVyZmFjZXMvVXBsb2FkRmlsZUFjdGlvblwiKTtcbk9iamVjdC5rZXlzKF9VcGxvYWRGaWxlQWN0aW9uKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgaWYgKGtleSA9PT0gXCJkZWZhdWx0XCIgfHwga2V5ID09PSBcIl9fZXNNb2R1bGVcIikgcmV0dXJuO1xuICBpZiAoa2V5IGluIGV4cG9ydHMgJiYgZXhwb3J0c1trZXldID09PSBfVXBsb2FkRmlsZUFjdGlvbltrZXldKSByZXR1cm47XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHtcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIF9VcGxvYWRGaWxlQWN0aW9uW2tleV07XG4gICAgfVxuICB9KTtcbn0pO1xudmFyIF9Eb3dubG9hZEZpbGVBY3Rpb24gPSByZXF1aXJlKFwiLi9pbnRlcmZhY2VzL0Rvd25sb2FkRmlsZUFjdGlvblwiKTtcbk9iamVjdC5rZXlzKF9Eb3dubG9hZEZpbGVBY3Rpb24pLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICBpZiAoa2V5ID09PSBcImRlZmF1bHRcIiB8fCBrZXkgPT09IFwiX19lc01vZHVsZVwiKSByZXR1cm47XG4gIGlmIChrZXkgaW4gZXhwb3J0cyAmJiBleHBvcnRzW2tleV0gPT09IF9Eb3dubG9hZEZpbGVBY3Rpb25ba2V5XSkgcmV0dXJuO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7XG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiBfRG93bmxvYWRGaWxlQWN0aW9uW2tleV07XG4gICAgfVxuICB9KTtcbn0pO1xudmFyIF9XaWRnZXRFdmVudENhcGFiaWxpdHkgPSByZXF1aXJlKFwiLi9tb2RlbHMvV2lkZ2V0RXZlbnRDYXBhYmlsaXR5XCIpO1xuT2JqZWN0LmtleXMoX1dpZGdldEV2ZW50Q2FwYWJpbGl0eSkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gIGlmIChrZXkgPT09IFwiZGVmYXVsdFwiIHx8IGtleSA9PT0gXCJfX2VzTW9kdWxlXCIpIHJldHVybjtcbiAgaWYgKGtleSBpbiBleHBvcnRzICYmIGV4cG9ydHNba2V5XSA9PT0gX1dpZGdldEV2ZW50Q2FwYWJpbGl0eVtrZXldKSByZXR1cm47XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHtcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIF9XaWRnZXRFdmVudENhcGFiaWxpdHlba2V5XTtcbiAgICB9XG4gIH0pO1xufSk7XG52YXIgX3VybCA9IHJlcXVpcmUoXCIuL21vZGVscy92YWxpZGF0aW9uL3VybFwiKTtcbk9iamVjdC5rZXlzKF91cmwpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICBpZiAoa2V5ID09PSBcImRlZmF1bHRcIiB8fCBrZXkgPT09IFwiX19lc01vZHVsZVwiKSByZXR1cm47XG4gIGlmIChrZXkgaW4gZXhwb3J0cyAmJiBleHBvcnRzW2tleV0gPT09IF91cmxba2V5XSkgcmV0dXJuO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7XG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiBfdXJsW2tleV07XG4gICAgfVxuICB9KTtcbn0pO1xudmFyIF91dGlscyA9IHJlcXVpcmUoXCIuL21vZGVscy92YWxpZGF0aW9uL3V0aWxzXCIpO1xuT2JqZWN0LmtleXMoX3V0aWxzKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgaWYgKGtleSA9PT0gXCJkZWZhdWx0XCIgfHwga2V5ID09PSBcIl9fZXNNb2R1bGVcIikgcmV0dXJuO1xuICBpZiAoa2V5IGluIGV4cG9ydHMgJiYgZXhwb3J0c1trZXldID09PSBfdXRpbHNba2V5XSkgcmV0dXJuO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7XG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiBfdXRpbHNba2V5XTtcbiAgICB9XG4gIH0pO1xufSk7XG52YXIgX1dpZGdldCA9IHJlcXVpcmUoXCIuL21vZGVscy9XaWRnZXRcIik7XG5PYmplY3Qua2V5cyhfV2lkZ2V0KS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgaWYgKGtleSA9PT0gXCJkZWZhdWx0XCIgfHwga2V5ID09PSBcIl9fZXNNb2R1bGVcIikgcmV0dXJuO1xuICBpZiAoa2V5IGluIGV4cG9ydHMgJiYgZXhwb3J0c1trZXldID09PSBfV2lkZ2V0W2tleV0pIHJldHVybjtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gX1dpZGdldFtrZXldO1xuICAgIH1cbiAgfSk7XG59KTtcbnZhciBfV2lkZ2V0UGFyc2VyID0gcmVxdWlyZShcIi4vbW9kZWxzL1dpZGdldFBhcnNlclwiKTtcbk9iamVjdC5rZXlzKF9XaWRnZXRQYXJzZXIpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICBpZiAoa2V5ID09PSBcImRlZmF1bHRcIiB8fCBrZXkgPT09IFwiX19lc01vZHVsZVwiKSByZXR1cm47XG4gIGlmIChrZXkgaW4gZXhwb3J0cyAmJiBleHBvcnRzW2tleV0gPT09IF9XaWRnZXRQYXJzZXJba2V5XSkgcmV0dXJuO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7XG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiBfV2lkZ2V0UGFyc2VyW2tleV07XG4gICAgfVxuICB9KTtcbn0pO1xudmFyIF91cmxUZW1wbGF0ZSA9IHJlcXVpcmUoXCIuL3RlbXBsYXRpbmcvdXJsLXRlbXBsYXRlXCIpO1xuT2JqZWN0LmtleXMoX3VybFRlbXBsYXRlKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgaWYgKGtleSA9PT0gXCJkZWZhdWx0XCIgfHwga2V5ID09PSBcIl9fZXNNb2R1bGVcIikgcmV0dXJuO1xuICBpZiAoa2V5IGluIGV4cG9ydHMgJiYgZXhwb3J0c1trZXldID09PSBfdXJsVGVtcGxhdGVba2V5XSkgcmV0dXJuO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7XG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiBfdXJsVGVtcGxhdGVba2V5XTtcbiAgICB9XG4gIH0pO1xufSk7XG52YXIgX1NpbXBsZU9ic2VydmFibGUgPSByZXF1aXJlKFwiLi91dGlsL1NpbXBsZU9ic2VydmFibGVcIik7XG5PYmplY3Qua2V5cyhfU2ltcGxlT2JzZXJ2YWJsZSkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gIGlmIChrZXkgPT09IFwiZGVmYXVsdFwiIHx8IGtleSA9PT0gXCJfX2VzTW9kdWxlXCIpIHJldHVybjtcbiAgaWYgKGtleSBpbiBleHBvcnRzICYmIGV4cG9ydHNba2V5XSA9PT0gX1NpbXBsZU9ic2VydmFibGVba2V5XSkgcmV0dXJuO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7XG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiBfU2ltcGxlT2JzZXJ2YWJsZVtrZXldO1xuICAgIH1cbiAgfSk7XG59KTtcbnZhciBfV2lkZ2V0RHJpdmVyID0gcmVxdWlyZShcIi4vZHJpdmVyL1dpZGdldERyaXZlclwiKTtcbk9iamVjdC5rZXlzKF9XaWRnZXREcml2ZXIpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICBpZiAoa2V5ID09PSBcImRlZmF1bHRcIiB8fCBrZXkgPT09IFwiX19lc01vZHVsZVwiKSByZXR1cm47XG4gIGlmIChrZXkgaW4gZXhwb3J0cyAmJiBleHBvcnRzW2tleV0gPT09IF9XaWRnZXREcml2ZXJba2V5XSkgcmV0dXJuO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7XG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiBfV2lkZ2V0RHJpdmVyW2tleV07XG4gICAgfVxuICB9KTtcbn0pO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLlVuc3RhYmxlQXBpVmVyc2lvbiA9IGV4cG9ydHMuTWF0cml4QXBpVmVyc2lvbiA9IGV4cG9ydHMuQ3VycmVudEFwaVZlcnNpb25zID0gdm9pZCAwO1xuLypcbiAqIENvcHlyaWdodCAyMDIwIFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xudmFyIE1hdHJpeEFwaVZlcnNpb24gPSAvKiNfX1BVUkVfXyovZnVuY3Rpb24gKE1hdHJpeEFwaVZlcnNpb24pIHtcbiAgTWF0cml4QXBpVmVyc2lvbltcIlByZXJlbGVhc2UxXCJdID0gXCIwLjAuMVwiO1xuICBNYXRyaXhBcGlWZXJzaW9uW1wiUHJlcmVsZWFzZTJcIl0gPSBcIjAuMC4yXCI7XG4gIHJldHVybiBNYXRyaXhBcGlWZXJzaW9uO1xufSh7fSk7IC8vVjAxMCA9IFwiMC4xLjBcIiwgLy8gZmlyc3QgcmVsZWFzZVxuZXhwb3J0cy5NYXRyaXhBcGlWZXJzaW9uID0gTWF0cml4QXBpVmVyc2lvbjtcbnZhciBVbnN0YWJsZUFwaVZlcnNpb24gPSAvKiNfX1BVUkVfXyovZnVuY3Rpb24gKFVuc3RhYmxlQXBpVmVyc2lvbikge1xuICBVbnN0YWJsZUFwaVZlcnNpb25bXCJNU0MyNzYyXCJdID0gXCJvcmcubWF0cml4Lm1zYzI3NjJcIjtcbiAgVW5zdGFibGVBcGlWZXJzaW9uW1wiTVNDMjg3MVwiXSA9IFwib3JnLm1hdHJpeC5tc2MyODcxXCI7XG4gIFVuc3RhYmxlQXBpVmVyc2lvbltcIk1TQzI5MzFcIl0gPSBcIm9yZy5tYXRyaXgubXNjMjkzMVwiO1xuICBVbnN0YWJsZUFwaVZlcnNpb25bXCJNU0MyOTc0XCJdID0gXCJvcmcubWF0cml4Lm1zYzI5NzRcIjtcbiAgVW5zdGFibGVBcGlWZXJzaW9uW1wiTVNDMjg3NlwiXSA9IFwib3JnLm1hdHJpeC5tc2MyODc2XCI7XG4gIFVuc3RhYmxlQXBpVmVyc2lvbltcIk1TQzM4MTlcIl0gPSBcIm9yZy5tYXRyaXgubXNjMzgxOVwiO1xuICBVbnN0YWJsZUFwaVZlcnNpb25bXCJNU0MzODQ2XCJdID0gXCJ0b3duLnJvYmluLm1zYzM4NDZcIjtcbiAgVW5zdGFibGVBcGlWZXJzaW9uW1wiTVNDMzg2OVwiXSA9IFwib3JnLm1hdHJpeC5tc2MzODY5XCI7XG4gIFVuc3RhYmxlQXBpVmVyc2lvbltcIk1TQzM5NzNcIl0gPSBcIm9yZy5tYXRyaXgubXNjMzk3M1wiO1xuICBVbnN0YWJsZUFwaVZlcnNpb25bXCJNU0M0MDM5XCJdID0gXCJvcmcubWF0cml4Lm1zYzQwMzlcIjtcbiAgcmV0dXJuIFVuc3RhYmxlQXBpVmVyc2lvbjtcbn0oe30pO1xuZXhwb3J0cy5VbnN0YWJsZUFwaVZlcnNpb24gPSBVbnN0YWJsZUFwaVZlcnNpb247XG52YXIgQ3VycmVudEFwaVZlcnNpb25zID0gW01hdHJpeEFwaVZlcnNpb24uUHJlcmVsZWFzZTEsIE1hdHJpeEFwaVZlcnNpb24uUHJlcmVsZWFzZTIsXG4vL01hdHJpeEFwaVZlcnNpb24uVjAxMCxcblVuc3RhYmxlQXBpVmVyc2lvbi5NU0MyNzYyLCBVbnN0YWJsZUFwaVZlcnNpb24uTVNDMjg3MSwgVW5zdGFibGVBcGlWZXJzaW9uLk1TQzI5MzEsIFVuc3RhYmxlQXBpVmVyc2lvbi5NU0MyOTc0LCBVbnN0YWJsZUFwaVZlcnNpb24uTVNDMjg3NiwgVW5zdGFibGVBcGlWZXJzaW9uLk1TQzM4MTksIFVuc3RhYmxlQXBpVmVyc2lvbi5NU0MzODQ2LCBVbnN0YWJsZUFwaVZlcnNpb24uTVNDMzg2OSwgVW5zdGFibGVBcGlWZXJzaW9uLk1TQzM5NzMsIFVuc3RhYmxlQXBpVmVyc2lvbi5NU0M0MDM5XTtcbmV4cG9ydHMuQ3VycmVudEFwaVZlcnNpb25zID0gQ3VycmVudEFwaVZlcnNpb25zO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9QXBpVmVyc2lvbi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuVmlkZW9Db25mZXJlbmNlQ2FwYWJpbGl0aWVzID0gZXhwb3J0cy5TdGlja2VycGlja2VyQ2FwYWJpbGl0aWVzID0gZXhwb3J0cy5NYXRyaXhDYXBhYmlsaXRpZXMgPSB2b2lkIDA7XG5leHBvcnRzLmdldFRpbWVsaW5lUm9vbUlERnJvbUNhcGFiaWxpdHkgPSBnZXRUaW1lbGluZVJvb21JREZyb21DYXBhYmlsaXR5O1xuZXhwb3J0cy5pc1RpbWVsaW5lQ2FwYWJpbGl0eSA9IGlzVGltZWxpbmVDYXBhYmlsaXR5O1xuZXhwb3J0cy5pc1RpbWVsaW5lQ2FwYWJpbGl0eUZvciA9IGlzVGltZWxpbmVDYXBhYmlsaXR5Rm9yO1xuLypcbiAqIENvcHlyaWdodCAyMDIwIC0gMjAyMSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbnZhciBNYXRyaXhDYXBhYmlsaXRpZXMgPSAvKiNfX1BVUkVfXyovZnVuY3Rpb24gKE1hdHJpeENhcGFiaWxpdGllcykge1xuICBNYXRyaXhDYXBhYmlsaXRpZXNbXCJTY3JlZW5zaG90c1wiXSA9IFwibS5jYXBhYmlsaXR5LnNjcmVlbnNob3RcIjtcbiAgTWF0cml4Q2FwYWJpbGl0aWVzW1wiU3RpY2tlclNlbmRpbmdcIl0gPSBcIm0uc3RpY2tlclwiO1xuICBNYXRyaXhDYXBhYmlsaXRpZXNbXCJBbHdheXNPblNjcmVlblwiXSA9IFwibS5hbHdheXNfb25fc2NyZWVuXCI7XG4gIE1hdHJpeENhcGFiaWxpdGllc1tcIlJlcXVpcmVzQ2xpZW50XCJdID0gXCJpby5lbGVtZW50LnJlcXVpcmVzX2NsaWVudFwiO1xuICBNYXRyaXhDYXBhYmlsaXRpZXNbXCJNU0MyOTMxTmF2aWdhdGVcIl0gPSBcIm9yZy5tYXRyaXgubXNjMjkzMS5uYXZpZ2F0ZVwiO1xuICBNYXRyaXhDYXBhYmlsaXRpZXNbXCJNU0MzODQ2VHVyblNlcnZlcnNcIl0gPSBcInRvd24ucm9iaW4ubXNjMzg0Ni50dXJuX3NlcnZlcnNcIjtcbiAgTWF0cml4Q2FwYWJpbGl0aWVzW1wiTVNDMzk3M1VzZXJEaXJlY3RvcnlTZWFyY2hcIl0gPSBcIm9yZy5tYXRyaXgubXNjMzk3My51c2VyX2RpcmVjdG9yeV9zZWFyY2hcIjtcbiAgTWF0cml4Q2FwYWJpbGl0aWVzW1wiTVNDNDAzOVVwbG9hZEZpbGVcIl0gPSBcIm9yZy5tYXRyaXgubXNjNDAzOS51cGxvYWRfZmlsZVwiO1xuICBNYXRyaXhDYXBhYmlsaXRpZXNbXCJNU0M0MDM5RG93bmxvYWRGaWxlXCJdID0gXCJvcmcubWF0cml4Lm1zYzQwMzkuZG93bmxvYWRfZmlsZVwiO1xuICBNYXRyaXhDYXBhYmlsaXRpZXNbXCJNU0M0MTU3U2VuZERlbGF5ZWRFdmVudFwiXSA9IFwib3JnLm1hdHJpeC5tc2M0MTU3LnNlbmQuZGVsYXllZF9ldmVudFwiO1xuICBNYXRyaXhDYXBhYmlsaXRpZXNbXCJNU0M0MTU3VXBkYXRlRGVsYXllZEV2ZW50XCJdID0gXCJvcmcubWF0cml4Lm1zYzQxNTcudXBkYXRlX2RlbGF5ZWRfZXZlbnRcIjtcbiAgcmV0dXJuIE1hdHJpeENhcGFiaWxpdGllcztcbn0oe30pO1xuZXhwb3J0cy5NYXRyaXhDYXBhYmlsaXRpZXMgPSBNYXRyaXhDYXBhYmlsaXRpZXM7XG52YXIgU3RpY2tlcnBpY2tlckNhcGFiaWxpdGllcyA9IFtNYXRyaXhDYXBhYmlsaXRpZXMuU3RpY2tlclNlbmRpbmddO1xuZXhwb3J0cy5TdGlja2VycGlja2VyQ2FwYWJpbGl0aWVzID0gU3RpY2tlcnBpY2tlckNhcGFiaWxpdGllcztcbnZhciBWaWRlb0NvbmZlcmVuY2VDYXBhYmlsaXRpZXMgPSBbTWF0cml4Q2FwYWJpbGl0aWVzLkFsd2F5c09uU2NyZWVuXTtcblxuLyoqXG4gKiBEZXRlcm1pbmVzIGlmIGEgY2FwYWJpbGl0eSBpcyBhIGNhcGFiaWxpdHkgZm9yIGEgdGltZWxpbmUuXG4gKiBAcGFyYW0ge0NhcGFiaWxpdHl9IGNhcGFiaWxpdHkgVGhlIGNhcGFiaWxpdHkgdG8gdGVzdC5cbiAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIGEgdGltZWxpbmUgY2FwYWJpbGl0eSwgZmFsc2Ugb3RoZXJ3aXNlLlxuICovXG5leHBvcnRzLlZpZGVvQ29uZmVyZW5jZUNhcGFiaWxpdGllcyA9IFZpZGVvQ29uZmVyZW5jZUNhcGFiaWxpdGllcztcbmZ1bmN0aW9uIGlzVGltZWxpbmVDYXBhYmlsaXR5KGNhcGFiaWxpdHkpIHtcbiAgLy8gVE9ETzogQ2hhbmdlIHdoZW4gTVNDMjc2MiBiZWNvbWVzIHN0YWJsZS5cbiAgcmV0dXJuIGNhcGFiaWxpdHkgPT09IG51bGwgfHwgY2FwYWJpbGl0eSA9PT0gdm9pZCAwID8gdm9pZCAwIDogY2FwYWJpbGl0eS5zdGFydHNXaXRoKFwib3JnLm1hdHJpeC5tc2MyNzYyLnRpbWVsaW5lOlwiKTtcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIGlmIGEgY2FwYWJpbGl0eSBpcyBhIHRpbWVsaW5lIGNhcGFiaWxpdHkgZm9yIHRoZSBnaXZlbiByb29tLlxuICogQHBhcmFtIHtDYXBhYmlsaXR5fSBjYXBhYmlsaXR5IFRoZSBjYXBhYmlsaXR5IHRvIHRlc3QuXG4gKiBAcGFyYW0ge3N0cmluZyB8IFN5bWJvbHMuQW55Um9vbX0gcm9vbUlkIFRoZSByb29tIElELCBvciBgU3ltYm9scy5BbnlSb29tYCBmb3IgdGhhdCBkZXNpZ25hdGlvbi5cbiAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIGEgbWF0Y2hpbmcgY2FwYWJpbGl0eSwgZmFsc2Ugb3RoZXJ3aXNlLlxuICovXG5mdW5jdGlvbiBpc1RpbWVsaW5lQ2FwYWJpbGl0eUZvcihjYXBhYmlsaXR5LCByb29tSWQpIHtcbiAgcmV0dXJuIGNhcGFiaWxpdHkgPT09IFwib3JnLm1hdHJpeC5tc2MyNzYyLnRpbWVsaW5lOlwiLmNvbmNhdChyb29tSWQpO1xufVxuXG4vKipcbiAqIEdldHMgdGhlIHJvb20gSUQgZGVzY3JpYmVkIGJ5IGEgdGltZWxpbmUgY2FwYWJpbGl0eS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBjYXBhYmlsaXR5IFRoZSBjYXBhYmlsaXR5IHRvIHBhcnNlLlxuICogQHJldHVybnMge3N0cmluZ30gVGhlIHJvb20gSUQuXG4gKi9cbmZ1bmN0aW9uIGdldFRpbWVsaW5lUm9vbUlERnJvbUNhcGFiaWxpdHkoY2FwYWJpbGl0eSkge1xuICByZXR1cm4gY2FwYWJpbGl0eS5zdWJzdHJpbmcoY2FwYWJpbGl0eS5pbmRleE9mKFwiOlwiKSArIDEpO1xufVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Q2FwYWJpbGl0aWVzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Q2FwYWJpbGl0aWVzQWN0aW9uLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Q29udGVudExvYWRlZEFjdGlvbi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPURvd25sb2FkRmlsZUFjdGlvbi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUdldE1lZGlhQ29uZmlnQWN0aW9uLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5PcGVuSURSZXF1ZXN0U3RhdGUgPSB2b2lkIDA7XG4vKlxuICogQ29weXJpZ2h0IDIwMjAgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG52YXIgT3BlbklEUmVxdWVzdFN0YXRlID0gLyojX19QVVJFX18qL2Z1bmN0aW9uIChPcGVuSURSZXF1ZXN0U3RhdGUpIHtcbiAgT3BlbklEUmVxdWVzdFN0YXRlW1wiQWxsb3dlZFwiXSA9IFwiYWxsb3dlZFwiO1xuICBPcGVuSURSZXF1ZXN0U3RhdGVbXCJCbG9ja2VkXCJdID0gXCJibG9ja2VkXCI7XG4gIE9wZW5JRFJlcXVlc3RTdGF0ZVtcIlBlbmRpbmdVc2VyQ29uZmlybWF0aW9uXCJdID0gXCJyZXF1ZXN0XCI7XG4gIHJldHVybiBPcGVuSURSZXF1ZXN0U3RhdGU7XG59KHt9KTtcbmV4cG9ydHMuT3BlbklEUmVxdWVzdFN0YXRlID0gT3BlbklEUmVxdWVzdFN0YXRlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9R2V0T3BlbklEQWN0aW9uLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9SUN1c3RvbVdpZGdldERhdGEuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1JSml0c2lXaWRnZXREYXRhLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9SVJvb21BY2NvdW50RGF0YS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUlSb29tRXZlbnQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1JU3RpY2tlcnBpY2tlcldpZGdldERhdGEuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1JV2lkZ2V0LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5pc0Vycm9yUmVzcG9uc2UgPSBpc0Vycm9yUmVzcG9uc2U7XG5mdW5jdGlvbiBfdHlwZW9mKG9iaikgeyBcIkBiYWJlbC9oZWxwZXJzIC0gdHlwZW9mXCI7IHJldHVybiBfdHlwZW9mID0gXCJmdW5jdGlvblwiID09IHR5cGVvZiBTeW1ib2wgJiYgXCJzeW1ib2xcIiA9PSB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID8gZnVuY3Rpb24gKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfSA6IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIG9iaiAmJiBcImZ1bmN0aW9uXCIgPT0gdHlwZW9mIFN5bWJvbCAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvYmogIT09IFN5bWJvbC5wcm90b3R5cGUgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajsgfSwgX3R5cGVvZihvYmopOyB9XG4vKlxuICogQ29weXJpZ2h0IDIwMjAgLSAyMDI0IFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vKipcbiAqIFRoZSBmb3JtYXQgb2YgZXJyb3JzIHJldHVybmVkIGJ5IE1hdHJpeCBBUEkgcmVxdWVzdHNcbiAqIG1hZGUgYnkgYSBXaWRnZXREcml2ZXIuXG4gKi9cblxuZnVuY3Rpb24gaXNFcnJvclJlc3BvbnNlKHJlc3BvbnNlRGF0YSkge1xuICB2YXIgZXJyb3IgPSByZXNwb25zZURhdGEuZXJyb3I7XG4gIHJldHVybiBfdHlwZW9mKGVycm9yKSA9PT0gXCJvYmplY3RcIiAmJiBlcnJvciAhPT0gbnVsbCAmJiBcIm1lc3NhZ2VcIiBpbiBlcnJvciAmJiB0eXBlb2YgZXJyb3IubWVzc2FnZSA9PT0gXCJzdHJpbmdcIjtcbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUlXaWRnZXRBcGlFcnJvclJlc3BvbnNlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9SVdpZGdldEFwaVJlcXVlc3QuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1JV2lkZ2V0QXBpUmVzcG9uc2UuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLk1vZGFsQnV0dG9uS2luZCA9IHZvaWQgMDtcbi8qXG4gKiBDb3B5cmlnaHQgMjAyMCBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbnZhciBNb2RhbEJ1dHRvbktpbmQgPSAvKiNfX1BVUkVfXyovZnVuY3Rpb24gKE1vZGFsQnV0dG9uS2luZCkge1xuICBNb2RhbEJ1dHRvbktpbmRbXCJQcmltYXJ5XCJdID0gXCJtLnByaW1hcnlcIjtcbiAgTW9kYWxCdXR0b25LaW5kW1wiU2Vjb25kYXJ5XCJdID0gXCJtLnNlY29uZGFyeVwiO1xuICBNb2RhbEJ1dHRvbktpbmRbXCJXYXJuaW5nXCJdID0gXCJtLndhcm5pbmdcIjtcbiAgTW9kYWxCdXR0b25LaW5kW1wiRGFuZ2VyXCJdID0gXCJtLmRhbmdlclwiO1xuICBNb2RhbEJ1dHRvbktpbmRbXCJMaW5rXCJdID0gXCJtLmxpbmtcIjtcbiAgcmV0dXJuIE1vZGFsQnV0dG9uS2luZDtcbn0oe30pO1xuZXhwb3J0cy5Nb2RhbEJ1dHRvbktpbmQgPSBNb2RhbEJ1dHRvbktpbmQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1Nb2RhbEJ1dHRvbktpbmQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLkJ1aWx0SW5Nb2RhbEJ1dHRvbklEID0gdm9pZCAwO1xuLypcbiAqIENvcHlyaWdodCAyMDIwIFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xudmFyIEJ1aWx0SW5Nb2RhbEJ1dHRvbklEID0gLyojX19QVVJFX18qL2Z1bmN0aW9uIChCdWlsdEluTW9kYWxCdXR0b25JRCkge1xuICBCdWlsdEluTW9kYWxCdXR0b25JRFtcIkNsb3NlXCJdID0gXCJtLmNsb3NlXCI7XG4gIHJldHVybiBCdWlsdEluTW9kYWxCdXR0b25JRDtcbn0oe30pOyAvLyBUeXBlcyBmb3IgYSBub3JtYWwgbW9kYWwgcmVxdWVzdGluZyB0aGUgb3BlbmluZyBhIG1vZGFsIHdpZGdldFxuLy8gVHlwZXMgZm9yIGEgbW9kYWwgd2lkZ2V0IHJlY2VpdmluZyBub3RpZmljYXRpb25zIHRoYXQgaXRzIGJ1dHRvbnMgaGF2ZSBiZWVuIHByZXNzZWRcbi8vIFR5cGVzIGZvciBhIG1vZGFsIHdpZGdldCByZXF1ZXN0aW5nIGNsb3NlXG4vLyBUeXBlcyBmb3IgYSBub3JtYWwgd2lkZ2V0IGJlaW5nIG5vdGlmaWVkIHRoYXQgdGhlIG1vZGFsIHdpZGdldCBpdCBvcGVuZWQgaGFzIGJlZW4gY2xvc2VkXG5leHBvcnRzLkJ1aWx0SW5Nb2RhbEJ1dHRvbklEID0gQnVpbHRJbk1vZGFsQnV0dG9uSUQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1Nb2RhbFdpZGdldEFjdGlvbnMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1OYXZpZ2F0ZUFjdGlvbi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPU9wZW5JRENyZWRlbnRpYWxzQWN0aW9uLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9UmVhZEV2ZW50QWN0aW9uLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9UmVhZFJlbGF0aW9uc0FjdGlvbi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVNjcmVlbnNob3RBY3Rpb24uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1TZW5kRXZlbnRBY3Rpb24uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1TZW5kVG9EZXZpY2VBY3Rpb24uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1TZXRNb2RhbEJ1dHRvbkVuYWJsZWRBY3Rpb24uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1TdGlja2VyQWN0aW9uLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9U3RpY2t5QWN0aW9uLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9U3VwcG9ydGVkVmVyc2lvbnNBY3Rpb24uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1UdXJuU2VydmVyQWN0aW9ucy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuVXBkYXRlRGVsYXllZEV2ZW50QWN0aW9uID0gdm9pZCAwO1xuLypcbiAqIENvcHlyaWdodCAyMDIwIC0gMjAyNCBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbnZhciBVcGRhdGVEZWxheWVkRXZlbnRBY3Rpb24gPSAvKiNfX1BVUkVfXyovZnVuY3Rpb24gKFVwZGF0ZURlbGF5ZWRFdmVudEFjdGlvbikge1xuICBVcGRhdGVEZWxheWVkRXZlbnRBY3Rpb25bXCJDYW5jZWxcIl0gPSBcImNhbmNlbFwiO1xuICBVcGRhdGVEZWxheWVkRXZlbnRBY3Rpb25bXCJSZXN0YXJ0XCJdID0gXCJyZXN0YXJ0XCI7XG4gIFVwZGF0ZURlbGF5ZWRFdmVudEFjdGlvbltcIlNlbmRcIl0gPSBcInNlbmRcIjtcbiAgcmV0dXJuIFVwZGF0ZURlbGF5ZWRFdmVudEFjdGlvbjtcbn0oe30pO1xuZXhwb3J0cy5VcGRhdGVEZWxheWVkRXZlbnRBY3Rpb24gPSBVcGRhdGVEZWxheWVkRXZlbnRBY3Rpb247XG4vLyMgc291cmNlTWFwcGluZ1VSTD1VcGRhdGVEZWxheWVkRXZlbnRBY3Rpb24uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1VcGxvYWRGaWxlQWN0aW9uLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9VmlzaWJpbGl0eUFjdGlvbi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuV2lkZ2V0QXBpVG9XaWRnZXRBY3Rpb24gPSBleHBvcnRzLldpZGdldEFwaUZyb21XaWRnZXRBY3Rpb24gPSB2b2lkIDA7XG4vKlxuICogQ29weXJpZ2h0IDIwMjAgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG52YXIgV2lkZ2V0QXBpVG9XaWRnZXRBY3Rpb24gPSAvKiNfX1BVUkVfXyovZnVuY3Rpb24gKFdpZGdldEFwaVRvV2lkZ2V0QWN0aW9uKSB7XG4gIFdpZGdldEFwaVRvV2lkZ2V0QWN0aW9uW1wiU3VwcG9ydGVkQXBpVmVyc2lvbnNcIl0gPSBcInN1cHBvcnRlZF9hcGlfdmVyc2lvbnNcIjtcbiAgV2lkZ2V0QXBpVG9XaWRnZXRBY3Rpb25bXCJDYXBhYmlsaXRpZXNcIl0gPSBcImNhcGFiaWxpdGllc1wiO1xuICBXaWRnZXRBcGlUb1dpZGdldEFjdGlvbltcIk5vdGlmeUNhcGFiaWxpdGllc1wiXSA9IFwibm90aWZ5X2NhcGFiaWxpdGllc1wiO1xuICBXaWRnZXRBcGlUb1dpZGdldEFjdGlvbltcIlRha2VTY3JlZW5zaG90XCJdID0gXCJzY3JlZW5zaG90XCI7XG4gIFdpZGdldEFwaVRvV2lkZ2V0QWN0aW9uW1wiVXBkYXRlVmlzaWJpbGl0eVwiXSA9IFwidmlzaWJpbGl0eVwiO1xuICBXaWRnZXRBcGlUb1dpZGdldEFjdGlvbltcIk9wZW5JRENyZWRlbnRpYWxzXCJdID0gXCJvcGVuaWRfY3JlZGVudGlhbHNcIjtcbiAgV2lkZ2V0QXBpVG9XaWRnZXRBY3Rpb25bXCJXaWRnZXRDb25maWdcIl0gPSBcIndpZGdldF9jb25maWdcIjtcbiAgV2lkZ2V0QXBpVG9XaWRnZXRBY3Rpb25bXCJDbG9zZU1vZGFsV2lkZ2V0XCJdID0gXCJjbG9zZV9tb2RhbFwiO1xuICBXaWRnZXRBcGlUb1dpZGdldEFjdGlvbltcIkJ1dHRvbkNsaWNrZWRcIl0gPSBcImJ1dHRvbl9jbGlja2VkXCI7XG4gIFdpZGdldEFwaVRvV2lkZ2V0QWN0aW9uW1wiU2VuZEV2ZW50XCJdID0gXCJzZW5kX2V2ZW50XCI7XG4gIFdpZGdldEFwaVRvV2lkZ2V0QWN0aW9uW1wiU2VuZFRvRGV2aWNlXCJdID0gXCJzZW5kX3RvX2RldmljZVwiO1xuICBXaWRnZXRBcGlUb1dpZGdldEFjdGlvbltcIlVwZGF0ZVR1cm5TZXJ2ZXJzXCJdID0gXCJ1cGRhdGVfdHVybl9zZXJ2ZXJzXCI7XG4gIHJldHVybiBXaWRnZXRBcGlUb1dpZGdldEFjdGlvbjtcbn0oe30pO1xuZXhwb3J0cy5XaWRnZXRBcGlUb1dpZGdldEFjdGlvbiA9IFdpZGdldEFwaVRvV2lkZ2V0QWN0aW9uO1xudmFyIFdpZGdldEFwaUZyb21XaWRnZXRBY3Rpb24gPSAvKiNfX1BVUkVfXyovZnVuY3Rpb24gKFdpZGdldEFwaUZyb21XaWRnZXRBY3Rpb24pIHtcbiAgV2lkZ2V0QXBpRnJvbVdpZGdldEFjdGlvbltcIlN1cHBvcnRlZEFwaVZlcnNpb25zXCJdID0gXCJzdXBwb3J0ZWRfYXBpX3ZlcnNpb25zXCI7XG4gIFdpZGdldEFwaUZyb21XaWRnZXRBY3Rpb25bXCJDb250ZW50TG9hZGVkXCJdID0gXCJjb250ZW50X2xvYWRlZFwiO1xuICBXaWRnZXRBcGlGcm9tV2lkZ2V0QWN0aW9uW1wiU2VuZFN0aWNrZXJcIl0gPSBcIm0uc3RpY2tlclwiO1xuICBXaWRnZXRBcGlGcm9tV2lkZ2V0QWN0aW9uW1wiVXBkYXRlQWx3YXlzT25TY3JlZW5cIl0gPSBcInNldF9hbHdheXNfb25fc2NyZWVuXCI7XG4gIFdpZGdldEFwaUZyb21XaWRnZXRBY3Rpb25bXCJHZXRPcGVuSURDcmVkZW50aWFsc1wiXSA9IFwiZ2V0X29wZW5pZFwiO1xuICBXaWRnZXRBcGlGcm9tV2lkZ2V0QWN0aW9uW1wiQ2xvc2VNb2RhbFdpZGdldFwiXSA9IFwiY2xvc2VfbW9kYWxcIjtcbiAgV2lkZ2V0QXBpRnJvbVdpZGdldEFjdGlvbltcIk9wZW5Nb2RhbFdpZGdldFwiXSA9IFwib3Blbl9tb2RhbFwiO1xuICBXaWRnZXRBcGlGcm9tV2lkZ2V0QWN0aW9uW1wiU2V0TW9kYWxCdXR0b25FbmFibGVkXCJdID0gXCJzZXRfYnV0dG9uX2VuYWJsZWRcIjtcbiAgV2lkZ2V0QXBpRnJvbVdpZGdldEFjdGlvbltcIlNlbmRFdmVudFwiXSA9IFwic2VuZF9ldmVudFwiO1xuICBXaWRnZXRBcGlGcm9tV2lkZ2V0QWN0aW9uW1wiU2VuZFRvRGV2aWNlXCJdID0gXCJzZW5kX3RvX2RldmljZVwiO1xuICBXaWRnZXRBcGlGcm9tV2lkZ2V0QWN0aW9uW1wiV2F0Y2hUdXJuU2VydmVyc1wiXSA9IFwid2F0Y2hfdHVybl9zZXJ2ZXJzXCI7XG4gIFdpZGdldEFwaUZyb21XaWRnZXRBY3Rpb25bXCJVbndhdGNoVHVyblNlcnZlcnNcIl0gPSBcInVud2F0Y2hfdHVybl9zZXJ2ZXJzXCI7XG4gIFdpZGdldEFwaUZyb21XaWRnZXRBY3Rpb25bXCJCZWVwZXJSZWFkUm9vbUFjY291bnREYXRhXCJdID0gXCJjb20uYmVlcGVyLnJlYWRfcm9vbV9hY2NvdW50X2RhdGFcIjtcbiAgV2lkZ2V0QXBpRnJvbVdpZGdldEFjdGlvbltcIk1TQzI4NzZSZWFkRXZlbnRzXCJdID0gXCJvcmcubWF0cml4Lm1zYzI4NzYucmVhZF9ldmVudHNcIjtcbiAgV2lkZ2V0QXBpRnJvbVdpZGdldEFjdGlvbltcIk1TQzI5MzFOYXZpZ2F0ZVwiXSA9IFwib3JnLm1hdHJpeC5tc2MyOTMxLm5hdmlnYXRlXCI7XG4gIFdpZGdldEFwaUZyb21XaWRnZXRBY3Rpb25bXCJNU0MyOTc0UmVuZWdvdGlhdGVDYXBhYmlsaXRpZXNcIl0gPSBcIm9yZy5tYXRyaXgubXNjMjk3NC5yZXF1ZXN0X2NhcGFiaWxpdGllc1wiO1xuICBXaWRnZXRBcGlGcm9tV2lkZ2V0QWN0aW9uW1wiTVNDMzg2OVJlYWRSZWxhdGlvbnNcIl0gPSBcIm9yZy5tYXRyaXgubXNjMzg2OS5yZWFkX3JlbGF0aW9uc1wiO1xuICBXaWRnZXRBcGlGcm9tV2lkZ2V0QWN0aW9uW1wiTVNDMzk3M1VzZXJEaXJlY3RvcnlTZWFyY2hcIl0gPSBcIm9yZy5tYXRyaXgubXNjMzk3My51c2VyX2RpcmVjdG9yeV9zZWFyY2hcIjtcbiAgV2lkZ2V0QXBpRnJvbVdpZGdldEFjdGlvbltcIk1TQzQwMzlHZXRNZWRpYUNvbmZpZ0FjdGlvblwiXSA9IFwib3JnLm1hdHJpeC5tc2M0MDM5LmdldF9tZWRpYV9jb25maWdcIjtcbiAgV2lkZ2V0QXBpRnJvbVdpZGdldEFjdGlvbltcIk1TQzQwMzlVcGxvYWRGaWxlQWN0aW9uXCJdID0gXCJvcmcubWF0cml4Lm1zYzQwMzkudXBsb2FkX2ZpbGVcIjtcbiAgV2lkZ2V0QXBpRnJvbVdpZGdldEFjdGlvbltcIk1TQzQwMzlEb3dubG9hZEZpbGVBY3Rpb25cIl0gPSBcIm9yZy5tYXRyaXgubXNjNDAzOS5kb3dubG9hZF9maWxlXCI7XG4gIFdpZGdldEFwaUZyb21XaWRnZXRBY3Rpb25bXCJNU0M0MTU3VXBkYXRlRGVsYXllZEV2ZW50XCJdID0gXCJvcmcubWF0cml4Lm1zYzQxNTcudXBkYXRlX2RlbGF5ZWRfZXZlbnRcIjtcbiAgcmV0dXJuIFdpZGdldEFwaUZyb21XaWRnZXRBY3Rpb247XG59KHt9KTtcbmV4cG9ydHMuV2lkZ2V0QXBpRnJvbVdpZGdldEFjdGlvbiA9IFdpZGdldEFwaUZyb21XaWRnZXRBY3Rpb247XG4vLyMgc291cmNlTWFwcGluZ1VSTD1XaWRnZXRBcGlBY3Rpb24uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLldpZGdldEFwaURpcmVjdGlvbiA9IHZvaWQgMDtcbmV4cG9ydHMuaW52ZXJ0ZWREaXJlY3Rpb24gPSBpbnZlcnRlZERpcmVjdGlvbjtcbi8qXG4gKiBDb3B5cmlnaHQgMjAyMCBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbnZhciBXaWRnZXRBcGlEaXJlY3Rpb24gPSAvKiNfX1BVUkVfXyovZnVuY3Rpb24gKFdpZGdldEFwaURpcmVjdGlvbikge1xuICBXaWRnZXRBcGlEaXJlY3Rpb25bXCJUb1dpZGdldFwiXSA9IFwidG9XaWRnZXRcIjtcbiAgV2lkZ2V0QXBpRGlyZWN0aW9uW1wiRnJvbVdpZGdldFwiXSA9IFwiZnJvbVdpZGdldFwiO1xuICByZXR1cm4gV2lkZ2V0QXBpRGlyZWN0aW9uO1xufSh7fSk7XG5leHBvcnRzLldpZGdldEFwaURpcmVjdGlvbiA9IFdpZGdldEFwaURpcmVjdGlvbjtcbmZ1bmN0aW9uIGludmVydGVkRGlyZWN0aW9uKGRpcikge1xuICBpZiAoZGlyID09PSBXaWRnZXRBcGlEaXJlY3Rpb24uVG9XaWRnZXQpIHtcbiAgICByZXR1cm4gV2lkZ2V0QXBpRGlyZWN0aW9uLkZyb21XaWRnZXQ7XG4gIH0gZWxzZSBpZiAoZGlyID09PSBXaWRnZXRBcGlEaXJlY3Rpb24uRnJvbVdpZGdldCkge1xuICAgIHJldHVybiBXaWRnZXRBcGlEaXJlY3Rpb24uVG9XaWRnZXQ7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBkaXJlY3Rpb25cIik7XG4gIH1cbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVdpZGdldEFwaURpcmVjdGlvbi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVdpZGdldENvbmZpZ0FjdGlvbi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuV2lkZ2V0S2luZCA9IHZvaWQgMDtcbi8qXG4gKiBDb3B5cmlnaHQgMjAyMCBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbnZhciBXaWRnZXRLaW5kID0gLyojX19QVVJFX18qL2Z1bmN0aW9uIChXaWRnZXRLaW5kKSB7XG4gIFdpZGdldEtpbmRbXCJSb29tXCJdID0gXCJyb29tXCI7XG4gIFdpZGdldEtpbmRbXCJBY2NvdW50XCJdID0gXCJhY2NvdW50XCI7XG4gIFdpZGdldEtpbmRbXCJNb2RhbFwiXSA9IFwibW9kYWxcIjtcbiAgcmV0dXJuIFdpZGdldEtpbmQ7XG59KHt9KTtcbmV4cG9ydHMuV2lkZ2V0S2luZCA9IFdpZGdldEtpbmQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1XaWRnZXRLaW5kLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5NYXRyaXhXaWRnZXRUeXBlID0gdm9pZCAwO1xuLypcbiAqIENvcHlyaWdodCAyMDIwIFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xudmFyIE1hdHJpeFdpZGdldFR5cGUgPSAvKiNfX1BVUkVfXyovZnVuY3Rpb24gKE1hdHJpeFdpZGdldFR5cGUpIHtcbiAgTWF0cml4V2lkZ2V0VHlwZVtcIkN1c3RvbVwiXSA9IFwibS5jdXN0b21cIjtcbiAgTWF0cml4V2lkZ2V0VHlwZVtcIkppdHNpTWVldFwiXSA9IFwibS5qaXRzaVwiO1xuICBNYXRyaXhXaWRnZXRUeXBlW1wiU3RpY2tlcnBpY2tlclwiXSA9IFwibS5zdGlja2VycGlja2VyXCI7XG4gIHJldHVybiBNYXRyaXhXaWRnZXRUeXBlO1xufSh7fSk7XG5leHBvcnRzLk1hdHJpeFdpZGdldFR5cGUgPSBNYXRyaXhXaWRnZXRUeXBlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9V2lkZ2V0VHlwZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuV2lkZ2V0ID0gdm9pZCAwO1xudmFyIF91dGlscyA9IHJlcXVpcmUoXCIuL3ZhbGlkYXRpb24vdXRpbHNcIik7XG52YXIgXyA9IHJlcXVpcmUoXCIuLlwiKTtcbmZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IFwiQGJhYmVsL2hlbHBlcnMgLSB0eXBlb2ZcIjsgcmV0dXJuIF90eXBlb2YgPSBcImZ1bmN0aW9uXCIgPT0gdHlwZW9mIFN5bWJvbCAmJiBcInN5bWJvbFwiID09IHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPyBmdW5jdGlvbiAob2JqKSB7IHJldHVybiB0eXBlb2Ygb2JqOyB9IDogZnVuY3Rpb24gKG9iaikgeyByZXR1cm4gb2JqICYmIFwiZnVuY3Rpb25cIiA9PSB0eXBlb2YgU3ltYm9sICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sICYmIG9iaiAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9LCBfdHlwZW9mKG9iaik7IH1cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIF90b1Byb3BlcnR5S2V5KGRlc2NyaXB0b3Iua2V5KSwgZGVzY3JpcHRvcik7IH0gfVxuZnVuY3Rpb24gX2NyZWF0ZUNsYXNzKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyBPYmplY3QuZGVmaW5lUHJvcGVydHkoQ29uc3RydWN0b3IsIFwicHJvdG90eXBlXCIsIHsgd3JpdGFibGU6IGZhbHNlIH0pOyByZXR1cm4gQ29uc3RydWN0b3I7IH1cbmZ1bmN0aW9uIF90b1Byb3BlcnR5S2V5KGFyZykgeyB2YXIga2V5ID0gX3RvUHJpbWl0aXZlKGFyZywgXCJzdHJpbmdcIik7IHJldHVybiBfdHlwZW9mKGtleSkgPT09IFwic3ltYm9sXCIgPyBrZXkgOiBTdHJpbmcoa2V5KTsgfVxuZnVuY3Rpb24gX3RvUHJpbWl0aXZlKGlucHV0LCBoaW50KSB7IGlmIChfdHlwZW9mKGlucHV0KSAhPT0gXCJvYmplY3RcIiB8fCBpbnB1dCA9PT0gbnVsbCkgcmV0dXJuIGlucHV0OyB2YXIgcHJpbSA9IGlucHV0W1N5bWJvbC50b1ByaW1pdGl2ZV07IGlmIChwcmltICE9PSB1bmRlZmluZWQpIHsgdmFyIHJlcyA9IHByaW0uY2FsbChpbnB1dCwgaGludCB8fCBcImRlZmF1bHRcIik7IGlmIChfdHlwZW9mKHJlcykgIT09IFwib2JqZWN0XCIpIHJldHVybiByZXM7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJAQHRvUHJpbWl0aXZlIG11c3QgcmV0dXJuIGEgcHJpbWl0aXZlIHZhbHVlLlwiKTsgfSByZXR1cm4gKGhpbnQgPT09IFwic3RyaW5nXCIgPyBTdHJpbmcgOiBOdW1iZXIpKGlucHV0KTsgfSAvKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIENvcHlyaWdodCAyMDIwIFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqICAgICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKi9cbi8qKlxuICogUmVwcmVzZW50cyB0aGUgYmFyZXN0IGZvcm0gb2Ygd2lkZ2V0LlxuICovXG52YXIgV2lkZ2V0ID0gLyojX19QVVJFX18qL2Z1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gV2lkZ2V0KGRlZmluaXRpb24pIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgV2lkZ2V0KTtcbiAgICB0aGlzLmRlZmluaXRpb24gPSBkZWZpbml0aW9uO1xuICAgIGlmICghdGhpcy5kZWZpbml0aW9uKSB0aHJvdyBuZXcgRXJyb3IoXCJEZWZpbml0aW9uIGlzIHJlcXVpcmVkXCIpO1xuICAgICgwLCBfdXRpbHMuYXNzZXJ0UHJlc2VudCkoZGVmaW5pdGlvbiwgXCJpZFwiKTtcbiAgICAoMCwgX3V0aWxzLmFzc2VydFByZXNlbnQpKGRlZmluaXRpb24sIFwiY3JlYXRvclVzZXJJZFwiKTtcbiAgICAoMCwgX3V0aWxzLmFzc2VydFByZXNlbnQpKGRlZmluaXRpb24sIFwidHlwZVwiKTtcbiAgICAoMCwgX3V0aWxzLmFzc2VydFByZXNlbnQpKGRlZmluaXRpb24sIFwidXJsXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSB1c2VyIElEIHdobyBjcmVhdGVkIHRoZSB3aWRnZXQuXG4gICAqL1xuICBfY3JlYXRlQ2xhc3MoV2lkZ2V0LCBbe1xuICAgIGtleTogXCJjcmVhdG9yVXNlcklkXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5kZWZpbml0aW9uLmNyZWF0b3JVc2VySWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHR5cGUgb2Ygd2lkZ2V0LlxuICAgICAqL1xuICB9LCB7XG4gICAga2V5OiBcInR5cGVcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiB0aGlzLmRlZmluaXRpb24udHlwZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgSUQgb2YgdGhlIHdpZGdldC5cbiAgICAgKi9cbiAgfSwge1xuICAgIGtleTogXCJpZFwiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIHRoaXMuZGVmaW5pdGlvbi5pZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgbmFtZSBvZiB0aGUgd2lkZ2V0LCBvciBudWxsIGlmIG5vdCBzZXQuXG4gICAgICovXG4gIH0sIHtcbiAgICBrZXk6IFwibmFtZVwiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIHRoaXMuZGVmaW5pdGlvbi5uYW1lIHx8IG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHRpdGxlIGZvciB0aGUgd2lkZ2V0LCBvciBudWxsIGlmIG5vdCBzZXQuXG4gICAgICovXG4gIH0sIHtcbiAgICBrZXk6IFwidGl0bGVcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiB0aGlzLnJhd0RhdGEudGl0bGUgfHwgbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgdGVtcGxhdGVkIFVSTCBmb3IgdGhlIHdpZGdldC5cbiAgICAgKi9cbiAgfSwge1xuICAgIGtleTogXCJ0ZW1wbGF0ZVVybFwiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIHRoaXMuZGVmaW5pdGlvbi51cmw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIG9yaWdpbiBmb3IgdGhpcyB3aWRnZXQuXG4gICAgICovXG4gIH0sIHtcbiAgICBrZXk6IFwib3JpZ2luXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gbmV3IFVSTCh0aGlzLnRlbXBsYXRlVXJsKS5vcmlnaW47XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogV2hldGhlciBvciBub3QgdGhlIGNsaWVudCBzaG91bGQgd2FpdCBmb3IgdGhlIGlmcmFtZSB0byBsb2FkLiBEZWZhdWx0c1xuICAgICAqIHRvIHRydWUuXG4gICAgICovXG4gIH0sIHtcbiAgICBrZXk6IFwid2FpdEZvcklmcmFtZUxvYWRcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIGlmICh0aGlzLmRlZmluaXRpb24ud2FpdEZvcklmcmFtZUxvYWQgPT09IGZhbHNlKSByZXR1cm4gZmFsc2U7XG4gICAgICBpZiAodGhpcy5kZWZpbml0aW9uLndhaXRGb3JJZnJhbWVMb2FkID09PSB0cnVlKSByZXR1cm4gdHJ1ZTtcbiAgICAgIHJldHVybiB0cnVlOyAvLyBkZWZhdWx0IHRydWVcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgcmF3IGRhdGEgZm9yIHRoZSB3aWRnZXQuIFRoaXMgd2lsbCBhbHdheXMgYmUgZGVmaW5lZCwgdGhvdWdoXG4gICAgICogbWF5IGJlIGVtcHR5LlxuICAgICAqL1xuICB9LCB7XG4gICAga2V5OiBcInJhd0RhdGFcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiB0aGlzLmRlZmluaXRpb24uZGF0YSB8fCB7fTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIGEgY29tcGxldGUgd2lkZ2V0IFVSTCBmb3IgdGhlIGNsaWVudCB0byByZW5kZXIuXG4gICAgICogQHBhcmFtIHtJVGVtcGxhdGVQYXJhbXN9IHBhcmFtcyBUaGUgdGVtcGxhdGUgcGFyYW1ldGVycy5cbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBBIHRlbXBsYXRlZCBVUkwuXG4gICAgICovXG4gIH0sIHtcbiAgICBrZXk6IFwiZ2V0Q29tcGxldGVVcmxcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0Q29tcGxldGVVcmwocGFyYW1zKSB7XG4gICAgICByZXR1cm4gKDAsIF8ucnVuVGVtcGxhdGUpKHRoaXMudGVtcGxhdGVVcmwsIHRoaXMuZGVmaW5pdGlvbiwgcGFyYW1zKTtcbiAgICB9XG4gIH1dKTtcbiAgcmV0dXJuIFdpZGdldDtcbn0oKTtcbmV4cG9ydHMuV2lkZ2V0ID0gV2lkZ2V0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9V2lkZ2V0LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5XaWRnZXRFdmVudENhcGFiaWxpdHkgPSBleHBvcnRzLkV2ZW50S2luZCA9IGV4cG9ydHMuRXZlbnREaXJlY3Rpb24gPSB2b2lkIDA7XG5mdW5jdGlvbiBfdHlwZW9mKG9iaikgeyBcIkBiYWJlbC9oZWxwZXJzIC0gdHlwZW9mXCI7IHJldHVybiBfdHlwZW9mID0gXCJmdW5jdGlvblwiID09IHR5cGVvZiBTeW1ib2wgJiYgXCJzeW1ib2xcIiA9PSB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID8gZnVuY3Rpb24gKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfSA6IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIG9iaiAmJiBcImZ1bmN0aW9uXCIgPT0gdHlwZW9mIFN5bWJvbCAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvYmogIT09IFN5bWJvbC5wcm90b3R5cGUgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajsgfSwgX3R5cGVvZihvYmopOyB9XG5mdW5jdGlvbiBfY3JlYXRlRm9yT2ZJdGVyYXRvckhlbHBlcihvLCBhbGxvd0FycmF5TGlrZSkgeyB2YXIgaXQgPSB0eXBlb2YgU3ltYm9sICE9PSBcInVuZGVmaW5lZFwiICYmIG9bU3ltYm9sLml0ZXJhdG9yXSB8fCBvW1wiQEBpdGVyYXRvclwiXTsgaWYgKCFpdCkgeyBpZiAoQXJyYXkuaXNBcnJheShvKSB8fCAoaXQgPSBfdW5zdXBwb3J0ZWRJdGVyYWJsZVRvQXJyYXkobykpIHx8IGFsbG93QXJyYXlMaWtlICYmIG8gJiYgdHlwZW9mIG8ubGVuZ3RoID09PSBcIm51bWJlclwiKSB7IGlmIChpdCkgbyA9IGl0OyB2YXIgaSA9IDA7IHZhciBGID0gZnVuY3Rpb24gRigpIHt9OyByZXR1cm4geyBzOiBGLCBuOiBmdW5jdGlvbiBuKCkgeyBpZiAoaSA+PSBvLmxlbmd0aCkgcmV0dXJuIHsgZG9uZTogdHJ1ZSB9OyByZXR1cm4geyBkb25lOiBmYWxzZSwgdmFsdWU6IG9baSsrXSB9OyB9LCBlOiBmdW5jdGlvbiBlKF9lKSB7IHRocm93IF9lOyB9LCBmOiBGIH07IH0gdGhyb3cgbmV3IFR5cGVFcnJvcihcIkludmFsaWQgYXR0ZW1wdCB0byBpdGVyYXRlIG5vbi1pdGVyYWJsZSBpbnN0YW5jZS5cXG5JbiBvcmRlciB0byBiZSBpdGVyYWJsZSwgbm9uLWFycmF5IG9iamVjdHMgbXVzdCBoYXZlIGEgW1N5bWJvbC5pdGVyYXRvcl0oKSBtZXRob2QuXCIpOyB9IHZhciBub3JtYWxDb21wbGV0aW9uID0gdHJ1ZSwgZGlkRXJyID0gZmFsc2UsIGVycjsgcmV0dXJuIHsgczogZnVuY3Rpb24gcygpIHsgaXQgPSBpdC5jYWxsKG8pOyB9LCBuOiBmdW5jdGlvbiBuKCkgeyB2YXIgc3RlcCA9IGl0Lm5leHQoKTsgbm9ybWFsQ29tcGxldGlvbiA9IHN0ZXAuZG9uZTsgcmV0dXJuIHN0ZXA7IH0sIGU6IGZ1bmN0aW9uIGUoX2UyKSB7IGRpZEVyciA9IHRydWU7IGVyciA9IF9lMjsgfSwgZjogZnVuY3Rpb24gZigpIHsgdHJ5IHsgaWYgKCFub3JtYWxDb21wbGV0aW9uICYmIGl0W1wicmV0dXJuXCJdICE9IG51bGwpIGl0W1wicmV0dXJuXCJdKCk7IH0gZmluYWxseSB7IGlmIChkaWRFcnIpIHRocm93IGVycjsgfSB9IH07IH1cbmZ1bmN0aW9uIF91bnN1cHBvcnRlZEl0ZXJhYmxlVG9BcnJheShvLCBtaW5MZW4pIHsgaWYgKCFvKSByZXR1cm47IGlmICh0eXBlb2YgbyA9PT0gXCJzdHJpbmdcIikgcmV0dXJuIF9hcnJheUxpa2VUb0FycmF5KG8sIG1pbkxlbik7IHZhciBuID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pLnNsaWNlKDgsIC0xKTsgaWYgKG4gPT09IFwiT2JqZWN0XCIgJiYgby5jb25zdHJ1Y3RvcikgbiA9IG8uY29uc3RydWN0b3IubmFtZTsgaWYgKG4gPT09IFwiTWFwXCIgfHwgbiA9PT0gXCJTZXRcIikgcmV0dXJuIEFycmF5LmZyb20obyk7IGlmIChuID09PSBcIkFyZ3VtZW50c1wiIHx8IC9eKD86VWl8SSludCg/Ojh8MTZ8MzIpKD86Q2xhbXBlZCk/QXJyYXkkLy50ZXN0KG4pKSByZXR1cm4gX2FycmF5TGlrZVRvQXJyYXkobywgbWluTGVuKTsgfVxuZnVuY3Rpb24gX2FycmF5TGlrZVRvQXJyYXkoYXJyLCBsZW4pIHsgaWYgKGxlbiA9PSBudWxsIHx8IGxlbiA+IGFyci5sZW5ndGgpIGxlbiA9IGFyci5sZW5ndGg7IGZvciAodmFyIGkgPSAwLCBhcnIyID0gbmV3IEFycmF5KGxlbik7IGkgPCBsZW47IGkrKykgYXJyMltpXSA9IGFycltpXTsgcmV0dXJuIGFycjI7IH1cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIF90b1Byb3BlcnR5S2V5KGRlc2NyaXB0b3Iua2V5KSwgZGVzY3JpcHRvcik7IH0gfVxuZnVuY3Rpb24gX2NyZWF0ZUNsYXNzKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyBPYmplY3QuZGVmaW5lUHJvcGVydHkoQ29uc3RydWN0b3IsIFwicHJvdG90eXBlXCIsIHsgd3JpdGFibGU6IGZhbHNlIH0pOyByZXR1cm4gQ29uc3RydWN0b3I7IH1cbmZ1bmN0aW9uIF90b1Byb3BlcnR5S2V5KGFyZykgeyB2YXIga2V5ID0gX3RvUHJpbWl0aXZlKGFyZywgXCJzdHJpbmdcIik7IHJldHVybiBfdHlwZW9mKGtleSkgPT09IFwic3ltYm9sXCIgPyBrZXkgOiBTdHJpbmcoa2V5KTsgfVxuZnVuY3Rpb24gX3RvUHJpbWl0aXZlKGlucHV0LCBoaW50KSB7IGlmIChfdHlwZW9mKGlucHV0KSAhPT0gXCJvYmplY3RcIiB8fCBpbnB1dCA9PT0gbnVsbCkgcmV0dXJuIGlucHV0OyB2YXIgcHJpbSA9IGlucHV0W1N5bWJvbC50b1ByaW1pdGl2ZV07IGlmIChwcmltICE9PSB1bmRlZmluZWQpIHsgdmFyIHJlcyA9IHByaW0uY2FsbChpbnB1dCwgaGludCB8fCBcImRlZmF1bHRcIik7IGlmIChfdHlwZW9mKHJlcykgIT09IFwib2JqZWN0XCIpIHJldHVybiByZXM7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJAQHRvUHJpbWl0aXZlIG11c3QgcmV0dXJuIGEgcHJpbWl0aXZlIHZhbHVlLlwiKTsgfSByZXR1cm4gKGhpbnQgPT09IFwic3RyaW5nXCIgPyBTdHJpbmcgOiBOdW1iZXIpKGlucHV0KTsgfVxuLypcbiAqIENvcHlyaWdodCAyMDIwIFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xudmFyIEV2ZW50S2luZCA9IC8qI19fUFVSRV9fKi9mdW5jdGlvbiAoRXZlbnRLaW5kKSB7XG4gIEV2ZW50S2luZFtcIkV2ZW50XCJdID0gXCJldmVudFwiO1xuICBFdmVudEtpbmRbXCJTdGF0ZVwiXSA9IFwic3RhdGVfZXZlbnRcIjtcbiAgRXZlbnRLaW5kW1wiVG9EZXZpY2VcIl0gPSBcInRvX2RldmljZVwiO1xuICBFdmVudEtpbmRbXCJSb29tQWNjb3VudFwiXSA9IFwicm9vbV9hY2NvdW50XCI7XG4gIHJldHVybiBFdmVudEtpbmQ7XG59KHt9KTtcbmV4cG9ydHMuRXZlbnRLaW5kID0gRXZlbnRLaW5kO1xudmFyIEV2ZW50RGlyZWN0aW9uID0gLyojX19QVVJFX18qL2Z1bmN0aW9uIChFdmVudERpcmVjdGlvbikge1xuICBFdmVudERpcmVjdGlvbltcIlNlbmRcIl0gPSBcInNlbmRcIjtcbiAgRXZlbnREaXJlY3Rpb25bXCJSZWNlaXZlXCJdID0gXCJyZWNlaXZlXCI7XG4gIHJldHVybiBFdmVudERpcmVjdGlvbjtcbn0oe30pO1xuZXhwb3J0cy5FdmVudERpcmVjdGlvbiA9IEV2ZW50RGlyZWN0aW9uO1xudmFyIFdpZGdldEV2ZW50Q2FwYWJpbGl0eSA9IC8qI19fUFVSRV9fKi9mdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIFdpZGdldEV2ZW50Q2FwYWJpbGl0eShkaXJlY3Rpb24sIGV2ZW50VHlwZSwga2luZCwga2V5U3RyLCByYXcpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgV2lkZ2V0RXZlbnRDYXBhYmlsaXR5KTtcbiAgICB0aGlzLmRpcmVjdGlvbiA9IGRpcmVjdGlvbjtcbiAgICB0aGlzLmV2ZW50VHlwZSA9IGV2ZW50VHlwZTtcbiAgICB0aGlzLmtpbmQgPSBraW5kO1xuICAgIHRoaXMua2V5U3RyID0ga2V5U3RyO1xuICAgIHRoaXMucmF3ID0gcmF3O1xuICB9XG4gIF9jcmVhdGVDbGFzcyhXaWRnZXRFdmVudENhcGFiaWxpdHksIFt7XG4gICAga2V5OiBcIm1hdGNoZXNBc1N0YXRlRXZlbnRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gbWF0Y2hlc0FzU3RhdGVFdmVudChkaXJlY3Rpb24sIGV2ZW50VHlwZSwgc3RhdGVLZXkpIHtcbiAgICAgIGlmICh0aGlzLmtpbmQgIT09IEV2ZW50S2luZC5TdGF0ZSkgcmV0dXJuIGZhbHNlOyAvLyBub3QgYSBzdGF0ZSBldmVudFxuICAgICAgaWYgKHRoaXMuZGlyZWN0aW9uICE9PSBkaXJlY3Rpb24pIHJldHVybiBmYWxzZTsgLy8gZGlyZWN0aW9uIG1pc21hdGNoXG4gICAgICBpZiAodGhpcy5ldmVudFR5cGUgIT09IGV2ZW50VHlwZSkgcmV0dXJuIGZhbHNlOyAvLyBldmVudCB0eXBlIG1pc21hdGNoXG4gICAgICBpZiAodGhpcy5rZXlTdHIgPT09IG51bGwpIHJldHVybiB0cnVlOyAvLyBhbGwgc3RhdGUga2V5cyBhcmUgYWxsb3dlZFxuICAgICAgaWYgKHRoaXMua2V5U3RyID09PSBzdGF0ZUtleSkgcmV0dXJuIHRydWU7IC8vIHRoaXMgc3RhdGUga2V5IGlzIGFsbG93ZWRcblxuICAgICAgLy8gRGVmYXVsdCBub3QgYWxsb3dlZFxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJtYXRjaGVzQXNUb0RldmljZUV2ZW50XCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIG1hdGNoZXNBc1RvRGV2aWNlRXZlbnQoZGlyZWN0aW9uLCBldmVudFR5cGUpIHtcbiAgICAgIGlmICh0aGlzLmtpbmQgIT09IEV2ZW50S2luZC5Ub0RldmljZSkgcmV0dXJuIGZhbHNlOyAvLyBub3QgYSB0by1kZXZpY2UgZXZlbnRcbiAgICAgIGlmICh0aGlzLmRpcmVjdGlvbiAhPT0gZGlyZWN0aW9uKSByZXR1cm4gZmFsc2U7IC8vIGRpcmVjdGlvbiBtaXNtYXRjaFxuICAgICAgaWYgKHRoaXMuZXZlbnRUeXBlICE9PSBldmVudFR5cGUpIHJldHVybiBmYWxzZTsgLy8gZXZlbnQgdHlwZSBtaXNtYXRjaFxuXG4gICAgICAvLyBDaGVja3MgcGFzc2VkLCB0aGUgZXZlbnQgaXMgYWxsb3dlZFxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcIm1hdGNoZXNBc1Jvb21FdmVudFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBtYXRjaGVzQXNSb29tRXZlbnQoZGlyZWN0aW9uLCBldmVudFR5cGUpIHtcbiAgICAgIHZhciBtc2d0eXBlID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMl0gOiBudWxsO1xuICAgICAgaWYgKHRoaXMua2luZCAhPT0gRXZlbnRLaW5kLkV2ZW50KSByZXR1cm4gZmFsc2U7IC8vIG5vdCBhIHJvb20gZXZlbnRcbiAgICAgIGlmICh0aGlzLmRpcmVjdGlvbiAhPT0gZGlyZWN0aW9uKSByZXR1cm4gZmFsc2U7IC8vIGRpcmVjdGlvbiBtaXNtYXRjaFxuICAgICAgaWYgKHRoaXMuZXZlbnRUeXBlICE9PSBldmVudFR5cGUpIHJldHVybiBmYWxzZTsgLy8gZXZlbnQgdHlwZSBtaXNtYXRjaFxuXG4gICAgICBpZiAodGhpcy5ldmVudFR5cGUgPT09IFwibS5yb29tLm1lc3NhZ2VcIikge1xuICAgICAgICBpZiAodGhpcy5rZXlTdHIgPT09IG51bGwpIHJldHVybiB0cnVlOyAvLyBhbGwgbWVzc2FnZSB0eXBlcyBhcmUgYWxsb3dlZFxuICAgICAgICBpZiAodGhpcy5rZXlTdHIgPT09IG1zZ3R5cGUpIHJldHVybiB0cnVlOyAvLyB0aGlzIG1lc3NhZ2UgdHlwZSBpcyBhbGxvd2VkXG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdHJ1ZTsgLy8gYWxyZWFkeSBwYXNzZWQgdGhlIGNoZWNrIGZvciBpZiB0aGUgZXZlbnQgaXMgYWxsb3dlZFxuICAgICAgfVxuXG4gICAgICAvLyBEZWZhdWx0IG5vdCBhbGxvd2VkXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcIm1hdGNoZXNBc1Jvb21BY2NvdW50RGF0YVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBtYXRjaGVzQXNSb29tQWNjb3VudERhdGEoZGlyZWN0aW9uLCBldmVudFR5cGUpIHtcbiAgICAgIGlmICh0aGlzLmtpbmQgIT09IEV2ZW50S2luZC5Sb29tQWNjb3VudCkgcmV0dXJuIGZhbHNlOyAvLyBub3Qgcm9vbSBhY2NvdW50IGRhdGFcbiAgICAgIGlmICh0aGlzLmRpcmVjdGlvbiAhPT0gZGlyZWN0aW9uKSByZXR1cm4gZmFsc2U7IC8vIGRpcmVjdGlvbiBtaXNtYXRjaFxuICAgICAgaWYgKHRoaXMuZXZlbnRUeXBlICE9PSBldmVudFR5cGUpIHJldHVybiBmYWxzZTsgLy8gZXZlbnQgdHlwZSBtaXNtYXRjaFxuXG4gICAgICAvLyBDaGVja3MgcGFzc2VkLCB0aGUgZXZlbnQgaXMgYWxsb3dlZFxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XSwgW3tcbiAgICBrZXk6IFwiZm9yU3RhdGVFdmVudFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBmb3JTdGF0ZUV2ZW50KGRpcmVjdGlvbiwgZXZlbnRUeXBlLCBzdGF0ZUtleSkge1xuICAgICAgLy8gVE9ETzogRW5hYmxlIHN1cHBvcnQgZm9yIG0uKiBuYW1lc3BhY2Ugb25jZSB0aGUgTVNDIGxhbmRzLlxuICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21hdHJpeC1vcmcvbWF0cml4LXdpZGdldC1hcGkvaXNzdWVzLzIyXG4gICAgICBldmVudFR5cGUgPSBldmVudFR5cGUucmVwbGFjZSgvIy9nLCAnXFxcXCMnKTtcbiAgICAgIHN0YXRlS2V5ID0gc3RhdGVLZXkgIT09IG51bGwgJiYgc3RhdGVLZXkgIT09IHVuZGVmaW5lZCA/IFwiI1wiLmNvbmNhdChzdGF0ZUtleSkgOiAnJztcbiAgICAgIHZhciBzdHIgPSBcIm9yZy5tYXRyaXgubXNjMjc2Mi5cIi5jb25jYXQoZGlyZWN0aW9uLCBcIi5zdGF0ZV9ldmVudDpcIikuY29uY2F0KGV2ZW50VHlwZSkuY29uY2F0KHN0YXRlS2V5KTtcblxuICAgICAgLy8gY2hlYXQgYnkgc2VuZGluZyBpdCB0aHJvdWdoIHRoZSBwcm9jZXNzb3JcbiAgICAgIHJldHVybiBXaWRnZXRFdmVudENhcGFiaWxpdHkuZmluZEV2ZW50Q2FwYWJpbGl0aWVzKFtzdHJdKVswXTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiZm9yVG9EZXZpY2VFdmVudFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBmb3JUb0RldmljZUV2ZW50KGRpcmVjdGlvbiwgZXZlbnRUeXBlKSB7XG4gICAgICAvLyBUT0RPOiBFbmFibGUgc3VwcG9ydCBmb3IgbS4qIG5hbWVzcGFjZSBvbmNlIHRoZSBNU0MgbGFuZHMuXG4gICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vbWF0cml4LW9yZy9tYXRyaXgtd2lkZ2V0LWFwaS9pc3N1ZXMvNTZcbiAgICAgIHZhciBzdHIgPSBcIm9yZy5tYXRyaXgubXNjMzgxOS5cIi5jb25jYXQoZGlyZWN0aW9uLCBcIi50b19kZXZpY2U6XCIpLmNvbmNhdChldmVudFR5cGUpO1xuXG4gICAgICAvLyBjaGVhdCBieSBzZW5kaW5nIGl0IHRocm91Z2ggdGhlIHByb2Nlc3NvclxuICAgICAgcmV0dXJuIFdpZGdldEV2ZW50Q2FwYWJpbGl0eS5maW5kRXZlbnRDYXBhYmlsaXRpZXMoW3N0cl0pWzBdO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJmb3JSb29tRXZlbnRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gZm9yUm9vbUV2ZW50KGRpcmVjdGlvbiwgZXZlbnRUeXBlKSB7XG4gICAgICAvLyBUT0RPOiBFbmFibGUgc3VwcG9ydCBmb3IgbS4qIG5hbWVzcGFjZSBvbmNlIHRoZSBNU0MgbGFuZHMuXG4gICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vbWF0cml4LW9yZy9tYXRyaXgtd2lkZ2V0LWFwaS9pc3N1ZXMvMjJcbiAgICAgIHZhciBzdHIgPSBcIm9yZy5tYXRyaXgubXNjMjc2Mi5cIi5jb25jYXQoZGlyZWN0aW9uLCBcIi5ldmVudDpcIikuY29uY2F0KGV2ZW50VHlwZSk7XG5cbiAgICAgIC8vIGNoZWF0IGJ5IHNlbmRpbmcgaXQgdGhyb3VnaCB0aGUgcHJvY2Vzc29yXG4gICAgICByZXR1cm4gV2lkZ2V0RXZlbnRDYXBhYmlsaXR5LmZpbmRFdmVudENhcGFiaWxpdGllcyhbc3RyXSlbMF07XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImZvclJvb21NZXNzYWdlRXZlbnRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gZm9yUm9vbU1lc3NhZ2VFdmVudChkaXJlY3Rpb24sIG1zZ3R5cGUpIHtcbiAgICAgIC8vIFRPRE86IEVuYWJsZSBzdXBwb3J0IGZvciBtLiogbmFtZXNwYWNlIG9uY2UgdGhlIE1TQyBsYW5kcy5cbiAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXRyaXgtb3JnL21hdHJpeC13aWRnZXQtYXBpL2lzc3Vlcy8yMlxuICAgICAgbXNndHlwZSA9IG1zZ3R5cGUgPT09IG51bGwgfHwgbXNndHlwZSA9PT0gdW5kZWZpbmVkID8gJycgOiBtc2d0eXBlO1xuICAgICAgdmFyIHN0ciA9IFwib3JnLm1hdHJpeC5tc2MyNzYyLlwiLmNvbmNhdChkaXJlY3Rpb24sIFwiLmV2ZW50Om0ucm9vbS5tZXNzYWdlI1wiKS5jb25jYXQobXNndHlwZSk7XG5cbiAgICAgIC8vIGNoZWF0IGJ5IHNlbmRpbmcgaXQgdGhyb3VnaCB0aGUgcHJvY2Vzc29yXG4gICAgICByZXR1cm4gV2lkZ2V0RXZlbnRDYXBhYmlsaXR5LmZpbmRFdmVudENhcGFiaWxpdGllcyhbc3RyXSlbMF07XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImZvclJvb21BY2NvdW50RGF0YVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBmb3JSb29tQWNjb3VudERhdGEoZGlyZWN0aW9uLCBldmVudFR5cGUpIHtcbiAgICAgIHZhciBzdHIgPSBcImNvbS5iZWVwZXIuY2FwYWJpbGl0aWVzLlwiLmNvbmNhdChkaXJlY3Rpb24sIFwiLnJvb21fYWNjb3VudF9kYXRhOlwiKS5jb25jYXQoZXZlbnRUeXBlKTtcbiAgICAgIHJldHVybiBXaWRnZXRFdmVudENhcGFiaWxpdHkuZmluZEV2ZW50Q2FwYWJpbGl0aWVzKFtzdHJdKVswXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQYXJzZXMgYSBjYXBhYmlsaXRpZXMgcmVxdWVzdCB0byBmaW5kIGFsbCB0aGUgZXZlbnQgY2FwYWJpbGl0eSByZXF1ZXN0cy5cbiAgICAgKiBAcGFyYW0ge0l0ZXJhYmxlPENhcGFiaWxpdHk+fSBjYXBhYmlsaXRpZXMgVGhlIGNhcGFiaWxpdGllcyByZXF1ZXN0ZWQvdG8gcGFyc2UuXG4gICAgICogQHJldHVybnMge1dpZGdldEV2ZW50Q2FwYWJpbGl0eVtdfSBBbiBhcnJheSBvZiBldmVudCBjYXBhYmlsaXR5IHJlcXVlc3RzLiBNYXkgYmUgZW1wdHksIGJ1dCBuZXZlciBudWxsLlxuICAgICAqL1xuICB9LCB7XG4gICAga2V5OiBcImZpbmRFdmVudENhcGFiaWxpdGllc1wiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBmaW5kRXZlbnRDYXBhYmlsaXRpZXMoY2FwYWJpbGl0aWVzKSB7XG4gICAgICB2YXIgcGFyc2VkID0gW107XG4gICAgICB2YXIgX2l0ZXJhdG9yID0gX2NyZWF0ZUZvck9mSXRlcmF0b3JIZWxwZXIoY2FwYWJpbGl0aWVzKSxcbiAgICAgICAgX3N0ZXA7XG4gICAgICB0cnkge1xuICAgICAgICBmb3IgKF9pdGVyYXRvci5zKCk7ICEoX3N0ZXAgPSBfaXRlcmF0b3IubigpKS5kb25lOykge1xuICAgICAgICAgIHZhciBjYXAgPSBfc3RlcC52YWx1ZTtcbiAgICAgICAgICB2YXIgX2RpcmVjdGlvbiA9IG51bGw7XG4gICAgICAgICAgdmFyIGV2ZW50U2VnbWVudCA9IHZvaWQgMDtcbiAgICAgICAgICB2YXIgX2tpbmQgPSBudWxsO1xuXG4gICAgICAgICAgLy8gVE9ETzogRW5hYmxlIHN1cHBvcnQgZm9yIG0uKiBuYW1lc3BhY2Ugb25jZSB0aGUgTVNDcyBsYW5kLlxuICAgICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXRyaXgtb3JnL21hdHJpeC13aWRnZXQtYXBpL2lzc3Vlcy8yMlxuICAgICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXRyaXgtb3JnL21hdHJpeC13aWRnZXQtYXBpL2lzc3Vlcy81NlxuXG4gICAgICAgICAgaWYgKGNhcC5zdGFydHNXaXRoKFwib3JnLm1hdHJpeC5tc2MyNzYyLnNlbmQuZXZlbnQ6XCIpKSB7XG4gICAgICAgICAgICBfZGlyZWN0aW9uID0gRXZlbnREaXJlY3Rpb24uU2VuZDtcbiAgICAgICAgICAgIF9raW5kID0gRXZlbnRLaW5kLkV2ZW50O1xuICAgICAgICAgICAgZXZlbnRTZWdtZW50ID0gY2FwLnN1YnN0cmluZyhcIm9yZy5tYXRyaXgubXNjMjc2Mi5zZW5kLmV2ZW50OlwiLmxlbmd0aCk7XG4gICAgICAgICAgfSBlbHNlIGlmIChjYXAuc3RhcnRzV2l0aChcIm9yZy5tYXRyaXgubXNjMjc2Mi5zZW5kLnN0YXRlX2V2ZW50OlwiKSkge1xuICAgICAgICAgICAgX2RpcmVjdGlvbiA9IEV2ZW50RGlyZWN0aW9uLlNlbmQ7XG4gICAgICAgICAgICBfa2luZCA9IEV2ZW50S2luZC5TdGF0ZTtcbiAgICAgICAgICAgIGV2ZW50U2VnbWVudCA9IGNhcC5zdWJzdHJpbmcoXCJvcmcubWF0cml4Lm1zYzI3NjIuc2VuZC5zdGF0ZV9ldmVudDpcIi5sZW5ndGgpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoY2FwLnN0YXJ0c1dpdGgoXCJvcmcubWF0cml4Lm1zYzM4MTkuc2VuZC50b19kZXZpY2U6XCIpKSB7XG4gICAgICAgICAgICBfZGlyZWN0aW9uID0gRXZlbnREaXJlY3Rpb24uU2VuZDtcbiAgICAgICAgICAgIF9raW5kID0gRXZlbnRLaW5kLlRvRGV2aWNlO1xuICAgICAgICAgICAgZXZlbnRTZWdtZW50ID0gY2FwLnN1YnN0cmluZyhcIm9yZy5tYXRyaXgubXNjMzgxOS5zZW5kLnRvX2RldmljZTpcIi5sZW5ndGgpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoY2FwLnN0YXJ0c1dpdGgoXCJvcmcubWF0cml4Lm1zYzI3NjIucmVjZWl2ZS5ldmVudDpcIikpIHtcbiAgICAgICAgICAgIF9kaXJlY3Rpb24gPSBFdmVudERpcmVjdGlvbi5SZWNlaXZlO1xuICAgICAgICAgICAgX2tpbmQgPSBFdmVudEtpbmQuRXZlbnQ7XG4gICAgICAgICAgICBldmVudFNlZ21lbnQgPSBjYXAuc3Vic3RyaW5nKFwib3JnLm1hdHJpeC5tc2MyNzYyLnJlY2VpdmUuZXZlbnQ6XCIubGVuZ3RoKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGNhcC5zdGFydHNXaXRoKFwib3JnLm1hdHJpeC5tc2MyNzYyLnJlY2VpdmUuc3RhdGVfZXZlbnQ6XCIpKSB7XG4gICAgICAgICAgICBfZGlyZWN0aW9uID0gRXZlbnREaXJlY3Rpb24uUmVjZWl2ZTtcbiAgICAgICAgICAgIF9raW5kID0gRXZlbnRLaW5kLlN0YXRlO1xuICAgICAgICAgICAgZXZlbnRTZWdtZW50ID0gY2FwLnN1YnN0cmluZyhcIm9yZy5tYXRyaXgubXNjMjc2Mi5yZWNlaXZlLnN0YXRlX2V2ZW50OlwiLmxlbmd0aCk7XG4gICAgICAgICAgfSBlbHNlIGlmIChjYXAuc3RhcnRzV2l0aChcIm9yZy5tYXRyaXgubXNjMzgxOS5yZWNlaXZlLnRvX2RldmljZTpcIikpIHtcbiAgICAgICAgICAgIF9kaXJlY3Rpb24gPSBFdmVudERpcmVjdGlvbi5SZWNlaXZlO1xuICAgICAgICAgICAgX2tpbmQgPSBFdmVudEtpbmQuVG9EZXZpY2U7XG4gICAgICAgICAgICBldmVudFNlZ21lbnQgPSBjYXAuc3Vic3RyaW5nKFwib3JnLm1hdHJpeC5tc2MzODE5LnJlY2VpdmUudG9fZGV2aWNlOlwiLmxlbmd0aCk7XG4gICAgICAgICAgfSBlbHNlIGlmIChjYXAuc3RhcnRzV2l0aChcImNvbS5iZWVwZXIuY2FwYWJpbGl0aWVzLnJlY2VpdmUucm9vbV9hY2NvdW50X2RhdGE6XCIpKSB7XG4gICAgICAgICAgICBfZGlyZWN0aW9uID0gRXZlbnREaXJlY3Rpb24uUmVjZWl2ZTtcbiAgICAgICAgICAgIF9raW5kID0gRXZlbnRLaW5kLlJvb21BY2NvdW50O1xuICAgICAgICAgICAgZXZlbnRTZWdtZW50ID0gY2FwLnN1YnN0cmluZyhcImNvbS5iZWVwZXIuY2FwYWJpbGl0aWVzLnJlY2VpdmUucm9vbV9hY2NvdW50X2RhdGE6XCIubGVuZ3RoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKF9kaXJlY3Rpb24gPT09IG51bGwgfHwgX2tpbmQgPT09IG51bGwgfHwgZXZlbnRTZWdtZW50ID09PSB1bmRlZmluZWQpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgLy8gVGhlIGNhcGFiaWxpdHkgdXNlcyBgI2AgYXMgYSBzZXBhcmF0b3IgYmV0d2VlbiBldmVudCB0eXBlIGFuZCBzdGF0ZSBrZXkvbXNndHlwZSxcbiAgICAgICAgICAvLyBzbyB3ZSBzcGxpdCBvbiB0aGF0LiBIb3dldmVyLCBhICMgaXMgYWxzbyB2YWxpZCBpbiBlaXRoZXIgb25lIG9mIHRob3NlIHNvIHdlXG4gICAgICAgICAgLy8gam9pbiBhY2NvcmRpbmdseS5cbiAgICAgICAgICAvLyBFZzogYG0ucm9vbS5tZXNzYWdlIyNtLnRleHRgIGlzIFwibS5yb29tLm1lc3NhZ2VcIiBldmVudCB3aXRoIG1zZ3R5cGUgXCIjbS50ZXh0XCIuXG4gICAgICAgICAgdmFyIGV4cGVjdGluZ0tleVN0ciA9IGV2ZW50U2VnbWVudC5zdGFydHNXaXRoKFwibS5yb29tLm1lc3NhZ2UjXCIpIHx8IF9raW5kID09PSBFdmVudEtpbmQuU3RhdGU7XG4gICAgICAgICAgdmFyIF9rZXlTdHIgPSBudWxsO1xuICAgICAgICAgIGlmIChldmVudFNlZ21lbnQuaW5jbHVkZXMoJyMnKSAmJiBleHBlY3RpbmdLZXlTdHIpIHtcbiAgICAgICAgICAgIC8vIERldiBub3RlOiByZWdleCBpcyBkaWZmaWN1bHQgdG8gd3JpdGUsIHNvIGluc3RlYWQgdGhlIHJ1bGVzIGFyZSBtYW51YWxseSB3cml0dGVuXG4gICAgICAgICAgICAvLyBvdXQuIFRoaXMgaXMgcHJvYmFibHkganVzdCBhcyB1bmRlcnN0YW5kYWJsZSBhcyBhIGJvcmluZyByZWdleCB0aG91Z2gsIHNvIHdpbi13aW4/XG5cbiAgICAgICAgICAgIC8vIFRlc3QgY2FzZXM6XG4gICAgICAgICAgICAvLyBzdHIgICAgICAgICAgICAgICAgICAgICAgZXZlbnRTZWdtZW50ICAgICAgICBrZXlTdHJcbiAgICAgICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgICAgIC8vIG0ucm9vbS5tZXNzYWdlIyAgICAgICAgICBtLnJvb20ubWVzc2FnZSAgICAgIDxlbXB0eSBzdHJpbmc+XG4gICAgICAgICAgICAvLyBtLnJvb20ubWVzc2FnZSN0ZXN0ICAgICAgbS5yb29tLm1lc3NhZ2UgICAgICB0ZXN0XG4gICAgICAgICAgICAvLyBtLnJvb20ubWVzc2FnZVxcIyAgICAgICAgIG0ucm9vbS5tZXNzYWdlIyAgICAgdGVzdFxuICAgICAgICAgICAgLy8gbS5yb29tLm1lc3NhZ2UjI3Rlc3QgICAgIG0ucm9vbS5tZXNzYWdlICAgICAgI3Rlc3RcbiAgICAgICAgICAgIC8vIG0ucm9vbS5tZXNzYWdlXFwjI3Rlc3QgICAgbS5yb29tLm1lc3NhZ2UjICAgICB0ZXN0XG4gICAgICAgICAgICAvLyBtLnJvb20ubWVzc2FnZVxcXFwjI3Rlc3QgICBtLnJvb20ubWVzc2FnZVxcIyAgICB0ZXN0XG4gICAgICAgICAgICAvLyBtLnJvb20ubWVzc2FnZVxcXFwjIyN0ZXN0ICBtLnJvb20ubWVzc2FnZVxcIyAgICAjdGVzdFxuXG4gICAgICAgICAgICAvLyBGaXJzdCBzdGVwOiBleHBsb2RlIHRoZSBzdHJpbmdcbiAgICAgICAgICAgIHZhciBwYXJ0cyA9IGV2ZW50U2VnbWVudC5zcGxpdCgnIycpO1xuXG4gICAgICAgICAgICAvLyBUbyBmb3JtIHRoZSBldmVudFNlZ21lbnQsIHdlJ2xsIGtlZXAgZmluZGluZyBwYXJ0cyBvZiB0aGUgZXhwbG9kZWQgc3RyaW5nIHVudGlsXG4gICAgICAgICAgICAvLyB0aGVyZSdzIG9uZSB0aGF0IGRvZXNuJ3QgZW5kIHdpdGggdGhlIGVzY2FwZSBjaGFyYWN0ZXIgKFxcKS4gV2UnbGwgdGhlbiBqb2luIHRob3NlXG4gICAgICAgICAgICAvLyBzZWdtZW50cyB0b2dldGhlciB3aXRoIHRoZSBleHBsb2RpbmcgY2hhcmFjdGVyLiBXZSBoYXZlIHRvIHJlbWVtYmVyIHRvIGNvbnN1bWUgdGhlXG4gICAgICAgICAgICAvLyBlc2NhcGUgY2hhcmFjdGVyIGFzIHdlbGwuXG4gICAgICAgICAgICB2YXIgaWR4ID0gcGFydHMuZmluZEluZGV4KGZ1bmN0aW9uIChwKSB7XG4gICAgICAgICAgICAgIHJldHVybiAhcC5lbmRzV2l0aChcIlxcXFxcIik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGV2ZW50U2VnbWVudCA9IHBhcnRzLnNsaWNlKDAsIGlkeCArIDEpLm1hcChmdW5jdGlvbiAocCkge1xuICAgICAgICAgICAgICByZXR1cm4gcC5lbmRzV2l0aCgnXFxcXCcpID8gcC5zdWJzdHJpbmcoMCwgcC5sZW5ndGggLSAxKSA6IHA7XG4gICAgICAgICAgICB9KS5qb2luKCcjJyk7XG5cbiAgICAgICAgICAgIC8vIFRoZSBrZXlTdHIgaXMgd2hhdGV2ZXIgaXMgbGVmdCBvdmVyLlxuICAgICAgICAgICAgX2tleVN0ciA9IHBhcnRzLnNsaWNlKGlkeCArIDEpLmpvaW4oJyMnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcGFyc2VkLnB1c2gobmV3IFdpZGdldEV2ZW50Q2FwYWJpbGl0eShfZGlyZWN0aW9uLCBldmVudFNlZ21lbnQsIF9raW5kLCBfa2V5U3RyLCBjYXApKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIF9pdGVyYXRvci5lKGVycik7XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICBfaXRlcmF0b3IuZigpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHBhcnNlZDtcbiAgICB9XG4gIH1dKTtcbiAgcmV0dXJuIFdpZGdldEV2ZW50Q2FwYWJpbGl0eTtcbn0oKTtcbmV4cG9ydHMuV2lkZ2V0RXZlbnRDYXBhYmlsaXR5ID0gV2lkZ2V0RXZlbnRDYXBhYmlsaXR5O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9V2lkZ2V0RXZlbnRDYXBhYmlsaXR5LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5XaWRnZXRQYXJzZXIgPSB2b2lkIDA7XG52YXIgX1dpZGdldCA9IHJlcXVpcmUoXCIuL1dpZGdldFwiKTtcbnZhciBfdXJsID0gcmVxdWlyZShcIi4vdmFsaWRhdGlvbi91cmxcIik7XG5mdW5jdGlvbiBfdHlwZW9mKG9iaikgeyBcIkBiYWJlbC9oZWxwZXJzIC0gdHlwZW9mXCI7IHJldHVybiBfdHlwZW9mID0gXCJmdW5jdGlvblwiID09IHR5cGVvZiBTeW1ib2wgJiYgXCJzeW1ib2xcIiA9PSB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID8gZnVuY3Rpb24gKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfSA6IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIG9iaiAmJiBcImZ1bmN0aW9uXCIgPT0gdHlwZW9mIFN5bWJvbCAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvYmogIT09IFN5bWJvbC5wcm90b3R5cGUgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajsgfSwgX3R5cGVvZihvYmopOyB9XG5mdW5jdGlvbiBfY3JlYXRlRm9yT2ZJdGVyYXRvckhlbHBlcihvLCBhbGxvd0FycmF5TGlrZSkgeyB2YXIgaXQgPSB0eXBlb2YgU3ltYm9sICE9PSBcInVuZGVmaW5lZFwiICYmIG9bU3ltYm9sLml0ZXJhdG9yXSB8fCBvW1wiQEBpdGVyYXRvclwiXTsgaWYgKCFpdCkgeyBpZiAoQXJyYXkuaXNBcnJheShvKSB8fCAoaXQgPSBfdW5zdXBwb3J0ZWRJdGVyYWJsZVRvQXJyYXkobykpIHx8IGFsbG93QXJyYXlMaWtlICYmIG8gJiYgdHlwZW9mIG8ubGVuZ3RoID09PSBcIm51bWJlclwiKSB7IGlmIChpdCkgbyA9IGl0OyB2YXIgaSA9IDA7IHZhciBGID0gZnVuY3Rpb24gRigpIHt9OyByZXR1cm4geyBzOiBGLCBuOiBmdW5jdGlvbiBuKCkgeyBpZiAoaSA+PSBvLmxlbmd0aCkgcmV0dXJuIHsgZG9uZTogdHJ1ZSB9OyByZXR1cm4geyBkb25lOiBmYWxzZSwgdmFsdWU6IG9baSsrXSB9OyB9LCBlOiBmdW5jdGlvbiBlKF9lKSB7IHRocm93IF9lOyB9LCBmOiBGIH07IH0gdGhyb3cgbmV3IFR5cGVFcnJvcihcIkludmFsaWQgYXR0ZW1wdCB0byBpdGVyYXRlIG5vbi1pdGVyYWJsZSBpbnN0YW5jZS5cXG5JbiBvcmRlciB0byBiZSBpdGVyYWJsZSwgbm9uLWFycmF5IG9iamVjdHMgbXVzdCBoYXZlIGEgW1N5bWJvbC5pdGVyYXRvcl0oKSBtZXRob2QuXCIpOyB9IHZhciBub3JtYWxDb21wbGV0aW9uID0gdHJ1ZSwgZGlkRXJyID0gZmFsc2UsIGVycjsgcmV0dXJuIHsgczogZnVuY3Rpb24gcygpIHsgaXQgPSBpdC5jYWxsKG8pOyB9LCBuOiBmdW5jdGlvbiBuKCkgeyB2YXIgc3RlcCA9IGl0Lm5leHQoKTsgbm9ybWFsQ29tcGxldGlvbiA9IHN0ZXAuZG9uZTsgcmV0dXJuIHN0ZXA7IH0sIGU6IGZ1bmN0aW9uIGUoX2UyKSB7IGRpZEVyciA9IHRydWU7IGVyciA9IF9lMjsgfSwgZjogZnVuY3Rpb24gZigpIHsgdHJ5IHsgaWYgKCFub3JtYWxDb21wbGV0aW9uICYmIGl0W1wicmV0dXJuXCJdICE9IG51bGwpIGl0W1wicmV0dXJuXCJdKCk7IH0gZmluYWxseSB7IGlmIChkaWRFcnIpIHRocm93IGVycjsgfSB9IH07IH1cbmZ1bmN0aW9uIF91bnN1cHBvcnRlZEl0ZXJhYmxlVG9BcnJheShvLCBtaW5MZW4pIHsgaWYgKCFvKSByZXR1cm47IGlmICh0eXBlb2YgbyA9PT0gXCJzdHJpbmdcIikgcmV0dXJuIF9hcnJheUxpa2VUb0FycmF5KG8sIG1pbkxlbik7IHZhciBuID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pLnNsaWNlKDgsIC0xKTsgaWYgKG4gPT09IFwiT2JqZWN0XCIgJiYgby5jb25zdHJ1Y3RvcikgbiA9IG8uY29uc3RydWN0b3IubmFtZTsgaWYgKG4gPT09IFwiTWFwXCIgfHwgbiA9PT0gXCJTZXRcIikgcmV0dXJuIEFycmF5LmZyb20obyk7IGlmIChuID09PSBcIkFyZ3VtZW50c1wiIHx8IC9eKD86VWl8SSludCg/Ojh8MTZ8MzIpKD86Q2xhbXBlZCk/QXJyYXkkLy50ZXN0KG4pKSByZXR1cm4gX2FycmF5TGlrZVRvQXJyYXkobywgbWluTGVuKTsgfVxuZnVuY3Rpb24gX2FycmF5TGlrZVRvQXJyYXkoYXJyLCBsZW4pIHsgaWYgKGxlbiA9PSBudWxsIHx8IGxlbiA+IGFyci5sZW5ndGgpIGxlbiA9IGFyci5sZW5ndGg7IGZvciAodmFyIGkgPSAwLCBhcnIyID0gbmV3IEFycmF5KGxlbik7IGkgPCBsZW47IGkrKykgYXJyMltpXSA9IGFycltpXTsgcmV0dXJuIGFycjI7IH1cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIF90b1Byb3BlcnR5S2V5KGRlc2NyaXB0b3Iua2V5KSwgZGVzY3JpcHRvcik7IH0gfVxuZnVuY3Rpb24gX2NyZWF0ZUNsYXNzKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyBPYmplY3QuZGVmaW5lUHJvcGVydHkoQ29uc3RydWN0b3IsIFwicHJvdG90eXBlXCIsIHsgd3JpdGFibGU6IGZhbHNlIH0pOyByZXR1cm4gQ29uc3RydWN0b3I7IH1cbmZ1bmN0aW9uIF90b1Byb3BlcnR5S2V5KGFyZykgeyB2YXIga2V5ID0gX3RvUHJpbWl0aXZlKGFyZywgXCJzdHJpbmdcIik7IHJldHVybiBfdHlwZW9mKGtleSkgPT09IFwic3ltYm9sXCIgPyBrZXkgOiBTdHJpbmcoa2V5KTsgfVxuZnVuY3Rpb24gX3RvUHJpbWl0aXZlKGlucHV0LCBoaW50KSB7IGlmIChfdHlwZW9mKGlucHV0KSAhPT0gXCJvYmplY3RcIiB8fCBpbnB1dCA9PT0gbnVsbCkgcmV0dXJuIGlucHV0OyB2YXIgcHJpbSA9IGlucHV0W1N5bWJvbC50b1ByaW1pdGl2ZV07IGlmIChwcmltICE9PSB1bmRlZmluZWQpIHsgdmFyIHJlcyA9IHByaW0uY2FsbChpbnB1dCwgaGludCB8fCBcImRlZmF1bHRcIik7IGlmIChfdHlwZW9mKHJlcykgIT09IFwib2JqZWN0XCIpIHJldHVybiByZXM7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJAQHRvUHJpbWl0aXZlIG11c3QgcmV0dXJuIGEgcHJpbWl0aXZlIHZhbHVlLlwiKTsgfSByZXR1cm4gKGhpbnQgPT09IFwic3RyaW5nXCIgPyBTdHJpbmcgOiBOdW1iZXIpKGlucHV0KTsgfSAvKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIENvcHlyaWdodCAyMDIwIFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqICAgICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKi9cbnZhciBXaWRnZXRQYXJzZXIgPSAvKiNfX1BVUkVfXyovZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBXaWRnZXRQYXJzZXIoKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFdpZGdldFBhcnNlcik7XG4gIH0gLy8gcHJpdmF0ZSBjb25zdHJ1Y3RvciBiZWNhdXNlIHRoaXMgaXMgYSB1dGlsIGNsYXNzXG5cbiAgLyoqXG4gICAqIFBhcnNlcyB3aWRnZXRzIGZyb20gdGhlIFwibS53aWRnZXRzXCIgYWNjb3VudCBkYXRhIGV2ZW50LiBUaGlzIHdpbGwgYWx3YXlzXG4gICAqIHJldHVybiBhbiBhcnJheSwgdGhvdWdoIG1heSBiZSBlbXB0eSBpZiBubyB2YWxpZCB3aWRnZXRzIHdlcmUgZm91bmQuXG4gICAqIEBwYXJhbSB7SUFjY291bnREYXRhV2lkZ2V0c30gY29udGVudCBUaGUgY29udGVudCBvZiB0aGUgXCJtLndpZGdldHNcIiBhY2NvdW50IGRhdGEuXG4gICAqIEByZXR1cm5zIHtXaWRnZXRbXX0gVGhlIHdpZGdldHMgaW4gYWNjb3VudCBkYXRhLCBvciBhbiBlbXB0eSBhcnJheS5cbiAgICovXG4gIF9jcmVhdGVDbGFzcyhXaWRnZXRQYXJzZXIsIG51bGwsIFt7XG4gICAga2V5OiBcInBhcnNlQWNjb3VudERhdGFcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gcGFyc2VBY2NvdW50RGF0YShjb250ZW50KSB7XG4gICAgICBpZiAoIWNvbnRlbnQpIHJldHVybiBbXTtcbiAgICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICAgIGZvciAodmFyIF9pID0gMCwgX09iamVjdCRrZXlzID0gT2JqZWN0LmtleXMoY29udGVudCk7IF9pIDwgX09iamVjdCRrZXlzLmxlbmd0aDsgX2krKykge1xuICAgICAgICB2YXIgX3dpZGdldElkID0gX09iamVjdCRrZXlzW19pXTtcbiAgICAgICAgdmFyIHJvdWdoV2lkZ2V0ID0gY29udGVudFtfd2lkZ2V0SWRdO1xuICAgICAgICBpZiAoIXJvdWdoV2lkZ2V0KSBjb250aW51ZTtcbiAgICAgICAgaWYgKHJvdWdoV2lkZ2V0LnR5cGUgIT09IFwibS53aWRnZXRcIiAmJiByb3VnaFdpZGdldC50eXBlICE9PSBcImltLnZlY3Rvci5tb2R1bGFyLndpZGdldHNcIikgY29udGludWU7XG4gICAgICAgIGlmICghcm91Z2hXaWRnZXQuc2VuZGVyKSBjb250aW51ZTtcbiAgICAgICAgdmFyIHByb2JhYmxlV2lkZ2V0SWQgPSByb3VnaFdpZGdldC5zdGF0ZV9rZXkgfHwgcm91Z2hXaWRnZXQuaWQ7XG4gICAgICAgIGlmIChwcm9iYWJsZVdpZGdldElkICE9PSBfd2lkZ2V0SWQpIGNvbnRpbnVlO1xuICAgICAgICB2YXIgYXNTdGF0ZUV2ZW50ID0ge1xuICAgICAgICAgIGNvbnRlbnQ6IHJvdWdoV2lkZ2V0LmNvbnRlbnQsXG4gICAgICAgICAgc2VuZGVyOiByb3VnaFdpZGdldC5zZW5kZXIsXG4gICAgICAgICAgdHlwZTogXCJtLndpZGdldFwiLFxuICAgICAgICAgIHN0YXRlX2tleTogX3dpZGdldElkLFxuICAgICAgICAgIGV2ZW50X2lkOiBcIiRleGFtcGxlXCIsXG4gICAgICAgICAgcm9vbV9pZDogXCIhZXhhbXBsZVwiLFxuICAgICAgICAgIG9yaWdpbl9zZXJ2ZXJfdHM6IDFcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHdpZGdldCA9IFdpZGdldFBhcnNlci5wYXJzZVJvb21XaWRnZXQoYXNTdGF0ZUV2ZW50KTtcbiAgICAgICAgaWYgKHdpZGdldCkgcmVzdWx0LnB1c2god2lkZ2V0KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUGFyc2VzIGFsbCB0aGUgd2lkZ2V0cyBwb3NzaWJsZSBpbiB0aGUgZ2l2ZW4gYXJyYXkuIFRoaXMgd2lsbCBhbHdheXMgcmV0dXJuXG4gICAgICogYW4gYXJyYXksIHRob3VnaCBtYXkgYmUgZW1wdHkgaWYgbm8gd2lkZ2V0cyBjb3VsZCBiZSBwYXJzZWQuXG4gICAgICogQHBhcmFtIHtJU3RhdGVFdmVudFtdfSBjdXJyZW50U3RhdGUgVGhlIHJvb20gc3RhdGUgdG8gcGFyc2UuXG4gICAgICogQHJldHVybnMge1dpZGdldFtdfSBUaGUgd2lkZ2V0cyBpbiB0aGUgc3RhdGUsIG9yIGFuIGVtcHR5IGFycmF5LlxuICAgICAqL1xuICB9LCB7XG4gICAga2V5OiBcInBhcnNlV2lkZ2V0c0Zyb21Sb29tU3RhdGVcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gcGFyc2VXaWRnZXRzRnJvbVJvb21TdGF0ZShjdXJyZW50U3RhdGUpIHtcbiAgICAgIGlmICghY3VycmVudFN0YXRlKSByZXR1cm4gW107XG4gICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICB2YXIgX2l0ZXJhdG9yID0gX2NyZWF0ZUZvck9mSXRlcmF0b3JIZWxwZXIoY3VycmVudFN0YXRlKSxcbiAgICAgICAgX3N0ZXA7XG4gICAgICB0cnkge1xuICAgICAgICBmb3IgKF9pdGVyYXRvci5zKCk7ICEoX3N0ZXAgPSBfaXRlcmF0b3IubigpKS5kb25lOykge1xuICAgICAgICAgIHZhciBzdGF0ZSA9IF9zdGVwLnZhbHVlO1xuICAgICAgICAgIHZhciB3aWRnZXQgPSBXaWRnZXRQYXJzZXIucGFyc2VSb29tV2lkZ2V0KHN0YXRlKTtcbiAgICAgICAgICBpZiAod2lkZ2V0KSByZXN1bHQucHVzaCh3aWRnZXQpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgX2l0ZXJhdG9yLmUoZXJyKTtcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIF9pdGVyYXRvci5mKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFBhcnNlcyBhIHN0YXRlIGV2ZW50IGludG8gYSB3aWRnZXQuIElmIHRoZSBzdGF0ZSBldmVudCBkb2VzIG5vdCByZXByZXNlbnRcbiAgICAgKiBhIHdpZGdldCAod3JvbmcgZXZlbnQgdHlwZSwgaW52YWxpZCB3aWRnZXQsIGV0YykgdGhlbiBudWxsIGlzIHJldHVybmVkLlxuICAgICAqIEBwYXJhbSB7SVN0YXRlRXZlbnR9IHN0YXRlRXZlbnQgVGhlIHN0YXRlIGV2ZW50LlxuICAgICAqIEByZXR1cm5zIHtXaWRnZXR8bnVsbH0gVGhlIHdpZGdldCwgb3IgbnVsbCBpZiBpbnZhbGlkXG4gICAgICovXG4gIH0sIHtcbiAgICBrZXk6IFwicGFyc2VSb29tV2lkZ2V0XCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHBhcnNlUm9vbVdpZGdldChzdGF0ZUV2ZW50KSB7XG4gICAgICBpZiAoIXN0YXRlRXZlbnQpIHJldHVybiBudWxsO1xuXG4gICAgICAvLyBUT0RPOiBbTGVnYWN5XSBSZW1vdmUgbGVnYWN5IHN1cHBvcnRcbiAgICAgIGlmIChzdGF0ZUV2ZW50LnR5cGUgIT09IFwibS53aWRnZXRcIiAmJiBzdGF0ZUV2ZW50LnR5cGUgIT09IFwiaW0udmVjdG9yLm1vZHVsYXIud2lkZ2V0c1wiKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuXG4gICAgICAvLyBEZXYgbm90ZTogVGhyb3VnaG91dCB0aGlzIGZ1bmN0aW9uIHdlIGhhdmUgbnVsbCBzYWZldHkgdG8gZW5zdXJlIHRoYXRcbiAgICAgIC8vIGlmIHRoZSBjYWxsZXIgZGlkIG5vdCBzdXBwbHkgc29tZXRoaW5nIHVzZWZ1bCB0aGF0IHdlIGRvbid0IGVycm9yLiBUaGlzXG4gICAgICAvLyBpcyBkb25lIGFnYWluc3QgdGhlIHJlcXVpcmVtZW50cyBvZiB0aGUgaW50ZXJmYWNlIGJlY2F1c2Ugbm90IGV2ZXJ5b25lXG4gICAgICAvLyB3aWxsIGhhdmUgYW4gaW50ZXJmYWNlIHRvIHZhbGlkYXRlIGFnYWluc3QuXG5cbiAgICAgIHZhciBjb250ZW50ID0gc3RhdGVFdmVudC5jb250ZW50IHx8IHt9O1xuXG4gICAgICAvLyBGb3JtIG91ciBiZXN0IGFwcHJveGltYXRpb24gb2YgYSB3aWRnZXQgd2l0aCB0aGUgaW5mb3JtYXRpb24gd2UgaGF2ZVxuICAgICAgdmFyIGVzdGltYXRlZFdpZGdldCA9IHtcbiAgICAgICAgaWQ6IHN0YXRlRXZlbnQuc3RhdGVfa2V5LFxuICAgICAgICBjcmVhdG9yVXNlcklkOiBjb250ZW50WydjcmVhdG9yVXNlcklkJ10gfHwgc3RhdGVFdmVudC5zZW5kZXIsXG4gICAgICAgIG5hbWU6IGNvbnRlbnRbJ25hbWUnXSxcbiAgICAgICAgdHlwZTogY29udGVudFsndHlwZSddLFxuICAgICAgICB1cmw6IGNvbnRlbnRbJ3VybCddLFxuICAgICAgICB3YWl0Rm9ySWZyYW1lTG9hZDogY29udGVudFsnd2FpdEZvcklmcmFtZUxvYWQnXSxcbiAgICAgICAgZGF0YTogY29udGVudFsnZGF0YSddXG4gICAgICB9O1xuXG4gICAgICAvLyBGaW5hbGx5LCBwcm9jZXNzIHRoYXQgd2lkZ2V0XG4gICAgICByZXR1cm4gV2lkZ2V0UGFyc2VyLnByb2Nlc3NFc3RpbWF0ZWRXaWRnZXQoZXN0aW1hdGVkV2lkZ2V0KTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwicHJvY2Vzc0VzdGltYXRlZFdpZGdldFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBwcm9jZXNzRXN0aW1hdGVkV2lkZ2V0KHdpZGdldCkge1xuICAgICAgLy8gVmFsaWRhdGUgdGhhdCB0aGUgd2lkZ2V0IGhhcyB0aGUgYmVzdCBjaGFuY2Ugb2YgcGFzc2luZyBhcyBhIHdpZGdldFxuICAgICAgaWYgKCF3aWRnZXQuaWQgfHwgIXdpZGdldC5jcmVhdG9yVXNlcklkIHx8ICF3aWRnZXQudHlwZSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIGlmICghKDAsIF91cmwuaXNWYWxpZFVybCkod2lkZ2V0LnVybCkpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICAvLyBUT0RPOiBWYWxpZGF0ZSBkYXRhIGZvciBrbm93biB3aWRnZXQgdHlwZXNcbiAgICAgIHJldHVybiBuZXcgX1dpZGdldC5XaWRnZXQod2lkZ2V0KTtcbiAgICB9XG4gIH1dKTtcbiAgcmV0dXJuIFdpZGdldFBhcnNlcjtcbn0oKTtcbmV4cG9ydHMuV2lkZ2V0UGFyc2VyID0gV2lkZ2V0UGFyc2VyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9V2lkZ2V0UGFyc2VyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5pc1ZhbGlkVXJsID0gaXNWYWxpZFVybDtcbi8qXG4gKiBDb3B5cmlnaHQgMjAyMCBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuZnVuY3Rpb24gaXNWYWxpZFVybCh2YWwpIHtcbiAgaWYgKCF2YWwpIHJldHVybiBmYWxzZTsgLy8gZWFzeTogbm90IHZhbGlkIGlmIG5vdCBwcmVzZW50XG5cbiAgdHJ5IHtcbiAgICB2YXIgcGFyc2VkID0gbmV3IFVSTCh2YWwpO1xuICAgIGlmIChwYXJzZWQucHJvdG9jb2wgIT09IFwiaHR0cFwiICYmIHBhcnNlZC5wcm90b2NvbCAhPT0gXCJodHRwc1wiKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9IGNhdGNoIChlKSB7XG4gICAgaWYgKGUgaW5zdGFuY2VvZiBUeXBlRXJyb3IpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdGhyb3cgZTtcbiAgfVxufVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dXJsLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5hc3NlcnRQcmVzZW50ID0gYXNzZXJ0UHJlc2VudDtcbi8qXG4gKiBDb3B5cmlnaHQgMjAyMCBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuZnVuY3Rpb24gYXNzZXJ0UHJlc2VudChvYmosIGtleSkge1xuICBpZiAoIW9ialtrZXldKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiXCIuY29uY2F0KFN0cmluZyhrZXkpLCBcIiBpcyByZXF1aXJlZFwiKSk7XG4gIH1cbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXV0aWxzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5ydW5UZW1wbGF0ZSA9IHJ1blRlbXBsYXRlO1xuZXhwb3J0cy50b1N0cmluZyA9IHRvU3RyaW5nO1xuLypcbiAqIENvcHlyaWdodCAyMDIwLCAyMDIxIFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5mdW5jdGlvbiBydW5UZW1wbGF0ZSh1cmwsIHdpZGdldCwgcGFyYW1zKSB7XG4gIC8vIEFsd2F5cyBhcHBseSB0aGUgc3VwcGxpZWQgcGFyYW1zIG92ZXIgdG9wIG9mIGRhdGEgdG8gZW5zdXJlIHRoZSBkYXRhIGNhbid0IGxpZSBhYm91dCB0aGVtLlxuICB2YXIgdmFyaWFibGVzID0gT2JqZWN0LmFzc2lnbih7fSwgd2lkZ2V0LmRhdGEsIHtcbiAgICAnbWF0cml4X3Jvb21faWQnOiBwYXJhbXMud2lkZ2V0Um9vbUlkIHx8IFwiXCIsXG4gICAgJ21hdHJpeF91c2VyX2lkJzogcGFyYW1zLmN1cnJlbnRVc2VySWQsXG4gICAgJ21hdHJpeF9kaXNwbGF5X25hbWUnOiBwYXJhbXMudXNlckRpc3BsYXlOYW1lIHx8IHBhcmFtcy5jdXJyZW50VXNlcklkLFxuICAgICdtYXRyaXhfYXZhdGFyX3VybCc6IHBhcmFtcy51c2VySHR0cEF2YXRhclVybCB8fCBcIlwiLFxuICAgICdtYXRyaXhfd2lkZ2V0X2lkJzogd2lkZ2V0LmlkLFxuICAgIC8vIFRPRE86IENvbnZlcnQgdG8gc3RhYmxlIChodHRwczovL2dpdGh1Yi5jb20vbWF0cml4LW9yZy9tYXRyaXgtZG9jL3B1bGwvMjg3MylcbiAgICAnb3JnLm1hdHJpeC5tc2MyODczLmNsaWVudF9pZCc6IHBhcmFtcy5jbGllbnRJZCB8fCBcIlwiLFxuICAgICdvcmcubWF0cml4Lm1zYzI4NzMuY2xpZW50X3RoZW1lJzogcGFyYW1zLmNsaWVudFRoZW1lIHx8IFwiXCIsXG4gICAgJ29yZy5tYXRyaXgubXNjMjg3My5jbGllbnRfbGFuZ3VhZ2UnOiBwYXJhbXMuY2xpZW50TGFuZ3VhZ2UgfHwgXCJcIixcbiAgICAvLyBUT0RPOiBDb252ZXJ0IHRvIHN0YWJsZSAoaHR0cHM6Ly9naXRodWIuY29tL21hdHJpeC1vcmcvbWF0cml4LXNwZWMtcHJvcG9zYWxzL3B1bGwvMzgxOSlcbiAgICAnb3JnLm1hdHJpeC5tc2MzODE5Lm1hdHJpeF9kZXZpY2VfaWQnOiBwYXJhbXMuZGV2aWNlSWQgfHwgXCJcIixcbiAgICAvLyBUT0RPOiBDb252ZXJ0IHRvIHN0YWJsZSAoaHR0cHM6Ly9naXRodWIuY29tL21hdHJpeC1vcmcvbWF0cml4LXNwZWMtcHJvcG9zYWxzL3B1bGwvNDAzOSlcbiAgICAnb3JnLm1hdHJpeC5tc2M0MDM5Lm1hdHJpeF9iYXNlX3VybCc6IHBhcmFtcy5iYXNlVXJsIHx8IFwiXCJcbiAgfSk7XG4gIHZhciByZXN1bHQgPSB1cmw7XG4gIGZvciAodmFyIF9pID0gMCwgX09iamVjdCRrZXlzID0gT2JqZWN0LmtleXModmFyaWFibGVzKTsgX2kgPCBfT2JqZWN0JGtleXMubGVuZ3RoOyBfaSsrKSB7XG4gICAgdmFyIGtleSA9IF9PYmplY3Qka2V5c1tfaV07XG4gICAgLy8gUmVnZXggZXNjYXBlIGZyb20gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9hLzY5Njk0ODYvNzAzNzM3OVxuICAgIHZhciBwYXR0ZXJuID0gXCIkXCIuY29uY2F0KGtleSkucmVwbGFjZSgvWy4qKz9eJHt9KCl8W1xcXVxcXFxdL2csICdcXFxcJCYnKTsgLy8gJCYgbWVhbnMgdGhlIHdob2xlIG1hdGNoZWQgc3RyaW5nXG4gICAgdmFyIHJleHAgPSBuZXcgUmVnRXhwKHBhdHRlcm4sICdnJyk7XG5cbiAgICAvLyBUaGlzIGlzIHRlY2huaWNhbGx5IG5vdCB3aGF0IHdlJ3JlIHN1cHBvc2VkIHRvIGRvIGZvciBhIGNvdXBsZSBvZiByZWFzb25zOlxuICAgIC8vIDEuIFdlIGFyZSBhc3N1bWluZyB0aGF0IHRoZXJlIHdvbid0IGxhdGVyIGJlIGEgJGtleSBtYXRjaCBhZnRlciB3ZSByZXBsYWNlIGEgdmFyaWFibGUuXG4gICAgLy8gMi4gV2UgYXJlIGFzc3VtaW5nIHRoYXQgdGhlIHZhcmlhYmxlIGlzIGluIGEgcGxhY2Ugd2hlcmUgaXQgY2FuIGJlIGVzY2FwZWQgKGVnOiBwYXRoIG9yIHF1ZXJ5IHN0cmluZykuXG4gICAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UocmV4cCwgZW5jb2RlVVJJQ29tcG9uZW50KHRvU3RyaW5nKHZhcmlhYmxlc1trZXldKSkpO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5mdW5jdGlvbiB0b1N0cmluZyhhKSB7XG4gIGlmIChhID09PSBudWxsIHx8IGEgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBcIlwiLmNvbmNhdChhKTtcbiAgfVxuICByZXR1cm4gU3RyaW5nKGEpO1xufVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dXJsLXRlbXBsYXRlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9SVRyYW5zcG9ydC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuUG9zdG1lc3NhZ2VUcmFuc3BvcnQgPSB2b2lkIDA7XG52YXIgX2V2ZW50cyA9IHJlcXVpcmUoXCJldmVudHNcIik7XG52YXIgXyA9IHJlcXVpcmUoXCIuLlwiKTtcbnZhciBfZXhjbHVkZWQgPSBbXCJtZXNzYWdlXCJdO1xuZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgXCJAYmFiZWwvaGVscGVycyAtIHR5cGVvZlwiOyByZXR1cm4gX3R5cGVvZiA9IFwiZnVuY3Rpb25cIiA9PSB0eXBlb2YgU3ltYm9sICYmIFwic3ltYm9sXCIgPT0gdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA/IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIHR5cGVvZiBvYmo7IH0gOiBmdW5jdGlvbiAob2JqKSB7IHJldHVybiBvYmogJiYgXCJmdW5jdGlvblwiID09IHR5cGVvZiBTeW1ib2wgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgJiYgb2JqICE9PSBTeW1ib2wucHJvdG90eXBlID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7IH0sIF90eXBlb2Yob2JqKTsgfVxuZnVuY3Rpb24gX29iamVjdFdpdGhvdXRQcm9wZXJ0aWVzKHNvdXJjZSwgZXhjbHVkZWQpIHsgaWYgKHNvdXJjZSA9PSBudWxsKSByZXR1cm4ge307IHZhciB0YXJnZXQgPSBfb2JqZWN0V2l0aG91dFByb3BlcnRpZXNMb29zZShzb3VyY2UsIGV4Y2x1ZGVkKTsgdmFyIGtleSwgaTsgaWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMpIHsgdmFyIHNvdXJjZVN5bWJvbEtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKHNvdXJjZSk7IGZvciAoaSA9IDA7IGkgPCBzb3VyY2VTeW1ib2xLZXlzLmxlbmd0aDsgaSsrKSB7IGtleSA9IHNvdXJjZVN5bWJvbEtleXNbaV07IGlmIChleGNsdWRlZC5pbmRleE9mKGtleSkgPj0gMCkgY29udGludWU7IGlmICghT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKHNvdXJjZSwga2V5KSkgY29udGludWU7IHRhcmdldFtrZXldID0gc291cmNlW2tleV07IH0gfSByZXR1cm4gdGFyZ2V0OyB9XG5mdW5jdGlvbiBfb2JqZWN0V2l0aG91dFByb3BlcnRpZXNMb29zZShzb3VyY2UsIGV4Y2x1ZGVkKSB7IGlmIChzb3VyY2UgPT0gbnVsbCkgcmV0dXJuIHt9OyB2YXIgdGFyZ2V0ID0ge307IHZhciBzb3VyY2VLZXlzID0gT2JqZWN0LmtleXMoc291cmNlKTsgdmFyIGtleSwgaTsgZm9yIChpID0gMDsgaSA8IHNvdXJjZUtleXMubGVuZ3RoOyBpKyspIHsga2V5ID0gc291cmNlS2V5c1tpXTsgaWYgKGV4Y2x1ZGVkLmluZGV4T2Yoa2V5KSA+PSAwKSBjb250aW51ZTsgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTsgfSByZXR1cm4gdGFyZ2V0OyB9XG5mdW5jdGlvbiBvd25LZXlzKG9iamVjdCwgZW51bWVyYWJsZU9ubHkpIHsgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhvYmplY3QpOyBpZiAoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scykgeyB2YXIgc3ltYm9scyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMob2JqZWN0KTsgZW51bWVyYWJsZU9ubHkgJiYgKHN5bWJvbHMgPSBzeW1ib2xzLmZpbHRlcihmdW5jdGlvbiAoc3ltKSB7IHJldHVybiBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iamVjdCwgc3ltKS5lbnVtZXJhYmxlOyB9KSksIGtleXMucHVzaC5hcHBseShrZXlzLCBzeW1ib2xzKTsgfSByZXR1cm4ga2V5czsgfVxuZnVuY3Rpb24gX29iamVjdFNwcmVhZCh0YXJnZXQpIHsgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHsgdmFyIHNvdXJjZSA9IG51bGwgIT0gYXJndW1lbnRzW2ldID8gYXJndW1lbnRzW2ldIDoge307IGkgJSAyID8gb3duS2V5cyhPYmplY3Qoc291cmNlKSwgITApLmZvckVhY2goZnVuY3Rpb24gKGtleSkgeyBfZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHNvdXJjZVtrZXldKTsgfSkgOiBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycyA/IE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnMoc291cmNlKSkgOiBvd25LZXlzKE9iamVjdChzb3VyY2UpKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHNvdXJjZSwga2V5KSk7IH0pOyB9IHJldHVybiB0YXJnZXQ7IH1cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIF90b1Byb3BlcnR5S2V5KGRlc2NyaXB0b3Iua2V5KSwgZGVzY3JpcHRvcik7IH0gfVxuZnVuY3Rpb24gX2NyZWF0ZUNsYXNzKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyBPYmplY3QuZGVmaW5lUHJvcGVydHkoQ29uc3RydWN0b3IsIFwicHJvdG90eXBlXCIsIHsgd3JpdGFibGU6IGZhbHNlIH0pOyByZXR1cm4gQ29uc3RydWN0b3I7IH1cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09IFwiZnVuY3Rpb25cIiAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvblwiKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eShzdWJDbGFzcywgXCJwcm90b3R5cGVcIiwgeyB3cml0YWJsZTogZmFsc2UgfSk7IGlmIChzdXBlckNsYXNzKSBfc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpOyB9XG5mdW5jdGlvbiBfc2V0UHJvdG90eXBlT2YobywgcCkgeyBfc2V0UHJvdG90eXBlT2YgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3Quc2V0UHJvdG90eXBlT2YuYmluZCgpIDogZnVuY3Rpb24gX3NldFByb3RvdHlwZU9mKG8sIHApIHsgby5fX3Byb3RvX18gPSBwOyByZXR1cm4gbzsgfTsgcmV0dXJuIF9zZXRQcm90b3R5cGVPZihvLCBwKTsgfVxuZnVuY3Rpb24gX2NyZWF0ZVN1cGVyKERlcml2ZWQpIHsgdmFyIGhhc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QgPSBfaXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KCk7IHJldHVybiBmdW5jdGlvbiBfY3JlYXRlU3VwZXJJbnRlcm5hbCgpIHsgdmFyIFN1cGVyID0gX2dldFByb3RvdHlwZU9mKERlcml2ZWQpLCByZXN1bHQ7IGlmIChoYXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KSB7IHZhciBOZXdUYXJnZXQgPSBfZ2V0UHJvdG90eXBlT2YodGhpcykuY29uc3RydWN0b3I7IHJlc3VsdCA9IFJlZmxlY3QuY29uc3RydWN0KFN1cGVyLCBhcmd1bWVudHMsIE5ld1RhcmdldCk7IH0gZWxzZSB7IHJlc3VsdCA9IFN1cGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH0gcmV0dXJuIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHRoaXMsIHJlc3VsdCk7IH07IH1cbmZ1bmN0aW9uIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHNlbGYsIGNhbGwpIHsgaWYgKGNhbGwgJiYgKF90eXBlb2YoY2FsbCkgPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIGNhbGwgPT09IFwiZnVuY3Rpb25cIikpIHsgcmV0dXJuIGNhbGw7IH0gZWxzZSBpZiAoY2FsbCAhPT0gdm9pZCAwKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJEZXJpdmVkIGNvbnN0cnVjdG9ycyBtYXkgb25seSByZXR1cm4gb2JqZWN0IG9yIHVuZGVmaW5lZFwiKTsgfSByZXR1cm4gX2Fzc2VydFRoaXNJbml0aWFsaXplZChzZWxmKTsgfVxuZnVuY3Rpb24gX2Fzc2VydFRoaXNJbml0aWFsaXplZChzZWxmKSB7IGlmIChzZWxmID09PSB2b2lkIDApIHsgdGhyb3cgbmV3IFJlZmVyZW5jZUVycm9yKFwidGhpcyBoYXNuJ3QgYmVlbiBpbml0aWFsaXNlZCAtIHN1cGVyKCkgaGFzbid0IGJlZW4gY2FsbGVkXCIpOyB9IHJldHVybiBzZWxmOyB9XG5mdW5jdGlvbiBfaXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KCkgeyBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwidW5kZWZpbmVkXCIgfHwgIVJlZmxlY3QuY29uc3RydWN0KSByZXR1cm4gZmFsc2U7IGlmIChSZWZsZWN0LmNvbnN0cnVjdC5zaGFtKSByZXR1cm4gZmFsc2U7IGlmICh0eXBlb2YgUHJveHkgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIHRydWU7IHRyeSB7IEJvb2xlYW4ucHJvdG90eXBlLnZhbHVlT2YuY2FsbChSZWZsZWN0LmNvbnN0cnVjdChCb29sZWFuLCBbXSwgZnVuY3Rpb24gKCkge30pKTsgcmV0dXJuIHRydWU7IH0gY2F0Y2ggKGUpIHsgcmV0dXJuIGZhbHNlOyB9IH1cbmZ1bmN0aW9uIF9nZXRQcm90b3R5cGVPZihvKSB7IF9nZXRQcm90b3R5cGVPZiA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiA/IE9iamVjdC5nZXRQcm90b3R5cGVPZi5iaW5kKCkgOiBmdW5jdGlvbiBfZ2V0UHJvdG90eXBlT2YobykgeyByZXR1cm4gby5fX3Byb3RvX18gfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKG8pOyB9OyByZXR1cm4gX2dldFByb3RvdHlwZU9mKG8pOyB9XG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydHkob2JqLCBrZXksIHZhbHVlKSB7IGtleSA9IF90b1Byb3BlcnR5S2V5KGtleSk7IGlmIChrZXkgaW4gb2JqKSB7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwgeyB2YWx1ZTogdmFsdWUsIGVudW1lcmFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSwgd3JpdGFibGU6IHRydWUgfSk7IH0gZWxzZSB7IG9ialtrZXldID0gdmFsdWU7IH0gcmV0dXJuIG9iajsgfVxuZnVuY3Rpb24gX3RvUHJvcGVydHlLZXkoYXJnKSB7IHZhciBrZXkgPSBfdG9QcmltaXRpdmUoYXJnLCBcInN0cmluZ1wiKTsgcmV0dXJuIF90eXBlb2Yoa2V5KSA9PT0gXCJzeW1ib2xcIiA/IGtleSA6IFN0cmluZyhrZXkpOyB9XG5mdW5jdGlvbiBfdG9QcmltaXRpdmUoaW5wdXQsIGhpbnQpIHsgaWYgKF90eXBlb2YoaW5wdXQpICE9PSBcIm9iamVjdFwiIHx8IGlucHV0ID09PSBudWxsKSByZXR1cm4gaW5wdXQ7IHZhciBwcmltID0gaW5wdXRbU3ltYm9sLnRvUHJpbWl0aXZlXTsgaWYgKHByaW0gIT09IHVuZGVmaW5lZCkgeyB2YXIgcmVzID0gcHJpbS5jYWxsKGlucHV0LCBoaW50IHx8IFwiZGVmYXVsdFwiKTsgaWYgKF90eXBlb2YocmVzKSAhPT0gXCJvYmplY3RcIikgcmV0dXJuIHJlczsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkBAdG9QcmltaXRpdmUgbXVzdCByZXR1cm4gYSBwcmltaXRpdmUgdmFsdWUuXCIpOyB9IHJldHVybiAoaGludCA9PT0gXCJzdHJpbmdcIiA/IFN0cmluZyA6IE51bWJlcikoaW5wdXQpOyB9IC8qXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICogQ29weXJpZ2h0IDIwMjAgLSAyMDI0IFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqICAgICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKi9cbi8qKlxuICogVHJhbnNwb3J0IGZvciB0aGUgV2lkZ2V0IEFQSSBvdmVyIHBvc3RNZXNzYWdlLlxuICovXG52YXIgUG9zdG1lc3NhZ2VUcmFuc3BvcnQgPSAvKiNfX1BVUkVfXyovZnVuY3Rpb24gKF9FdmVudEVtaXR0ZXIpIHtcbiAgX2luaGVyaXRzKFBvc3RtZXNzYWdlVHJhbnNwb3J0LCBfRXZlbnRFbWl0dGVyKTtcbiAgdmFyIF9zdXBlciA9IF9jcmVhdGVTdXBlcihQb3N0bWVzc2FnZVRyYW5zcG9ydCk7XG4gIGZ1bmN0aW9uIFBvc3RtZXNzYWdlVHJhbnNwb3J0KHNlbmREaXJlY3Rpb24sIGluaXRpYWxXaWRnZXRJZCwgdHJhbnNwb3J0V2luZG93LCBpbmJvdW5kV2luZG93KSB7XG4gICAgdmFyIF90aGlzO1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBQb3N0bWVzc2FnZVRyYW5zcG9ydCk7XG4gICAgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzKTtcbiAgICBfdGhpcy5zZW5kRGlyZWN0aW9uID0gc2VuZERpcmVjdGlvbjtcbiAgICBfdGhpcy5pbml0aWFsV2lkZ2V0SWQgPSBpbml0aWFsV2lkZ2V0SWQ7XG4gICAgX3RoaXMudHJhbnNwb3J0V2luZG93ID0gdHJhbnNwb3J0V2luZG93O1xuICAgIF90aGlzLmluYm91bmRXaW5kb3cgPSBpbmJvdW5kV2luZG93O1xuICAgIF9kZWZpbmVQcm9wZXJ0eShfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSwgXCJzdHJpY3RPcmlnaW5DaGVja1wiLCBmYWxzZSk7XG4gICAgX2RlZmluZVByb3BlcnR5KF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpLCBcInRhcmdldE9yaWdpblwiLCBcIipcIik7XG4gICAgX2RlZmluZVByb3BlcnR5KF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpLCBcInRpbWVvdXRTZWNvbmRzXCIsIDEwKTtcbiAgICBfZGVmaW5lUHJvcGVydHkoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcyksIFwiX3JlYWR5XCIsIGZhbHNlKTtcbiAgICBfZGVmaW5lUHJvcGVydHkoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcyksIFwiX3dpZGdldElkXCIsIG51bGwpO1xuICAgIF9kZWZpbmVQcm9wZXJ0eShfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSwgXCJvdXRib3VuZFJlcXVlc3RzXCIsIG5ldyBNYXAoKSk7XG4gICAgX2RlZmluZVByb3BlcnR5KF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpLCBcInN0b3BDb250cm9sbGVyXCIsIG5ldyBBYm9ydENvbnRyb2xsZXIoKSk7XG4gICAgX3RoaXMuX3dpZGdldElkID0gaW5pdGlhbFdpZGdldElkO1xuICAgIHJldHVybiBfdGhpcztcbiAgfVxuICBfY3JlYXRlQ2xhc3MoUG9zdG1lc3NhZ2VUcmFuc3BvcnQsIFt7XG4gICAga2V5OiBcInJlYWR5XCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcmVhZHk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcIndpZGdldElkXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fd2lkZ2V0SWQgfHwgbnVsbDtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwibmV4dFJlcXVlc3RJZFwiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgdmFyIGlkQmFzZSA9IFwid2lkZ2V0YXBpLVwiLmNvbmNhdChEYXRlLm5vdygpKTtcbiAgICAgIHZhciBpbmRleCA9IDA7XG4gICAgICB2YXIgaWQgPSBpZEJhc2U7XG4gICAgICB3aGlsZSAodGhpcy5vdXRib3VuZFJlcXVlc3RzLmhhcyhpZCkpIHtcbiAgICAgICAgaWQgPSBcIlwiLmNvbmNhdChpZEJhc2UsIFwiLVwiKS5jb25jYXQoaW5kZXgrKyk7XG4gICAgICB9XG5cbiAgICAgIC8vIHJlc2VydmUgdGhlIElEXG4gICAgICB0aGlzLm91dGJvdW5kUmVxdWVzdHMuc2V0KGlkLCBudWxsKTtcbiAgICAgIHJldHVybiBpZDtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwic2VuZEludGVybmFsXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHNlbmRJbnRlcm5hbChtZXNzYWdlKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIltQb3N0bWVzc2FnZVRyYW5zcG9ydF0gU2VuZGluZyBvYmplY3QgdG8gXCIuY29uY2F0KHRoaXMudGFyZ2V0T3JpZ2luLCBcIjogXCIpLCBtZXNzYWdlKTtcbiAgICAgIHRoaXMudHJhbnNwb3J0V2luZG93LnBvc3RNZXNzYWdlKG1lc3NhZ2UsIHRoaXMudGFyZ2V0T3JpZ2luKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwicmVwbHlcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gcmVwbHkocmVxdWVzdCwgcmVzcG9uc2VEYXRhKSB7XG4gICAgICByZXR1cm4gdGhpcy5zZW5kSW50ZXJuYWwoX29iamVjdFNwcmVhZChfb2JqZWN0U3ByZWFkKHt9LCByZXF1ZXN0KSwge30sIHtcbiAgICAgICAgcmVzcG9uc2U6IHJlc3BvbnNlRGF0YVxuICAgICAgfSkpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJzZW5kXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHNlbmQoYWN0aW9uLCBkYXRhKSB7XG4gICAgICByZXR1cm4gdGhpcy5zZW5kQ29tcGxldGUoYWN0aW9uLCBkYXRhKS50aGVuKGZ1bmN0aW9uIChyKSB7XG4gICAgICAgIHJldHVybiByLnJlc3BvbnNlO1xuICAgICAgfSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInNlbmRDb21wbGV0ZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzZW5kQ29tcGxldGUoYWN0aW9uLCBkYXRhKSB7XG4gICAgICB2YXIgX3RoaXMyID0gdGhpcztcbiAgICAgIGlmICghdGhpcy5yZWFkeSB8fCAhdGhpcy53aWRnZXRJZCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwiTm90IHJlYWR5IG9yIHVua25vd24gd2lkZ2V0IElEXCIpKTtcbiAgICAgIH1cbiAgICAgIHZhciByZXF1ZXN0ID0ge1xuICAgICAgICBhcGk6IHRoaXMuc2VuZERpcmVjdGlvbixcbiAgICAgICAgd2lkZ2V0SWQ6IHRoaXMud2lkZ2V0SWQsXG4gICAgICAgIHJlcXVlc3RJZDogdGhpcy5uZXh0UmVxdWVzdElkLFxuICAgICAgICBhY3Rpb246IGFjdGlvbixcbiAgICAgICAgZGF0YTogZGF0YVxuICAgICAgfTtcbiAgICAgIGlmIChhY3Rpb24gPT09IF8uV2lkZ2V0QXBpVG9XaWRnZXRBY3Rpb24uVXBkYXRlVmlzaWJpbGl0eSkge1xuICAgICAgICByZXF1ZXN0Wyd2aXNpYmxlJ10gPSBkYXRhWyd2aXNpYmxlJ107XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHByUmVzb2x2ZSwgcHJSZWplY3QpIHtcbiAgICAgICAgdmFyIHJlc29sdmUgPSBmdW5jdGlvbiByZXNvbHZlKHJlc3BvbnNlKSB7XG4gICAgICAgICAgY2xlYW5VcCgpO1xuICAgICAgICAgIHByUmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciByZWplY3QgPSBmdW5jdGlvbiByZWplY3QoZXJyKSB7XG4gICAgICAgICAgY2xlYW5VcCgpO1xuICAgICAgICAgIHByUmVqZWN0KGVycik7XG4gICAgICAgIH07XG4gICAgICAgIHZhciB0aW1lcklkID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgcmV0dXJuIHJlamVjdChuZXcgRXJyb3IoXCJSZXF1ZXN0IHRpbWVkIG91dFwiKSk7XG4gICAgICAgIH0sIChfdGhpczIudGltZW91dFNlY29uZHMgfHwgMSkgKiAxMDAwKTtcbiAgICAgICAgdmFyIG9uU3RvcCA9IGZ1bmN0aW9uIG9uU3RvcCgpIHtcbiAgICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBFcnJvcihcIlRyYW5zcG9ydCBzdG9wcGVkXCIpKTtcbiAgICAgICAgfTtcbiAgICAgICAgX3RoaXMyLnN0b3BDb250cm9sbGVyLnNpZ25hbC5hZGRFdmVudExpc3RlbmVyKFwiYWJvcnRcIiwgb25TdG9wKTtcbiAgICAgICAgdmFyIGNsZWFuVXAgPSBmdW5jdGlvbiBjbGVhblVwKCkge1xuICAgICAgICAgIF90aGlzMi5vdXRib3VuZFJlcXVlc3RzW1wiZGVsZXRlXCJdKHJlcXVlc3QucmVxdWVzdElkKTtcbiAgICAgICAgICBjbGVhclRpbWVvdXQodGltZXJJZCk7XG4gICAgICAgICAgX3RoaXMyLnN0b3BDb250cm9sbGVyLnNpZ25hbC5yZW1vdmVFdmVudExpc3RlbmVyKFwiYWJvcnRcIiwgb25TdG9wKTtcbiAgICAgICAgfTtcbiAgICAgICAgX3RoaXMyLm91dGJvdW5kUmVxdWVzdHMuc2V0KHJlcXVlc3QucmVxdWVzdElkLCB7XG4gICAgICAgICAgcmVxdWVzdDogcmVxdWVzdCxcbiAgICAgICAgICByZXNvbHZlOiByZXNvbHZlLFxuICAgICAgICAgIHJlamVjdDogcmVqZWN0XG4gICAgICAgIH0pO1xuICAgICAgICBfdGhpczIuc2VuZEludGVybmFsKHJlcXVlc3QpO1xuICAgICAgfSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInN0YXJ0XCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHN0YXJ0KCkge1xuICAgICAgdmFyIF90aGlzMyA9IHRoaXM7XG4gICAgICB0aGlzLmluYm91bmRXaW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgIF90aGlzMy5oYW5kbGVNZXNzYWdlKGV2KTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5fcmVhZHkgPSB0cnVlO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJzdG9wXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHN0b3AoKSB7XG4gICAgICB0aGlzLl9yZWFkeSA9IGZhbHNlO1xuICAgICAgdGhpcy5zdG9wQ29udHJvbGxlci5hYm9ydCgpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJoYW5kbGVNZXNzYWdlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGhhbmRsZU1lc3NhZ2UoZXYpIHtcbiAgICAgIGlmICh0aGlzLnN0b3BDb250cm9sbGVyLnNpZ25hbC5hYm9ydGVkKSByZXR1cm47XG4gICAgICBpZiAoIWV2LmRhdGEpIHJldHVybjsgLy8gaW52YWxpZCBldmVudFxuXG4gICAgICBpZiAodGhpcy5zdHJpY3RPcmlnaW5DaGVjayAmJiBldi5vcmlnaW4gIT09IHdpbmRvdy5vcmlnaW4pIHJldHVybjsgLy8gYmFkIG9yaWdpblxuXG4gICAgICAvLyB0cmVhdCB0aGUgbWVzc2FnZSBhcyBhIHJlc3BvbnNlIGZpcnN0LCB0aGVuIGRvd25ncmFkZSB0byBhIHJlcXVlc3RcbiAgICAgIHZhciByZXNwb25zZSA9IGV2LmRhdGE7XG4gICAgICBpZiAoIXJlc3BvbnNlLmFjdGlvbiB8fCAhcmVzcG9uc2UucmVxdWVzdElkIHx8ICFyZXNwb25zZS53aWRnZXRJZCkgcmV0dXJuOyAvLyBpbnZhbGlkIHJlcXVlc3QvcmVzcG9uc2VcblxuICAgICAgaWYgKCFyZXNwb25zZS5yZXNwb25zZSkge1xuICAgICAgICAvLyBpdCdzIGEgcmVxdWVzdFxuICAgICAgICB2YXIgcmVxdWVzdCA9IHJlc3BvbnNlO1xuICAgICAgICBpZiAocmVxdWVzdC5hcGkgIT09ICgwLCBfLmludmVydGVkRGlyZWN0aW9uKSh0aGlzLnNlbmREaXJlY3Rpb24pKSByZXR1cm47IC8vIHdyb25nIGRpcmVjdGlvblxuICAgICAgICB0aGlzLmhhbmRsZVJlcXVlc3QocmVxdWVzdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBpdCdzIGEgcmVzcG9uc2VcbiAgICAgICAgaWYgKHJlc3BvbnNlLmFwaSAhPT0gdGhpcy5zZW5kRGlyZWN0aW9uKSByZXR1cm47IC8vIHdyb25nIGRpcmVjdGlvblxuICAgICAgICB0aGlzLmhhbmRsZVJlc3BvbnNlKHJlc3BvbnNlKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiaGFuZGxlUmVxdWVzdFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBoYW5kbGVSZXF1ZXN0KHJlcXVlc3QpIHtcbiAgICAgIGlmICh0aGlzLndpZGdldElkKSB7XG4gICAgICAgIGlmICh0aGlzLndpZGdldElkICE9PSByZXF1ZXN0LndpZGdldElkKSByZXR1cm47IC8vIHdyb25nIHdpZGdldFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fd2lkZ2V0SWQgPSByZXF1ZXN0LndpZGdldElkO1xuICAgICAgfVxuICAgICAgdGhpcy5lbWl0KFwibWVzc2FnZVwiLCBuZXcgQ3VzdG9tRXZlbnQoXCJtZXNzYWdlXCIsIHtcbiAgICAgICAgZGV0YWlsOiByZXF1ZXN0XG4gICAgICB9KSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImhhbmRsZVJlc3BvbnNlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGhhbmRsZVJlc3BvbnNlKHJlc3BvbnNlKSB7XG4gICAgICBpZiAocmVzcG9uc2Uud2lkZ2V0SWQgIT09IHRoaXMud2lkZ2V0SWQpIHJldHVybjsgLy8gd3Jvbmcgd2lkZ2V0XG5cbiAgICAgIHZhciByZXEgPSB0aGlzLm91dGJvdW5kUmVxdWVzdHMuZ2V0KHJlc3BvbnNlLnJlcXVlc3RJZCk7XG4gICAgICBpZiAoIXJlcSkgcmV0dXJuOyAvLyByZXNwb25zZSB0byBhbiB1bmtub3duIHJlcXVlc3RcblxuICAgICAgaWYgKCgwLCBfLmlzRXJyb3JSZXNwb25zZSkocmVzcG9uc2UucmVzcG9uc2UpKSB7XG4gICAgICAgIHZhciBfcmVzcG9uc2UkcmVzcG9uc2UkZXIgPSByZXNwb25zZS5yZXNwb25zZS5lcnJvcixcbiAgICAgICAgICBtZXNzYWdlID0gX3Jlc3BvbnNlJHJlc3BvbnNlJGVyLm1lc3NhZ2UsXG4gICAgICAgICAgZGF0YSA9IF9vYmplY3RXaXRob3V0UHJvcGVydGllcyhfcmVzcG9uc2UkcmVzcG9uc2UkZXIsIF9leGNsdWRlZCk7XG4gICAgICAgIHJlcS5yZWplY3QobmV3IF8uV2lkZ2V0QXBpUmVzcG9uc2VFcnJvcihtZXNzYWdlLCBkYXRhKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXEucmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICB9XG4gICAgfVxuICB9XSk7XG4gIHJldHVybiBQb3N0bWVzc2FnZVRyYW5zcG9ydDtcbn0oX2V2ZW50cy5FdmVudEVtaXR0ZXIpO1xuZXhwb3J0cy5Qb3N0bWVzc2FnZVRyYW5zcG9ydCA9IFBvc3RtZXNzYWdlVHJhbnNwb3J0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9UG9zdG1lc3NhZ2VUcmFuc3BvcnQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLlNpbXBsZU9ic2VydmFibGUgPSB2b2lkIDA7XG5mdW5jdGlvbiBfdHlwZW9mKG9iaikgeyBcIkBiYWJlbC9oZWxwZXJzIC0gdHlwZW9mXCI7IHJldHVybiBfdHlwZW9mID0gXCJmdW5jdGlvblwiID09IHR5cGVvZiBTeW1ib2wgJiYgXCJzeW1ib2xcIiA9PSB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID8gZnVuY3Rpb24gKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfSA6IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIG9iaiAmJiBcImZ1bmN0aW9uXCIgPT0gdHlwZW9mIFN5bWJvbCAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvYmogIT09IFN5bWJvbC5wcm90b3R5cGUgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajsgfSwgX3R5cGVvZihvYmopOyB9XG5mdW5jdGlvbiBfY3JlYXRlRm9yT2ZJdGVyYXRvckhlbHBlcihvLCBhbGxvd0FycmF5TGlrZSkgeyB2YXIgaXQgPSB0eXBlb2YgU3ltYm9sICE9PSBcInVuZGVmaW5lZFwiICYmIG9bU3ltYm9sLml0ZXJhdG9yXSB8fCBvW1wiQEBpdGVyYXRvclwiXTsgaWYgKCFpdCkgeyBpZiAoQXJyYXkuaXNBcnJheShvKSB8fCAoaXQgPSBfdW5zdXBwb3J0ZWRJdGVyYWJsZVRvQXJyYXkobykpIHx8IGFsbG93QXJyYXlMaWtlICYmIG8gJiYgdHlwZW9mIG8ubGVuZ3RoID09PSBcIm51bWJlclwiKSB7IGlmIChpdCkgbyA9IGl0OyB2YXIgaSA9IDA7IHZhciBGID0gZnVuY3Rpb24gRigpIHt9OyByZXR1cm4geyBzOiBGLCBuOiBmdW5jdGlvbiBuKCkgeyBpZiAoaSA+PSBvLmxlbmd0aCkgcmV0dXJuIHsgZG9uZTogdHJ1ZSB9OyByZXR1cm4geyBkb25lOiBmYWxzZSwgdmFsdWU6IG9baSsrXSB9OyB9LCBlOiBmdW5jdGlvbiBlKF9lKSB7IHRocm93IF9lOyB9LCBmOiBGIH07IH0gdGhyb3cgbmV3IFR5cGVFcnJvcihcIkludmFsaWQgYXR0ZW1wdCB0byBpdGVyYXRlIG5vbi1pdGVyYWJsZSBpbnN0YW5jZS5cXG5JbiBvcmRlciB0byBiZSBpdGVyYWJsZSwgbm9uLWFycmF5IG9iamVjdHMgbXVzdCBoYXZlIGEgW1N5bWJvbC5pdGVyYXRvcl0oKSBtZXRob2QuXCIpOyB9IHZhciBub3JtYWxDb21wbGV0aW9uID0gdHJ1ZSwgZGlkRXJyID0gZmFsc2UsIGVycjsgcmV0dXJuIHsgczogZnVuY3Rpb24gcygpIHsgaXQgPSBpdC5jYWxsKG8pOyB9LCBuOiBmdW5jdGlvbiBuKCkgeyB2YXIgc3RlcCA9IGl0Lm5leHQoKTsgbm9ybWFsQ29tcGxldGlvbiA9IHN0ZXAuZG9uZTsgcmV0dXJuIHN0ZXA7IH0sIGU6IGZ1bmN0aW9uIGUoX2UyKSB7IGRpZEVyciA9IHRydWU7IGVyciA9IF9lMjsgfSwgZjogZnVuY3Rpb24gZigpIHsgdHJ5IHsgaWYgKCFub3JtYWxDb21wbGV0aW9uICYmIGl0W1wicmV0dXJuXCJdICE9IG51bGwpIGl0W1wicmV0dXJuXCJdKCk7IH0gZmluYWxseSB7IGlmIChkaWRFcnIpIHRocm93IGVycjsgfSB9IH07IH1cbmZ1bmN0aW9uIF91bnN1cHBvcnRlZEl0ZXJhYmxlVG9BcnJheShvLCBtaW5MZW4pIHsgaWYgKCFvKSByZXR1cm47IGlmICh0eXBlb2YgbyA9PT0gXCJzdHJpbmdcIikgcmV0dXJuIF9hcnJheUxpa2VUb0FycmF5KG8sIG1pbkxlbik7IHZhciBuID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pLnNsaWNlKDgsIC0xKTsgaWYgKG4gPT09IFwiT2JqZWN0XCIgJiYgby5jb25zdHJ1Y3RvcikgbiA9IG8uY29uc3RydWN0b3IubmFtZTsgaWYgKG4gPT09IFwiTWFwXCIgfHwgbiA9PT0gXCJTZXRcIikgcmV0dXJuIEFycmF5LmZyb20obyk7IGlmIChuID09PSBcIkFyZ3VtZW50c1wiIHx8IC9eKD86VWl8SSludCg/Ojh8MTZ8MzIpKD86Q2xhbXBlZCk/QXJyYXkkLy50ZXN0KG4pKSByZXR1cm4gX2FycmF5TGlrZVRvQXJyYXkobywgbWluTGVuKTsgfVxuZnVuY3Rpb24gX2FycmF5TGlrZVRvQXJyYXkoYXJyLCBsZW4pIHsgaWYgKGxlbiA9PSBudWxsIHx8IGxlbiA+IGFyci5sZW5ndGgpIGxlbiA9IGFyci5sZW5ndGg7IGZvciAodmFyIGkgPSAwLCBhcnIyID0gbmV3IEFycmF5KGxlbik7IGkgPCBsZW47IGkrKykgYXJyMltpXSA9IGFycltpXTsgcmV0dXJuIGFycjI7IH1cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIF90b1Byb3BlcnR5S2V5KGRlc2NyaXB0b3Iua2V5KSwgZGVzY3JpcHRvcik7IH0gfVxuZnVuY3Rpb24gX2NyZWF0ZUNsYXNzKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyBPYmplY3QuZGVmaW5lUHJvcGVydHkoQ29uc3RydWN0b3IsIFwicHJvdG90eXBlXCIsIHsgd3JpdGFibGU6IGZhbHNlIH0pOyByZXR1cm4gQ29uc3RydWN0b3I7IH1cbmZ1bmN0aW9uIF9kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwgdmFsdWUpIHsga2V5ID0gX3RvUHJvcGVydHlLZXkoa2V5KTsgaWYgKGtleSBpbiBvYmopIHsgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwga2V5LCB7IHZhbHVlOiB2YWx1ZSwgZW51bWVyYWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlLCB3cml0YWJsZTogdHJ1ZSB9KTsgfSBlbHNlIHsgb2JqW2tleV0gPSB2YWx1ZTsgfSByZXR1cm4gb2JqOyB9XG5mdW5jdGlvbiBfdG9Qcm9wZXJ0eUtleShhcmcpIHsgdmFyIGtleSA9IF90b1ByaW1pdGl2ZShhcmcsIFwic3RyaW5nXCIpOyByZXR1cm4gX3R5cGVvZihrZXkpID09PSBcInN5bWJvbFwiID8ga2V5IDogU3RyaW5nKGtleSk7IH1cbmZ1bmN0aW9uIF90b1ByaW1pdGl2ZShpbnB1dCwgaGludCkgeyBpZiAoX3R5cGVvZihpbnB1dCkgIT09IFwib2JqZWN0XCIgfHwgaW5wdXQgPT09IG51bGwpIHJldHVybiBpbnB1dDsgdmFyIHByaW0gPSBpbnB1dFtTeW1ib2wudG9QcmltaXRpdmVdOyBpZiAocHJpbSAhPT0gdW5kZWZpbmVkKSB7IHZhciByZXMgPSBwcmltLmNhbGwoaW5wdXQsIGhpbnQgfHwgXCJkZWZhdWx0XCIpOyBpZiAoX3R5cGVvZihyZXMpICE9PSBcIm9iamVjdFwiKSByZXR1cm4gcmVzOyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQEB0b1ByaW1pdGl2ZSBtdXN0IHJldHVybiBhIHByaW1pdGl2ZSB2YWx1ZS5cIik7IH0gcmV0dXJuIChoaW50ID09PSBcInN0cmluZ1wiID8gU3RyaW5nIDogTnVtYmVyKShpbnB1dCk7IH1cbi8qXG4gKiBDb3B5cmlnaHQgMjAyMCBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbnZhciBTaW1wbGVPYnNlcnZhYmxlID0gLyojX19QVVJFX18qL2Z1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gU2ltcGxlT2JzZXJ2YWJsZShpbml0aWFsRm4pIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgU2ltcGxlT2JzZXJ2YWJsZSk7XG4gICAgX2RlZmluZVByb3BlcnR5KHRoaXMsIFwibGlzdGVuZXJzXCIsIFtdKTtcbiAgICBpZiAoaW5pdGlhbEZuKSB0aGlzLmxpc3RlbmVycy5wdXNoKGluaXRpYWxGbik7XG4gIH1cbiAgX2NyZWF0ZUNsYXNzKFNpbXBsZU9ic2VydmFibGUsIFt7XG4gICAga2V5OiBcIm9uVXBkYXRlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIG9uVXBkYXRlKGZuKSB7XG4gICAgICB0aGlzLmxpc3RlbmVycy5wdXNoKGZuKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwidXBkYXRlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHVwZGF0ZSh2YWwpIHtcbiAgICAgIHZhciBfaXRlcmF0b3IgPSBfY3JlYXRlRm9yT2ZJdGVyYXRvckhlbHBlcih0aGlzLmxpc3RlbmVycyksXG4gICAgICAgIF9zdGVwO1xuICAgICAgdHJ5IHtcbiAgICAgICAgZm9yIChfaXRlcmF0b3IucygpOyAhKF9zdGVwID0gX2l0ZXJhdG9yLm4oKSkuZG9uZTspIHtcbiAgICAgICAgICB2YXIgbGlzdGVuZXIgPSBfc3RlcC52YWx1ZTtcbiAgICAgICAgICBsaXN0ZW5lcih2YWwpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgX2l0ZXJhdG9yLmUoZXJyKTtcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIF9pdGVyYXRvci5mKCk7XG4gICAgICB9XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImNsb3NlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGNsb3NlKCkge1xuICAgICAgdGhpcy5saXN0ZW5lcnMgPSBbXTsgLy8gcmVzZXRcbiAgICB9XG4gIH1dKTtcbiAgcmV0dXJuIFNpbXBsZU9ic2VydmFibGU7XG59KCk7XG5leHBvcnRzLlNpbXBsZU9ic2VydmFibGUgPSBTaW1wbGVPYnNlcnZhYmxlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9U2ltcGxlT2JzZXJ2YWJsZS5qcy5tYXAiLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUiA9IHR5cGVvZiBSZWZsZWN0ID09PSAnb2JqZWN0JyA/IFJlZmxlY3QgOiBudWxsXG52YXIgUmVmbGVjdEFwcGx5ID0gUiAmJiB0eXBlb2YgUi5hcHBseSA9PT0gJ2Z1bmN0aW9uJ1xuICA/IFIuYXBwbHlcbiAgOiBmdW5jdGlvbiBSZWZsZWN0QXBwbHkodGFyZ2V0LCByZWNlaXZlciwgYXJncykge1xuICAgIHJldHVybiBGdW5jdGlvbi5wcm90b3R5cGUuYXBwbHkuY2FsbCh0YXJnZXQsIHJlY2VpdmVyLCBhcmdzKTtcbiAgfVxuXG52YXIgUmVmbGVjdE93bktleXNcbmlmIChSICYmIHR5cGVvZiBSLm93bktleXMgPT09ICdmdW5jdGlvbicpIHtcbiAgUmVmbGVjdE93bktleXMgPSBSLm93bktleXNcbn0gZWxzZSBpZiAoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scykge1xuICBSZWZsZWN0T3duS2V5cyA9IGZ1bmN0aW9uIFJlZmxlY3RPd25LZXlzKHRhcmdldCkge1xuICAgIHJldHVybiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh0YXJnZXQpXG4gICAgICAuY29uY2F0KE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHModGFyZ2V0KSk7XG4gIH07XG59IGVsc2Uge1xuICBSZWZsZWN0T3duS2V5cyA9IGZ1bmN0aW9uIFJlZmxlY3RPd25LZXlzKHRhcmdldCkge1xuICAgIHJldHVybiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh0YXJnZXQpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBQcm9jZXNzRW1pdFdhcm5pbmcod2FybmluZykge1xuICBpZiAoY29uc29sZSAmJiBjb25zb2xlLndhcm4pIGNvbnNvbGUud2Fybih3YXJuaW5nKTtcbn1cblxudmFyIE51bWJlcklzTmFOID0gTnVtYmVyLmlzTmFOIHx8IGZ1bmN0aW9uIE51bWJlcklzTmFOKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSAhPT0gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgRXZlbnRFbWl0dGVyLmluaXQuY2FsbCh0aGlzKTtcbn1cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xubW9kdWxlLmV4cG9ydHMub25jZSA9IG9uY2U7XG5cbi8vIEJhY2t3YXJkcy1jb21wYXQgd2l0aCBub2RlIDAuMTAueFxuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzQ291bnQgPSAwO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fbWF4TGlzdGVuZXJzID0gdW5kZWZpbmVkO1xuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuIDEwIGxpc3RlbmVycyBhcmVcbi8vIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2ggaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG52YXIgZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuXG5mdW5jdGlvbiBjaGVja0xpc3RlbmVyKGxpc3RlbmVyKSB7XG4gIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgXCJsaXN0ZW5lclwiIGFyZ3VtZW50IG11c3QgYmUgb2YgdHlwZSBGdW5jdGlvbi4gUmVjZWl2ZWQgdHlwZSAnICsgdHlwZW9mIGxpc3RlbmVyKTtcbiAgfVxufVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoRXZlbnRFbWl0dGVyLCAnZGVmYXVsdE1heExpc3RlbmVycycsIHtcbiAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZGVmYXVsdE1heExpc3RlbmVycztcbiAgfSxcbiAgc2V0OiBmdW5jdGlvbihhcmcpIHtcbiAgICBpZiAodHlwZW9mIGFyZyAhPT0gJ251bWJlcicgfHwgYXJnIDwgMCB8fCBOdW1iZXJJc05hTihhcmcpKSB7XG4gICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVGhlIHZhbHVlIG9mIFwiZGVmYXVsdE1heExpc3RlbmVyc1wiIGlzIG91dCBvZiByYW5nZS4gSXQgbXVzdCBiZSBhIG5vbi1uZWdhdGl2ZSBudW1iZXIuIFJlY2VpdmVkICcgKyBhcmcgKyAnLicpO1xuICAgIH1cbiAgICBkZWZhdWx0TWF4TGlzdGVuZXJzID0gYXJnO1xuICB9XG59KTtcblxuRXZlbnRFbWl0dGVyLmluaXQgPSBmdW5jdGlvbigpIHtcblxuICBpZiAodGhpcy5fZXZlbnRzID09PSB1bmRlZmluZWQgfHxcbiAgICAgIHRoaXMuX2V2ZW50cyA9PT0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHRoaXMpLl9ldmVudHMpIHtcbiAgICB0aGlzLl9ldmVudHMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIHRoaXMuX2V2ZW50c0NvdW50ID0gMDtcbiAgfVxuXG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59O1xuXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbiBzZXRNYXhMaXN0ZW5lcnMobikge1xuICBpZiAodHlwZW9mIG4gIT09ICdudW1iZXInIHx8IG4gPCAwIHx8IE51bWJlcklzTmFOKG4pKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1RoZSB2YWx1ZSBvZiBcIm5cIiBpcyBvdXQgb2YgcmFuZ2UuIEl0IG11c3QgYmUgYSBub24tbmVnYXRpdmUgbnVtYmVyLiBSZWNlaXZlZCAnICsgbiArICcuJyk7XG4gIH1cbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5mdW5jdGlvbiBfZ2V0TWF4TGlzdGVuZXJzKHRoYXQpIHtcbiAgaWYgKHRoYXQuX21heExpc3RlbmVycyA9PT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgcmV0dXJuIHRoYXQuX21heExpc3RlbmVycztcbn1cblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5nZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbiBnZXRNYXhMaXN0ZW5lcnMoKSB7XG4gIHJldHVybiBfZ2V0TWF4TGlzdGVuZXJzKHRoaXMpO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24gZW1pdCh0eXBlKSB7XG4gIHZhciBhcmdzID0gW107XG4gIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSBhcmdzLnB1c2goYXJndW1lbnRzW2ldKTtcbiAgdmFyIGRvRXJyb3IgPSAodHlwZSA9PT0gJ2Vycm9yJyk7XG5cbiAgdmFyIGV2ZW50cyA9IHRoaXMuX2V2ZW50cztcbiAgaWYgKGV2ZW50cyAhPT0gdW5kZWZpbmVkKVxuICAgIGRvRXJyb3IgPSAoZG9FcnJvciAmJiBldmVudHMuZXJyb3IgPT09IHVuZGVmaW5lZCk7XG4gIGVsc2UgaWYgKCFkb0Vycm9yKVxuICAgIHJldHVybiBmYWxzZTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmIChkb0Vycm9yKSB7XG4gICAgdmFyIGVyO1xuICAgIGlmIChhcmdzLmxlbmd0aCA+IDApXG4gICAgICBlciA9IGFyZ3NbMF07XG4gICAgaWYgKGVyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgIC8vIE5vdGU6IFRoZSBjb21tZW50cyBvbiB0aGUgYHRocm93YCBsaW5lcyBhcmUgaW50ZW50aW9uYWwsIHRoZXkgc2hvd1xuICAgICAgLy8gdXAgaW4gTm9kZSdzIG91dHB1dCBpZiB0aGlzIHJlc3VsdHMgaW4gYW4gdW5oYW5kbGVkIGV4Y2VwdGlvbi5cbiAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgIH1cbiAgICAvLyBBdCBsZWFzdCBnaXZlIHNvbWUga2luZCBvZiBjb250ZXh0IHRvIHRoZSB1c2VyXG4gICAgdmFyIGVyciA9IG5ldyBFcnJvcignVW5oYW5kbGVkIGVycm9yLicgKyAoZXIgPyAnICgnICsgZXIubWVzc2FnZSArICcpJyA6ICcnKSk7XG4gICAgZXJyLmNvbnRleHQgPSBlcjtcbiAgICB0aHJvdyBlcnI7IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gIH1cblxuICB2YXIgaGFuZGxlciA9IGV2ZW50c1t0eXBlXTtcblxuICBpZiAoaGFuZGxlciA9PT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAodHlwZW9mIGhhbmRsZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICBSZWZsZWN0QXBwbHkoaGFuZGxlciwgdGhpcywgYXJncyk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGxlbiA9IGhhbmRsZXIubGVuZ3RoO1xuICAgIHZhciBsaXN0ZW5lcnMgPSBhcnJheUNsb25lKGhhbmRsZXIsIGxlbik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSlcbiAgICAgIFJlZmxlY3RBcHBseShsaXN0ZW5lcnNbaV0sIHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5mdW5jdGlvbiBfYWRkTGlzdGVuZXIodGFyZ2V0LCB0eXBlLCBsaXN0ZW5lciwgcHJlcGVuZCkge1xuICB2YXIgbTtcbiAgdmFyIGV2ZW50cztcbiAgdmFyIGV4aXN0aW5nO1xuXG4gIGNoZWNrTGlzdGVuZXIobGlzdGVuZXIpO1xuXG4gIGV2ZW50cyA9IHRhcmdldC5fZXZlbnRzO1xuICBpZiAoZXZlbnRzID09PSB1bmRlZmluZWQpIHtcbiAgICBldmVudHMgPSB0YXJnZXQuX2V2ZW50cyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgdGFyZ2V0Ll9ldmVudHNDb3VudCA9IDA7XG4gIH0gZWxzZSB7XG4gICAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PT0gXCJuZXdMaXN0ZW5lclwiISBCZWZvcmVcbiAgICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyXCIuXG4gICAgaWYgKGV2ZW50cy5uZXdMaXN0ZW5lciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0YXJnZXQuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLFxuICAgICAgICAgICAgICAgICAgbGlzdGVuZXIubGlzdGVuZXIgPyBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICAgICAgLy8gUmUtYXNzaWduIGBldmVudHNgIGJlY2F1c2UgYSBuZXdMaXN0ZW5lciBoYW5kbGVyIGNvdWxkIGhhdmUgY2F1c2VkIHRoZVxuICAgICAgLy8gdGhpcy5fZXZlbnRzIHRvIGJlIGFzc2lnbmVkIHRvIGEgbmV3IG9iamVjdFxuICAgICAgZXZlbnRzID0gdGFyZ2V0Ll9ldmVudHM7XG4gICAgfVxuICAgIGV4aXN0aW5nID0gZXZlbnRzW3R5cGVdO1xuICB9XG5cbiAgaWYgKGV4aXN0aW5nID09PSB1bmRlZmluZWQpIHtcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICBleGlzdGluZyA9IGV2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICAgICsrdGFyZ2V0Ll9ldmVudHNDb3VudDtcbiAgfSBlbHNlIHtcbiAgICBpZiAodHlwZW9mIGV4aXN0aW5nID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICAgIGV4aXN0aW5nID0gZXZlbnRzW3R5cGVdID1cbiAgICAgICAgcHJlcGVuZCA/IFtsaXN0ZW5lciwgZXhpc3RpbmddIDogW2V4aXN0aW5nLCBsaXN0ZW5lcl07XG4gICAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgfSBlbHNlIGlmIChwcmVwZW5kKSB7XG4gICAgICBleGlzdGluZy51bnNoaWZ0KGxpc3RlbmVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXhpc3RpbmcucHVzaChsaXN0ZW5lcik7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgICBtID0gX2dldE1heExpc3RlbmVycyh0YXJnZXQpO1xuICAgIGlmIChtID4gMCAmJiBleGlzdGluZy5sZW5ndGggPiBtICYmICFleGlzdGluZy53YXJuZWQpIHtcbiAgICAgIGV4aXN0aW5nLndhcm5lZCA9IHRydWU7XG4gICAgICAvLyBObyBlcnJvciBjb2RlIGZvciB0aGlzIHNpbmNlIGl0IGlzIGEgV2FybmluZ1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXJlc3RyaWN0ZWQtc3ludGF4XG4gICAgICB2YXIgdyA9IG5ldyBFcnJvcignUG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSBsZWFrIGRldGVjdGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZXhpc3RpbmcubGVuZ3RoICsgJyAnICsgU3RyaW5nKHR5cGUpICsgJyBsaXN0ZW5lcnMgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICdhZGRlZC4gVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICdpbmNyZWFzZSBsaW1pdCcpO1xuICAgICAgdy5uYW1lID0gJ01heExpc3RlbmVyc0V4Y2VlZGVkV2FybmluZyc7XG4gICAgICB3LmVtaXR0ZXIgPSB0YXJnZXQ7XG4gICAgICB3LnR5cGUgPSB0eXBlO1xuICAgICAgdy5jb3VudCA9IGV4aXN0aW5nLmxlbmd0aDtcbiAgICAgIFByb2Nlc3NFbWl0V2FybmluZyh3KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGFyZ2V0O1xufVxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24gYWRkTGlzdGVuZXIodHlwZSwgbGlzdGVuZXIpIHtcbiAgcmV0dXJuIF9hZGRMaXN0ZW5lcih0aGlzLCB0eXBlLCBsaXN0ZW5lciwgZmFsc2UpO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucHJlcGVuZExpc3RlbmVyID1cbiAgICBmdW5jdGlvbiBwcmVwZW5kTGlzdGVuZXIodHlwZSwgbGlzdGVuZXIpIHtcbiAgICAgIHJldHVybiBfYWRkTGlzdGVuZXIodGhpcywgdHlwZSwgbGlzdGVuZXIsIHRydWUpO1xuICAgIH07XG5cbmZ1bmN0aW9uIG9uY2VXcmFwcGVyKCkge1xuICBpZiAoIXRoaXMuZmlyZWQpIHtcbiAgICB0aGlzLnRhcmdldC5yZW1vdmVMaXN0ZW5lcih0aGlzLnR5cGUsIHRoaXMud3JhcEZuKTtcbiAgICB0aGlzLmZpcmVkID0gdHJ1ZTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHJldHVybiB0aGlzLmxpc3RlbmVyLmNhbGwodGhpcy50YXJnZXQpO1xuICAgIHJldHVybiB0aGlzLmxpc3RlbmVyLmFwcGx5KHRoaXMudGFyZ2V0LCBhcmd1bWVudHMpO1xuICB9XG59XG5cbmZ1bmN0aW9uIF9vbmNlV3JhcCh0YXJnZXQsIHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBzdGF0ZSA9IHsgZmlyZWQ6IGZhbHNlLCB3cmFwRm46IHVuZGVmaW5lZCwgdGFyZ2V0OiB0YXJnZXQsIHR5cGU6IHR5cGUsIGxpc3RlbmVyOiBsaXN0ZW5lciB9O1xuICB2YXIgd3JhcHBlZCA9IG9uY2VXcmFwcGVyLmJpbmQoc3RhdGUpO1xuICB3cmFwcGVkLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHN0YXRlLndyYXBGbiA9IHdyYXBwZWQ7XG4gIHJldHVybiB3cmFwcGVkO1xufVxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbiBvbmNlKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGNoZWNrTGlzdGVuZXIobGlzdGVuZXIpO1xuICB0aGlzLm9uKHR5cGUsIF9vbmNlV3JhcCh0aGlzLCB0eXBlLCBsaXN0ZW5lcikpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucHJlcGVuZE9uY2VMaXN0ZW5lciA9XG4gICAgZnVuY3Rpb24gcHJlcGVuZE9uY2VMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcikge1xuICAgICAgY2hlY2tMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgICB0aGlzLnByZXBlbmRMaXN0ZW5lcih0eXBlLCBfb25jZVdyYXAodGhpcywgdHlwZSwgbGlzdGVuZXIpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbi8vIEVtaXRzIGEgJ3JlbW92ZUxpc3RlbmVyJyBldmVudCBpZiBhbmQgb25seSBpZiB0aGUgbGlzdGVuZXIgd2FzIHJlbW92ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID1cbiAgICBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcikge1xuICAgICAgdmFyIGxpc3QsIGV2ZW50cywgcG9zaXRpb24sIGksIG9yaWdpbmFsTGlzdGVuZXI7XG5cbiAgICAgIGNoZWNrTGlzdGVuZXIobGlzdGVuZXIpO1xuXG4gICAgICBldmVudHMgPSB0aGlzLl9ldmVudHM7XG4gICAgICBpZiAoZXZlbnRzID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgICBsaXN0ID0gZXZlbnRzW3R5cGVdO1xuICAgICAgaWYgKGxpc3QgPT09IHVuZGVmaW5lZClcbiAgICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICAgIGlmIChsaXN0ID09PSBsaXN0ZW5lciB8fCBsaXN0Lmxpc3RlbmVyID09PSBsaXN0ZW5lcikge1xuICAgICAgICBpZiAoLS10aGlzLl9ldmVudHNDb3VudCA9PT0gMClcbiAgICAgICAgICB0aGlzLl9ldmVudHMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBkZWxldGUgZXZlbnRzW3R5cGVdO1xuICAgICAgICAgIGlmIChldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdC5saXN0ZW5lciB8fCBsaXN0ZW5lcik7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGxpc3QgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcG9zaXRpb24gPSAtMTtcblxuICAgICAgICBmb3IgKGkgPSBsaXN0Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8IGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSB7XG4gICAgICAgICAgICBvcmlnaW5hbExpc3RlbmVyID0gbGlzdFtpXS5saXN0ZW5lcjtcbiAgICAgICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICAgICAgaWYgKHBvc2l0aW9uID09PSAwKVxuICAgICAgICAgIGxpc3Quc2hpZnQoKTtcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgc3BsaWNlT25lKGxpc3QsIHBvc2l0aW9uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSlcbiAgICAgICAgICBldmVudHNbdHlwZV0gPSBsaXN0WzBdO1xuXG4gICAgICAgIGlmIChldmVudHMucmVtb3ZlTGlzdGVuZXIgIT09IHVuZGVmaW5lZClcbiAgICAgICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgb3JpZ2luYWxMaXN0ZW5lciB8fCBsaXN0ZW5lcik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub2ZmID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPVxuICAgIGZ1bmN0aW9uIHJlbW92ZUFsbExpc3RlbmVycyh0eXBlKSB7XG4gICAgICB2YXIgbGlzdGVuZXJzLCBldmVudHMsIGk7XG5cbiAgICAgIGV2ZW50cyA9IHRoaXMuX2V2ZW50cztcbiAgICAgIGlmIChldmVudHMgPT09IHVuZGVmaW5lZClcbiAgICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICAgIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgICAgIGlmIChldmVudHMucmVtb3ZlTGlzdGVuZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIHRoaXMuX2V2ZW50cyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgICAgICAgdGhpcy5fZXZlbnRzQ291bnQgPSAwO1xuICAgICAgICB9IGVsc2UgaWYgKGV2ZW50c1t0eXBlXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgaWYgKC0tdGhpcy5fZXZlbnRzQ291bnQgPT09IDApXG4gICAgICAgICAgICB0aGlzLl9ldmVudHMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGRlbGV0ZSBldmVudHNbdHlwZV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG5cbiAgICAgIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhldmVudHMpO1xuICAgICAgICB2YXIga2V5O1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgIGtleSA9IGtleXNbaV07XG4gICAgICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICAgICAgdGhpcy5fZXZlbnRzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICAgICAgdGhpcy5fZXZlbnRzQ291bnQgPSAwO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cblxuICAgICAgbGlzdGVuZXJzID0gZXZlbnRzW3R5cGVdO1xuXG4gICAgICBpZiAodHlwZW9mIGxpc3RlbmVycyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVycyk7XG4gICAgICB9IGVsc2UgaWYgKGxpc3RlbmVycyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIExJRk8gb3JkZXJcbiAgICAgICAgZm9yIChpID0gbGlzdGVuZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnNbaV0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbmZ1bmN0aW9uIF9saXN0ZW5lcnModGFyZ2V0LCB0eXBlLCB1bndyYXApIHtcbiAgdmFyIGV2ZW50cyA9IHRhcmdldC5fZXZlbnRzO1xuXG4gIGlmIChldmVudHMgPT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gW107XG5cbiAgdmFyIGV2bGlzdGVuZXIgPSBldmVudHNbdHlwZV07XG4gIGlmIChldmxpc3RlbmVyID09PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuIFtdO1xuXG4gIGlmICh0eXBlb2YgZXZsaXN0ZW5lciA9PT0gJ2Z1bmN0aW9uJylcbiAgICByZXR1cm4gdW53cmFwID8gW2V2bGlzdGVuZXIubGlzdGVuZXIgfHwgZXZsaXN0ZW5lcl0gOiBbZXZsaXN0ZW5lcl07XG5cbiAgcmV0dXJuIHVud3JhcCA/XG4gICAgdW53cmFwTGlzdGVuZXJzKGV2bGlzdGVuZXIpIDogYXJyYXlDbG9uZShldmxpc3RlbmVyLCBldmxpc3RlbmVyLmxlbmd0aCk7XG59XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24gbGlzdGVuZXJzKHR5cGUpIHtcbiAgcmV0dXJuIF9saXN0ZW5lcnModGhpcywgdHlwZSwgdHJ1ZSk7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJhd0xpc3RlbmVycyA9IGZ1bmN0aW9uIHJhd0xpc3RlbmVycyh0eXBlKSB7XG4gIHJldHVybiBfbGlzdGVuZXJzKHRoaXMsIHR5cGUsIGZhbHNlKTtcbn07XG5cbkV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24oZW1pdHRlciwgdHlwZSkge1xuICBpZiAodHlwZW9mIGVtaXR0ZXIubGlzdGVuZXJDb3VudCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBlbWl0dGVyLmxpc3RlbmVyQ291bnQodHlwZSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGxpc3RlbmVyQ291bnQuY2FsbChlbWl0dGVyLCB0eXBlKTtcbiAgfVxufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lckNvdW50ID0gbGlzdGVuZXJDb3VudDtcbmZ1bmN0aW9uIGxpc3RlbmVyQ291bnQodHlwZSkge1xuICB2YXIgZXZlbnRzID0gdGhpcy5fZXZlbnRzO1xuXG4gIGlmIChldmVudHMgIT09IHVuZGVmaW5lZCkge1xuICAgIHZhciBldmxpc3RlbmVyID0gZXZlbnRzW3R5cGVdO1xuXG4gICAgaWYgKHR5cGVvZiBldmxpc3RlbmVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gMTtcbiAgICB9IGVsc2UgaWYgKGV2bGlzdGVuZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIGV2bGlzdGVuZXIubGVuZ3RoO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiAwO1xufVxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmV2ZW50TmFtZXMgPSBmdW5jdGlvbiBldmVudE5hbWVzKCkge1xuICByZXR1cm4gdGhpcy5fZXZlbnRzQ291bnQgPiAwID8gUmVmbGVjdE93bktleXModGhpcy5fZXZlbnRzKSA6IFtdO1xufTtcblxuZnVuY3Rpb24gYXJyYXlDbG9uZShhcnIsIG4pIHtcbiAgdmFyIGNvcHkgPSBuZXcgQXJyYXkobik7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKVxuICAgIGNvcHlbaV0gPSBhcnJbaV07XG4gIHJldHVybiBjb3B5O1xufVxuXG5mdW5jdGlvbiBzcGxpY2VPbmUobGlzdCwgaW5kZXgpIHtcbiAgZm9yICg7IGluZGV4ICsgMSA8IGxpc3QubGVuZ3RoOyBpbmRleCsrKVxuICAgIGxpc3RbaW5kZXhdID0gbGlzdFtpbmRleCArIDFdO1xuICBsaXN0LnBvcCgpO1xufVxuXG5mdW5jdGlvbiB1bndyYXBMaXN0ZW5lcnMoYXJyKSB7XG4gIHZhciByZXQgPSBuZXcgQXJyYXkoYXJyLmxlbmd0aCk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcmV0Lmxlbmd0aDsgKytpKSB7XG4gICAgcmV0W2ldID0gYXJyW2ldLmxpc3RlbmVyIHx8IGFycltpXTtcbiAgfVxuICByZXR1cm4gcmV0O1xufVxuXG5mdW5jdGlvbiBvbmNlKGVtaXR0ZXIsIG5hbWUpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICBmdW5jdGlvbiBlcnJvckxpc3RlbmVyKGVycikge1xuICAgICAgZW1pdHRlci5yZW1vdmVMaXN0ZW5lcihuYW1lLCByZXNvbHZlcik7XG4gICAgICByZWplY3QoZXJyKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZXNvbHZlcigpIHtcbiAgICAgIGlmICh0eXBlb2YgZW1pdHRlci5yZW1vdmVMaXN0ZW5lciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBlbWl0dGVyLnJlbW92ZUxpc3RlbmVyKCdlcnJvcicsIGVycm9yTGlzdGVuZXIpO1xuICAgICAgfVxuICAgICAgcmVzb2x2ZShbXS5zbGljZS5jYWxsKGFyZ3VtZW50cykpO1xuICAgIH07XG5cbiAgICBldmVudFRhcmdldEFnbm9zdGljQWRkTGlzdGVuZXIoZW1pdHRlciwgbmFtZSwgcmVzb2x2ZXIsIHsgb25jZTogdHJ1ZSB9KTtcbiAgICBpZiAobmFtZSAhPT0gJ2Vycm9yJykge1xuICAgICAgYWRkRXJyb3JIYW5kbGVySWZFdmVudEVtaXR0ZXIoZW1pdHRlciwgZXJyb3JMaXN0ZW5lciwgeyBvbmNlOiB0cnVlIH0pO1xuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGFkZEVycm9ySGFuZGxlcklmRXZlbnRFbWl0dGVyKGVtaXR0ZXIsIGhhbmRsZXIsIGZsYWdzKSB7XG4gIGlmICh0eXBlb2YgZW1pdHRlci5vbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGV2ZW50VGFyZ2V0QWdub3N0aWNBZGRMaXN0ZW5lcihlbWl0dGVyLCAnZXJyb3InLCBoYW5kbGVyLCBmbGFncyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZXZlbnRUYXJnZXRBZ25vc3RpY0FkZExpc3RlbmVyKGVtaXR0ZXIsIG5hbWUsIGxpc3RlbmVyLCBmbGFncykge1xuICBpZiAodHlwZW9mIGVtaXR0ZXIub24gPT09ICdmdW5jdGlvbicpIHtcbiAgICBpZiAoZmxhZ3Mub25jZSkge1xuICAgICAgZW1pdHRlci5vbmNlKG5hbWUsIGxpc3RlbmVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZW1pdHRlci5vbihuYW1lLCBsaXN0ZW5lcik7XG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGVvZiBlbWl0dGVyLmFkZEV2ZW50TGlzdGVuZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAvLyBFdmVudFRhcmdldCBkb2VzIG5vdCBoYXZlIGBlcnJvcmAgZXZlbnQgc2VtYW50aWNzIGxpa2UgTm9kZVxuICAgIC8vIEV2ZW50RW1pdHRlcnMsIHdlIGRvIG5vdCBsaXN0ZW4gZm9yIGBlcnJvcmAgZXZlbnRzIGhlcmUuXG4gICAgZW1pdHRlci5hZGRFdmVudExpc3RlbmVyKG5hbWUsIGZ1bmN0aW9uIHdyYXBMaXN0ZW5lcihhcmcpIHtcbiAgICAgIC8vIElFIGRvZXMgbm90IGhhdmUgYnVpbHRpbiBgeyBvbmNlOiB0cnVlIH1gIHN1cHBvcnQgc28gd2VcbiAgICAgIC8vIGhhdmUgdG8gZG8gaXQgbWFudWFsbHkuXG4gICAgICBpZiAoZmxhZ3Mub25jZSkge1xuICAgICAgICBlbWl0dGVyLnJlbW92ZUV2ZW50TGlzdGVuZXIobmFtZSwgd3JhcExpc3RlbmVyKTtcbiAgICAgIH1cbiAgICAgIGxpc3RlbmVyKGFyZyk7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwiZW1pdHRlclwiIGFyZ3VtZW50IG11c3QgYmUgb2YgdHlwZSBFdmVudEVtaXR0ZXIuIFJlY2VpdmVkIHR5cGUgJyArIHR5cGVvZiBlbWl0dGVyKTtcbiAgfVxufVxuIl19
