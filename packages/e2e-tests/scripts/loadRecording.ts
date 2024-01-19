import { SimpleProtocolClient } from "@replayio/protocol";
import WebSocket from "ws";

import { logAnimated } from "./log";

const DISPATCH_URL =
  process.env.DISPATCH_ADDRESS ||
  process.env.NEXT_PUBLIC_DISPATCH_URL ||
  "wss://dispatch.replay.io";

const callbacks: any = {
  onClose: console.log,
  onError: console.log,
};

export async function loadRecording(recordingId: string) {
  const { completeLog, updateLog } = logAnimated(`Processing recording ${recordingId}`);

  const onProgress = ({
    progressPercent,
    recordingId,
  }: {
    progressPercent: number;
    recordingId: string;
  }) => {
    updateLog(`Processing recording ${recordingId} ${progressPercent}%`);
  };

  const client = new SimpleProtocolClient(new WebSocket(DISPATCH_URL), callbacks, console.log);
  client.addEventListener("Recording.processRecordingProgress", onProgress);

  await client.sendCommand("Recording.processRecording", {
    recordingId,
  });

  completeLog();
}
