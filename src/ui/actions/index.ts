import { Action, Store } from "redux";

import * as appActions from "./app";
import * as timelineActions from "./timeline";
import * as sessionActions from "./session";
import * as commentsActions from "./comments";
import * as reactDevToolsActions from "./reactDevTools";
import { ThunkAction, ThunkExtraArgs } from "ui/utils/thunk";
import { UIState } from "ui/state";
import type { AppActions } from "./app";
import type { TimelineActions } from "./timeline";
import type { CommentsAction } from "./comments";
import { SessionActions } from "./session";
import { ReactDevToolsAction } from "./reactDevTools";
import * as eventListeners from "devtools/client/debugger/src/actions/event-listeners";
import debuggerActions from "devtools/client/debugger/src/actions";
import { MarkupAction } from "devtools/client/inspector/markup/actions/markup";
import { EventTooltipAction } from "devtools/client/inspector/markup/actions/eventTooltip";
import UserProperties from "devtools/client/inspector/rules/models/user-properties";
import consoleActions from "devtools/client/webconsole/actions";
import { NetworkAction } from "./network";

type DebuggerAction = Action<"RESUME" | "CLEAR_FRAME_POSITIONS">;

export type UIAction =
  | AppActions
  | CommentsAction
  | DebuggerAction
  | EventTooltipAction
  | MarkupAction
  | NetworkAction
  | ReactDevToolsAction
  | SessionActions
  | TimelineActions;

export type UIThunkAction<TReturn = void> = ThunkAction<TReturn, UIState, ThunkExtraArgs, UIAction>;

export type UIStore = Store<UIState, UIAction> & {
  userProperties?: UserProperties;
};

export const actions = {
  ...appActions,
  ...timelineActions,
  ...commentsActions,
  ...reactDevToolsActions,
  ...eventListeners,
  ...debuggerActions,
  ...consoleActions,
  ...sessionActions,
};
