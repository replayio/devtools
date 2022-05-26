import { UIState } from "ui/state";

import { getPausePreviewLocation } from "../reducers/pause";
import { getSourceWithContent } from "../reducers/sources";
import { hasDocument } from "../utils/editor";

import { getVisibleSelectedFrame } from "./pause";

export function getDebugLineLocation(state: UIState) {
  const frame = getVisibleSelectedFrame(state);
  const previewLocation = getPausePreviewLocation(state);
  const location = previewLocation || (frame && frame.location);
  if (!location) {
    return undefined;
  }
  const source = getSourceWithContent(state, location.sourceId);
  if (source && source.content && hasDocument(location.sourceId)) {
    return location;
  }
}
