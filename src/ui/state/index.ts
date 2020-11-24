import { TimelineState } from "./timeline";
import { MetadataState } from "./metadata";
import { AppState } from "./app";
import { InspectorState } from "devtools/client/inspector/state";
import { MarkupState } from "devtools/client/inspector/markup/state/markup";
import { EventTooltipState } from "devtools/client/inspector/markup/state/eventTooltip";

export interface UIState {
  timeline: TimelineState;
  metadata: MetadataState;
  app: AppState;
  inspector: InspectorState;
  markup: MarkupState;
  eventTooltip: EventTooltipState;
}
