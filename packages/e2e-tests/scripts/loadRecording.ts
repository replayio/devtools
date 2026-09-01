import { SimpleProtocolClient } from "@replayio/protocol";
import chalk from "chalk";
import WebSocket from "ws";
import { withExponentialBackoff } from "./exponential-backoff";

const DISPATCH_URL =
  process.env.DISPATCH_ADDRESS ||
  process.env.NEXT_PUBLIC_DISPATCH_URL ||
  "wss://dispatch.replay.io";

export async function loadRecording(recordingId: string) {
  console.log(`Processing recording ${chalk.bold.yellow(recordingId)}`);

  await withExponentialBackoff(() => loadRecordingOnce(recordingId), 1000, 5);
}

async function loadRecordingOnce(recordingId: string) {
  let currentProgress = 0;
  let lastLoggedProgress = 0;

  let rejectClosed!: (err: Error) => void;
  const closed = new Promise<never>((_, reject) => {
    rejectClosed = reject;
  });

  const client = new SimpleProtocolClient(
    new WebSocket(DISPATCH_URL),
    {
      onClose: (code, reason) => {
        console.log(code, reason);
        rejectClosed(new Error(`Dispatch WebSocket closed (${code}): ${reason}`));
      },
      onError: err => {
        console.log(err);
        rejectClosed(err instanceof Error ? err : new Error(String(err)));
      },
    },
    console.log
  );

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

  const command = client.sendCommand("Recording.processRecording", { recordingId });
  command.catch(() => {});

  try {
    await Promise.race([command, closed]);
  } finally {
    clearInterval(intervalId);
  }
}
