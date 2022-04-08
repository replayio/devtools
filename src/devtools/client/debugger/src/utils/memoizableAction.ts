/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { ThunkExtraArgs } from "ui/utils/thunk";
import type { UIThunkAction } from "ui/actions";
import type { AppStore, AppDispatch } from "ui/setup/store";
import type { Context } from "../reducers/pause";

import { asSettled, AsyncValue, isRejected } from "./async-value";
import { validateContext } from "./context";

type AppGetState = AppStore["getState"];
export type ActionThunkArgs = {
  dispatch: AppDispatch;
  getState: AppGetState;
} & ThunkExtraArgs;

/*
 * memoizableAction is a utility for actions that should only be performed
 * once per key. It is useful for loading sources, parsing symbols ...
 *
 * For TS usage, you will primarily want to provide a type for the `args` value
 * passed to each function. This can be done by defining the type inline inside
 * of `getValue` itself, and it will be inferred and used in the other methods:
 * `getValue: ( {id, line} : {id: string, line: number} => whatever
 *
 * @getValue - gets the result from the redux store
 * @createKey - creates a key for the requests map
 * @action - kicks off the async work for the action
 *
 *
 *
 * For Example
 *
 * export const setItem = memoizeableAction(
 *   "setItem",
 *   {
 *     hasValue: ({ a }, { getState }) => hasItem(getState(), a),
 *     getValue: ({ a }, { getState }) => getItem(getState(), a),
 *     createKey: ({ a }) => a,
 *     action: ({ a }, thunkArgs) => doSetItem(a, thunkArgs)
 *   }
 * );
 *
 */
export function memoizeableAction<Args, Value, Key>(
  name: string,
  {
    getValue,
    createKey,
    action,
  }: {
    getValue: (args: Args, thunkArgs: ActionThunkArgs) => AsyncValue<Value> | Value;
    createKey: (args: Args, thunkArgs: ActionThunkArgs) => Key;
    action: (args: Args, thunkArgs: ActionThunkArgs) => Promise<void> | void;
  }
) {
  const requests = new Map();
  return (args: Args & { cx?: Context }): UIThunkAction =>
    async (dispatch, getState: AppGetState, extraArgs) => {
      // TODO Consider rewriting usage sites to not need thunkArgs as an object

      // This mimics the existing pattern from the legacy "object thunk args" middleware.
      // The "action" functions given to `memoizableAction` are not thunks themselves,
      // but expect that same `{dispatch, getState, client}` object.
      const thunkArgs: ActionThunkArgs = {
        dispatch,
        getState,
        ...extraArgs,
      };

      let result = asSettled(getValue(args, thunkArgs));
      if (!result) {
        const key = createKey(args, thunkArgs);
        if (!requests.has(key)) {
          requests.set(
            key,
            (async () => {
              try {
                await action(args, thunkArgs);
              } catch (e: any) {
                console.warn(`Action ${name} had an exception:`, e, e.stack);
              } finally {
                requests.delete(key);
              }
            })()
          );
        }

        await requests.get(key);

        if (args.cx) {
          validateContext(thunkArgs.getState(), args.cx);
        }

        result = asSettled(getValue(args, thunkArgs));
        if (!result) {
          // Returning null here is not ideal. This means that the action
          // resolved but 'getValue' didn't return a loaded value, for instance
          // if the data the action was meant to store was deleted. In a perfect
          // world we'd throw a ContextError here or handle cancellation somehow.
          // Throwing will also allow us to change the return type on the action
          // to always return a promise for the getValue AsyncValue type, but
          // for now we have to add an additional '| null' for this case.
          return null;
        }
      }

      if (isRejected(result)) {
        throw result.value;
      }
      // @ts-ignore No `value` in pending status
      return result.value;
    };
}
