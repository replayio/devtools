import { PayloadAction, createSelector, createSlice } from "@reduxjs/toolkit";

import { compareNumericStrings } from "protocol/utils";
import { UIState } from "ui/state";
import { Annotation } from "ui/types";

export interface ReporterState {
  annotations: Annotation[];
}

const initialState: ReporterState = {
  annotations: [],
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
  },
});

export default reporterSlice.reducer;
export const { addReporterAnnotations } = reporterSlice.actions;
export const getReporterAnnotations = (state: UIState) => state.reporter.annotations;
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
export const getReporterAnnotationsForTitleNavigation = (title: string) =>
  createSelector(getReporterAnnotations, (annotations: Annotation[]) =>
    annotations.filter(
      a =>
        a.message.titlePath[a.message.titlePath.length - 1] === title &&
        a.message.event === "event:navigation"
    )
  );
