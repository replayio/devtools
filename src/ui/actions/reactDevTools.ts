import { ThreadFront } from "protocol/thread";
import { Action } from "redux";
import { Annotation } from "ui/state/reactDevTools";

import { UIStore } from ".";

export type AddAnnotationsAction = Action<"add_annotations"> & { annotations: Annotation[] };
export type SetHasReactComponentsAction = Action<"set_has_react_components"> & {
  hasReactComponents: boolean;
};
export type SetProtocolCheckFailedAction = Action<"set_protocol_fail">;

export type ReactDevToolsAction =
  | AddAnnotationsAction
  | SetHasReactComponentsAction
  | SetProtocolCheckFailedAction;

export function setHasReactComponents(hasReactComponents: boolean): SetHasReactComponentsAction {
  return { type: "set_has_react_components", hasReactComponents };
}

export function setupReactDevTools(store: UIStore) {
  ThreadFront.getAnnotations(annotations => {
    store.dispatch(
      // TODO This action should be named more specific to the React usage
      addAnnotations(
        annotations.map(({ point, time, contents }) => ({
          point,
          time,
          message: JSON.parse(contents),
        }))
      )
    );
  }, "react-devtools-bridge");
}

export function addAnnotations(annotations: Annotation[]): AddAnnotationsAction {
  return { type: "add_annotations", annotations };
}

export function setProtocolCheckFailed(): SetProtocolCheckFailedAction {
  return { type: "set_protocol_fail" };
}
