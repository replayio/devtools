import { createListenerMiddleware, addListener, nanoid } from "@reduxjs/toolkit";
import type { TypedStartListening, TypedAddListener } from "@reduxjs/toolkit";
import type { AnyListenerPredicate } from "@reduxjs/toolkit/dist/listenerMiddleware/types";
import type { UIThunkAction } from "ui/actions";

import type { AppDispatch } from "./store";
import type { UIState } from "ui/state";

export const listenerMiddleware = createListenerMiddleware();

export type AppStartListening = TypedStartListening<UIState, AppDispatch>;

export const startAppListening = listenerMiddleware.startListening as AppStartListening;

export const addAppListener = addListener as TypedAddListener<UIState, AppDispatch>;

/**
 * A hacky but useful utility to add a one-shot RTK listener that
 * returns a promise that resolves when the given `predicate` returns true.
 * This allows for scenarios like "wait for this action" or "wait for this
 * state value" from inside a thunk.
 *
 * Usage:
 * ```ts
 * await dispatch(
 *   listenForCondition(
 *     (action, currState, prevState) => state.counter.value > 3
 *   )
 * )
 * ```
 */
export const listenForCondition =
  (predicate: AnyListenerPredicate<UIState>, timeout?: number): UIThunkAction =>
  dispatch => {
    // Listeners can only start in response to an action.
    // Define a unique and useless action type we can dispatch to trigger this.
    const dummyTriggeringActionType = `conditionListenerTrigger-${nanoid()}`;

    return new Promise<boolean>((resolve, reject) => {
      dispatch(
        addListener({
          type: dummyTriggeringActionType,
          effect: (_, { condition, unsubscribe }) =>
            condition(predicate as AnyListenerPredicate<unknown>, timeout)
              .then(resolve)
              .catch(reject)
              .finally(unsubscribe),
        })
      );
      dispatch({ type: dummyTriggeringActionType });
    });
  };
