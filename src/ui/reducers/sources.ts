import { createEntityAdapter, createSlice, EntityState, PayloadAction } from "@reduxjs/toolkit";
import { Location, newSource, SourceKind } from "@replayio/protocol";
import { parser } from "devtools/client/debugger/src/utils/bootstrap";
import { UIThunkAction } from "ui/actions";
import { UIState } from "ui/state";
import { newSourcesToCompleteSourceDetails } from "ui/utils/sources";

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
  stableId: string;
  url?: string;
}

export enum LoadingState {
  LOADING = "loading",
  LOADED = "loaded",
  ERRORED = "errored",
}

export interface SourceContent {
  id: string;
  status: LoadingState;
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
const sourceDetailSelectors = sourceDetailsAdapter.getSelectors();
export const contentSelectors = contentsAdapter.getSelectors();

export interface SourcesState {
  allSourcesRecieved: boolean;
  selectedLocationHistory: Location[];
  contents: EntityState<SourceContent>;
  sourceDetails: EntityState<SourceDetails>;
  sources: EntityState<newSource>;
}

const initialState: SourcesState = {
  allSourcesRecieved: false,
  contents: contentsAdapter.getInitialState(),
  selectedLocationHistory: [],
  sourceDetails: sourceDetailsAdapter.getInitialState(),
  sources: sourcesAdapter.getInitialState(),
};

const sourcesSlice = createSlice({
  name: "sources",
  initialState,
  reducers: {
    addSources: (state, action: PayloadAction<newSource[]>) => {
      // Store the raw protocol information. Once we have recieved all sources
      // we will run over this and build it into the shape we want.
      sourcesAdapter.addMany(state.sources, action.payload);
    },
    allSourcesReceived: state => {
      state.allSourcesRecieved = true;
      sourceDetailsAdapter.addMany(
        state.sourceDetails,
        newSourcesToCompleteSourceDetails(sourceSelectors.selectAll(state.sources))
      );
    },
    sourceLoading: (state, action: PayloadAction<string>) => {
      contentsAdapter.upsertOne(state.contents, {
        id: action.payload,
        status: LoadingState.LOADING,
      });
    },
    sourceLoaded: (
      state,
      action: PayloadAction<{ sourceId: string; contents: string; contentType: string }>
    ) => {
      contentsAdapter.upsertOne(state.contents, {
        id: action.payload.sourceId,
        status: LoadingState.LOADED,
        value: {
          contentType: action.payload.contentType,
          value: action.payload.contents,
          type: action.payload.contentType.slice(0, action.payload.contentType.indexOf("/")),
        },
      });
    },
    sourceErrored: (state, action: PayloadAction<string>) => {
      const existing = state.contents.entities[action.payload];
      if (existing?.status === LoadingState.LOADED) {
        return;
      }

      contentsAdapter.upsertOne(state.contents, {
        id: action.payload,
        status: LoadingState.ERRORED,
      });
    },
    selectLocation: (state, action: PayloadAction<Location>) => {
      state.selectedLocationHistory.unshift(action.payload);
    },
  },
});

export const { addSources, allSourcesReceived, sourceLoading, sourceLoaded, sourceErrored } =
  sourcesSlice.actions;

export const experimentalLoadSourceText = (sourceId: string): UIThunkAction => {
  return async (dispatch, getState, { ThreadFront }) => {
    const existing = getState().experimentalSources.contents.entities[sourceId];
    console.log({ existing });
    if (existing?.status === LoadingState.LOADING || existing?.status === LoadingState.LOADED) {
      return;
    }
    dispatch(sourceLoading(sourceId));

    try {
      const response = await ThreadFront.getSourceContents(sourceId);

      console.log({ response });
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

export const getSourcesLoading = (state: UIState) => !state.experimentalSources.allSourcesRecieved;
export const getAllSourceDetails = (state: UIState) =>
  sourceDetailSelectors.selectAll(state.experimentalSources.sourceDetails);
export const getSelectedLocation = (state: UIState) =>
  state.experimentalSources.selectedLocationHistory[0];
export const getSelectedSourceId = (state: UIState) => {
  const location = getSelectedLocation(state);
  return location?.sourceId;
};
export const getSelectedSourceDetails = (state: UIState) => {
  const selectedSourceId = getSelectedSourceId(state);
  return selectedSourceId ? getSourceDetails(state, selectedSourceId) : null;
};
// This is a selector we used to have, so for the sake of making it easier to
// port old code I've aliased it.
export const getSelectedSource = getSelectedSourceDetails;
export const getSourcesById = (state: UIState, ids: string[]) => {
  return ids.map(id => sourceSelectors.selectById(state.experimentalSources.sources, id)!);
};
export const getSourceDetails = (state: UIState, id: string) => {
  return sourceSelectors.selectById(state.experimentalSources.sources, id);
};
export const getSourceContent = (state: UIState, id: string) => {
  return state.experimentalSources.contents.entities[id];
};
export const getSelectedSourceWithContent = (state: UIState) => {
  const selectedSourceId = getSelectedSourceId(state);
  return selectedSourceId ? getSourceContent(state, selectedSourceId) : null;
};

export default sourcesSlice.reducer;
