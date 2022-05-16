import type { SourceId } from "@recordreplay/protocol";
import sortBy from "lodash/sortBy";
import { ThreadFront } from "protocol/thread";

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
  if (ThreadFront.getSourceKind(selectedSource.id) === "prettyPrinted") {
    // for pretty-printed sources we show the sourcemap of the non-pretty-printed version
    const nonPrettyPrintedSourceId = ThreadFront.getGeneratedSourceIds(selectedSource.id)?.[0];
    if (nonPrettyPrintedSourceId) {
      let hasSourceMap = ThreadFront.getSourceKind(nonPrettyPrintedSourceId) === "sourceMapped";
      if (!hasSourceMap) {
        const originalSourceIds = ThreadFront.getOriginalSourceIds(nonPrettyPrintedSourceId);
        // originalSourceIds always contains the id of the pretty-printed version
        hasSourceMap = originalSourceIds! && originalSourceIds.length > 1;
      }
      if (hasSourceMap) {
        return nonPrettyPrintedSourceId;
      }
    }
  } else if (ThreadFront.getOriginalSourceIds(selectedSource.id)?.length) {
    return selectedSource.id;
  }
  return undefined;
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
  if (!generatedSourceIds?.length) {
    return { why: "no-sourcemap" };
  }

  const alternateSourceIds = [...ThreadFront.getAlternateSourceIds(sourceId)].filter(
    sourceId => !ThreadFront.isMinifiedSource(sourceId)
  );
  if (alternateSourceIds.length > 2) {
    return { why: "not-unique" };
  }

  let alternateSourceId = alternateSourceIds.find(
    alternateSourceId => alternateSourceId !== sourceId
  );
  if (!alternateSourceId) {
    // the only alternate source is the minified version of the given source
    return { sourceId: generatedSourceIds[0] };
  }
  return { sourceId: alternateSourceId };
}
