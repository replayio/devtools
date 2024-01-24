import type { TypedStartListening } from "@reduxjs/toolkit";
import { createListenerMiddleware } from "@reduxjs/toolkit";

import type { UIState } from "ui/state";
import { ThunkExtraArgs, extraThunkArgs } from "ui/utils/thunk";

import type { AppDispatch } from "./store";

export const listenerMiddleware = createListenerMiddleware({
  extra: extraThunkArgs,
});

export type AppStartListening = TypedStartListening<UIState, AppDispatch, ThunkExtraArgs>;

export const startAppListening = listenerMiddleware.startListening as AppStartListening;
