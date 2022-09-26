import { TimelineState } from "./timeline";
import { AppState } from "./app";
import { ASTState } from "devtools/client/debugger/src/reducers/ast";
import type { AsyncRequestsState } from "devtools/client/debugger/src/reducers/async-requests";
import { BoxModelState } from "devtools/client/inspector/boxmodel/reducers/box-model";
import { BreakpointsState } from "devtools/client/debugger/src/selectors";
import type { FileSearchState } from "devtools/client/debugger/src/selectors";
import { ContextMenusState } from "../reducers/contextMenus";
import { ReactDevToolsState } from "./reactDevTools";
import { InspectorState } from "devtools/client/inspector/reducers";
import { MarkupState } from "devtools/client/inspector/markup/reducers/markup";
import { RulesState } from "devtools/client/inspector/rules/reducers/rules";
import { ComputedState } from "devtools/client/inspector/computed/state";
import { PauseState } from "devtools/client/debugger/src/reducers/pause";
import type { PendingBreakpointsState } from "devtools/client/debugger/src/selectors";
import type { PreviewState } from "devtools/client/debugger/src/reducers/preview";
import type { SourceTreeState } from "devtools/client/debugger/src/reducers/source-tree";
import { NetworkState } from "ui/reducers/network";
import { QuickOpenState } from "devtools/client/debugger/src/reducers/quick-open";
import type { TabsState } from "devtools/client/debugger/src/reducers/tabs";
import type { ThreadsState } from "devtools/client/debugger/src/reducers/threads";
import type { UISliceState } from "devtools/client/debugger/src/reducers/ui";

import { LayoutState } from "./layout";
import type { SourcesState as NewSourcesState } from "ui/reducers/sources";
import { ProtocolMessagesState } from "ui/reducers/protocolMessages";
import { HitCountsState } from "ui/reducers/hitCounts";
import { PossibleBreakpointsState } from "ui/reducers/possibleBreakpoints";

// TODO Ideally this should be inferred from store setup
export interface UIState {
  app: AppState;
  ast: ASTState;
  asyncRequests: AsyncRequestsState;
  boxModel: BoxModelState;
  breakpoints: BreakpointsState;
  computed: ComputedState;
  contextMenus: ContextMenusState;
  sources: NewSourcesState;
  fileSearch: FileSearchState;
  hitCounts: HitCountsState;
  inspector: InspectorState;
  layout: LayoutState;
  markup: MarkupState;
  network: NetworkState;
  pause: PauseState;
  pendingBreakpoints: PendingBreakpointsState;
  possibleBreakpoints: PossibleBreakpointsState;
  preview: PreviewState;
  protocolMessages: ProtocolMessagesState;
  quickOpen: QuickOpenState;
  reactDevTools: ReactDevToolsState;
  rules: RulesState;
  sourceTree: SourceTreeState;
  tabs: TabsState;
  threads: ThreadsState;
  timeline: TimelineState;
  ui: UISliceState;
}
