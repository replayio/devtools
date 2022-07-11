import { createEntityAdapter, createSlice, EntityState, PayloadAction } from "@reduxjs/toolkit";
import { Location } from "@replayio/protocol";
import { UIThunkAction } from "ui/actions";
import { UIState } from "ui/state";
import { getSelectedSourceId } from "./sources";

export interface HitCount {
  location: Location;
  hits: number;
}

export interface SourceHitCounts {
  hitCounts?: HitCount[];
  id: string;
  status: LoadingState;
}

export interface HitCountsState {
  hitCounts: EntityState<SourceHitCounts>;
}

export enum LoadingState {
  LOADING = "loading",
  LOADED = "loaded",
  ERRORED = "errored",
}

const hitCountAdapter = createEntityAdapter<SourceHitCounts>();
const initialState: HitCountsState = {
  hitCounts: hitCountAdapter.getInitialState(),
};

const hitCountsSlice = createSlice({
  name: "hitCounts",
  initialState,
  reducers: {
    hitCountsRequested: (state, action: PayloadAction<string>) => {
      hitCountAdapter.upsertOne(state.hitCounts, {
        id: action.payload,
        status: LoadingState.LOADING,
      });
    },
    hitCountsReceived: (
      state,
      action: PayloadAction<{ sourceId: string; hitCounts: HitCount[] }>
    ) => {
      hitCountAdapter.upsertOne(state.hitCounts, {
        hitCounts: action.payload.hitCounts,
        id: action.payload.sourceId,
        status: LoadingState.LOADED,
      });
    },
    hitCountsFailed: (state, action: PayloadAction<string>) => {
      hitCountAdapter.upsertOne(state.hitCounts, {
        id: action.payload,
        status: LoadingState.ERRORED,
      });
    },
  },
});

export const loadBreakpointHitCounts = (sourceId: string): UIThunkAction => {
  return (dispatch, getState) => {
    dispatch(hitCountsRequested(sourceId));
    // TODO @jcmorrow actually get the hitCounts
    // await ThreadFront.getHitCounts(sourceId)
    dispatch(hitCountsReceived({ sourceId, hitCounts: [] }));
  };
};

export const { hitCountsRequested, hitCountsReceived, hitCountsFailed } = hitCountsSlice.actions;

export const getHitCountsForSource = (state: UIState, sourceId: string) => {
  return (
    hitCountAdapter.getSelectors().selectById(state.hitCounts.hitCounts, sourceId)?.hitCounts ||
    null
  );
};
export const getHitCountsForSelectedSource = (state: UIState) => {
  const id = getSelectedSourceId(state);
  if (!id) {
    return null;
  }

  return getHitCountsForSource(state, id);
};

export default hitCountsSlice.reducer;
