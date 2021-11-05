const { parentPort } = require("worker_threads");

parentPort.on("message", async ({ kind }) => {
  console.log("WorkerReceivedMessage", kind);
  parentPort.postMessage({ kind: "pong" });
});
