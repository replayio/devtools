import { getSourceContent } from "ui/reducers/sources";
import { UIState } from "ui/state";

import { getPausePreviewLocation } from "../reducers/pause";
import { hasDocument } from "../utils/editor";

import { getVisibleSelectedFrame } from "./pause";

export function getDebugLineLocation(state: UIState) {
  const frame = getVisibleSelectedFrame(state);
  const previewLocation = getPausePreviewLocation(state);
  const location = previewLocation || (frame && frame.location);
  if (!location) {
    return undefined;
  }
  const source = getSourceContent(state, location.sourceId);
  if (source && source.value && hasDocument(location.sourceId)) {
    return location;
  }
}
