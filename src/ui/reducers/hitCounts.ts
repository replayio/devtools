import { createEntityAdapter, createSlice, EntityState, PayloadAction } from "@reduxjs/toolkit";
import { Location } from "@replayio/protocol";
import { UIThunkAction } from "ui/actions";
import { UIState } from "ui/state";
import { rangeForFocusRegion } from "ui/utils/timeline";
import { getCorrespondingSourceIds, getSourceDetails } from "./sources";
import { getFocusRegion } from "./timeline";
import { fetchProtocolHitCounts, firstColumnForLocations } from "protocol/thread/hitCounts";
import { listenForCondition } from "ui/setup/listenerMiddleware";
import { LoadingStatus } from "ui/utils/LoadingStatus";
import { createSelector } from "reselect";
import uniqBy from "lodash/uniqBy";

export interface HitCount {
  location: Location;
  hits: number;
}

export type HitCountsByLine = Record<number, HitCount[]>;

export interface SourceHitCounts {
  error?: string;
  hitCounts?: HitCount[];
  id: string;
  status: LoadingStatus;
}

export type HitCountsState = {
  aggregateHitCounts: EntityState<SourceHitCounts>;
  hitCounts: EntityState<SourceHitCounts>;
};

const hitCountsAdapter = createEntityAdapter<SourceHitCounts>();
const aggregateHitCountsAdapter = createEntityAdapter<SourceHitCounts>();
const initialState = {
  aggregateHitCounts: aggregateHitCountsAdapter.getInitialState(),
  hitCounts: hitCountsAdapter.getInitialState(),
};

const hitCountsSlice = createSlice({
  name: "hitCounts",
  initialState,
  reducers: {
    hitCountsRequested: (state, action: PayloadAction<string>) => {
      hitCountsAdapter.upsertOne(state.hitCounts, {
        id: action.payload,
        status: LoadingStatus.LOADING,
      });
    },
    hitCountsReceived: (state, action: PayloadAction<{ id: string; hitCounts: HitCount[] }>) => {
      hitCountsAdapter.upsertOne(state.hitCounts, {
        ...action.payload,
        status: LoadingStatus.LOADED,
      });
      const id = removeLineNumbersFromCacheKey(action.payload.id);
      const existing = state.aggregateHitCounts.entities[id];
      aggregateHitCountsAdapter.upsertOne(state.aggregateHitCounts, {
        id,
        hitCounts: [...(existing?.hitCounts ?? []), ...action.payload.hitCounts],
        status: LoadingStatus.LOADED,
      });
    },
    hitCountsFailed: (state, action: PayloadAction<{ id: string; error: string }>) => {
      hitCountsAdapter.upsertOne(state.hitCounts, {
        id: action.payload.id,
        status: LoadingStatus.ERRORED,
        error: action.payload.error,
      });
    },
  },
});

const hitCountsSelectors = hitCountsAdapter.getSelectors<UIState>(
  (state: UIState) => state.hitCounts.hitCounts
);
const aggregateHitCountsSelectors = aggregateHitCountsAdapter.getSelectors<UIState>(
  (state: UIState) => state.hitCounts.aggregateHitCounts
);

const MAX_LINE_HITS_TO_FETCH = 100;
// This will fetch hitCounts in chunks of lines. So if line 4 is request, lines
// 1-100 will be fetched. If line 101 is requested, lines 101-200 will be
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

  return [lineNumberSection, correspondingSourceIdsSection, rangeSection].join("|");
};
const removeLineNumbersFromCacheKey = (cacheKey: string) =>
  cacheKey.slice(cacheKey.indexOf("|") + 1, cacheKey.length);

export const fetchHitCounts = (sourceId: string, lineNumber: number): UIThunkAction => {
  return async (dispatch, getState, { ThreadFront }) => {
    const cacheKey = getCacheKeyForSourceHitCounts(getState(), sourceId, lineNumber);
    const status = hitCountsSelectors.selectById(getState(), cacheKey)?.status;

    if (status === LoadingStatus.LOADING) {
      // in flight - resolve this thunk's promise when it completes
      // TODO Replace this with RTK Query!
      return dispatch(
        listenForCondition(() => {
          // Check the status of this source after every action
          const status = hitCountsSelectors.selectById(getState(), cacheKey)?.status;
          return status === LoadingStatus.LOADED;
        })
      );
    }
    if (status === LoadingStatus.LOADED) {
      return;
    }

    try {
      dispatch(hitCountsRequested(cacheKey));
      const { lower, upper } = getBoundsForLineNumber(lineNumber);
      const locations = await ThreadFront.getBreakpointPositionsCompressed(sourceId);
      // When you fetch possible breakpoints, you will receive a list of columns
      // for each breakable line. We only display the number of times that the
      // *first* possible breakpoint on a line was hit, so we can throw the rest
      // of them away.
      const firstColumnLocations = firstColumnForLocations(
        locations.filter(location => location.line >= lower && location.line < upper)
      );
      const focusRegion = getFocusRegion(getState());
      const range = focusRegion ? rangeForFocusRegion(focusRegion) : undefined;
      const correspondingSourceIds = getCorrespondingSourceIds(getState(), sourceId);
      // See https://linear.app/replay/issue/FE-412/two-different-responses-to-the-same-protocol-message-in-a-single
      await Promise.all(
        correspondingSourceIds.map(sourceId =>
          ThreadFront.getBreakpointPositionsCompressed(sourceId)
        )
      );

      const hitCounts = await fetchProtocolHitCounts(
        correspondingSourceIds,
        firstColumnLocations,
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
    }
  };
};

export const { hitCountsRequested, hitCountsReceived, hitCountsFailed } = hitCountsSlice.actions;

export const getHitCountsForSource = (state: UIState, sourceId: string) => {
  const cacheKey = removeLineNumbersFromCacheKey(getCacheKeyForSourceHitCounts(state, sourceId, 0));
  const aggregatedEntry = aggregateHitCountsSelectors.selectById(state, cacheKey);
  return aggregatedEntry?.hitCounts || null;
};

export const getHitCountsStatusForSourceByLine = (
  state: UIState,
  sourceId: string,
  line: number
) => {
  const cacheKey = getCacheKeyForSourceHitCounts(state, sourceId, line);
  const statusEntry = hitCountsSelectors.selectById(state, cacheKey);
  return statusEntry?.status || null;
};

export const getHitCountsForSourceByLine = createSelector(getHitCountsForSource, hitCounts => {
  if (!hitCounts) {
    return null;
  }
  const hitCountsByLine: HitCountsByLine = {};
  for (const hitCount of hitCounts) {
    const line = hitCount.location.line;
    if (!hitCountsByLine[line]) {
      hitCountsByLine[line] = [];
    }
    hitCountsByLine[line].push(hitCount);
  }
  return hitCountsByLine;
});

export const getUniqueHitCountsChunksForLines = (...lines: number[]) => {
  const lineChunks = lines.map(line => getBoundsForLineNumber(line));
  const uniqueChunks = uniqBy(lineChunks, chunk => chunk.lower);
  return uniqueChunks;
};

export default hitCountsSlice.reducer;
