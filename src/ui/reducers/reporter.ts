import { PayloadAction, createSelector, createSlice } from "@reduxjs/toolkit";

import { compareNumericStrings } from "protocol/utils";
import { UIState } from "ui/state";
import { Annotation } from "ui/types";
import { updateUrlWithParams } from "ui/utils/environment";

export interface ReporterState {
  annotations: Annotation[];
  selectedStep: SelectedStep | null;
  selectedTest: number | null;
}

type SelectedStep = {
  id: string;
  startTime: number;
  endTime: number;
};

const initialState: ReporterState = {
  annotations: [],
  selectedStep: null,
  selectedTest: null,
};

const reporterSlice = createSlice({
  name: "pause",
  initialState,
  reducers: {
    addReporterAnnotations(state, action: PayloadAction<Annotation[]>) {
      const annotations = [...state.annotations, ...action.payload];
      annotations.sort((a1, a2) => compareNumericStrings(a1.point, a2.point));

      state.annotations = annotations;
    },
    setSelectedStep(state, action: PayloadAction<SelectedStep | null>) {
      // This is not ideal since we're duplicating data that's being composed elsewhere.
      // Ideally we would have a selectedStepId, and a list of steps to query to get that
      // data instead.
      state.selectedStep = action.payload;
    },
    setSelectedTest(state, action: PayloadAction<number | null>) {
      updateUrlWithParams({ testIndex: JSON.stringify(action.payload) });
      state.selectedTest = action.payload;
    },
  },
});

export default reporterSlice.reducer;
export const { addReporterAnnotations, setSelectedStep, setSelectedTest } = reporterSlice.actions;
export const getReporterAnnotations = (state: UIState) => state.reporter.annotations;
export const getSelectedStep = (state: UIState) => state.reporter.selectedStep;
export const getSelectedTest = (state: UIState) => state.reporter.selectedTest;
export const getReporterAnnotationsForTests = createSelector(
  getReporterAnnotations,
  (annotations: Annotation[]) => annotations.filter(a => a.message.event === "test:start")
);
export const getReporterAnnotationsForTitle = (title: string) =>
  createSelector(getReporterAnnotations, (annotations: Annotation[]) =>
    annotations.filter(
      a =>
        a.message.titlePath[a.message.titlePath.length - 1] === title &&
        a.message.event === "step:enqueue"
    )
  );
export const getReporterAnnotationsForTitleEnd = (title: string) =>
  createSelector(getReporterAnnotations, (annotations: Annotation[]) =>
    annotations.filter(
      a =>
        a.message.titlePath[a.message.titlePath.length - 1] === title &&
        a.message.event === "step:end"
    )
  );
export const getReporterAnnotationsForTitleStart = (title: string) =>
  createSelector(getReporterAnnotations, (annotations: Annotation[]) =>
    annotations.filter(
      a =>
        a.message.titlePath[a.message.titlePath.length - 1] === title &&
        a.message.event === "step:start"
    )
  );
export const getReporterAnnotationsForTitleNavigation = (title: string) =>
  createSelector(getReporterAnnotations, (annotations: Annotation[]) =>
    annotations.filter(
      a =>
        a.message.titlePath[a.message.titlePath.length - 1] === title &&
        a.message.event === "event:navigation"
    )
  );
