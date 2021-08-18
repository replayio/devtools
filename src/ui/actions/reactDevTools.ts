import { Action } from "redux";
import { ExecutionPoint } from "@recordreplay/protocol";
import { ThreadFront } from "protocol/thread";
import { Annotation } from "ui/state/reactDevTools";
import { UIStore } from ".";

export type AddAnnotationsAction = Action<"add_annotations"> & { annotations: Annotation[] };
export type SetCurrentPointAction = Action<"set_current_point"> & {
  currentPoint: ExecutionPoint | null;
};

export type ReactDevToolsAction = AddAnnotationsAction | SetCurrentPointAction;

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

export function addAnnotations(annotations: Annotation[]): AddAnnotationsAction {
  return { type: "add_annotations", annotations };
}

export function setCurrentPoint(currentPoint: ExecutionPoint | null): SetCurrentPointAction {
  return { type: "set_current_point", currentPoint };
}
