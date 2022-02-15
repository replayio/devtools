import { Action } from "redux";
import { ExecutionPoint } from "@recordreplay/protocol";
import { ThreadFront } from "protocol/thread";
import { Annotation } from "ui/state/reactDevTools";
import { UIStore, UIThunkAction } from ".";

export type AddAnnotationsAction = Action<"add_annotations"> & { annotations: Annotation[] };
export type SetHasReactComponentsAction = Action<"set_has_react_components"> & {
  hasReactComponents: boolean;
};
export type SetCurrentPointAction = Action<"set_current_point"> & {
  currentPoint: ExecutionPoint | null;
};
export type SetProtocolCheckFailedAction = Action<"set_protocol_fail">;

export type ReactDevToolsAction =
  | AddAnnotationsAction
  | SetCurrentPointAction
  | SetHasReactComponentsAction
  | SetProtocolCheckFailedAction;

export function setupReactDevTools(store: UIStore) {
  store.dispatch(setCurrentPoint(ThreadFront.currentPoint));
  ThreadFront.on("paused", ({ point }) => store.dispatch(setCurrentPoint(point)));

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

export function setCurrentPoint(currentPoint: ExecutionPoint | null): SetCurrentPointAction {
  return { type: "set_current_point", currentPoint };
}

export function setProtocolCheckFailed(): UIThunkAction {
  return async ({ dispatch }) => {
    dispatch({ type: "set_protocol_fail" });
  };
}
