import {
  Dictionary,
  EntityState,
  PayloadAction,
  createEntityAdapter,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";
import { Location, MappedLocation, SourceKind, newSource } from "@replayio/protocol";

import type { PartialLocation } from "devtools/client/debugger/src/actions/sources";
import { parser } from "devtools/client/debugger/src/utils/bootstrap";
import { getTextAtPosition } from "devtools/client/debugger/src/utils/source";
import { assert } from "protocol/utils";
import { preCacheSources } from "replay-next/src/suspense/SourcesCache";
import { getStreamingSourceContentsHelper } from "replay-next/src/suspense/SourcesCache";
import { UIThunkAction } from "ui/actions";
import { listenForCondition } from "ui/setup/listenerMiddleware";
import { UIState } from "ui/state";
import { LoadingStatus } from "ui/utils/LoadingStatus";
import { newSourcesToCompleteSourceDetails } from "ui/utils/sources";

export interface SourceDetails {
  isSourceMapped: boolean;
  contentHash?: string;
  correspondingSourceIds: string[];
  generated: string[];
  generatedFrom: string[];
  id: string;
  kind: SourceKind;
  prettyPrinted?: string;
  prettyPrintedFrom?: string;
  url?: string;
  // TODO stableId: string;
}

/**
 * Both `Source` and `SourceDetails` have `{id, url?}`,
 * and we usually only need those fields in string manipulation functions.
 */
export interface MiniSource {
  id: string;
  url?: string;
}

export interface SourceContentValue {
  contentType: string;
  type: string;
  value: string;
}

export interface SourceContent {
  id: string;
  status: LoadingStatus;
  value?: SourceContentValue;
}

const sourceDetailsAdapter = createEntityAdapter<SourceDetails>();
const contentsAdapter = createEntityAdapter<SourceContent>();

export const { selectById: getSourceContentsEntry } = contentsAdapter.getSelectors(
  (state: UIState) => state.sources.contents
);

export const {
  selectAll: getAllSourceDetails,
  selectById: getSourceDetails,
  selectEntities: getSourceDetailsEntities,
  selectTotal: getSourceDetailsCount,
} = sourceDetailsAdapter.getSelectors((state: UIState) => state.sources.sourceDetails);

export interface SourcesState {
  allSourcesReceived: boolean;
  sourceDetails: EntityState<SourceDetails>;
  contents: EntityState<SourceContent>;
  selectedLocation: PartialLocation | null;
  selectedLocationHistory: PartialLocation[];
  selectedLocationHasScrolled: boolean;
  persistedSelectedLocation: PartialLocation | null;
  sourcesByUrl: Record<string, string[]>;
  preferredGeneratedSources: string[];
}

export const initialState: SourcesState = {
  allSourcesReceived: false,
  sourceDetails: sourceDetailsAdapter.getInitialState(),
  contents: contentsAdapter.getInitialState(),
  selectedLocation: null,
  selectedLocationHistory: [],
  selectedLocationHasScrolled: false,
  // Persisted value will be applied in ui/setup/index.ts as part of store setup
  persistedSelectedLocation: null,
  sourcesByUrl: {},
  preferredGeneratedSources: [],
};

const sourcesSlice = createSlice({
  name: "sources",
  initialState,
  reducers: {
    allSourcesReceived: (state, action: PayloadAction<newSource[]>) => {
      const sources = action.payload;
      state.allSourcesReceived = true;

      sourceDetailsAdapter.addMany(state.sourceDetails, newSourcesToCompleteSourceDetails(sources));

      // The backend doesn't send the same source twice, nor should we request them twice (since it wastes bytes).
      // Pre-cache source data in the new Suspense cache then so that it can use it for e.g. displaying sources in the Console.
      //
      // TODO [bvaughn] Will the new console code need to add some step similar to newSourcesToCompleteSourceDetails() to map between generated and corresponding sources?
      preCacheSources(sources);

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
    sourceLoading: (state, action: PayloadAction<string>) => {
      contentsAdapter.upsertOne(state.contents, {
        id: action.payload,
        status: LoadingStatus.LOADING,
      });
    },
    sourceLoaded: (
      state,
      action: PayloadAction<{ sourceId: string; contents: string; contentType: string }>
    ) => {
      contentsAdapter.upsertOne(state.contents, {
        id: action.payload.sourceId,
        status: LoadingStatus.LOADED,
        value: {
          contentType: action.payload.contentType,
          value: action.payload.contents,
          type: action.payload.contentType.slice(0, action.payload.contentType.indexOf("/")),
        },
      });
    },
    sourceErrored: (state, action: PayloadAction<string>) => {
      const existing = state.contents.entities[action.payload];
      if (existing?.status === LoadingStatus.LOADED) {
        return;
      }

      contentsAdapter.upsertOne(state.contents, {
        id: action.payload,
        status: LoadingStatus.ERRORED,
      });
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
  sourceLoading,
  sourceLoaded,
  sourceErrored,
} = sourcesSlice.actions;

export const loadSourceText = (sourceId: string): UIThunkAction<Promise<void>> => {
  return async (dispatch, getState, { replayClient }) => {
    const existing = getSourceContentsEntry(getState(), sourceId);
    if (existing?.status === LoadingStatus.LOADING) {
      // in flight - resolve this thunk's promise when it completes
      // TODO Replace this with RTK Query!
      return dispatch(
        listenForCondition(() => {
          // Check the status of this source after every action
          const status = getSourceContentsEntry(getState(), sourceId)?.status;
          return status === LoadingStatus.LOADED;
        })
      );
    }
    if (existing?.status === LoadingStatus.LOADED) {
      return;
    }
    dispatch(sourceLoading(sourceId));

    try {
      const { resolver } = await getStreamingSourceContentsHelper(replayClient, sourceId);
      const { contents, contentType } = await resolver;

      parser.setSource(sourceId, {
        type: "text",
        value: contents,
        contentType,
      });

      dispatch(sourceLoaded({ contents: contents!, contentType: contentType!, sourceId }));
    } catch (e) {
      dispatch(sourceErrored(sourceId));
    }
  };
};

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
export const getSourcesById = (state: UIState, ids: string[]) => {
  return ids.map(id => getSourceDetails(state, id)!);
};
export const getCorrespondingSourceIds = (state: UIState, id: string) => {
  return getCorrespondingSourceIdsFromSourcesState(state.sources, id);
};
export const getCorrespondingSourceIdsFromSourcesState = (sources: SourcesState, id: string) => {
  const source = sources.sourceDetails.entities[id];
  // TODO [hbenl] disabled for now because the sources we receive from the backend
  // are incomplete for node recordings, see RUN-508
  // assert(source, `unknown source ${id}`);
  return source?.correspondingSourceIds || [id];
};
export const getSourceContent = (state: UIState, id: string) => {
  return state.sources.contents.entities[id];
};
export const getSelectedSourceWithContent = (state: UIState) => {
  const selectedSourceId = getSelectedSourceId(state);
  return selectedSourceId ? getSourceContent(state, selectedSourceId) : null;
};
export const getTextAtLocation = (state: UIState, location: Location) => {
  const content = getSourceContent(state, location.sourceId);
  if (!content) {
    return null;
  }
  return getTextAtPosition(content, location);
};

export const getSelectedLocationHasScrolled = (state: UIState) =>
  state.sources.selectedLocationHasScrolled;

// This is useful if you are displaying a bunch of sources and want them to
// ensure they all have unique names, even though some of them might have been
// loaded from the same URL. If that's the case, and either of the original URLs
// had a query string, then we will add that query string back.
export const getUniqueUrlForSource = (state: UIState, sourceId: string) => {
  const sourceDetails = getSourceDetails(state, sourceId);
  if (!sourceDetails || !sourceDetails.url) {
    return null;
  }
  if (state.sources.sourcesByUrl[sourceDetails.url].length > 1) {
    // I was going to put the query string back here...
    // But I'm not sure we're actually *removing* query strings in the first
    // place yet!
    // TODO @jcmorrow - actually remove query strings, then add them back here.
    const queryString = "";
    return sourceDetails.url + queryString;
  } else {
    return sourceDetails.url;
  }
};

export const getSourceContentsLoaded = (state: UIState, sourceId: string) => {
  const entry = getSourceContentsEntry(state, sourceId);
  return entry && isFulfilled(entry);
};

export const isFulfilled = (item?: { status: LoadingStatus }) => {
  return item?.status === LoadingStatus.LOADED;
};

export const isOriginalSource = (sd: SourceDetails) => {
  return sd.isSourceMapped;
};

export const isPrettyPrintedSource = (sd: SourceDetails) => {
  return !!sd.prettyPrintedFrom;
};

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
  assert(
    preferredLocation.sourceId ===
      getCorrespondingSourceIdsFromSourcesState(sources, preferredLocation.sourceId)[0],
    "location.sourceId should be updated to the first corresponding sourceId"
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

export function getGeneratedLocation(
  sourcesById: Dictionary<SourceDetails>,
  locations: MappedLocation
): Location {
  const location = locations.find(location => {
    const source = sourcesById[location.sourceId];
    return source?.generated.length === 0;
  });
  assert(location, "no generated location found");
  return location || locations[0];
}

export function getHasSiblingOfSameName(state: UIState, source: MiniSource) {
  if (!source || !source.url) {
    return false;
  }

  return state.sources.sourcesByUrl[source.url]?.length > 0;
}

export function getSourceIdToDisplayById(state: UIState, sourceId: string) {
  return getCorrespondingSourceIds(state, sourceId)[0];
}

export const getSourceToDisplayById = (state: UIState, sourceId: string) => {
  const sourceIdToDisplay = getSourceIdToDisplayById(state, sourceId);
  return sourceIdToDisplay ? getSourceDetails(state, sourceIdToDisplay) : undefined;
};

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

export function getSourceIdToDisplayForUrl(state: UIState, url: string) {
  const sourceIds = state.sources.sourcesByUrl[url];
  if (!sourceIds) {
    return;
  }
  const preferred = getPreferredSourceId(state.sources.sourceDetails.entities, sourceIds)!;
  return getCorrespondingSourceIds(state, preferred)[0];
}

export const getSourceToDisplayForUrl = (state: UIState, url: string) => {
  const sourceId = getSourceIdToDisplayForUrl(state, url);
  return sourceId ? getSourceDetails(state, sourceId) : undefined;
};

export const getPreviousPersistedLocation = (state: UIState) =>
  state.sources.persistedSelectedLocation;

export const getPreferredGeneratedSources = (state: UIState) =>
  state.sources.preferredGeneratedSources;

/*
export const getStableLocationForLocation = (
  state: UIState,
  location: Location
): StableLocation => {
  const sourceDetails = getSourceDetails(state, location.sourceId);
  if (!sourceDetails) {
    throw "Cannot find source details for sourceId: " + location.sourceId;
  }
  return {
    ...location,
    kind: sourceDetails.kind,
    url: sourceDetails.url!,
    contentHash: sourceDetails.contentHash!,
  };
};
*/

export const selectors = {
  getAllSourceDetails,
  getSourceDetails,
  getSourceDetailsEntities,
  getSourceDetailsCount,
  getSourceContentsEntry,
  getSourcesLoading,
  getSelectedLocation,
  getSelectedSourceId,
  getSelectedSource,
  getSourcesById,
  getCorrespondingSourceIds,
  getSourceContent,
  getSelectedSourceWithContent,
  getTextAtLocation,
  getSelectedLocationHasScrolled,
  getUniqueUrlForSource,
  getSourceContentsLoaded,
  getHasSiblingOfSameName,
  getPreviousPersistedLocation,
  getSourceToDisplayById,
  getSourceIdToDisplayById,
  getSourceToDisplayForUrl,
  getSourceIdToDisplayForUrl,
  getSourceIdsByUrl,
  getSourcesToDisplayByUrl,
  getPreferredGeneratedSources,
};

export default sourcesSlice.reducer;
