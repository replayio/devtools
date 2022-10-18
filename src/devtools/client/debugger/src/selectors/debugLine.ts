import { UIState } from "ui/state";

import { getPausePreviewLocation } from "../reducers/pause";
import { getSourceContentsEntry } from "ui/reducers/sources";
import { hasDocument } from "../utils/editor";

import { getSelectedFrameSuspense } from "./pause";

export function getDebugLineLocationSuspense(state: UIState) {
  const frame = getSelectedFrameSuspense(state);
  const previewLocation = getPausePreviewLocation(state);
  const location = previewLocation || (frame && frame.location);
  if (!location) {
    return undefined;
  }
  const source = getSourceContentsEntry(state, location.sourceId);
  if (source && source.value && hasDocument(location.sourceId)) {
    return location;
  }
}
