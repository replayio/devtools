import { TimelineState } from "./timeline";
import { AppState } from "./app";
import { ASTState } from "devtools/client/debugger/src/reducers/ast";
import type { AsyncRequestsState } from "devtools/client/debugger/src/reducers/async-requests";
import { BoxModelState } from "devtools/client/inspector/boxmodel/reducers/box-model";
import { BreakpointsState } from "devtools/client/debugger/src/selectors";
import type { ChangesState } from "devtools/client/inspector/changes/reducers/changes";
import type { EventListenersState } from "devtools/client/debugger/src/selectors";
import type { FileSearchState } from "devtools/client/debugger/src/selectors";
import { ContextMenusState } from "../reducers/contextMenus";
import { ReactDevToolsState } from "./reactDevTools";
import { InspectorState } from "devtools/client/inspector/state";
import { MarkupState } from "devtools/client/inspector/markup/state/markup";
import { ClassListState } from "devtools/client/inspector/rules/state/class-list";
import { RulesState } from "devtools/client/inspector/rules/state/rules";
import { ComputedState } from "devtools/client/inspector/computed/state";
import { MessageState } from "devtools/client/webconsole/reducers/messages";
import { PauseState } from "devtools/client/debugger/src/selectors";
import type { PendingBreakpointsState } from "devtools/client/debugger/src/selectors";
import type { PreviewState } from "devtools/client/debugger/src/reducers/preview";
import type { SourcesState } from "devtools/client/debugger/src/reducers/sources";
import type { SourceActorsState } from "devtools/client/debugger/src/reducers/source-actors";
import type { SourceTreeState } from "devtools/client/debugger/src/reducers/source-tree";
import { NetworkState } from "ui/reducers/network";
import { QuickOpenState } from "devtools/client/debugger/src/reducers/quick-open";
import type { TabsState } from "devtools/client/debugger/src/reducers/tabs";
import type { ThreadsState } from "devtools/client/debugger/src/reducers/threads";
import type { WebconsoleUIState } from "devtools/client/webconsole/reducers/ui";
import type { UISliceState } from "devtools/client/debugger/src/reducers/ui";

import { LayoutState } from "./layout";
import type { SourcesState as NewSourcesState } from "ui/reducers/sources";
import { ProtocolMessagesState } from "ui/reducers/protocolMessages";
import { HitCountsState } from "ui/reducers/hitCounts";

// TODO Ideally this should be inferred from store setup
export interface UIState {
  app: AppState;
  ast: ASTState;
  asyncRequests: AsyncRequestsState;
  boxModel: BoxModelState;
  breakpoints: BreakpointsState;
  changes: ChangesState;
  classList: ClassListState;
  computed: ComputedState;
  consoleUI: WebconsoleUIState;
  contextMenus: ContextMenusState;
  eventListenerBreakpoints: EventListenersState;
  experimentalSources: NewSourcesState;
  fileSearch: FileSearchState;
  hitCounts: HitCountsState;
  inspector: InspectorState;
  layout: LayoutState;
  markup: MarkupState;
  messages: MessageState;
  network: NetworkState;
  pause: PauseState;
  pendingBreakpoints: PendingBreakpointsState;
  preview: PreviewState;
  protocolMessages: ProtocolMessagesState;
  quickOpen: QuickOpenState;
  reactDevTools: ReactDevToolsState;
  rules: RulesState;
  sourceActors: SourceActorsState;
  sourceTree: SourceTreeState;
  sources: SourcesState;
  tabs: TabsState;
  threads: ThreadsState;
  timeline: TimelineState;
  ui: UISliceState;
}
