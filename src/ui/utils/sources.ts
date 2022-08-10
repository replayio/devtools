import { EntityId } from "@reduxjs/toolkit";
import { newSource } from "@replayio/protocol";
import { ArrayMap, assert } from "protocol/utils";
import { SourceDetails } from "ui/reducers/sources";

export const newSourcesToCompleteSourceDetails = (
  newSources: newSource[]
): Record<EntityId, SourceDetails> => {
  const newSourcesById: Record<string, newSource> = {};
  const corresponding = new ArrayMap<string, string>();
  const original = new ArrayMap<string, string>();
  const prettyPrinted: Record<string, string> = {};

  // TODO @jcmorrow: remove this once we include the contentHash with prettyPrinted sources
  const contentHashForSource = (source: newSource) => {
    return source.kind === "prettyPrinted"
      ? newSourcesById[source.generatedSourceIds![0]].contentHash
      : source.contentHash;
  };
  const isSourceMapped = (source: newSource) => {
    return source.kind === "prettyPrinted"
      ? newSourcesById[source.generatedSourceIds![0]].kind === "sourceMapped"
      : source.kind === "sourceMapped";
  };

  const keyForSource = (source: newSource): string => {
    return `${source.kind}:${source.url!}:${contentHashForSource(source)}`;
  };

  for (let source of newSources) {
    newSourcesById[source.sourceId] = source;
  }
  for (let source of newSources) {
    corresponding.add(keyForSource(source), source.sourceId);
    for (const generatedSourceId of source.generatedSourceIds || []) {
      original.add(generatedSourceId, source.sourceId);
    }
    if (source.kind === "prettyPrinted") {
      assert(source.generatedSourceIds?.length === 1, "a pretty-printed source should have exactly one generated source");
      prettyPrinted[source.generatedSourceIds[0]] = source.sourceId;
    }
  }

  const returnValue: Record<EntityId, SourceDetails> = {};

  for (let source of newSources) {
    const { sourceId, generatedSourceIds, ...remainingFields } = source;
    returnValue[sourceId] = Object.assign(remainingFields, {
      contentHash: contentHashForSource(source),
      correspondingSourceIds: corresponding.map.get(keyForSource(source)) || [],
      id: sourceId,
      prettyPrinted: prettyPrinted[sourceId],
      prettyPrintedFrom: source.kind === "prettyPrinted" ? source.generatedSourceIds![0] : undefined,
      generated: source.generatedSourceIds || [],
      generatedFrom: original.map.get(sourceId) || [],
      isSourceMapped: isSourceMapped(source),
    });
  }

  return returnValue;
};
