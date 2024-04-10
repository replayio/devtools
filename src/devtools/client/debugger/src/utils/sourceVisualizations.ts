import { Dictionary } from "@reduxjs/toolkit";
import type { SameLineSourceLocations, SourceId } from "@replayio/protocol";
import sortBy from "lodash/sortBy";

import { assert } from "protocol/utils";
import { breakpointPositionsIntervalCache } from "replay-next/src/suspense/BreakpointPositionsCache";
import { mappedLocationCache } from "replay-next/src/suspense/MappedLocationCache";
import { bucketBreakpointLines } from "replay-next/src/utils/source";
import { ReplayClientInterface } from "shared/client/types";
import {
  SourceDetails,
  SourcesState,
  getBestNonSourceMappedSourceId,
  getBestSourceMappedSourceId,
} from "ui/reducers/sources";
import { getPauseFrameSuspense } from "ui/suspense/frameCache";

import { PauseAndFrameId } from "../reducers/pause";
import { isBowerComponent, isNodeModule } from "./source";

export type CursorPosition = {
  readonly column: number;
  readonly line: number;
};

export function getSourceIDsToSearch(
  sourcesById: Map<string, SourceDetails>,
  includeNodeModules: boolean = false
) {
  const sourceIds = [];
  for (const sourceId in sourcesById) {
    const source = sourcesById.get(sourceId);
    assert(source);
    if (source.prettyPrinted) {
      continue;
    }
    const correspondingSourceId = source.correspondingSourceIds[0];
    if (correspondingSourceId !== sourceId) {
      continue;
    }
    if (isBowerComponent(source)) {
      continue;
    }
    if (!includeNodeModules && isNodeModule(source)) {
      continue;
    }
    sourceIds.push(sourceId);
  }
  return sortBy(sourceIds, sourceId => {
    const source = sourcesById.get(sourceId);
    assert(source);
    const isOriginal = source.isSourceMapped;
    return [isOriginal ? 0 : 1, source.url];
  });
}

function getSourceIdToVisualizeSuspense(
  replayClient: ReplayClientInterface,
  selectedSource: SourceDetails | null | undefined,
  selectedFrameId: PauseAndFrameId | null,
  sourcesState: SourcesState,
  position?: CursorPosition,
  client?: ReplayClientInterface
) {
  if (!selectedSource) {
    return undefined;
  }
  if (selectedSource.isSourceMapped) {
    return selectedSource.id;
  }

  let alternateSourceId = selectedFrameId
    ? getAlternateSourceIdFromSelectedFrameSuspense(
        replayClient,
        selectedSource,
        selectedFrameId,
        sourcesState
      )
    : undefined;
  if (!alternateSourceId) {
    alternateSourceId = getUniqueAlternateSourceId(
      selectedSource,
      sourcesState.sourceDetails.entities
    ).sourceId;
  }
  if (alternateSourceId) {
    const alternateSource = sourcesState.sourceDetails.entities[alternateSourceId];
    assert(
      alternateSource && alternateSource.isSourceMapped,
      "either selected or alternate source must be original"
    );
    return alternateSourceId;
  }
  if (position && client) {
    return getAlternateSourceIdForPositionSuspense(
      client,
      selectedSource,
      position,
      sourcesState.sourceDetails.entities
    );
  }
}

export function getSourcemapVisualizerURLSuspense(
  replayClient: ReplayClientInterface,
  recordingId: string | null,
  selectedSource: SourceDetails | null | undefined,
  selectedFrameId: PauseAndFrameId | null,
  sourcesState: SourcesState,
  position?: CursorPosition,
  client?: ReplayClientInterface
) {
  if (!recordingId || !selectedSource) {
    return null;
  }
  const sourceId = getSourceIdToVisualizeSuspense(
    replayClient,
    selectedSource,
    selectedFrameId,
    sourcesState,
    position,
    client
  );
  if (!sourceId) {
    return null;
  }

  let href = `/recording/${recordingId}/sourcemap/${sourceId}`;
  const dispatchUrl = new URL(location.href).searchParams.get("dispatch");
  if (dispatchUrl) {
    href += `?dispatch=${dispatchUrl}`;
  }

  return href;
}

interface AlternateSourceResult {
  sourceId?: SourceId;
  why?: "no-source" | "no-sourcemap" | "not-unique";
}

function getAlternateSourceIdFromSelectedFrameSuspense(
  replayClient: ReplayClientInterface,
  selectedSource: SourceDetails,
  selectedFrameId: PauseAndFrameId,
  sourcesState: SourcesState
) {
  const selectedFrame = getPauseFrameSuspense(replayClient, selectedFrameId, sourcesState);
  if (selectedFrame?.location.sourceId === selectedSource.id) {
    return selectedFrame.alternateLocation?.sourceId;
  }
}

// Get the ID of the only alternate source that can be switched to from the source with
// the given ID. This doesn't work for sources that are bundles or linked to bundles
// through sourcemaps, because in that case there may be multiple alternate sources.
// If no unique alternate source could be found, the reason ("no-sourcemap" or "not-unique")
// is returned.
function getUniqueAlternateSourceId(
  source: SourceDetails,
  sourcesById: Dictionary<SourceDetails>
): AlternateSourceResult {
  const nonPrettyPrintedSourceId = source.prettyPrintedFrom || source.id;
  assert(nonPrettyPrintedSourceId, "couldn't find minified version of pretty-printed source");
  const nonPrettyPrintedSource = sourcesById[nonPrettyPrintedSourceId];
  assert(nonPrettyPrintedSource, `couldn't find source ${nonPrettyPrintedSourceId}`);

  if (nonPrettyPrintedSource.kind === "sourceMapped") {
    const generatedSourceId = nonPrettyPrintedSource.generated[0];
    assert(generatedSourceId, "couldn't find generated version of sourcemapped source");
    const generatedSource = sourcesById[generatedSourceId];
    assert(generatedSource, `couldn't find source ${generatedSourceId}`);
    const sourceId = generatedSource.prettyPrinted || generatedSourceId;
    return { sourceId };
  }

  const sourcemappedSourceIds = nonPrettyPrintedSource.generatedFrom.filter(
    sourceId => sourcesById[sourceId]?.kind === "sourceMapped"
  );
  if (!sourcemappedSourceIds.length) {
    return { why: "no-sourcemap" };
  }
  if (sourcemappedSourceIds.length > 1) {
    return { why: "not-unique" };
  }

  let alternateSourceId = sourcemappedSourceIds[0];
  alternateSourceId = sourcesById[sourcemappedSourceIds[0]]?.prettyPrinted || alternateSourceId;
  const alternateSource = sourcesById[alternateSourceId];
  assert(alternateSource, `couldn't find source ${alternateSourceId}`);
  alternateSourceId = alternateSource.correspondingSourceIds[0];

  return { sourceId: alternateSourceId };
}

function getAlternateSourceIdForPositionSuspense(
  client: ReplayClientInterface,
  source: SourceDetails,
  position: CursorPosition,
  sourcesById: Dictionary<SourceDetails>
) {
  const [startLine, endLine] = bucketBreakpointLines(position.line, position.line);
  const breakablePositions = breakpointPositionsIntervalCache.read(
    startLine,
    endLine,
    client,
    source.id
  );

  // We want to find the first breakable line starting from the given cursor location,
  // so that we can translate that position into an alternate mapped location.
  let firstBreakableLineAfterPosition = breakablePositions.find(bp => bp.line > position.line);

  if (!firstBreakableLineAfterPosition) {
    return undefined;
  }

  // Now we can ask the backend for alternate locations with that line.
  let breakableColumn = firstBreakableLineAfterPosition.columns[0];

  const mappedLocation = mappedLocationCache.read(client, {
    sourceId: source.id,
    line: firstBreakableLineAfterPosition.line,
    column: breakableColumn,
  });
  return source.isSourceMapped
    ? getBestNonSourceMappedSourceId(
        sourcesById,
        mappedLocation.map(loc => loc.sourceId)
      )
    : getBestSourceMappedSourceId(
        sourcesById,
        mappedLocation.map(loc => loc.sourceId)
      );
}

export function getAlternateSourceIdSuspense(
  client: ReplayClientInterface,
  selectedSource: SourceDetails | null | undefined,
  selectedFrameId: PauseAndFrameId | null,
  position: CursorPosition,
  sourcesState: SourcesState
): AlternateSourceResult {
  if (!selectedSource) {
    return { why: "no-source" };
  }

  let alternateSourceId = selectedFrameId
    ? getAlternateSourceIdFromSelectedFrameSuspense(
        client,
        selectedSource,
        selectedFrameId,
        sourcesState
      )
    : undefined;
  if (alternateSourceId) {
    return { sourceId: alternateSourceId };
  }

  const uniqueAlternate = getUniqueAlternateSourceId(
    selectedSource,
    sourcesState.sourceDetails.entities
  );
  if (uniqueAlternate.sourceId || uniqueAlternate.why === "no-sourcemap") {
    return uniqueAlternate;
  }

  alternateSourceId = getAlternateSourceIdForPositionSuspense(
    client,
    selectedSource,
    position,
    sourcesState.sourceDetails.entities
  );
  if (alternateSourceId) {
    return { sourceId: alternateSourceId };
  }

  return { why: "not-unique" };
}
