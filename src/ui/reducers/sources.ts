import { createEntityAdapter, createSlice, EntityState, PayloadAction } from "@reduxjs/toolkit";
import { newSource, SourceKind } from "@replayio/protocol";
import { getSelectedSourceId } from "devtools/client/debugger/src/selectors";
import { UIThunkAction } from "ui/actions";
import { UIState } from "ui/state";
import { newSourcesToCompleteSourceDetails } from "ui/utils/sources";
import { parser } from "devtools/client/debugger/src/utils/bootstrap";

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
export const contentSelectors = contentsAdapter.getSelectors();

export interface SourcesState {
  sourceDetails: EntityState<SourceDetails>;
  sources: EntityState<newSource>;
  contents: EntityState<SourceContent>;
}

const initialState: SourcesState = {
  sourceDetails: sourceDetailsAdapter.getInitialState(),
  sources: sourcesAdapter.getInitialState(),
  contents: contentsAdapter.getInitialState(),
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
  },
});

export const experimentalLoadSourceText = (sourceId: string): UIThunkAction => {
  return async (dispatch, getState, { ThreadFront }) => {
    const existing = getState().experimentalSources.contents.entities[sourceId];
    if (existing?.status === LoadingState.LOADING || existing?.status === LoadingState.LOADED) {
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

const sourceDetailsSelectors = sourceDetailsAdapter.getSelectors<UIState>(
  (state: UIState) => state.experimentalSources.sourceDetails
);

export const getSourceDetails = sourceDetailsSelectors.selectById;
export const getAllSourceDetails = sourceDetailsSelectors.selectAll;
export const getSelectedSourceDetails = (state: UIState) => {
  const selected = getSelectedSourceId(state);
  if (!selected) {
    return undefined;
  }

  return sourceDetailsSelectors.selectById(state, selected);
};
export const getCorrespondingSourceIds = (state: UIState, id: string) =>
  getSourceDetails(state, id)?.correspondingSourceIds;

export const { addSources, allSourcesReceived, sourceErrored, sourceLoaded, sourceLoading } =
  sourcesSlice.actions;

export default sourcesSlice.reducer;
