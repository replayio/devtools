import { Dictionary } from "@reduxjs/toolkit";
import type { SourceId } from "@replayio/protocol";
import sortBy from "lodash/sortBy";

import { getMappedLocationSuspense } from "bvaughn-architecture-demo/src/suspense/MappedLocationCache";
import { getBreakpointPositionsSuspense } from "bvaughn-architecture-demo/src/suspense/SourcesCache";
import { ThreadFront } from "protocol/thread";
import { assert } from "protocol/utils";
import { ReplayClientInterface } from "shared/client/types";
import {
  SourceDetails,
  SourcesState,
  getBestNonSourceMappedSourceId,
  getBestSourceMappedSourceId,
  isOriginalSource,
} from "ui/reducers/sources";
import { getPauseFrameSuspense } from "ui/suspense/frameCache";

import { CursorPosition } from "../components/Editor/Footer";
import { PauseAndFrameId } from "../reducers/pause";
import { isBowerComponent, isNodeModule } from "./source";

export function getSourceIDsToSearch(
  sourcesById: Record<string, SourceDetails>,
  includeNodeModules: boolean = false
) {
  const sourceIds = [];
  for (const sourceId in sourcesById) {
    const source = sourcesById[sourceId];
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
    const source = sourcesById[sourceId];
    const isOriginal = isOriginalSource(source);
    return [isOriginal ? 0 : 1, source.url];
  });
}

function getSourceIdToVisualizeSuspense(
  selectedSource: SourceDetails | null | undefined,
  selectedFrameId: PauseAndFrameId | null,
  sourcesState: SourcesState,
  position?: CursorPosition,
  client?: ReplayClientInterface
) {
  if (!selectedSource) {
    return undefined;
  }
  if (isOriginalSource(selectedSource)) {
    return selectedSource.id;
  }

  let alternateSourceId = selectedFrameId
    ? getAlternateSourceIdFromSelectedFrameSuspense(selectedSource, selectedFrameId, sourcesState)
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
      alternateSource && isOriginalSource(alternateSource),
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
  selectedSource: SourceDetails | null | undefined,
  selectedFrameId: PauseAndFrameId | null,
  sourcesState: SourcesState,
  position?: CursorPosition,
  client?: ReplayClientInterface
) {
  if (!selectedSource) {
    return null;
  }
  const sourceId = getSourceIdToVisualizeSuspense(
    selectedSource,
    selectedFrameId,
    sourcesState,
    position,
    client
  );
  if (!sourceId) {
    return null;
  }

  let href = `/recording/${ThreadFront.recordingId}/sourcemap/${sourceId}`;
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
  selectedSource: SourceDetails,
  selectedFrameId: PauseAndFrameId,
  sourcesState: SourcesState
) {
  const selectedFrame = getPauseFrameSuspense(selectedFrameId, sourcesState);
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
  const [breakablePositions, breakablePositionsByLine] = getBreakpointPositionsSuspense(
    client,
    source.id
  );

  // We want to find the first breakable line starting from the given cursor location,
  // so that we can translate that position into an alternate mapped location.
  let firstBreakableLineAfterPosition: number | null = null;

  // Grab the last line off the array. It's possible there might _not_ be any breakable lines.
  const [lastBreakableLine] = breakablePositions.slice(-1);

  // We have a Map with line numbers as keys. Rather than check the entire array,
  // start from the position's line and check succeeding line numbers to find the
  // next line number that has a breakable position.
  for (let lineToCheck = position.line; lineToCheck <= lastBreakableLine?.line; lineToCheck++) {
    if (breakablePositionsByLine.has(lineToCheck)) {
      firstBreakableLineAfterPosition = lineToCheck;
      break;
    }
  }

  if (firstBreakableLineAfterPosition === null) {
    return undefined;
  }

  const breakableLineLocations = breakablePositionsByLine.get(firstBreakableLineAfterPosition)!;

  // Now we can ask the backend for alternate locations with that line.
  let breakableColumn = breakableLineLocations.columns[0];

  const mappedLocation = getMappedLocationSuspense(client, {
    sourceId: source.id,
    line: breakableLineLocations.line,
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
    ? getAlternateSourceIdFromSelectedFrameSuspense(selectedSource, selectedFrameId, sourcesState)
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
