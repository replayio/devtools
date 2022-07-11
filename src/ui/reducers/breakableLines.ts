import { createEntityAdapter, createSlice, EntityState, PayloadAction } from "@reduxjs/toolkit";
import { UIThunkAction } from "ui/actions";
import { UIState } from "ui/state";
import { getSelectedSourceId } from "./sources";

export interface SourceBreakableLines {
  error?: string;
  lines?: number[];
  id: string;
  status: LoadingState;
}

export enum LoadingState {
  LOADING = "loading",
  LOADED = "loaded",
  ERRORED = "errored",
}

export interface BreakableLinesState {
  breakableLines: EntityState<SourceBreakableLines>;
}

const breakableLines = createEntityAdapter<SourceBreakableLines>();

const initialState = {
  breakableLines: breakableLines.getInitialState(),
};

const breakableLinesSlice = createSlice({
  name: "breakableLines",
  initialState,
  reducers: {
    breakableLinesRequested: (state, action: PayloadAction<string>) => {
      breakableLines.upsertOne(state.breakableLines, {
        id: action.payload,
        status: LoadingState.LOADING,
      });
    },
    breakableLinesReceived: (
      state,
      action: PayloadAction<{ sourceId: string; breakableLines: number[] }>
    ) => {
      breakableLines.upsertOne(state.breakableLines, {
        lines: action.payload.breakableLines,
        id: action.payload.sourceId,
        status: LoadingState.LOADED,
      });
    },
    breakableLinesErrored: (state, action: PayloadAction<{ sourceId: string; error: string }>) => {
      breakableLines.upsertOne(state.breakableLines, {
        error: action.payload.error,
        id: action.payload.sourceId,
        status: LoadingState.ERRORED,
      });
    },
  },
});

export const fetchBreakableLinesForSource = (sourceId: string): UIThunkAction => {
  return async (dispatch, getState, { ThreadFront }) => {
    const status = getState().breakableLines.breakableLines.entities[sourceId]?.status;
    if (status === LoadingState.LOADED || status === LoadingState.LOADING) {
      return;
    }
    dispatch(breakableLinesSlice.actions.breakableLinesRequested(sourceId));
    try {
      const lineLocations = await ThreadFront.getBreakpointPositionsCompressed(sourceId);
      dispatch(
        breakableLinesSlice.actions.breakableLinesReceived({
          sourceId,
          breakableLines: lineLocations.map(location => location.line),
        })
      );
    } catch (error) {
      dispatch(
        breakableLinesSlice.actions.breakableLinesErrored({ sourceId, error: String(error) })
      );
    }
  };
};
export const getBreakableLinesForSelectedSource = (state: UIState) => {
  const sourceId = getSelectedSourceId(state);
  if (!sourceId) {
    return null;
  }
  return state.breakableLines.breakableLines.entities[sourceId]?.lines;
};

export default breakableLinesSlice.reducer;
