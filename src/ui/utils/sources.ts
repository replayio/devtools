import { EntityId } from "@reduxjs/toolkit";
import { newSource, SourceKind } from "@replayio/protocol";
import { SourceDetails } from "ui/reducers/sources";
import newGraph from "./graph";

const fullSourceDetails = (
  attributes: Partial<SourceDetails> & {
    id: string;
    kind: SourceKind;
  }
): SourceDetails => {
  return Object.assign(
    {
      canonicalId: attributes.id,
      correspondingSourceIds: [],
      generated: [],
      generatedFrom: [],
    },
    attributes
  );
};

export const keyForSource = (source: newSource): string => {
  return `${source.url!}:${source.contentHash}`;
};

export const newSourcesToCompleteSourceDetails = (
  newSources: newSource[]
): Record<EntityId, SourceDetails> => {
  const prettyPrinted = newGraph();
  const canonical = newGraph();
  const corresponding: Record<string, string[]> = {};
  const newSourcesById: Record<string, newSource> = {};
  const byKind = {} as Record<SourceKind, newSource[]>;

  // Canonical links can go across multiple links
  const findCanonicalId = (id: string) => {
    let current = id;
    let nextNode = canonical.from(current)?.[0];

    while (nextNode && nextNode !== current) {
      current = nextNode;
      nextNode = canonical.from(current)?.[0];
    }

    return current;
  };

  const generated = newGraph();

  // We'll iterate through the whole list once, and perform three setup operations per source:
  // 1) Creating a normalized lookup table by source ID
  // 2) Grouping sources by kind
  // 3) Connected nodes based on generated source IDs
  for (let source of newSources) {
    // start by adding this source to the lookup table
    newSourcesById[source.sourceId] = source;

    // Also group by kind
    if (!byKind[source.kind]) {
      byKind[source.kind] = [];
    }

    byKind[source.kind].push(source);

    // We handle pretty-printed (pp) files and their generated links a little
    // differently. Because Replay makes the pp sources, their structure is
    // predictable. All pp sources will have one generatedSourceId, and it will
    // be the minified source.
    if (source.kind === "prettyPrinted") {
      continue;
    }

    for (let generatedId of source.generatedSourceIds || []) {
      // source.generatedSourceIds?.map(generatedId => {
      generated.connectNode(source.sourceId, generatedId);
    }
  }

  // Sources are processed by kind

  const inlineScripts = byKind["inlineScript"] || [];
  for (let source of inlineScripts) {
    canonical.connectNode(source.sourceId, generated.to(source.sourceId)![0]);
  }

  const sourceMapped = byKind["sourceMapped"] || [];
  for (let source of sourceMapped) {
    canonical.connectNode(generated.from(source.sourceId)![0], source.sourceId);
  }

  // TODO @jcmorrow: remove this once we include the contentHash with prettyPrinted sources
  const contentHashForSource = (source: newSource) => {
    return source.kind === "prettyPrinted"
      ? newSourcesById[source.generatedSourceIds![0]].contentHash
      : source.contentHash;
  };

  const keyForSource = (source: newSource): string => {
    return `${source.kind}:${source.url!}:${contentHashForSource(source)}`;
  };

  for (let source of newSources) {
    const key = keyForSource(source);
    if (corresponding[key] === undefined) {
      corresponding[key] = [];
    }
    corresponding[key].push(source.sourceId);
  }

  const returnValue: Record<EntityId, SourceDetails> = {};

  const prettyPrintedSources = byKind["prettyPrinted"] || [];

  for (let source of prettyPrintedSources) {
    const nonPrettyPrintedVersionId = source.generatedSourceIds![0];
    prettyPrinted.connectNode(nonPrettyPrintedVersionId, source.sourceId);
    canonical.connectNode(source.sourceId, nonPrettyPrintedVersionId);
  }

  for (let source of newSources) {
    const { sourceId, generatedSourceIds, ...remainingFields } = source;

    returnValue[sourceId] = fullSourceDetails(
      Object.assign(remainingFields, {
        contentHash: contentHashForSource(source),
        correspondingSourceIds: corresponding[keyForSource(source)],
        id: sourceId,
        prettyPrinted: prettyPrinted.from(sourceId)?.[0],
        prettyPrintedFrom: prettyPrinted.to(source.sourceId)?.[0],
        generated: generated.from(sourceId) || [],
        generatedFrom: generated.to(sourceId) || [],
        canonicalId: findCanonicalId(sourceId),
      })
    );
  }

  return returnValue;
};
