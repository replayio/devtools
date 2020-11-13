import { TimelineState } from "./timeline";
import { MetadataState } from "./metadata";
import { AppState } from "./app";
import { InspectorState } from "devtools/client/inspector/state";

export interface UIState {
  timeline: TimelineState;
  metadata: MetadataState;
  app: AppState;
  inspector: InspectorState;
  markup: any;
}
