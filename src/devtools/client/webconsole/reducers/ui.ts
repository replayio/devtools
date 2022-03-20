/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { createSlice, createNextState } from "@reduxjs/toolkit";

interface WebconsoleUIState {
  timestampsVisible: boolean;
}

const initialState: WebconsoleUIState = {
  timestampsVisible: false,
};

export const UiState = (overrides: Partial<WebconsoleUIState> = {}) => {
  return createNextState(initialState, draft => {
    return Object.assign(draft, overrides);
  });
};

const webconsoleUISlice = createSlice({
  name: "consoleUI",
  initialState,
  reducers: {
    toggleTimestamps(state) {
      state.timestampsVisible = !state.timestampsVisible;
    },
  },
});

export const { toggleTimestamps } = webconsoleUISlice.actions;

export const ui = webconsoleUISlice.reducer;
