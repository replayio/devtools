import { Action } from "redux";

export type ReducerObject<TState, TAction extends Action> = {
  [T in TAction["type"]]: (state: TState, action: TAction & Action<T>) => TState;
};

export function createReducer<
  TState,
  TActionType extends string,
  TAction extends Action<TActionType>
>(initialState: TState, reducers: ReducerObject<TState, TAction>) {
  return function (state = initialState, action: TAction & Action<TActionType>) {
    const reducer = reducers[action.type];
    if (!reducer) {
      return state;
    }
    return reducer(state, action);
  };
}
