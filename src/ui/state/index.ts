import { TimelineState } from "./timeline";
import { MetadataState } from "./metadata";
import { AppState } from "./app";

export interface UIState {
  timeline: TimelineState;
  metadata: MetadataState;
  app: AppState;
}
