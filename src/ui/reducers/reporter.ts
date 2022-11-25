import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { ExecutionPoint } from "@replayio/protocol";

import { compareNumericStrings } from "protocol/utils";
import { UIState } from "ui/state";

type TestEvents = "test:start" | "step:end" | "step:enqueue" | "step:start";

type CypressAnnotationMessage = {
  event: TestEvents;
  titlePath: string[];
  commandVariable?: "cmd" | "log";
  id?: string;
};
export interface Annotation {
  point: ExecutionPoint;
  time: number;
  message: CypressAnnotationMessage;
}

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
export const getReporterAnnotationsForTests = (state: UIState) =>
  state.reporter.annotations.filter(a => a.message.event === "test:start");
export const getReporterAnnotationsForTitle = (title: string) => (state: UIState) =>
  state.reporter.annotations.filter(
    a =>
      a.message.titlePath[a.message.titlePath.length - 1] === title &&
      a.message.event === "step:enqueue"
  );
