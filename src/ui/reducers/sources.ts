import {
  createEntityAdapter,
  createSelector,
  createSlice,
  EntityState,
  PayloadAction,
} from "@reduxjs/toolkit";
import { ContentType, newSource, SourceKind } from "@replayio/protocol";
import { getSelectedSourceId } from "devtools/client/debugger/src/selectors";
import { parser } from "devtools/client/debugger/src/utils/bootstrap";
import { UIThunkAction } from "ui/actions";
import { UIState } from "ui/state";
import { newSourcesToCompleteSourceDetails } from "ui/utils/sources";

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

export enum LoadingState {
  LOADING = "loading",
  LOADED = "loaded",
  ERRORED = "errored",
}

export interface SourceContent {
  content?: string;
  contentType?: ContentType;
  id: string;
  status: LoadingState;
}

const sourceDetailsAdapter = createEntityAdapter<SourceDetails>();
const sourcesAdapter = createEntityAdapter<newSource>({ selectId: source => source.sourceId });
const contentsAdapter = createEntityAdapter<SourceContent>();
const sourceSelectors = sourcesAdapter.getSelectors();

export interface SourcesState {
  contents: EntityState<SourceContent>;
  sourceDetails: EntityState<SourceDetails>;
  sources: EntityState<newSource>;
}

const initialState: SourcesState = {
  contents: contentsAdapter.getInitialState(),
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
    sourceLoaded: (state, action: PayloadAction<{ sourceId: string; contents: string }>) => {
      contentsAdapter.upsertOne(state.contents, {
        id: action.payload.sourceId,
        status: LoadingState.LOADED,
        content: action.payload.contents,
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
  },
});

export const getSelectedSourceDetails = createSelector(
  (state: UIState) => state.experimentalSources.sourceDetails,
  getSelectedSourceId,
  (sourceDetails, id) => {
    if (id === null || id === undefined) {
      return null;
    }

    return sourceDetails.entities[id];
  }
);

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

export default sourcesSlice.reducer;
