import {
  createEntityAdapter,
  createSlice,
  EntityState,
  PayloadAction,
  createAsyncThunk,
} from "@reduxjs/toolkit";
import { Location } from "@replayio/protocol";
import { UIThunkAction } from "ui/actions";
import { UIState } from "ui/state";
import { rangeForFocusRegion } from "ui/utils/timeline";
import { getCorrespondingSourceIds, getSelectedSourceId, getSourceDetails } from "./sources";
import { getFocusRegion } from "./timeline";
import { fetchHitCounts as fetchHitCountsFromProtocol } from "protocol/thread/hitCounts";

const MAX_LINE_HITS_TO_FETCH = 1000;

export interface HitCount {
  location: Location;
  hits: number;
}

export interface SourceHitCounts {
  error?: string;
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
    hitCountsFailed: (state, action: PayloadAction<{ id: string; error: string }>) => {
      hitCountAdapter.upsertOne(state.hitCounts, {
        id: action.payload.id,
        status: LoadingState.ERRORED,
        error: action.payload.error,
      });
    },
  },
});

export const getBoundsForLineNumber = (line: number) => {
  const lower = Math.floor(line / MAX_LINE_HITS_TO_FETCH) * MAX_LINE_HITS_TO_FETCH;
  const upper = lower + MAX_LINE_HITS_TO_FETCH;
  return {
    lower,
    upper,
  };
};

export const getCacheKeyForSourceHitCounts = (
  state: UIState,
  sourceId: string,
  lineNumber: number
) => {
  const sourceDetails = getSourceDetails(state, sourceId);
  if (!sourceDetails) {
    throw `Source with ID ${sourceId} not found`;
  }
  const correspondingSourceIds = sourceDetails.correspondingSourceIds;

  const { lower, upper } = getBoundsForLineNumber(lineNumber);

  return `${correspondingSourceIds.join(":")}-${lower}-${upper}`;
};

export const fetchHitCounts = (sourceId: string, lineNumber: number): UIThunkAction => {
  return async (dispatch, getState, { ThreadFront }) => {
    const state = getState();
    const cacheKey = getCacheKeyForSourceHitCounts(state, sourceId, lineNumber);
    const status = getState().hitCounts.hitCounts.entities[cacheKey]?.status;

    if (status === LoadingState.LOADING || status === LoadingState.LOADED) {
      return;
    }

    try {
      dispatch(hitCountsRequested(sourceId));
      const { lower, upper } = getBoundsForLineNumber(lineNumber);
      const locations = await ThreadFront.getBreakpointPositionsCompressed(sourceId);
      const locationsToFetch = locations.filter(
        location => location.line >= lower && location.line < upper
      );
      // When you fetch possible breakpoints, you will receive a list of columns
      // for each breakable line. We only display the number of times that the
      // *first* possible breakpoint on a line was hit, so we can throw the rest
      // of them away.
      locationsToFetch.forEach(location => {
        const sortedColumns = location.columns.sort((a, b) => a - b);
        location.columns = sortedColumns.slice(0, 1);
      });
      const focusRegion = getFocusRegion(state);
      const range = focusRegion ? rangeForFocusRegion(focusRegion) : undefined;
      const correspondingSourceIds = getCorrespondingSourceIds(state, sourceId)!;

      const hitCounts = await fetchHitCountsFromProtocol(
        correspondingSourceIds,
        locationsToFetch,
        range
          ? {
              beginPoint: range.begin.point,
              endPoint: range.end.point,
            }
          : null
      );
      dispatch(hitCountsReceived({ sourceId: cacheKey, hitCounts: hitCounts.hits }));
    } catch (e) {
      dispatch(hitCountsFailed({ id: cacheKey, error: String(e) }));
    }
  };
};

export const { hitCountsRequested, hitCountsReceived, hitCountsFailed } = hitCountsSlice.actions;

export const getHitCountsForSource = (state: UIState, sourceId: string) => {
  const cacheKey = getCacheKeyForSourceHitCounts(state, sourceId, 0);
  return (
    hitCountAdapter.getSelectors().selectById(state.hitCounts.hitCounts, cacheKey)?.hitCounts ||
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
