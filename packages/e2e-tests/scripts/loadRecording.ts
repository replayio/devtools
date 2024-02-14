import { SimpleProtocolClient } from "@replayio/protocol";
import chalk from "chalk";
import WebSocket from "ws";

const DISPATCH_URL =
  process.env.DISPATCH_ADDRESS ||
  process.env.NEXT_PUBLIC_DISPATCH_URL ||
  "wss://dispatch.replay.io";

const callbacks: any = {
  onClose: console.log,
  onError: console.log,
};

export async function loadRecording(recordingId: string) {
  console.log(`Processing recording ${chalk.bold.yellow(recordingId)}`);

  let currentProgress = 0;
  let lastLoggedProgress = 0;

  const client = new SimpleProtocolClient(new WebSocket(DISPATCH_URL), callbacks, console.log);
  client.addEventListener("Recording.processRecordingProgress", data => {
    if (data.recordingId === recordingId) {
      currentProgress = data.progressPercent;
    }
  });

  const intervalId = setInterval(() => {
    if (lastLoggedProgress !== currentProgress) {
      lastLoggedProgress = currentProgress;

      console.log(`Recording ${chalk.bold.yellow(recordingId)} ${currentProgress}% processed`);
    }
  }, 250);

  try {
    await client.sendCommand("Recording.processRecording", {
      recordingId,
    });
  } finally {
    clearInterval(intervalId);
  }
}
