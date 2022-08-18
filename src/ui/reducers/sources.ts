import {
  createEntityAdapter,
  createSelector,
  createSlice,
  Dictionary,
  EntityState,
  PayloadAction,
} from "@reduxjs/toolkit";
import { Location, newSource, SourceKind } from "@replayio/protocol";

import { UIThunkAction } from "ui/actions";
import { UIState } from "ui/state";
import { newSourcesToCompleteSourceDetails } from "ui/utils/sources";
import { parser } from "devtools/client/debugger/src/utils/bootstrap";
import { listenForCondition } from "ui/setup/listenerMiddleware";
import { LoadingStatus } from "ui/utils/LoadingStatus";
import type { PartialLocation } from "devtools/client/debugger/src/actions/sources";
// TODO Move prefs out of reducers and load this separately
import { prefs } from "devtools/client/debugger/src/utils/prefs";
import { getTextAtPosition } from "devtools/client/debugger/src/utils/source";
import { assert } from "protocol/utils";
import { UiState } from "devtools/client/webconsole/reducers/ui";

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
}

const initialState: SourcesState = {
  allSourcesReceived: false,
  sourceDetails: sourceDetailsAdapter.getInitialState(),
  contents: contentsAdapter.getInitialState(),
  selectedLocation: null,
  selectedLocationHistory: [],
  selectedLocationHasScrolled: false,
  // TODO Move prefs out of reducers and load this separately
  persistedSelectedLocation: (prefs.pendingSelectedLocation as PartialLocation) || null,
  sourcesByUrl: {},
};

const sourcesSlice = createSlice({
  name: "sources",
  initialState,
  reducers: {
    allSourcesReceived: (state, action: PayloadAction<newSource[]>) => {
      const sources = action.payload;
      state.allSourcesReceived = true;

      sourceDetailsAdapter.addMany(state.sourceDetails, newSourcesToCompleteSourceDetails(sources));

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
  sourceLoading,
  sourceLoaded,
  sourceErrored,
} = sourcesSlice.actions;

export const loadSourceText = (sourceId: string): UIThunkAction<Promise<void>> => {
  return async (dispatch, getState, { ThreadFront }) => {
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
      const response = await ThreadFront.getSourceContents(sourceId);

      parser.setSource(sourceId, {
        type: "text",
        value: response.contents,
        contentType: response.contentType,
      });

      dispatch(sourceLoaded({ sourceId, ...response }));
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
  return getSourceDetails(state, id)?.correspondingSourceIds;
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
  preferredGeneratedSources?: Set<string>
) {
  const sourceMappedId = getBestSourceMappedSourceId(sourcesById, sourceIds);
  const nonSourceMappedId = getBestNonSourceMappedSourceId(sourcesById, sourceIds);
  if (!sourceMappedId) {
    return nonSourceMappedId;
  }
  if (!nonSourceMappedId) {
    return sourceMappedId;
  }
  if (preferredGeneratedSources?.has(nonSourceMappedId)) {
    return nonSourceMappedId;
  }
  return sourceMappedId;
}

export function getAlternateSourceId(
  sourcesById: Dictionary<SourceDetails>,
  sourceIds: string[],
  preferredGeneratedSources?: Set<string>
) {
  const sourceMappedId = getBestSourceMappedSourceId(sourcesById, sourceIds);
  const nonSourceMappedId = getBestNonSourceMappedSourceId(sourcesById, sourceIds);
  if (!sourceMappedId || !nonSourceMappedId) {
    return;
  }
  if (preferredGeneratedSources?.has(nonSourceMappedId)) {
    return sourceMappedId;
  }
  return nonSourceMappedId;
}

export function getHasSiblingOfSameName(state: UIState, source: MiniSource) {
  if (!source || !source.url) {
    return false;
  }

  return state.sources.sourcesByUrl[source.url]?.length > 0;
}

export function getSourceIdToDisplayById(state: UIState, sourceId: string) {
  return getCorrespondingSourceIds(state, sourceId)![0];
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
  return getCorrespondingSourceIds(state, preferred)![0];
}

export const getSourceToDisplayForUrl = (state: UIState, url: string) => {
  const sourceId = getSourceIdToDisplayForUrl(state, url);
  return sourceId ? getSourceDetails(state, sourceId) : undefined;
};

export const getPreviousPersistedLocation = (state: UIState) =>
  state.sources.persistedSelectedLocation;

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
};

export default sourcesSlice.reducer;
