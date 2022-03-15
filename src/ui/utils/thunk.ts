import { Action } from "redux";
import { DevToolsToolbox } from "./devtools-toolbox";
import { ProtocolClient } from "@recordreplay/protocol";

/**
 * The following type definitions have been taken from the redux-thunk package
 * and modified to match our thunk middleware (which is slightly different
 * from the redux-thunk middleware).
 */

/**
 * The dispatch method as modified by our thunk middleware; overloaded
 * so that you can dispatch:
 *   - standard (object) actions: `dispatch()` returns the action itself
 *   - thunk actions: `dispatch()` returns the thunk's return value
 *
 * @template TState The redux state
 * @template TExtraThunkArg The extra argument passed to the inner function of
 * thunks (if specified when setting up the Thunk middleware)
 * @template TBasicAction The (non-thunk) actions that can be dispatched.
 */
export interface ThunkDispatch<TState, TExtraThunkArg, TBasicAction extends Action> {
  <TReturnType>(
    thunkAction: ThunkAction<TReturnType, TState, TExtraThunkArg, TBasicAction>
  ): TReturnType;

  <A extends TBasicAction>(action: A): A;

  // This overload is the union of the two above (see TS issue #14107).
  <TReturnType, TAction extends TBasicAction>(
    action: TAction | ThunkAction<TReturnType, TState, TExtraThunkArg, TBasicAction>
  ): TAction | TReturnType;
}

/**
 * A "thunk" action (a callback function that can be dispatched to the Redux
 * store.)
 *
 * Also known as the "thunk inner function", when used with the typical pattern
 * of an action creator function that returns a thunk action.
 *
 * @template TReturnType The return type of the thunk's inner function
 * @template TState The redux state
 * @template TExtraThunkARg Optional extra argument passed to the inner function
 * (if specified when setting up the Thunk middleware)
 * @template TBasicAction The (non-thunk) actions that can be dispatched.
 */
export type ThunkAction<TReturnType, TState, TExtraThunkArg, TBasicAction extends Action> = (
  args: {
    dispatch: ThunkDispatch<TState, TExtraThunkArg, TBasicAction>;
    getState: () => TState;
  } & TExtraThunkArg
) => TReturnType;

export interface ThunkExtraArgs {
  client: ProtocolClient;
  toolbox: DevToolsToolbox;
}

/**
 * Redux behaviour changed by middleware, so overloads here
 */
declare module "redux" {
  /**
   * Overload for bindActionCreators redux function, returns expects responses
   * from thunk actions
   */
  function bindActionCreators<TActionCreators extends ActionCreatorsMapObject<any>>(
    actionCreators: TActionCreators,
    dispatch: Dispatch
  ): {
    [TActionCreatorName in keyof TActionCreators]: ReturnType<
      TActionCreators[TActionCreatorName]
    > extends ThunkAction<any, any, any, any>
      ? (
          ...args: Parameters<TActionCreators[TActionCreatorName]>
        ) => ReturnType<ReturnType<TActionCreators[TActionCreatorName]>>
      : TActionCreators[TActionCreatorName];
  };

  /*
   * Overload to add thunk support to Redux's dispatch() function.
   * Useful for react-redux or any other library which could use this type.
   */
  export interface Dispatch<A extends Action = AnyAction> {
    <TReturnType = any, TState = any, TExtraThunkArg = any>(
      thunkAction: ThunkAction<TReturnType, TState, TExtraThunkArg, A>
    ): TReturnType;
  }
}
