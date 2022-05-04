import { Action } from "redux";
import { Annotation } from "ui/state/reactDevTools";

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

export function addAnnotations(annotations: Annotation[]): AddAnnotationsAction {
  return { type: "add_annotations", annotations };
}

export function setProtocolCheckFailed(): SetProtocolCheckFailedAction {
  return { type: "set_protocol_fail" };
}
