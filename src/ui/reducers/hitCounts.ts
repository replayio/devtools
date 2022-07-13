import { createEntityAdapter, createSlice, EntityState, PayloadAction } from "@reduxjs/toolkit";
import { Location } from "@replayio/protocol";
import { UIThunkAction } from "ui/actions";
import { UIState } from "ui/state";
import { rangeForFocusRegion } from "ui/utils/timeline";
import { getCorrespondingSourceIds, getSourceDetails } from "./sources";
import { getFocusRegion } from "./timeline";
import { fetchProtocolHitCounts } from "protocol/thread/hitCounts";
import sortBy from "lodash/sortBy";
import { getSelectedSourceId } from "devtools/client/debugger/src/selectors";

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

export type HitCountsState = EntityState<SourceHitCounts>;

export enum LoadingState {
  LOADING = "loading",
  LOADED = "loaded",
  ERRORED = "errored",
}

const hitCountsAdapter = createEntityAdapter<SourceHitCounts>();
const initialState = hitCountsAdapter.getInitialState();

const hitCountsSlice = createSlice({
  name: "hitCounts",
  initialState,
  reducers: {
    hitCountsRequested: (state, action: PayloadAction<string>) => {
      hitCountsAdapter.upsertOne(state, {
        id: action.payload,
        status: LoadingState.LOADING,
      });
    },
    hitCountsReceived: (state, action: PayloadAction<{ id: string; hitCounts: HitCount[] }>) => {
      hitCountsAdapter.upsertOne(state, {
        ...action.payload,
        status: LoadingState.LOADED,
      });
    },
    hitCountsFailed: (state, action: PayloadAction<{ id: string; error: string }>) => {
      hitCountsAdapter.upsertOne(state, {
        id: action.payload.id,
        status: LoadingState.ERRORED,
        error: action.payload.error,
      });
    },
  },
});

const hitCountsSelectors = hitCountsAdapter.getSelectors<UIState>(
  (state: UIState) => state.hitCounts
);

const MAX_LINE_HITS_TO_FETCH = 1000;
// This will fetch hitCounts in chunks of lines. So if line 4 is request, lines
// 1-1000 will be fetched. If line 1001 is requested, lines 1001-2000 will be
// fetched.
export const getBoundsForLineNumber = (line: number) => {
  const lower = Math.floor(line / MAX_LINE_HITS_TO_FETCH) * MAX_LINE_HITS_TO_FETCH;
  const upper = lower + MAX_LINE_HITS_TO_FETCH;
  return {
    lower,
    upper,
  };
};

export const getCacheKeyForFocusRegion = (state: UIState) => {
  const focusRegion = getFocusRegion(state);
  if (!focusRegion) {
    return "";
  }
  const range = rangeForFocusRegion(focusRegion);
  return `${range.begin.point}-${range.end.point}`;
};

// We need to refetch if: we are beyond the maximum number of line hits
// fetchable OR the focusRegion has changed. So we use a cache key which will
// change any time either of those factors change.
export const getCacheKeyForSourceHitCounts = (
  state: UIState,
  sourceId: string,
  lineNumber: number = 0
) => {
  const sourceDetails = getSourceDetails(state, sourceId);
  if (!sourceDetails) {
    throw `Source with ID ${sourceId} not found`;
  }

  const correspondingSourceIdsSection = sourceDetails.correspondingSourceIds.join("&");
  const { lower, upper } = getBoundsForLineNumber(lineNumber);
  const lineNumberSection = `${lower}-${upper}`;
  const rangeSection = getCacheKeyForFocusRegion(state);

  return [correspondingSourceIdsSection, lineNumberSection, rangeSection].join("|");
};

export const fetchHitCounts = (sourceId: string, lineNumber: number): UIThunkAction => {
  return async (dispatch, getState, { ThreadFront }) => {
    const cacheKey = getCacheKeyForSourceHitCounts(getState(), sourceId, lineNumber);
    const status = hitCountsSelectors.selectById(getState(), cacheKey)?.status;

    if (status === LoadingState.LOADING || status === LoadingState.LOADED) {
      return;
    }

    try {
      dispatch(hitCountsRequested(cacheKey));
      const { lower, upper } = getBoundsForLineNumber(lineNumber);
      const locations = await ThreadFront.getBreakpointPositionsCompressed(sourceId);
      const locationsToFetch = locations.filter(
        location => location.line >= lower && location.line < upper
      );
      // When you fetch possible breakpoints, you will receive a list of columns
      // for each breakable line. We only display the number of times that the
      // *first* possible breakpoint on a line was hit, so we can throw the rest
      // of them away.
      locationsToFetch.map(location => {
        const sortedColumns = sortBy(location.columns, (a, b) => a - b);
        return {
          ...location,
          columns: sortedColumns.slice(0, 1),
        };
      });
      const focusRegion = getFocusRegion(getState());
      const range = focusRegion ? rangeForFocusRegion(focusRegion) : undefined;
      const correspondingSourceIds = getCorrespondingSourceIds(getState(), sourceId)!;

      const hitCounts = await fetchProtocolHitCounts(
        correspondingSourceIds,
        locationsToFetch,
        range
          ? {
              beginPoint: range.begin.point,
              endPoint: range.end.point,
            }
          : null
      );
      dispatch(hitCountsReceived({ id: cacheKey, hitCounts }));
    } catch (e) {
      dispatch(hitCountsFailed({ id: cacheKey, error: String(e) }));
      throw e;
    }
  };
};

export const { hitCountsRequested, hitCountsReceived, hitCountsFailed } = hitCountsSlice.actions;

export const getHitCountsForSource = (state: UIState, sourceId: string) => {
  const cacheKey = getCacheKeyForSourceHitCounts(state, sourceId);
  return hitCountsSelectors.selectById(state, cacheKey)?.hitCounts || null;
};

export const getHitCountsForSelectedSource = (state: UIState) => {
  const id = getSelectedSourceId(state);
  if (!id) {
    return null;
  }

  return getHitCountsForSource(state, id);
};

export default hitCountsSlice.reducer;
