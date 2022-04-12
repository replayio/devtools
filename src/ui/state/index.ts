import { TimelineState } from "./timeline";
import { AppState } from "./app";
import { ASTState } from "devtools/client/debugger/src/reducers/ast";
import { BoxModelState } from "devtools/client/inspector/boxmodel/reducers/box-model";
import { BreakpointsState } from "devtools/client/debugger/src/selectors";
import { CommentsState } from "./comments";
import { ContextMenusState } from "../reducers/contextMenus";
import { ReactDevToolsState } from "./reactDevTools";
import { InspectorState } from "devtools/client/inspector/state";
import { MarkupState } from "devtools/client/inspector/markup/state/markup";
import { ClassListState } from "devtools/client/inspector/rules/state/class-list";
import { RulesState } from "devtools/client/inspector/rules/state/rules";
import { ComputedState } from "devtools/client/inspector/computed/state";
import { MessageState } from "devtools/client/webconsole/reducers/messages";
import { PauseState } from "devtools/client/debugger/src/selectors";
import type { SourcesState } from "devtools/client/debugger/src/reducers/sources";
import type { SourceActorsState } from "devtools/client/debugger/src/reducers/source-actors";
import { NetworkState } from "ui/reducers/network";
import { QuickOpenState } from "devtools/client/debugger/src/reducers/quick-open";
import type { WebconsoleUIState } from "devtools/client/webconsole/reducers/ui";

import { LayoutState } from "./layout";

// TODO Ideally this should be inferred from store setup
export interface UIState {
  app: AppState;
  ast: ASTState;
  boxModel: BoxModelState;
  breakpoints: BreakpointsState;
  classList: ClassListState;
  comments: CommentsState;
  computed: ComputedState;
  consoleUI: WebconsoleUIState;
  contextMenus: ContextMenusState;
  eventListenerBreakpoints: any;
  inspector: InspectorState;
  layout: LayoutState;
  markup: MarkupState;
  messages: MessageState;
  network: NetworkState;
  pause: PauseState;
  quickOpen: QuickOpenState;
  reactDevTools: ReactDevToolsState;
  rules: RulesState;
  sources: SourcesState;
  sourceActors: SourceActorsState;
  timeline: TimelineState;
}
