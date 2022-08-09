import {
  createEntityAdapter,
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

export interface SourceDetails {
  canonicalId: string;
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
export const getSourceByUrl = (state: UIState, url: string) => {
  const urlEntries = state.sources.sourcesByUrl[url] ?? [];
  const id = urlEntries[0];
  if (!id) {
    return undefined;
  }
  return getSourceDetails(state, id);
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

export function getGeneratedSourceByURL(state: UIState, url: string) {
  const sourceForUrl = getSourceByUrl(state, url);
  if (sourceForUrl) {
    // TODO Should this be using `state.urls` instead and finding the first item?
    const canonicalSource = getSourceDetails(state, sourceForUrl.canonicalId);
    const firstGenerated = canonicalSource?.generated[0];
    if (firstGenerated) {
      return getSourceDetails(state, firstGenerated);
    }
  }
}

export const getSourceContentsLoaded = (state: UIState, sourceId: string) => {
  const entry = getSourceContentsEntry(state, sourceId);
  return entry && isFulfilled(entry);
};

export const isFulfilled = (item?: { status: LoadingStatus }) => {
  return item?.status === LoadingStatus.LOADED;
};

export const isOriginalSource = (sd: SourceDetails) => {
  return sd.canonicalId === sd.id;
};

export const isPrettyPrintedSource = (sd: SourceDetails) => {
  return !!sd.prettyPrintedFrom;
};

export function getHasSiblingOfSameName(state: UIState, source: MiniSource) {
  if (!source || !source.url) {
    return false;
  }

  return state.sources.sourcesByUrl[source.url]?.length > 0;
}

export const getCanonicalSourceFromEntities = (
  detailsEntities: Dictionary<SourceDetails>,
  sd: SourceDetails
) => {
  const canonicalSource = detailsEntities[sd.canonicalId];
  if (!canonicalSource) {
    console.error("Could not find canonical source for alternate source: ", sd);
  }
  return canonicalSource ?? sd;
};

export const getCanonicalSource = (state: UIState, sd: SourceDetails) => {
  return getCanonicalSourceFromEntities(state.sources.sourceDetails.entities, sd);
};

export const getCanonicalSourceForUrl = (state: UIState, url: string) => {
  const sd = getSourceByUrl(state, url);
  if (!sd) {
    console.error("Could not find source for URL: ", url);
    return undefined;
  }

  return getCanonicalSource(state, sd);
};

/**
 * Smartly look up a single source for display purposes, starting from
 * the first source's ID, and going through various "corresponding",
 * "canonical", and "pretty-printed" versions.
 * This is loosely similar to `ThreadFront._chooseSourceId()`, but hopefully
 * shorter and simpler while giving mostly equivalent results.
 */
export const getSourceToDisplay = (
  sourceEntities: Dictionary<SourceDetails>,
  startingSourceId: string
) => {
  const startingSource = sourceEntities[startingSourceId];
  if (!startingSource) {
    return;
  }

  // We should guarantee that there is _always_ at _least_ one
  // corresponding source ID, that it always includes this source
  // itself, and worst case it's _only_ this source.
  const firstCorrespondingSource = sourceEntities[startingSource.correspondingSourceIds[0]];

  if (!firstCorrespondingSource) {
    return;
  }

  // We then look up the "canonical" version of this source.
  const canonicalSource = sourceEntities[firstCorrespondingSource.canonicalId]!;
  // It's possible there may be a pretty-printed version that would
  // be a better choice for display. Use that if available.
  if (canonicalSource.prettyPrinted) {
    return sourceEntities[canonicalSource.prettyPrinted]!;
  }

  // otherwise show the canonical version
  return canonicalSource;
};

export const getSourceToDisplayById = (state: UIState, startingSourceId: string) => {
  const sourceEntities = getSourceDetailsEntities(state);
  return getSourceToDisplay(sourceEntities, startingSourceId);
};

export const getSourceToDisplayForUrl = (state: UIState, url: string) => {
  const initialSourceForUrl = getSourceByUrl(state, url);
  if (!initialSourceForUrl) {
    return;
  }
  return getSourceToDisplayById(state, initialSourceForUrl.id);
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
  getSourceByUrl,
  getSourceContent,
  getSelectedSourceWithContent,
  getTextAtLocation,
  getSelectedLocationHasScrolled,
  getUniqueUrlForSource,
  getGeneratedSourceByURL,
  getSourceContentsLoaded,
  getHasSiblingOfSameName,
  getPreviousPersistedLocation,
  getCanonicalSource,
  getCanonicalSourceForUrl,
  getSourceToDisplayById,
  getSourceToDisplayForUrl,
};

export default sourcesSlice.reducer;
