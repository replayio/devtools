import { createEntityAdapter, createSlice, EntityState, PayloadAction } from "@reduxjs/toolkit";
import { Location } from "@replayio/protocol";
import { UIThunkAction } from "ui/actions";
import { UIState } from "ui/state";
import { rangeForFocusRegion } from "ui/utils/timeline";
import { getSelectedSourceId } from "./sources";
import { getFocusRegion } from "./timeline";

const MAX_LINE_HITS_TO_FETCH = 1000;

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

export const fetchHitCounts = (sourceId: string, line: number): UIThunkAction => {
  return async (dispatch, getState, { ThreadFront }) => {
    dispatch(hitCountsRequested(sourceId));

    const locations = await ThreadFront.getBreakpointPositionsCompressed(sourceId);
    // See `source-actors` where MAX_LINE_HITS_TO_FETCH is defined for an
    // explanation of the bounds here.
    const lowerBound = Math.floor(line / MAX_LINE_HITS_TO_FETCH) * MAX_LINE_HITS_TO_FETCH;
    const upperBound = lowerBound + MAX_LINE_HITS_TO_FETCH;
    const locationsToFetch = locations
      .filter(location => location.line >= lowerBound && location.line < upperBound)
      .map(location => ({ ...location, columns: [location.columns.sort((a, b) => a - b)[0]] }));
    const focusRegion = getFocusRegion(getState());
    const range = focusRegion ? rangeForFocusRegion(focusRegion) : undefined;
    const hitCounts = await ThreadFront.getHitCounts(
      sourceId,
      locationsToFetch,
      range
        ? {
            beginPoint: range.begin.point,
            endPoint: range.end.point,
          }
        : null
    );
    // TODO @jcmorrow actually get the hitCounts
    // await ThreadFront.getHitCounts(sourceId)
    dispatch(hitCountsReceived({ sourceId, hitCounts: hitCounts.hits }));
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
