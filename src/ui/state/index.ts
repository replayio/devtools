import { ASTState } from "devtools/client/debugger/src/reducers/ast";
import type { AsyncRequestsState } from "devtools/client/debugger/src/reducers/async-requests";
import { PauseState } from "devtools/client/debugger/src/reducers/pause";
import type { PreviewState } from "devtools/client/debugger/src/reducers/preview";
import { QuickOpenState } from "devtools/client/debugger/src/reducers/quick-open";
import type { SourceTreeState } from "devtools/client/debugger/src/reducers/source-tree";
import type { TabsState } from "devtools/client/debugger/src/reducers/tabs";
import type { ThreadsState } from "devtools/client/debugger/src/reducers/threads";
import type { UISliceState } from "devtools/client/debugger/src/reducers/ui";
import { ComputedState } from "devtools/client/inspector/computed/state";
import { MarkupState } from "devtools/client/inspector/markup/reducers/markup";
import { InspectorState } from "devtools/client/inspector/reducers";
import { NetworkState } from "ui/reducers/network";
import { ProtocolMessagesState } from "ui/reducers/protocolMessages";
import type { SourcesState as NewSourcesState } from "ui/reducers/sources";

import { AppState } from "./app";
import { LayoutState } from "./layout";
import { ReactDevToolsState } from "./reactDevTools";
import { TimelineState } from "./timeline";

// TODO Ideally this should be inferred from store setup
export interface UIState {
  app: AppState;
  ast: ASTState;
  asyncRequests: AsyncRequestsState;
  computed: ComputedState;
  inspector: InspectorState;
  layout: LayoutState;
  markup: MarkupState;
  network: NetworkState;
  pause: PauseState;
  preview: PreviewState;
  protocolMessages: ProtocolMessagesState;
  quickOpen: QuickOpenState;
  reactDevTools: ReactDevToolsState;
  sources: NewSourcesState;
  sourceTree: SourceTreeState;
  tabs: TabsState;
  threads: ThreadsState;
  timeline: TimelineState;
  ui: UISliceState;
}
