import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PointDescription, Location } from "@replayio/protocol";

type PartialLocation = Pick<Location, "line" | "column">;
interface SourcesState {
  selectedSourceId: string | null;
  selectedLocation: PartialLocation | null;
  selectedPoint: PointDescription | null;
}

const initialState: SourcesState = {
  selectedSourceId: null,
  selectedLocation: null,
  selectedPoint: null,
};

const sourcesSlice = createSlice({
  name: "sources",
  initialState,
  reducers: {
    sourceEntrySelected(state, action: PayloadAction<string | null>) {
      state.selectedSourceId = action.payload;
    },
    locationSelected(state, action: PayloadAction<PartialLocation | null>) {
      state.selectedLocation = action.payload;
    },
    pointSelected(state, action: PayloadAction<PointDescription | null>) {
      state.selectedPoint = action.payload;
    },
  },
});

export const { sourceEntrySelected, pointSelected, locationSelected } = sourcesSlice.actions;
export default sourcesSlice.reducer;
