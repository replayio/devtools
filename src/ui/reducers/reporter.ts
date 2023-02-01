import { PayloadAction, createSelector, createSlice } from "@reduxjs/toolkit";

import { compareNumericStrings } from "protocol/utils";
import { AnnotatedTestStep, Annotation } from "shared/graphql/types";
import { UIState } from "ui/state";

export interface ReporterState {
  annotations: Annotation[];
  annotationsComplete: boolean;
  selectedStep: AnnotatedTestStep | null;
  selectedTest: number | null;
  selectedTestTitle: string | null;
}

const initialState: ReporterState = {
  annotations: [],
  annotationsComplete: false,
  selectedStep: null,
  selectedTest: null,
  selectedTestTitle: null,
};

const reporterSlice = createSlice({
  name: "pause",
  initialState,
  reducers: {
    completeReporterAnnotations(state) {
      state.annotationsComplete = true;
    },
    addReporterAnnotations(state, action: PayloadAction<Annotation[]>) {
      const annotations = [...state.annotations, ...action.payload];
      annotations.sort((a1, a2) => compareNumericStrings(a1.point, a2.point));

      state.annotations = annotations;
    },
    setSelectedStep(state, action: PayloadAction<AnnotatedTestStep | null>) {
      // This is not ideal since we're duplicating data that's being composed elsewhere.
      // Ideally we would have a selectedStepId, and a list of steps to query to get that
      // data instead.
      state.selectedStep = action.payload;
    },
    setSelectedTest(state, action: PayloadAction<{ index: number; title: string } | null>) {
      state.selectedTest = action.payload?.index ?? null;
      state.selectedTestTitle = action.payload?.title ?? null;
    },
    mayClearSelectedStep(state, action: PayloadAction<{ point?: string; time?: number }>) {
      const { point, time } = action.payload;

      if ((point || time) && state.selectedStep) {
        const points = [
          state.selectedStep.annotations.start?.point,
          state.selectedStep.annotations.end?.point,
        ];

        const times = [state.selectedStep.absoluteStartTime, state.selectedStep.absoluteEndTime];

        if ((point && points.includes(point)) || (time && times.includes(time))) {
          return;
        }
      }

      state.selectedStep = null;
    },
  },
});

export default reporterSlice.reducer;
export const {
  addReporterAnnotations,
  completeReporterAnnotations,
  setSelectedStep,
  setSelectedTest,
  mayClearSelectedStep,
} = reporterSlice.actions;
export const getReporterAnnotations = (state: UIState) => state.reporter.annotations;
export const getReporterAnnotationsComplete = (state: UIState) =>
  state.reporter.annotationsComplete;
export const getSelectedStep = (state: UIState) => state.reporter.selectedStep;
export const getSelectedTest = (state: UIState) => state.reporter.selectedTest;
export const getSelectedTestTitle = (state: UIState) => state.reporter.selectedTestTitle;
export const getReporterAnnotationsForTests = createSelector(
  getReporterAnnotations,
  (annotations: Annotation[]) => annotations.filter(a => a.message.event === "test:start")
);
export const getReporterAnnotationsForTitle = createSelector(
  getSelectedTestTitle,
  getReporterAnnotations,
  (title, annotations) =>
    title
      ? annotations.filter(
          a =>
            a.message.titlePath[a.message.titlePath.length - 1] === title &&
            a.message.event === "step:enqueue"
        )
      : []
);
export const getReporterAnnotationsForTitleEnd = createSelector(
  getSelectedTestTitle,
  getReporterAnnotations,
  (title, annotations) => {
    if (!title) {
      return [];
    }

    const acc = new Map<string, Annotation>();
    annotations.forEach(a => {
      const id = a.message.id;
      if (
        id &&
        a.message.titlePath[a.message.titlePath.length - 1] === title &&
        a.message.event === "step:end" &&
        (!acc.has(id) || compareNumericStrings(acc.get(id)!.point, a.point))
      ) {
        acc.set(id, a);
      }
    });

    return Array.from(acc.values());
  }
);
export const getReporterAnnotationsForTitleStart = createSelector(
  getSelectedTestTitle,
  getReporterAnnotations,
  (title, annotations) =>
    title
      ? annotations.filter(
          a =>
            a.message.titlePath[a.message.titlePath.length - 1] === title &&
            a.message.event === "step:start"
        )
      : []
);
export const getReporterAnnotationsForTitleNavigation = createSelector(
  getSelectedTestTitle,
  getReporterAnnotations,
  (title, annotations) =>
    title
      ? annotations.filter(
          a =>
            a.message.titlePath[a.message.titlePath.length - 1] === title &&
            a.message.event === "event:navigation"
        )
      : []
);
