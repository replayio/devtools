import { UIState } from "ui/state";
import { getVisibleSelectedFrame, getSourceWithContent, getPausePreviewLocation } from ".";
import { hasDocument } from "../utils/editor";

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
