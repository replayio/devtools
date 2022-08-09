import { Annotation } from "@replayio/protocol";
import type { ThreadFront as TF } from "protocol/thread";
import { Action } from "redux";
import debounce from "lodash/debounce";

import { Annotation as ParsedAnnotation } from "ui/state/reactDevTools";

import { UIStore } from ".";

export type AddAnnotationsAction = Action<"add_annotations"> & { annotations: ParsedAnnotation[] };
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

export async function setupReactDevTools(store: UIStore, ThreadFront: typeof TF) {
  await ThreadFront.ensureAllSources();

  // Annotations come in piecemeal over time. Cut down the number of dispatches by
  // storing incoming Annotations and debouncing the dispatch considerably.
  let receivedAnnotations: Annotation[] = [];

  // Debounce loading of React annotations
  const onAnnotationsReceived = debounce(() => {
    store.dispatch(
      // TODO This action should be named more specific to the React usage
      addAnnotations(
        receivedAnnotations.map(({ point, time, contents }) => ({
          point,
          time,
          message: JSON.parse(contents),
        }))
      )
    );
    receivedAnnotations = [];
  }, 1_000);

  ThreadFront.getAnnotations(annotations => {
    receivedAnnotations.push(...annotations);
    onAnnotationsReceived();
  }, "react-devtools-bridge");
}

export function addAnnotations(annotations: ParsedAnnotation[]): AddAnnotationsAction {
  return { type: "add_annotations", annotations };
}

export function setProtocolCheckFailed(): SetProtocolCheckFailedAction {
  return { type: "set_protocol_fail" };
}
