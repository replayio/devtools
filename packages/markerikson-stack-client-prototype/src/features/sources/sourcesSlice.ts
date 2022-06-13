import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SourcesState {
  selectedSourceId: string | null;
}

const initialState: SourcesState = {
  selectedSourceId: null,
};

const sourcesSlice = createSlice({
  name: "sources",
  initialState,
  reducers: {
    sourceEntrySelected(state, action: PayloadAction<string | null>) {
      state.selectedSourceId = action.payload;
    },
  },
});

export const { sourceEntrySelected } = sourcesSlice.actions;
export default sourcesSlice.reducer;
