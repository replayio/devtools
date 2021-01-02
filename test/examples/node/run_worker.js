const { Worker } = require("worker_threads");

let gWorker;

function spawnWorker() {
  gWorker = new Worker(`${__dirname}/worker.js`);
  gWorker.on("message", onWorkerMessage);
  setTimeout(sendWorkerMessage, 0);
}
setTimeout(spawnWorker, 0);

function sendWorkerMessage() {
  gWorker.postMessage({ kind: "ping" });
}

function onWorkerMessage({ kind }) {
  console.log("GotWorkerMessage", kind);
  process.exit();
}
