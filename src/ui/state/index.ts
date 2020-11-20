import { TimelineState } from "./timeline";
import { MetadataState } from "./metadata";
import { AppState } from "./app";
import { InspectorState } from "devtools/client/inspector/state";
import { MarkupState } from "devtools/client/inspector/markup/state/markup";

export interface UIState {
  timeline: TimelineState;
  metadata: MetadataState;
  app: AppState;
  inspector: InspectorState;
  markup: MarkupState;
}
