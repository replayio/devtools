import { ReplayClientInterface } from "shared/client/types";
import { getSourceContentsEntry } from "ui/reducers/sources";
import { UIState } from "ui/state";

import { getPausePreviewLocation } from "../reducers/pause";
import { hasDocument } from "../utils/editor";
import { getSelectedFrameSuspense } from "./pause";

export function getDebugLineLocationSuspense(replayClient: ReplayClientInterface, state: UIState) {
  const frame = getSelectedFrameSuspense(replayClient, state);
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
