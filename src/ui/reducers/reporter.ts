import { PayloadAction, createSlice } from "@reduxjs/toolkit";

import { ProcessedTestItem, ProcessedTestStep } from "ui/components/TestSuite/types";
import { UIState } from "ui/state";

export interface ReporterState {
  selectedTestItem: ProcessedTestItem | null;
  selectedTestStep: ProcessedTestStep | null;
}

const initialState: ReporterState = {
  selectedTestItem: null,
  selectedTestStep: null,
};

const reporterSlice = createSlice({
  name: "test-suite",
  initialState,
  reducers: {
    selectTestItem(state, action: PayloadAction<ProcessedTestItem | null>) {
      state.selectedTestItem = action.payload;
    },
    selectTestStep(state, action: PayloadAction<ProcessedTestStep | null>) {
      state.selectedTestStep = action.payload;
    },
  },
});

export default reporterSlice.reducer;

export const { selectTestItem, selectTestStep } = reporterSlice.actions;

export const getSelectedTestItem = (state: UIState) => state.reporter.selectedTestItem;
export const getSelectedTestStep = (state: UIState) => state.reporter.selectedTestStep;
