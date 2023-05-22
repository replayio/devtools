import { Action, AnyAction, Store, ThunkAction } from "@reduxjs/toolkit";

import debuggerActions from "devtools/client/debugger/src/actions";
import { QuickOpenActions } from "devtools/client/debugger/src/actions/quick-open";
import * as markupActions from "devtools/client/inspector/markup/actions/markup";
import type { AppStore } from "ui/setup/store";
import { UIState } from "ui/state";
import { ThunkExtraArgs } from "ui/utils/thunk";

import * as appActions from "./app";
import * as commentsActions from "./comments";
import * as layoutActions from "./layout";
import { LayoutAction } from "./layout";
import { NetworkAction } from "./network";
import * as sessionActions from "./session";
import * as timelineActions from "./timeline";

export type UIAction = LayoutAction | NetworkAction | QuickOpenActions;

export type UIThunkAction<TReturn = void> = ThunkAction<
  TReturn,
  UIState,
  ThunkExtraArgs,
  AnyAction
>;

export type UIStore = AppStore;

const { initialAppState, ...actualAppActions } = appActions;

export const actions = {
  ...actualAppActions,
  ...commentsActions,
  ...debuggerActions,
  ...layoutActions,
  ...sessionActions,
  ...timelineActions,
  ...markupActions,
};
