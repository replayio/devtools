import {
  EntityId,
  EntityState,
  createEntityAdapter,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";
import { SourceKind, newSource } from "@replayio/protocol";
import groupBy from "lodash/groupBy";
import keyBy from "lodash/keyBy";
import omit from "lodash/omit";

import { api } from "../../app/api";
import type { AppState } from "../../app/store";

export interface SourceDetails {
  canonicalId: string;
  correspondingSourceIds: string[];
  generated: string[];
  generatedFrom: string[];
  id: string;
  kind: SourceKind;
  contentHash?: string;
  prettyPrinted?: string;
  prettyPrintedFrom?: string;
  url?: string;
}

const sourceDetailsAdapter = createEntityAdapter<SourceDetails>();
const sourcesAdapter = createEntityAdapter<newSource>({ selectId: source => source.sourceId });
const sourceSelectors = sourcesAdapter.getSelectors();

export interface SourcesState {
  sourceDetails: EntityState<SourceDetails>;
  sources: EntityState<newSource>;
}

export type SourceDetailsEntities = SourcesState["sourceDetails"]["entities"];

const initialState: SourcesState = {
  sourceDetails: sourceDetailsAdapter.getInitialState(),
  sources: sourcesAdapter.getInitialState(),
};

const sourcesSlice = createSlice({
  name: "sources",
  initialState,
  reducers: {
    /*
    addSources: (state, action: PayloadAction<newSource[]>) => {
      // Store the raw protocol information. Once we have recieved all sources
      // we will run over this and build it into the shape we want.
      sourcesAdapter.addMany(state.sources, action.payload);
    },
    allSourcesReceived: state => {
      sourceDetailsAdapter.addMany(
        state.sourceDetails,
        newSourcesToCompleteSourceDetails(sourceSelectors.selectAll(state.sources))
      );
    },
    */
  },
  extraReducers: builder => {
    // Technically this could just be a `createReducer` now, but oh well
    builder.addMatcher(api.endpoints.getSources.matchFulfilled, (state, action) => {
      // TODO We really don't even need this if it's in RTKQ already
      // and we're processing them all at once instead of trickling in
      sourcesAdapter.addMany(state.sources, action.payload);

      sourceDetailsAdapter.addMany(
        state.sourceDetails,
        newSourcesToCompleteSourceDetails(sourceSelectors.selectAll(state.sources))
      );
    });
  },
});

export default sourcesSlice.reducer;

export const getSelectedSourceDetails = createSelector(
  (state: AppState) => state.sources.sourceDetails,
  (state: AppState) => state.selectedSources.selectedSourceId,
  (sourceDetails, id) => {
    if (id === null || id === undefined) {
      return null;
    }

    return sourceDetails.entities[id];
  }
);

export const { selectAll: openSourceDetails, selectEntities: openSourceDetailsEntities } =
  sourceDetailsAdapter.getSelectors((state: AppState) => state.sources.sourceDetails);

export const selectCanonicalSourceName = (
  detailsEntities: EntityState<SourceDetails>["entities"],
  sourceId: string
) => {
  const initialDetails = detailsEntities[sourceId];
  if (initialDetails) {
    const canonicalDetails = detailsEntities[initialDetails.canonicalId];
    return canonicalDetails?.url;
  }
};

export const selectLikelyAppOriginalSources = createSelector(
  openSourceDetails,
  sourceDetails => {}
);

export interface Graph {
  addNode(node: string): void;
  connectNode(from: string, to: string): void;
  from: (node: string) => string[];
  to: (node: string) => string[];
}

const newGraph = (): Graph & { inspect: () => string } => {
  const incoming: Record<string, string[]> = {};
  const outgoing: Record<string, string[]> = {};

  const addNode = (node: string) => {
    incoming[node] = incoming[node] || [];
    outgoing[node] = outgoing[node] || [];
  };

  const connectNode = (from: string, to: string) => {
    addNode(from);
    addNode(to);
    outgoing[from].push(to);
    incoming[to].push(from);
  };

  const inspect = () => {
    return JSON.stringify({ outgoing, incoming }, null, 2);
  };

  return {
    from: (node: string) => outgoing[node],
    to: (node: string) => incoming[node],
    addNode,
    connectNode,
    inspect,
  };
};

const fullSourceDetails = (
  attributes: Partial<SourceDetails> & {
    id: string;
    kind: SourceKind;
  }
): SourceDetails => {
  return {
    canonicalId: attributes.id,
    correspondingSourceIds: [],
    generated: [],
    generatedFrom: [],
    ...attributes,
  };
};

export const newSourcesToCompleteSourceDetails = (
  newSources: newSource[]
): Record<EntityId, SourceDetails> => {
  const newSourcesById = keyBy(newSources, s => s.sourceId);
  const prettyPrinted = newGraph();
  const canonical = newGraph();
  const corresponding: Record<string, string[]> = {};

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
  newSources.forEach((source: newSource) => {
    // We handle pretty-printed (pp) files and their generated links a little
    // differently. Because Replay makes the pp sources, their structure is
    // predictable. All pp sources will have one generatedSourceId, and it will
    // be the minified source.
    if (source.kind === "prettyPrinted") {
      return;
    }

    source.generatedSourceIds?.map(generatedId => {
      generated.connectNode(source.sourceId, generatedId);
    });
  });

  // Sources are processed by kind. So first we go through the whole list once
  // just to group things properly.
  const byKind = groupBy(newSources, source => source.kind);

  const inlineScripts = byKind["inlineScript"] || [];
  inlineScripts.forEach(source => {
    canonical.connectNode(source.sourceId, generated.to(source.sourceId)![0]);
  });

  const sourceMapped = byKind["sourceMapped"] || [];
  sourceMapped.forEach(source => {
    canonical.connectNode(generated.from(source.sourceId)![0], source.sourceId);
  });

  const prettyPrintedSources = byKind["prettyPrinted"] || [];
  prettyPrintedSources.forEach(source => {
    const nonPrettyPrintedVersionId = source.generatedSourceIds![0];
    prettyPrinted.connectNode(nonPrettyPrintedVersionId, source.sourceId);
    canonical.connectNode(source.sourceId, nonPrettyPrintedVersionId);
  });

  // TODO @jcmorrow: remove this once we include the contentHash with prettyPrinted sources
  const contentHashForSource = (source: newSource) => {
    return source.kind === "prettyPrinted"
      ? newSourcesById[source.generatedSourceIds![0]].contentHash
      : source.contentHash;
  };

  const keyForSource = (source: newSource): string => {
    return `${source.kind}:${source.url!}:${contentHashForSource(source)}`;
  };

  // We have to do the corresponding linkage *after* handling pretty-printed
  // sources because they are missing a content hash when we get them from the
  // protocol and we mutate them to include it up above.
  newSources.forEach(source => {
    const key = keyForSource(source);
    if (corresponding[key] === undefined) {
      corresponding[key] = [];
    }
    corresponding[key].push(source.sourceId);
  });

  const returnValue: Record<EntityId, SourceDetails> = {};
  newSources.forEach(source => {
    returnValue[source.sourceId] = fullSourceDetails({
      ...omit(source, "sourceId", "generatedSourceIds"),
      contentHash: contentHashForSource(source),
      correspondingSourceIds: corresponding[keyForSource(source)],
      id: source.sourceId,
      prettyPrinted: prettyPrinted.from(source.sourceId)?.[0],
      prettyPrintedFrom: prettyPrinted.to(source.sourceId)?.[0],
      generated: generated.from(source.sourceId) || [],
      generatedFrom: generated.to(source.sourceId) || [],
      canonicalId: findCanonicalId(source.sourceId),
    });
  });

  return returnValue;
};
