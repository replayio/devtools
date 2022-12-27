"use strict";
/* Copyright 2022 Record Replay Inc. */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleProtocolClient = void 0;
var SimpleProtocolClient = /** @class */ (function () {
    function SimpleProtocolClient(webSocket, callbacks, log) {
        var _this = this;
        this.log = log;
        this.eventListeners = {};
        this.pendingMessages = new Map();
        this.nextMessageId = 1;
        this.socket = webSocket;
        this.opened = defer();
        this.socket.onopen = function () { return _this.opened.resolve(); };
        this.socket.onclose = function (_a) {
            var code = _a.code, reason = _a.reason;
            return callbacks.onClose(code, reason);
        };
        this.socket.onerror = callbacks.onError;
        this.socket.onmessage = function (ev) { return _this.onMessage(JSON.parse(ev.data)); };
    }
    SimpleProtocolClient.prototype.addEventListener = function (event, listener) {
        if (event in this.eventListeners) {
            throw new Error("Duplicate event listener " + event);
        }
        this.eventListeners[event] = listener;
    };
    SimpleProtocolClient.prototype.removeEventListener = function (event, listener) {
        if (listener && listener !== this.eventListeners[event]) {
            return;
        }
        delete this.eventListeners[event];
    };
    SimpleProtocolClient.prototype.sendCommand = function (method, params, sessionId, pauseId) {
        return __awaiter(this, void 0, void 0, function () {
            var id, waiter;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.opened.promise];
                    case 1:
                        _a.sent();
                        id = this.nextMessageId++;
                        this.socket.send(JSON.stringify({ id: id, method: method, params: params, sessionId: sessionId, pauseId: pauseId }));
                        waiter = defer();
                        this.pendingMessages.set(id, waiter);
                        return [2 /*return*/, waiter.promise];
                }
            });
        });
    };
    SimpleProtocolClient.prototype.onMessage = function (msg) {
        if (msg.id) {
            var _a = this.pendingMessages.get(msg.id), resolve = _a.resolve, reject = _a.reject;
            this.pendingMessages.delete(msg.id);
            if (msg.result) {
                resolve(msg.result);
            }
            else {
                reject(msg.error);
            }
        }
        else {
            var handler = this.eventListeners[msg.method];
            if (handler) {
                handler(msg.params);
            }
            else {
                this.log("No handler for event: ".concat(JSON.stringify(msg)));
            }
        }
    };
    return SimpleProtocolClient;
}());
exports.SimpleProtocolClient = SimpleProtocolClient;
function defer() {
    var resolve;
    var reject;
    var promise = new Promise(function (res, rej) {
        resolve = res;
        reject = rej;
    });
    return { promise: promise, resolve: resolve, reject: reject };
}
