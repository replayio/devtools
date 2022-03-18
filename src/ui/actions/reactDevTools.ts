import { Action } from "redux";
import { ExecutionPoint } from "@recordreplay/protocol";
import { ThreadFront } from "protocol/thread";
import { Annotation } from "ui/state/reactDevTools";
import { UIStore, UIThunkAction } from ".";

export type AddAnnotationsAction = Action<"add_annotations"> & { annotations: Annotation[] };
export type SetHasReactComponentsAction = Action<"set_has_react_components"> & {
  hasReactComponents: boolean;
};
export type SetProtocolCheckFailedAction = Action<"set_protocol_fail">;

export type ReactDevToolsAction =
  | AddAnnotationsAction
  | SetHasReactComponentsAction
  | SetProtocolCheckFailedAction;

export function setupReactDevTools(store: UIStore) {
  ThreadFront.getAnnotations(({ annotations }) => {
    store.dispatch(
      addAnnotations(
        annotations.map(({ point, time, contents }) => ({
          point,
          time,
          message: JSON.parse(contents),
        }))
      )
    );
  });
}

export function setHasReactComponents(hasReactComponents: boolean): SetHasReactComponentsAction {
  return { type: "set_has_react_components", hasReactComponents };
}

export function addAnnotations(annotations: Annotation[]): AddAnnotationsAction {
  return { type: "add_annotations", annotations };
}

export function setProtocolCheckFailed(): UIThunkAction {
  return async dispatch => {
    dispatch({ type: "set_protocol_fail" });
  };
}
