import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PointDescription } from "@replayio/protocol";
import { createMachine } from "@xstate/fsm";

interface SourcesState {
  selectedSourceId: string | null;
  selectedPoint: PointDescription | null;
}

const initialState: SourcesState = {
  selectedSourceId: null,
  selectedPoint: null,
};

const sourcesSlice = createSlice({
  name: "sources",
  initialState,
  reducers: {
    sourceEntrySelected(state, action: PayloadAction<string | null>) {
      state.selectedSourceId = action.payload;
    },
    pointSelected(state, action: PayloadAction<PointDescription | null>) {
      state.selectedPoint = action.payload;
    },
  },
});

export const { sourceEntrySelected, pointSelected } = sourcesSlice.actions;
export default sourcesSlice.reducer;

export const toggleMachine = createMachine({
  id: "toggle",
  initial: "inactive",
  states: {
    inactive: { on: { TOGGLE: "active" } },
    active: { on: { TOGGLE: "inactive" } },
  },
});
