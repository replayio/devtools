import { SimpleProtocolClient } from "@replayio/protocol";
import WebSocket from "ws";

const DISPATCH_URL =
  process.env.DISPATCH_ADDRESS ||
  process.env.NEXT_PUBLIC_DISPATCH_URL ||
  "wss://dispatch.replay.io";

const callbacks: any = {
  onClose: console.log,
  onError: console.log,
};

const onProgress = ({
  progressPercent,
  recordingId,
}: {
  progressPercent: number;
  recordingId: string;
}) => {
  console.log(`    ⏳ Processing recording ${recordingId} ${progressPercent}%`);
};

const client = new SimpleProtocolClient(new WebSocket(DISPATCH_URL), callbacks, console.log);

client.addEventListener(
  // @ts-expect-error - when we update protocol client to 0.68, it will throw an error - just remove this comment
  "Recording.processRecordingProgress",
  onProgress
);

export const loadRecording = async (recordingId: string) => {
  const { sessionId } = await client.sendCommand("Recording.createSession", {
    recordingId,
  });
  console.log(`    ⏳ Processing recording ${recordingId} with session ${sessionId}`);

  await client.sendCommand("Recording.processRecording", {
    recordingId,
  });
  console.log(`    ✅ Loaded recording ${recordingId}`);
};
