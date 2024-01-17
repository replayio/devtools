import { loadedRegions as LoadedRegions } from "@replayio/protocol";

import { defer } from "protocol/utils";

import { newProtocolClient } from "./protocolClient/protocolClient";

const DISPATCH_URL =
  process.env.DISPATCH_ADDRESS ||
  process.env.NEXT_PUBLIC_DISPATCH_URL ||
  "wss://dispatch.replay.io";

export const clientPromise = newProtocolClient(DISPATCH_URL);

export const loadRecording = async (recordingId: string) => {
  const client = await clientPromise;
  const { sessionId } = await client.sendCommand("Recording.createSession", {
    recordingId,
  });

  console.log(`    ⏳ Loading recording ${recordingId} with session ${sessionId}`);

  const { promise: allLoadedPromise, resolve: allLoadedResolve } = defer<void>();
  let loadedRegion: LoadedRegions["loaded"][0] | undefined;
  client.addEventListener("Session.loadedRegions", event => {
    if (
      event.loaded.length !== 1 ||
      event.loading.length !== 1 ||
      event.indexed.length !== 1 ||
      event.loading[0]?.end?.point !== event.loaded[0]?.end?.point
    ) {
      return;
    }

    loadedRegion = event.loaded[0];
    allLoadedResolve();
  });

  await Promise.race([
    allLoadedPromise,
    client.sendCommand("Session.listenForLoadChanges", {}, sessionId),
  ]);
};
