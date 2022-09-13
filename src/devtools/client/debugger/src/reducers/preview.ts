/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { Value, SourceLocation } from "@replayio/protocol";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import type { UIState } from "ui/state";

import { ThreadContext } from "./pause";

interface PreviewInitialFields {
  expression: string;
  // TODO DOMRects shouldn't be in Redux
  cursorPos: DOMRect;
  location: { start: SourceLocation; end: SourceLocation };
  tokenPos: SourceLocation;
}

interface PreviewStartedContents extends PreviewInitialFields {
  previewId: string;
}

interface PreviewData extends PreviewStartedContents {
  value: Value | null;
}

export type PreviewState = PreviewData | null;

const initialState = null as PreviewState;

const previewSlice = createSlice({
  name: "preview",
  initialState,
  reducers: {
    previewStarted(state, action: PayloadAction<PreviewStartedContents>) {
      return {
        ...action.payload,
        value: null,
      };
    },
    previewCleared(state, action: PayloadAction<{ previewId: string; cx: ThreadContext }>) {
      if (action.payload.previewId === state?.previewId) {
        return null;
      }
    },
    previewLoaded(
      state,
      action: PayloadAction<{ cx: ThreadContext; previewId: string; value: Value | null }>
    ) {
      const { previewId, value } = action.payload;

      if (previewId === state?.previewId) {
        state.value = value;
      }
    },
  },
});

export const { previewStarted, previewLoaded, previewCleared } = previewSlice.actions;

export default previewSlice.reducer;

export function getPreview(state: UIState) {
  return state.preview;
}
