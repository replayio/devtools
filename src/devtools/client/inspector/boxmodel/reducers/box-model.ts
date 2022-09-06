/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const LAYOUT_NUMERIC_FIELDS = [
  "position",
  "top",
  "right",
  "bottom",
  "left",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "border-top-width",
  "border-right-width",
  "border-bottom-width",
  "border-left-width",
  "z-index",
  "box-sizing",
  "display",
  "float",
  "line-height",
] as const;

// https://stackoverflow.com/a/67942573/62937
type ObjectFromList<T extends ReadonlyArray<string>, V = string> = {
  [K in T extends ReadonlyArray<infer U> ? U : never]: V;
};

export type LayoutNumericFields = ObjectFromList<typeof LAYOUT_NUMERIC_FIELDS>;

export type Layout = LayoutNumericFields & {
  width: number;
  height: number;
  autoMargins?: Record<string, number>;
};

export interface BoxModelState {
  layout: Layout;
}

const initialState: BoxModelState = {
  // Some component code tries to read values right away
  layout: {} as Layout,
};

const boxModelSlice = createSlice({
  name: "boxModel",
  initialState,
  reducers: {
    layoutUpdated(state, action: PayloadAction<Layout>) {
      state.layout = action.payload;
    },
  },
  extraReducers: builder => {
    // dispatched by actions/timeline.ts, in `playback()`
    builder.addCase("pause/resumed", (state, action) => {
      // Clear out the DOM nodes data whenever the user hits "Play" in the timeline
      state.layout = {} as Layout;
    });
  },
});

export const { layoutUpdated } = boxModelSlice.actions;

export default boxModelSlice.reducer;
