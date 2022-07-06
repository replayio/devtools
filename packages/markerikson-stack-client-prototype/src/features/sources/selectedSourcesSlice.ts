import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PointDescription } from "@replayio/protocol";

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
