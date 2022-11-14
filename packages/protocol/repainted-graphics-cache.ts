import { PauseId, repaintGraphicsResult } from "@replayio/protocol";

import { ReplayClientInterface } from "shared/client/types";

const cache = new Map<PauseId, Promise<repaintGraphicsResult | null>>();

export function repaintGraphics(
  replayClient: ReplayClientInterface,
  pauseId: PauseId,
  force = false
) {
  if (!force) {
    const cachedPromise = cache.get(pauseId);
    if (cachedPromise) {
      return cachedPromise;
    }
  }

  const repaintedGraphicsPromise = fetchRepaintedGraphics(replayClient, pauseId);
  cache.set(pauseId, repaintedGraphicsPromise);
  return repaintedGraphicsPromise;
}

async function fetchRepaintedGraphics(replayClient: ReplayClientInterface, pauseId: PauseId) {
  try {
    return await replayClient.repaintGraphics(pauseId);
  } catch (e) {
    console.error("DOM.repaintGraphics failed", e);
    return null;
  }
}
