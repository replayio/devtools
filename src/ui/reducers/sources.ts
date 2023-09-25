import {
  Dictionary,
  EntityState,
  PayloadAction,
  createEntityAdapter,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";
import { MappedLocation } from "@replayio/protocol";

import type { PartialLocation } from "devtools/client/debugger/src/actions/sources";
import { assert } from "protocol/utils";
import { Source } from "replay-next/src/suspense/SourcesCache";
import { UIState } from "ui/state";

export type SourceDetails = Source;

/**
 * Both `Source` and `SourceDetails` have `{id, url?}`,
 * and we usually only need those fields in string manipulation functions.
 */
export interface MiniSource {
  id: string;
  url?: string;
}

export const sourceDetailsAdapter = createEntityAdapter<SourceDetails>();

export const {
  selectAll: getAllSourceDetails,
  selectById: getSourceDetails,
  selectEntities: getSourceDetailsEntities,
  selectTotal: getSourceDetailsCount,
} = sourceDetailsAdapter.getSelectors((state: UIState) => state.sources.sourceDetails);

export interface SourcesState {
  allSourcesReceived: boolean;
  sourceDetails: EntityState<SourceDetails>;
  selectedLocation: PartialLocation | null;
  selectedLocationHistory: PartialLocation[];
  selectedLocationHasScrolled: boolean;
  persistedSelectedLocation: PartialLocation | null;
  sourcesByUrl: Record<string, string[]>;
  preferredGeneratedSources: string[];
  sourcesUserActionPending: boolean;
}

export const initialState: SourcesState = {
  allSourcesReceived: false,
  sourceDetails: sourceDetailsAdapter.getInitialState(),
  selectedLocation: null,
  selectedLocationHistory: [],
  selectedLocationHasScrolled: false,
  // Persisted value will be applied in ui/setup/index.ts as part of store setup
  persistedSelectedLocation: null,
  sourcesByUrl: {},
  preferredGeneratedSources: [],
  sourcesUserActionPending: false,
};

const sourcesSlice = createSlice({
  name: "sources",
  initialState,
  reducers: {
    allSourcesReceived: (state, action: PayloadAction<SourceDetails[]>) => {
      const sources = action.payload;
      state.allSourcesReceived = true;

      sourceDetailsAdapter.addMany(state.sourceDetails, sources);

      const sourcesByUrl: Record<string, string[]> = {};

      for (let source of sources) {
        if (!source.url) {
          continue;
        }

        if (!sourcesByUrl[source.url]) {
          sourcesByUrl[source.url] = [];
        }
        sourcesByUrl[source.url].push(source.sourceId);
      }
      state.sourcesByUrl = sourcesByUrl;
    },
    locationSelected: (
      state,
      action: PayloadAction<{ location: PartialLocation; source: SourceDetails }>
    ) => {
      // Source is used by the tabs reducer
      const { location } = action.payload;
      state.selectedLocationHasScrolled = false;
      state.selectedLocation = location;
      state.selectedLocationHistory.unshift(location);
      state.persistedSelectedLocation = location;
    },
    clearSelectedLocation: state => {
      state.selectedLocationHasScrolled = false;
      state.selectedLocation = null;
      state.persistedSelectedLocation = null;
    },
    preferSource: (state, action: PayloadAction<{ sourceId: string; preferred: boolean }>) => {
      if (action.payload.preferred) {
        if (!state.preferredGeneratedSources.includes(action.payload.sourceId)) {
          state.preferredGeneratedSources.push(action.payload.sourceId);
        }
      } else {
        if (state.preferredGeneratedSources.includes(action.payload.sourceId)) {
          state.preferredGeneratedSources = state.preferredGeneratedSources.filter(
            sourceId => sourceId !== action.payload.sourceId
          );
        }
      }
    },
    setSourcesUserActionPending: (state, action: PayloadAction<boolean>) => {
      state.sourcesUserActionPending = action.payload;
    },
  },
  extraReducers: builder => {
    builder.addCase("debuggerUI/setViewport", state => {
      state.selectedLocationHasScrolled = true;
    });
  },
});

export const {
  allSourcesReceived,
  clearSelectedLocation,
  locationSelected,
  preferSource,
  setSourcesUserActionPending,
} = sourcesSlice.actions;

export const getSourcesLoading = (state: UIState) => !state.sources.allSourcesReceived;

export const getSelectedLocation = (state: UIState) => state.sources.selectedLocation;

export const getSelectedSourceId = (state: UIState) => {
  const location = getSelectedLocation(state);
  return location?.sourceId;
};
export const getSelectedSource = (state: UIState) => {
  const selectedSourceId = getSelectedSourceId(state);
  return selectedSourceId ? getSourceDetails(state, selectedSourceId) : null;
};
export const getCorrespondingSourceIdsFromSourcesState = (sources: SourcesState, id: string) => {
  const source = sources.sourceDetails.entities[id];
  // TODO [hbenl] disabled for now because the sources we receive from the backend
  // are incomplete for node recordings, see RUN-508
  // assert(source, `unknown source ${id}`);
  return source?.correspondingSourceIds || [id];
};

export const getSelectedLocationHasScrolled = (state: UIState) =>
  state.sources.selectedLocationHasScrolled;

export function getBestSourceMappedSourceId(
  sourcesById: Dictionary<SourceDetails>,
  sourceIds: string[]
) {
  const sourceIdSet = new Set(sourceIds);
  return sourceIds.find(sourceId => {
    const source = sourcesById[sourceId];
    assert(source, `unknown source ${sourceId}`);
    return (
      source.isSourceMapped && !source.generatedFrom.some(originalId => sourceIdSet.has(originalId))
    );
  });
}

export function getBestNonSourceMappedSourceId(
  sourcesById: Dictionary<SourceDetails>,
  sourceIds: string[]
) {
  const sourceIdSet = new Set(sourceIds);
  return sourceIds.find(sourceId => {
    const source = sourcesById[sourceId];
    assert(source, `unknown source ${sourceId}`);
    return (
      !source.isSourceMapped &&
      !source.generatedFrom.some(originalId => sourceIdSet.has(originalId))
    );
  });
}

export function getPreferredSourceId(
  sourcesById: Dictionary<SourceDetails>,
  sourceIds: string[],
  preferredGeneratedSources?: string[]
) {
  const sourceMappedId = getBestSourceMappedSourceId(sourcesById, sourceIds);
  const nonSourceMappedId = getBestNonSourceMappedSourceId(sourcesById, sourceIds);
  if (!sourceMappedId) {
    return nonSourceMappedId;
  }
  if (!nonSourceMappedId) {
    return sourceMappedId;
  }
  if (preferredGeneratedSources?.includes(nonSourceMappedId)) {
    return nonSourceMappedId;
  }
  return sourceMappedId;
}

// Given an RRP MappedLocation array with locations in different sources
// representing the same generated location (i.e. a generated location plus
// all the corresponding locations in original or pretty printed sources etc.),
// choose the location which we should be using within the devtools. Normally
// this is the most original location, except when preferSource has been used
// to prefer a generated source instead.
export function getPreferredLocation(sources: SourcesState, locations: MappedLocation) {
  if (!sources.allSourcesReceived) {
    return locations[0];
  }
  const sourceId = getPreferredSourceId(
    sources.sourceDetails.entities,
    locations.map(l => l.sourceId),
    sources.preferredGeneratedSources
  );
  const preferredLocation = locations.find(l => l.sourceId == sourceId);
  assert(preferredLocation, "no preferred location found");

  const correspondingSources = getCorrespondingSourceIdsFromSourcesState(
    sources,
    preferredLocation.sourceId
  );
  const assertion = preferredLocation.sourceId === correspondingSources[0];

  assert(
    assertion,
    `location.sourceId should be updated to the first corresponding sourceId: ${JSON.stringify({
      preferredLocation,
      correspondingSources,
    })}`
  );
  return preferredLocation;
}

export function getAlternateSourceId(
  sourcesById: Dictionary<SourceDetails>,
  sourceIds: string[],
  preferredGeneratedSources?: string[]
) {
  const sourceMappedId = getBestSourceMappedSourceId(sourcesById, sourceIds);
  const nonSourceMappedId = getBestNonSourceMappedSourceId(sourcesById, sourceIds);
  if (!sourceMappedId || !nonSourceMappedId) {
    return;
  }
  if (preferredGeneratedSources?.includes(nonSourceMappedId)) {
    return sourceMappedId;
  }
  return nonSourceMappedId;
}

export function getAlternateLocation(sources: SourcesState, locations: MappedLocation) {
  const alternateId = getAlternateSourceId(
    sources.sourceDetails.entities,
    locations.map(l => l.sourceId),
    sources.preferredGeneratedSources
  );
  if (alternateId) {
    return locations.find(l => l.sourceId == alternateId);
  }
  return null;
}

export function getSourceIdsByUrl(state: UIState) {
  return state.sources.sourcesByUrl;
}

export const getSourcesToDisplayByUrl = createSelector(
  [getSourceIdsByUrl, getSourceDetailsEntities],
  (sourceIdsByUrl, sourceDetailsById) => {
    const sourcesToDisplay: Dictionary<SourceDetails> = {};
    for (const url in sourceIdsByUrl) {
      if (sourcesToDisplay[url]) {
        continue;
      }
      let sourceId = getPreferredSourceId(sourceDetailsById, sourceIdsByUrl[url])!;
      sourceId = sourceDetailsById[sourceId]!.correspondingSourceIds[0];
      sourcesToDisplay[url] = sourceDetailsById[sourceId];
    }
    return sourcesToDisplay;
  }
);

export const getPreviousPersistedLocation = (state: UIState) =>
  state.sources.persistedSelectedLocation;

export const getPreferredGeneratedSources = (state: UIState) =>
  state.sources.preferredGeneratedSources;

export const getSourcesUserActionPending = (state: UIState) =>
  state.sources.sourcesUserActionPending;

export const selectors = {
  getSourceDetails,
  getSourceDetailsEntities,
  getSourceDetailsCount,
  getSourcesLoading,
  getSelectedLocation,
  getSelectedSourceId,
  getSelectedSource,
  getSelectedLocationHasScrolled,
  getPreviousPersistedLocation,
  getSourceIdsByUrl,
  getSourcesToDisplayByUrl,
  getPreferredGeneratedSources,
  getSourcesUserActionPending,
};

export default sourcesSlice.reducer;
