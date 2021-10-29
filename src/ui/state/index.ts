import { TimelineState } from "./timeline";
import { AppState } from "./app";
import { CommentsState } from "./comments";
import { ContextMenusState } from "../reducers/contextMenus";
import { ReactDevToolsState } from "./reactDevTools";
import { InspectorState } from "devtools/client/inspector/state";
import { MarkupState } from "devtools/client/inspector/markup/state/markup";
import { EventTooltipState } from "devtools/client/inspector/markup/state/eventTooltip";
import { ClassListState } from "devtools/client/inspector/rules/state/class-list";
import { PseudoClassesState } from "devtools/client/inspector/rules/state/pseudo-classes";
import { RulesState } from "devtools/client/inspector/rules/state/rules";
import { ComputedState } from "devtools/client/inspector/computed/state";
import { MessageState } from "devtools/client/webconsole/reducers/messages";

export interface UIState {
  timeline: TimelineState;
  app: AppState;
  comments: CommentsState;
  contextMenus: ContextMenusState;
  reactDevTools: ReactDevToolsState;
  inspector: InspectorState;
  markup: MarkupState;
  messages: MessageState;
  eventTooltip: EventTooltipState;
  classList: ClassListState;
  pseudoClasses: PseudoClassesState;
  rules: RulesState;
  computed: ComputedState;
  eventListenerBreakpoints: any;
}
