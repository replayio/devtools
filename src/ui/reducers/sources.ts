import {
  createEntityAdapter,
  createSelector,
  createSlice,
  EntityState,
  PayloadAction,
} from "@reduxjs/toolkit";
import { Location, newSource, SourceKind } from "@replayio/protocol";
// import { getSelectedSourceId } from "devtools/client/debugger/src/selectors";
import { UIThunkAction } from "ui/actions";
import { UIState } from "ui/state";
import { newSourcesToCompleteSourceDetails } from "ui/utils/sources";
import { parser } from "devtools/client/debugger/src/utils/bootstrap";
import { listenForCondition } from "ui/setup/listenerMiddleware";
import type { Source } from "devtools/client/debugger/src/reducers/sources";
import type { SourcesMap } from "devtools/client/debugger/src/utils/sources-tree";
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

export enum LoadingStatus {
  LOADING = "loading",
  LOADED = "loaded",
  ERRORED = "errored",
}

export interface SourceContent {
  id: string;
  status: LoadingStatus;
  value?: {
    contentType: string;
    type: string;
    value: string;
  };
}

const sourceDetailsAdapter = createEntityAdapter<SourceDetails>();
const sourcesAdapter = createEntityAdapter<newSource>({ selectId: source => source.sourceId });
const contentsAdapter = createEntityAdapter<SourceContent>();

export const sourceSelectors = sourcesAdapter.getSelectors();
export const contentsSelectors = contentsAdapter.getSelectors(
  (state: UIState) => state.experimentalSources.contents
);
export const { selectAll: getAllSourceDetails, selectById: getSourceDetails } =
  sourceDetailsAdapter.getSelectors((state: UIState) => state.experimentalSources.sourceDetails);

export interface SourcesState {
  allSourcesReceived: boolean;
  sourceDetails: EntityState<SourceDetails>;
  sources: EntityState<newSource>;
  contents: EntityState<SourceContent>;
  selectedLocationHistory: Partial<Location>[];
  sourcesByUrl: { [url: string]: string[] };
}

const initialState: SourcesState = {
  allSourcesReceived: false,
  sourceDetails: sourceDetailsAdapter.getInitialState(),
  sources: sourcesAdapter.getInitialState(),
  contents: contentsAdapter.getInitialState(),
  selectedLocationHistory: [],
  sourcesByUrl: {},
};

const sourcesSlice = createSlice({
  name: "sources",
  initialState,
  reducers: {
    addSources: (state, action: PayloadAction<newSource[]>) => {
      // Store the raw protocol information. Once we have recieved all sources
      // we will iterate over this and build it into the shape we want.
      sourcesAdapter.addMany(state.sources, action.payload);
    },
    allSourcesReceived: state => {
      state.allSourcesReceived = true;
      const sources = sourceSelectors.selectAll(state.sources);
      sourceDetailsAdapter.addMany(state.sourceDetails, newSourcesToCompleteSourceDetails(sources));
      const sourcesByUrl: Record<string, string[]> = {};
      sources.forEach(source => {
        if (!source.url) {
          return;
        }

        if (!sourcesByUrl[source.url]) {
          sourcesByUrl[source.url] = [];
        }
        sourcesByUrl[source.url].push(source.sourceId);
      });
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
    selectLocation: (state, action: PayloadAction<Partial<Location>>) => {
      state.selectedLocationHistory.unshift(action.payload);
    },
  },
});

export const {
  addSources,
  allSourcesReceived,
  selectLocation,
  sourceLoading,
  sourceLoaded,
  sourceErrored,
} = sourcesSlice.actions;

export const experimentalLoadSourceText = (sourceId: string): UIThunkAction<Promise<void>> => {
  return async (dispatch, getState, { ThreadFront }) => {
    const existing = contentsSelectors.selectById(getState(), sourceId);
    if (existing?.status === LoadingStatus.LOADING) {
      // in flight - resolve this thunk's promise when it completes
      // TODO Replace this with RTK Query!
      return dispatch(
        listenForCondition(() => {
          // Check the status of this source after every action
          const status = contentsSelectors.selectById(getState(), sourceId)?.status;
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

export const getSourcesLoading = (state: UIState) => !state.experimentalSources.allSourcesReceived;

export const getSelectedLocation = (state: UIState) =>
  state.experimentalSources.selectedLocationHistory[0];

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
  const id = state.experimentalSources.sourcesByUrl[url][0];
  return getSourceDetails(state, id);
};
export const getSourceContent = (state: UIState, id: string) => {
  return state.experimentalSources.contents.entities[id];
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
  // TODO Rework selectors
  return "";
  // return getTextAtPosition(content, location);
};
// This is useful if you are displaying a bunch of sources and want them to
// ensure they all have unique names, even though some of them might have been
// loaded from the same URL. If that's the case, and either of the original URLs
// had a query string, then we will add that query string back.
export const getUniqueUrlForSource = (state: UIState, sourceId: string) => {
  const sourceDetails = getSourceDetails(state, sourceId);
  if (!sourceDetails || !sourceDetails.url) {
    return null;
  }
  if (state.experimentalSources.sourcesByUrl[sourceDetails.url].length > 1) {
    // I was going to put the query string back here...
    // But I'm not sure we're actually *removing* query strings in the first
    // place yet!
    // TODO @jcmorrow - actually remove query strings, then add them back here.
    // presence
    const queryString = "";
    return sourceDetails.url + queryString;
  } else {
    return sourceDetails.url;
  }
};

export const getAllSourceDetailsAsSourceMap = createSelector(
  (state: UIState) => state.experimentalSources.sourceDetails.entities,
  sourcesEntities => {
    const sourcesMap: SourcesMap = {};
    for (let [id, sourceDetails] of Object.entries(sourcesEntities)) {
      sourcesMap[id] = convertSourceDetailsToSource(sourceDetails!);
    }

    return sourcesMap;
  }
);

export const convertSourceDetailsToSource = (sd: SourceDetails) => {
  const source: Source = {
    id: sd.id,
    url: sd.url,
    isOriginal: sd.id === sd.canonicalId,
    isPrettyPrinted: sd.id.startsWith("pp"),
    // TODO Implement blackboxing
    isBlackBoxed: false,
    isExtension: false,
  };

  return source;
};

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

export default sourcesSlice.reducer;
