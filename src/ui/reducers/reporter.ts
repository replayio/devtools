import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { ExecutionPoint } from "@replayio/protocol";

import { compareNumericStrings } from "protocol/utils";
import { UIState } from "ui/state";

type CypressAnnotationMessage = {
  event: "test:start";
  titlePath: string[];
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
