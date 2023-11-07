import { FrameId, PauseId } from "@replayio/protocol";

import { ReplayClientInterface } from "shared/client/types";

import { recordingCapabilitiesCache } from "../suspense/BuildIdCache";
import { cachePauseData } from "../suspense/PauseCache";
import { sourcesByIdCache } from "../suspense/SourcesCache";

export async function evaluate({
  replayClient,
  pauseId,
  text,
  frameId,
  pure = false,
}: {
  replayClient: ReplayClientInterface;
  pauseId: PauseId;
  text: string;
  frameId?: FrameId;
  pure?: boolean;
}) {
  const abilities = await recordingCapabilitiesCache.readAsync(replayClient);
  const result = await replayClient.evaluateExpression(
    pauseId,
    text,
    frameId ?? null,
    abilities.supportsPureEvaluation && pure
  );
  const sources = await sourcesByIdCache.readAsync(replayClient);
  cachePauseData(replayClient, sources, pauseId, result.data);

  if (result.returned) {
    return { exception: null, returned: result.returned };
  } else if (result.exception) {
    return { exception: result.exception, returned: null };
  } else {
    return { exception: null, returned: null };
  }
}
