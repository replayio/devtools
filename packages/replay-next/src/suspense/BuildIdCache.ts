import { createSingleEntryCache } from "suspense";

import { ReplayClientInterface } from "shared/client/types";
import { userData } from "shared/user-data/GraphQL/UserData";

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
  supportsObjectIdLookupsInEvaluations: boolean;
};

// Target applications which can create recordings.
export enum RecordingTarget {
  gecko = "gecko",
  chromium = "chromium",
  node = "node",
  unknown = "unknown",
}

/**
 * Takes a build date (i.e. 'YYYYMMDD') and converts it to a `Date` object.
 */
export function buildDateStringToDate(buildDate: string) {
  const y = buildDate.substring(0, 4);
  const m = buildDate.substring(4, 6);
  const d = buildDate.substring(6);

  return new Date(`${y}-${m}-${d}T00:00:00Z`);
}

export interface BuildComponents {
  platform: string;
  runtime: string;
  date: string;
}

// Ported from the backend
export function parseBuildIdComponents(buildId: string): BuildComponents | null {
  // Add the platform, runtime, and date to the metadata, which we can determine
  // from the build ID itself.
  const match = /(.*?)-(.*?)-(.*?)-/.exec(buildId);

  if (match) {
    return { platform: match[1], runtime: match[2], date: match[3] };
  }

  // NOTE: Only old builds that are outside our supported range should hit
  // this case, but this function may well be called for those older builds
  // still if someone tries to view an older recording.
  return null;
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

function getRecordingCapabilities(
  recordingTarget: RecordingTarget,
  buildComponents: BuildComponents
) {
  switch (recordingTarget) {
    case "chromium": {
      const buildDate = buildDateStringToDate(buildComponents?.date ?? "");
      const supportsObjectIdLookupsInEvaluations = buildDate >= new Date("2023-09-16");

      return {
        supportsEagerEvaluation: false,
        supportsElementsInspector: true,
        supportsEventTypes: true,
        supportsNetworkRequests: false,
        supportsRepaintingGraphics: userData.get("protocol_chromiumRepaints"),
        supportsPureEvaluation: false,
        supportsObjectIdLookupsInEvaluations,
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
        supportsObjectIdLookupsInEvaluations: false,
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
        supportsObjectIdLookupsInEvaluations: false,
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
        supportsObjectIdLookupsInEvaluations: false,
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
    const buildId = await buildIdCache.readAsync(replayClient);

    const buildComponents = parseBuildIdComponents(buildId) ?? {
      platform: "unknown",
      runtime: "unknown",
      date: "",
    };
    return getRecordingCapabilities(recordingTarget, buildComponents);
  },
});
