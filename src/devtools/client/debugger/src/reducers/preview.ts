/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import uniqueId from "lodash/uniqueId";
import type { AnyAction } from "@reduxjs/toolkit";
import type { UIState } from "ui/state";

import type { Preview } from "./types";

export interface PreviewState {
  preview: (Preview & { previewId: string }) | null;
}

export function initialPreviewState(): PreviewState {
  return {
    preview: null,
  };
}

function update(state = initialPreviewState(), action: AnyAction) {
  switch (action.type) {
    case "CLEAR_PREVIEW": {
      if (action.previewId !== state.preview?.previewId) {
        return state;
      }

      return { preview: null };
    }

    case "START_PREVIEW": {
      return {
        preview: {
          ...action.value,
          previewId: uniqueId(),
        },
      };
    }

    case "COMPLETE_PREVIEW": {
      const { previewId, value } = action;
      if (previewId !== state.preview?.previewId) {
        return state;
      }

      return {
        preview: {
          ...state.preview,
          ...value,
        },
      };
    }
  }

  return state;
}

export function getPreview(state: UIState) {
  return state.preview.preview;
}

export default update;
