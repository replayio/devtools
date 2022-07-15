import { createEntityAdapter, createSlice, EntityState, PayloadAction } from "@reduxjs/toolkit";
import type { Location, SameLineSourceLocations } from "@replayio/protocol";
import uniq from "lodash/uniq";
import {
  fetchProtocolPossibleBreakpoints,
  sameLineSourceLocationsToLocationList,
} from "protocol/thread/possibleBreakpoints";
import { UIThunkAction } from "ui/actions";
import { UIState } from "ui/state";
import { listenForCondition } from "ui/setup/listenerMiddleware";

export enum LoadingStatus {
  LOADING = "loading",
  LOADED = "loaded",
  ERRORED = "errored",
}

export interface PossibleBreakpoints {
  error?: string;
  id: string;
  possibleBreakpoints?: Location[];
  status: LoadingStatus;
}

export type PossibleBreakpointsState = EntityState<PossibleBreakpoints>;

const adapter = createEntityAdapter<PossibleBreakpoints>();

const initialState = adapter.getInitialState();

const possibleBreakpointsSlice = createSlice({
  name: "breakableLines",
  initialState,
  reducers: {
    possibleBreakpointsRequested: (state, action: PayloadAction<string>) => {
      adapter.upsertOne(state, {
        id: action.payload,
        status: LoadingStatus.LOADING,
      });
    },
    possibleBreakpointsReceived: (
      state,
      action: PayloadAction<{ sourceId: string; possibleBreakpoints: Location[] }>
    ) => {
      adapter.upsertOne(state, {
        possibleBreakpoints: action.payload.possibleBreakpoints,
        id: action.payload.sourceId,
        status: LoadingStatus.LOADED,
      });
    },
    possibleBreakpointsErrored: (
      state,
      action: PayloadAction<{ sourceId: string; error: string }>
    ) => {
      adapter.upsertOne(state, {
        error: action.payload.error,
        id: action.payload.sourceId,
        status: LoadingStatus.ERRORED,
      });
    },
  },
});

const adapterSelectors = adapter.getSelectors<UIState>(state => state.possibleBreakpoints);

export function getLocationKey(location: Location & { scriptId?: string }) {
  const { sourceId, line, column } = location;
  const columnString = column || "";
  return `${sourceId || location.scriptId}:${line}:${columnString}`;
}

export const fetchPossibleBreakpointsForSource = (
  sourceId: string
): UIThunkAction<Promise<void>> => {
  return async (dispatch, getState) => {
    const status = adapterSelectors.selectById(getState(), sourceId)?.status;
    if (status === LoadingStatus.LOADING) {
      // in flight - resolve this thunk's promise when it completes
      return dispatch(
        listenForCondition(() => {
          // Check the status of this source after every action
          const status = adapterSelectors.selectById(getState(), sourceId)?.status;
          return status === LoadingStatus.LOADED;
        })
      );
    }
    if (status === LoadingStatus.LOADED) {
      return;
    }
    dispatch(possibleBreakpointsSlice.actions.possibleBreakpointsRequested(sourceId));
    try {
      const lineLocations = await fetchProtocolPossibleBreakpoints(sourceId);
      dispatch(
        possibleBreakpointsSlice.actions.possibleBreakpointsReceived({
          sourceId,
          possibleBreakpoints: sameLineSourceLocationsToLocationList(lineLocations, sourceId),
        })
      );
    } catch (error) {
      dispatch(
        possibleBreakpointsSlice.actions.possibleBreakpointsErrored({
          sourceId,
          error: String(error),
        })
      );
    }
  };
};
export const getPossibleBreakpointsForSource = (state: UIState, sourceId: string) => {
  return adapterSelectors.selectById(state, sourceId)?.possibleBreakpoints;
};

export const getPossibleBreakpointsForSelectedSource = (state: UIState): Location[] => {
  const sourceId = state.sources.selectedLocation?.sourceId;
  if (!sourceId) {
    return [];
  }
  return getPossibleBreakpointsForSource(state, sourceId) || [];
};

export const getBreakableLinesForSource = (state: UIState, sourceId: string) => {
  return uniq(
    adapterSelectors
      .selectById(state, sourceId)
      ?.possibleBreakpoints?.map(location => location.line)
  );
};
export const getBreakableLinesForSelectedSource = (state: UIState) => {
  const sourceId = state.sources.selectedLocation?.sourceId;
  if (!sourceId) {
    return null;
  }
  return getBreakableLinesForSource(state, sourceId);
};

export const selectors = {
  getBreakableLinesForSelectedSource,
  getBreakableLinesForSource,
  getPossibleBreakpointsForSelectedSource,
  getPossibleBreakpointsForSource,
};

export default possibleBreakpointsSlice.reducer;
