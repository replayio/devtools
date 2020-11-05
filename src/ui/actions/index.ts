import { Store } from "redux";
import * as appActions from "./app";
import * as timelineActions from "./timeline";
import * as metadataActions from "./metadata";
import { ThunkAction } from "ui/utils/thunk";
import { UIState } from "ui/state";
import type { AppAction } from "./app";
import type { MetadataAction } from "./metadata";
import type { TimelineAction } from "./timeline";
import * as eventListeners from "devtools/client/debugger/src/actions/event-listeners";
import debuggerActions from "devtools/client/debugger/src/actions";

export type UIAction = AppAction | MetadataAction | TimelineAction;

interface ThunkExtraArgs {
  client: any;
  panels: any;
  prefsService: any;
  toolbox: any;
  parser: any;
  search: any;
}

export type UIThunkAction<TReturn = void> = ThunkAction<TReturn, UIState, ThunkExtraArgs, UIAction>;

export type UIStore = Store<UIState, UIAction>;

export const actions = {
  ...appActions,
  ...timelineActions,
  ...metadataActions,
  ...eventListeners,
  ...debuggerActions,
};
