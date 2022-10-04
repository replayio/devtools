import { Dictionary } from "@reduxjs/toolkit";
import type { SourceId } from "@replayio/protocol";
import sortBy from "lodash/sortBy";
import { ThreadFront } from "protocol/thread";
import { assert } from "protocol/utils";
import { ReplayClientInterface } from "shared/client/types";
import { getMappedLocationSuspense } from "bvaughn-architecture-demo/src/suspense/MappedLocationCache";
import { getBreakpointPositionsSuspense } from "bvaughn-architecture-demo/src/suspense/SourcesCache";
import {
  SourceDetails,
  isOriginalSource,
  getBestNonSourceMappedSourceId,
  getBestSourceMappedSourceId,
} from "ui/reducers/sources";
import { CursorPosition } from "../components/Editor/Footer";

import { isNodeModule, isBowerComponent } from "./source";

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

function getSourceToVisualize(
  selectedSource: SourceDetails | null | undefined,
  alternateSource: SourceDetails | null | undefined,
  sourcesById: Dictionary<SourceDetails>,
  position?: CursorPosition,
  client?: ReplayClientInterface
) {
  if (!selectedSource) {
    return undefined;
  }
  if (isOriginalSource(selectedSource)) {
    return selectedSource.id;
  }
  if (!alternateSource) {
    const alternateSourceId = getUniqueAlternateSourceId(selectedSource, sourcesById).sourceId;
    if (alternateSourceId) {
      alternateSource = sourcesById[alternateSourceId];
    }
  }
  if (alternateSource) {
    assert(
      isOriginalSource(alternateSource),
      "either selected or alternate source must be original"
    );
    return alternateSource.id;
  }
  if (position && client) {
    return getAlternateSourceIdForPosition(client, selectedSource, position, sourcesById);
  }
}

export function getSourcemapVisualizerURL(
  selectedSource: SourceDetails | null | undefined,
  alternateSource: SourceDetails | null | undefined,
  sourcesById: Dictionary<SourceDetails>,
  position?: CursorPosition,
  client?: ReplayClientInterface
) {
  if (!selectedSource) {
    return null;
  }
  const sourceId = getSourceToVisualize(
    selectedSource,
    alternateSource,
    sourcesById,
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

function min(arr: number[]) {
  if (arr.length === 0) {
    return Infinity;
  }
  let lowest = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < lowest) {
      lowest = arr[i];
    }
  }
  return lowest;
}

function getAlternateSourceIdForPosition(
  client: ReplayClientInterface,
  source: SourceDetails,
  position: CursorPosition,
  sourcesById: Dictionary<SourceDetails>
) {
  const lineLocations = getBreakpointPositionsSuspense(client, source.id, null);
  const breakableLine = min(
    lineLocations.filter(ll => ll.line >= position.line).map(ll => ll.line)
  );

  const breakableLineLocations = lineLocations.find(ll => ll.line === breakableLine);
  if (!breakableLineLocations) {
    return undefined;
  }

  let breakableColumn = breakableLineLocations.columns[0];
  const mappedLocation = getMappedLocationSuspense(client, {
    sourceId: source.id,
    line: breakableLine,
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

export function getAlternateSourceId(
  client: ReplayClientInterface,
  selectedSource: SourceDetails | null | undefined,
  alternateSource: SourceDetails | null | undefined,
  sourcesById: Dictionary<SourceDetails>,
  position: CursorPosition
): AlternateSourceResult {
  if (alternateSource) {
    return { sourceId: alternateSource.id };
  }
  if (!selectedSource) {
    return { why: "no-source" };
  }

  const uniqueAlternate = getUniqueAlternateSourceId(selectedSource, sourcesById);
  if (uniqueAlternate.sourceId || uniqueAlternate.why === "no-sourcemap") {
    return uniqueAlternate;
  }

  const alternateSourceId = getAlternateSourceIdForPosition(
    client,
    selectedSource,
    position,
    sourcesById
  );
  if (alternateSourceId) {
    return { sourceId: alternateSourceId };
  }

  return { why: "not-unique" };
}
