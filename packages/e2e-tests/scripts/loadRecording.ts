import { SimpleProtocolClient } from "@replayio/protocol";
import chalk from "chalk";
import WebSocket from "ws";

const DISPATCH_URL =
  process.env.DISPATCH_ADDRESS ||
  process.env.NEXT_PUBLIC_DISPATCH_URL ||
  "wss://dispatch.replay.io";

const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 1000;

export async function loadRecording(recordingId: string) {
  console.log(`Processing recording ${chalk.bold.yellow(recordingId)}`);

  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      await loadRecordingOnce(recordingId);
      return;
    } catch (err) {
      lastError = err;
      if (attempt === MAX_ATTEMPTS - 1) {
        break;
      }
      const delayMs = BASE_DELAY_MS * 2 ** attempt;
      console.log(
        `Processing recording ${chalk.bold.yellow(recordingId)} failed ` +
          `(attempt ${attempt + 1}/${MAX_ATTEMPTS}): ${err}. Retrying in ${delayMs}ms`
      );
      await new Promise<void>(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
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
