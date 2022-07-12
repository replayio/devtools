import { createEntityAdapter, createSlice, EntityState, PayloadAction } from "@reduxjs/toolkit";
import { Location, SameLineSourceLocations } from "@replayio/protocol";
import uniq from "lodash/uniq";
import uniqBy from "lodash/uniqBy";
import { UIThunkAction } from "ui/actions";
import { UIState } from "ui/state";
import { getSelectedSourceId, SourceDetails } from "./sources";

export interface SourcePossibleBreakpoints {
  error?: string;
  possibleBreakpoints?: SameLineSourceLocations[];
  id: string;
  status: LoadingState;
}

export enum LoadingState {
  LOADING = "loading",
  LOADED = "loaded",
  ERRORED = "errored",
}

export interface PossibleBreakpointsState {
  possibleBreakpoints: EntityState<SourcePossibleBreakpoints>;
}

const possibleBreakpointsAdapter = createEntityAdapter<SourcePossibleBreakpoints>();

const initialState = {
  possibleBreakpoints: possibleBreakpointsAdapter.getInitialState(),
};

const possibleBreakpointsSlice = createSlice({
  name: "breakableLines",
  initialState,
  reducers: {
    possibleBreakpointsRequested: (state, action: PayloadAction<string>) => {
      possibleBreakpointsAdapter.upsertOne(state.possibleBreakpoints, {
        id: action.payload,
        status: LoadingState.LOADING,
      });
    },
    possibleBreakpointsReceived: (
      state,
      action: PayloadAction<{ sourceId: string; possibleBreakpoints: SameLineSourceLocations[] }>
    ) => {
      possibleBreakpointsAdapter.upsertOne(state.possibleBreakpoints, {
        possibleBreakpoints: action.payload.possibleBreakpoints,
        id: action.payload.sourceId,
        status: LoadingState.LOADED,
      });
    },
    possibleBreakpointsErrored: (
      state,
      action: PayloadAction<{ sourceId: string; error: string }>
    ) => {
      possibleBreakpointsAdapter.upsertOne(state.possibleBreakpoints, {
        error: action.payload.error,
        id: action.payload.sourceId,
        status: LoadingState.ERRORED,
      });
    },
  },
});

export function getLocationKey(location: Location & { scriptId?: string }) {
  const { sourceId, line, column } = location;
  const columnString = column || "";
  return `${sourceId || location.scriptId}:${line}:${columnString}`;
}

function filterByUniqLocation(positions: Location[]) {
  return uniqBy(positions, getLocationKey);
}

function convertToList(results: Record<number, number[]>, source: SourceDetails) {
  const { id, url } = source;
  const positions = [];

  for (const line in results) {
    for (const column of results[line]) {
      positions.push({
        line: Number(line),
        column,
        sourceId: id,
        sourceUrl: url,
      });
    }
  }

  return positions;
}

function groupByLine(results: Location[], sourceId: string, line: number) {
  const positions: Record<number, Location[]> = {};

  // Ensure that we have an entry for the line fetched
  if (typeof line === "number") {
    positions[line] = [];
  }

  for (const result of results) {
    if (!positions[result.line]) {
      positions[result.line] = [];
    }

    positions[result.line].push(result);
  }

  return positions;
}

export const fetchPossibleBreakpointsForSource = (sourceId: string): UIThunkAction => {
  return async (dispatch, getState, { ThreadFront }) => {
    const status = getState().possibleBreakpoints.possibleBreakpoints.entities[sourceId]?.status;
    if (status === LoadingState.LOADED || status === LoadingState.LOADING) {
      return;
    }
    dispatch(possibleBreakpointsSlice.actions.possibleBreakpointsRequested(sourceId));
    try {
      const lineLocations = await ThreadFront.getBreakpointPositionsCompressed(sourceId);
      dispatch(
        possibleBreakpointsSlice.actions.possibleBreakpointsReceived({
          sourceId,
          possibleBreakpoints: lineLocations,
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
  return state.possibleBreakpoints.possibleBreakpoints.entities[sourceId]?.possibleBreakpoints;
};
export const getPossibleBreakpointsForSelectedSource = (state: UIState): Location[] => {
  const sourceId = getSelectedSourceId(state);
  if (!sourceId) {
    return [];
  }
  const byLine: SameLineSourceLocations[] = getPossibleBreakpointsForSource(state, sourceId) || [];
  return byLine.flatMap(line =>
    line.columns.map(column => {
      return {
        sourceId,
        line: line.line,
        column,
      };
    })
  );
};

const possibleBreakpointSelectors = possibleBreakpointsAdapter.getSelectors<UIState>(
  (state: UIState) => state.possibleBreakpoints.possibleBreakpoints
);

export const { selectById: getPossibleBreakpointsById } = possibleBreakpointSelectors;

export const getBreakableLinesForSource = (state: UIState, sourceId: string) => {
  return uniq(
    state.possibleBreakpoints.possibleBreakpoints.entities[sourceId]?.possibleBreakpoints?.map(
      location => location.line
    )
  );
};
export const getBreakableLinesForSelectedSource = (state: UIState) => {
  const sourceId = getSelectedSourceId(state);
  if (!sourceId) {
    return null;
  }
  return getBreakableLinesForSource(state, sourceId);
};

export default possibleBreakpointsSlice.reducer;
