import assert from "assert";
import { FrameId, PauseId } from "@replayio/protocol";

import { ThreadFront } from "protocol/thread/thread";
import { ReplayClientInterface } from "shared/client/types";

import { recordingCapabilitiesCache } from "../suspense/BuildIdCache";
import { cachePauseData } from "../suspense/PauseCache";
import { sourcesCache } from "../suspense/SourcesCache";

export async function evaluate({
  replayClient,
  pauseId,
  text,
  frameId,
  pure = false,
}: {
  replayClient: ReplayClientInterface;
  pauseId?: PauseId;
  text: string;
  frameId?: FrameId;
  pure?: boolean;
}) {
  if (!pauseId) {
    pauseId = await ThreadFront.getCurrentPauseId(replayClient);
  }
  const abilities = await recordingCapabilitiesCache.readAsync(replayClient);
  const result = await replayClient.evaluateExpression(
    pauseId,
    text,
    frameId ?? null,
    abilities.supportsPureEvaluation && pure
  );
  const { value: { idToSource } = {} } = await sourcesCache.readAsync(replayClient);
  assert(idToSource != null);

  cachePauseData(replayClient, idToSource, pauseId, result.data);

  if (result.returned) {
    return { exception: null, returned: result.returned };
  } else if (result.exception) {
    return { exception: result.exception, returned: null };
  } else {
    return { exception: null, returned: null };
  }
}
