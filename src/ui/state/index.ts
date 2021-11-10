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
import { NetworkState } from "ui/reducers/network";

export interface UIState {
  app: AppState;
  classList: ClassListState;
  comments: CommentsState;
  computed: ComputedState;
  contextMenus: ContextMenusState;
  eventListenerBreakpoints: any;
  eventTooltip: EventTooltipState;
  inspector: InspectorState;
  markup: MarkupState;
  messages: MessageState;
  network: NetworkState;
  pseudoClasses: PseudoClassesState;
  reactDevTools: ReactDevToolsState;
  rules: RulesState;
  timeline: TimelineState;
}
