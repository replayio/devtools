import type { SourceId } from "@replayio/protocol";
import sortBy from "lodash/sortBy";
import { ThreadFront } from "protocol/thread";
import { assert } from "protocol/utils";

import type { Source } from "../reducers/sources";

import { isNodeModule, isBowerComponent } from "./source";

export function getSourceIDsToSearch(
  sourcesById: Record<string, Source>,
  includeNodeModules: boolean = false
) {
  const sourceIds = [];
  for (const sourceId in sourcesById) {
    if (ThreadFront.isMinifiedSource(sourceId)) {
      continue;
    }
    const correspondingSourceId = ThreadFront.getCorrespondingSourceIds(sourceId)[0];
    if (correspondingSourceId !== sourceId) {
      continue;
    }
    const source = sourcesById[sourceId];
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
    return [source.isOriginal ? 0 : 1, source.url];
  });
}

function getSourceToVisualize(selectedSource: Source, alternateSource: Source) {
  if (!selectedSource) {
    return undefined;
  }
  if (selectedSource.isOriginal) {
    return selectedSource.id;
  }
  if (alternateSource?.isOriginal) {
    return alternateSource.id;
  }
  const { sourceId } = getUniqueAlternateSourceId(selectedSource.id);
  return sourceId;
}

export function getSourcemapVisualizerURL(
  selectedSource: Source,
  alternateSource: Source
): string | null {
  const sourceId = getSourceToVisualize(selectedSource, alternateSource);
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

// Get the ID of the only alternate source that can be switched to from the source with
// the given ID. This doesn't work for sources that are bundles or linked to bundles
// through sourcemaps, because in that case there may be multiple alternate sources.
// If no unique alternate source could be found, the reason ("no-sourcemap" or "not-unique")
// is returned.
export function getUniqueAlternateSourceId(sourceId: string): {
  sourceId?: SourceId;
  why?: "no-sourcemap" | "not-unique";
} {
  const generatedSourceIds = ThreadFront.getGeneratedSourceIds(sourceId);
  const nonPrettyPrintedSourceId =
    ThreadFront.getSourceKind(sourceId) === "prettyPrinted" ? generatedSourceIds?.[0] : sourceId;
  assert(nonPrettyPrintedSourceId, "couldn't find minified version of pretty-printed source");

  if (ThreadFront.getSourceKind(nonPrettyPrintedSourceId) === "sourceMapped") {
    const generatedSourceId = ThreadFront.getGeneratedSourceIds(nonPrettyPrintedSourceId)?.[0];
    assert(generatedSourceId, "couldn't find generated version of sourcemapped source");
    const sourceId = ThreadFront.getPrettyPrintedSourceId(generatedSourceId) || generatedSourceId;
    return { sourceId };
  }

  const sourcemappedSourceIds = ThreadFront.getOriginalSourceIds(nonPrettyPrintedSourceId)?.filter(
    sourceId => ThreadFront.getSourceKind(sourceId) === "sourceMapped"
  );
  if (!sourcemappedSourceIds?.length) {
    return { why: "no-sourcemap" };
  }
  if (sourcemappedSourceIds.length > 1) {
    return { why: "not-unique" };
  }

  let alternateSourceId = sourcemappedSourceIds[0];
  alternateSourceId = ThreadFront.getPrettyPrintedSourceId(alternateSourceId) || alternateSourceId;
  alternateSourceId = ThreadFront.getCorrespondingSourceIds(alternateSourceId)[0];

  return { sourceId: alternateSourceId };
}
