import { createSingleEntryCache } from "suspense";

import { features } from "protocol/thread/thread";
import { ReplayClientInterface } from "shared/client/types";

export const buildIdCache = createSingleEntryCache<[replayClient: ReplayClientInterface], string>({
  config: { immutable: true },
  debugLabel: "buildIdCache",
  load: ([replayClient]) => replayClient.getBuildId(),
});

export type RecordingCapabilities = {
  supportsEagerEvaluation: boolean;
  supportsElementsInspector: boolean;
  supportsEventTypes: boolean;
  supportsNetworkRequests: boolean;
  supportsRepaintingGraphics: boolean;
  supportsPureEvaluation: boolean;
};

// Target applications which can create recordings.
export enum RecordingTarget {
  gecko = "gecko",
  chromium = "chromium",
  node = "node",
  unknown = "unknown",
}

function getRecordingTarget(buildId: string): RecordingTarget {
  if (buildId.includes("gecko")) {
    return RecordingTarget.gecko;
  }
  if (buildId.includes("chromium")) {
    return RecordingTarget.chromium;
  }
  if (buildId.includes("node")) {
    return RecordingTarget.node;
  }
  return RecordingTarget.unknown;
}

export const recordingTargetCache = createSingleEntryCache<
  [replayClient: ReplayClientInterface],
  RecordingTarget
>({
  config: { immutable: true },
  debugLabel: "recordingTargetCache",
  load: async ([replayClient]) => {
    const buildId = await buildIdCache.readAsync(replayClient);
    return getRecordingTarget(buildId);
  },
});

function getRecordingCapabilities(buildId: string) {
  const recordingTarget = getRecordingTarget(buildId);
  switch (recordingTarget) {
    case "chromium": {
      return {
        supportsEagerEvaluation: false,
        supportsElementsInspector: true,
        supportsEventTypes: true,
        supportsNetworkRequests: false,
        supportsRepaintingGraphics: features.chromiumRepaints,
        supportsPureEvaluation: false,
      };
    }
    case "gecko": {
      return {
        supportsEagerEvaluation: true,
        supportsElementsInspector: true,
        supportsEventTypes: true,
        supportsNetworkRequests: true,
        supportsRepaintingGraphics: true,
        supportsPureEvaluation: true,
      };
    }
    case "node": {
      return {
        supportsEagerEvaluation: true,
        supportsElementsInspector: false,
        supportsEventTypes: false,
        supportsNetworkRequests: true,
        supportsRepaintingGraphics: false,
        supportsPureEvaluation: false,
      };
    }
    case "unknown":
    default: {
      return {
        supportsEagerEvaluation: false,
        supportsElementsInspector: false,
        supportsEventTypes: false,
        supportsNetworkRequests: true,
        supportsRepaintingGraphics: true,
        supportsPureEvaluation: false,
      };
    }
  }
}

export const recordingCapabilitiesCache = createSingleEntryCache<
  [replayClient: ReplayClientInterface],
  RecordingCapabilities
>({
  config: { immutable: true },
  debugLabel: "recordingCapabilitiesCache",
  load: async ([replayClient]) => {
    const recordingTarget = await recordingTargetCache.readAsync(replayClient);
    return getRecordingCapabilities(recordingTarget);
  },
});
