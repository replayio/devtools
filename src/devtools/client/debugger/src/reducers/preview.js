/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { uniqueId } from "lodash";

//

export function initialPreviewState() {
  return {
    preview: null,
  };
}

function update(state = initialPreviewState(), action) {
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

// NOTE: we'd like to have the app state fully typed
// https://github.com/firefox-devtools/debugger/blob/master/src/reducers/sources.js#L179-L185

export function getPreview(state) {
  return state.preview.preview;
}

export default update;
