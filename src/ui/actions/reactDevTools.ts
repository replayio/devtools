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
    // TODO We're also getting some other annotations here.
    // It would be nice if we could ask the backend to filter them for us.
    const reactDevtoolsAnnotations = annotations.filter(annotation => {
      // `kind` value per React Devtools code in `gecko-dev`
      return annotation.kind === "react-devtools-bridge";
    });

    store.dispatch(
      // TODO This action should be named more specific to the React usage
      addAnnotations(
        reactDevtoolsAnnotations.map(({ point, time, contents }) => ({
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
