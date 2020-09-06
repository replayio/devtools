const { defer, makeInfallible } = require("./utils");
const { setStatus } = require("../ui/actions/app");

let socket;
let gSocketOpen = false;

let gPendingMessages = [];
let gNextMessageId = 1;

const gMessageWaiters = new Map();

// These are helpful when investigating connection speeds.
const gStartTime = Date.now();
let gSentBytes = 0;
let gReceivedBytes = 0;

function initSocket(address) {
  socket = new WebSocket(address || "wss://dispatch.replay.io");

  socket.onopen = makeInfallible(onSocketOpen);
  socket.onclose = makeInfallible(onSocketClose);
  socket.onerror = makeInfallible(onSocketError);
  socket.onmessage = makeInfallible(onSocketMessage);
}

function sendMessage(method, params, sessionId, pauseId) {
  const id = gNextMessageId++;
  const msg = { id, sessionId, pauseId, method, params };

  if (gSocketOpen) {
    doSend(msg);
  } else {
    gPendingMessages.push(msg);
  }

  const { promise, resolve, reject } = defer();
  gMessageWaiters.set(id, { method, resolve, reject });

  return promise;
}

const doSend = makeInfallible(msg => {
  const str = JSON.stringify(msg);
  gSentBytes += str.length;
  socket.send(str);
});

function onSocketOpen() {
  console.log("Socket Open");
  setStatus({ type: "message", message: "Connected" });
  gPendingMessages.forEach(msg => doSend(msg));
  gPendingMessages.length = 0;
  gSocketOpen = true;
}

const gEventListeners = new Map();

function addEventListener(method, handler) {
  if (gEventListeners.has(method)) {
    throw new Error("Duplicate event listener", method);
  }
  gEventListeners.set(method, handler);
}

function removeEventListener(method) {
  gEventListeners.delete(method);
}

function onSocketMessage(evt) {
  gReceivedBytes += evt.data.length;
  const msg = JSON.parse(evt.data);

  if (msg.id) {
    const { method, resolve, reject } = gMessageWaiters.get(msg.id);
    gMessageWaiters.delete(msg.id);
    if (msg.error) {
      console.warn("Message failed", method, msg.error, msg.data);
      reject(msg.error);
    } else {
      resolve(msg.result);
    }
  } else if (gEventListeners.has(msg.method)) {
    const handler = gEventListeners.get(msg.method);
    handler(msg.params);
  } else {
    console.error("Received unknown message", msg);
  }
}

function onSocketClose() {
  setStatus("Disconnected.");
  log("Socket Closed");
}

function onSocketError() {
  log("Socket Error");
}

function log(text) {
  // Don't actually log anything. This is a convenient place to add a logpoint
  // when reviewing recordings of the viewer.
}

// function setStatus(text) {
//   if (document.getElementById("status")) {
//     document.getElementById("status").innerText = text;
//   }
// }

module.exports = {
  initSocket,
  sendMessage,
  addEventListener,
  removeEventListener,
  log,
  // setStatus,
};

// Debugging methods.
if (typeof window === "object") {
  window.disconnect = () => {
    socket.close();
  };

  window.outstanding = () => {
    const messages = [...gMessageWaiters.entries()].map(([id, { method }]) => ({
      id,
      method,
    }));
    return {
      messages,
      time: Date.now() - gStartTime,
      sent: gSentBytes,
      received: gReceivedBytes,
    };
  };
}
