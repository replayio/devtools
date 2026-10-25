import { Annotation, ReduxAction, TimeStampedPoint } from "@replayio/protocol";

import { compareNumericStrings } from "protocol/utils";

interface ReduxActionFields {
  actionType: string;
  shouldIgnoreAction: boolean;
  connectionType: "redux" | "generic";
  instanceId: number;
}

interface ReduxAnnotationContents {
  event: string;
  payload: ReduxActionFields;
}

export interface ReduxActionAnnotation extends TimeStampedPoint, ReduxAnnotationContents {
  kind: string;
}

export const processReduxAnnotations = (annotations: Annotation[]): ReduxActionAnnotation[] => {
  return annotations.map(annotation => {
    const { contents, kind, point, time } = annotation;
    // Parse the stringified data from the Redux DevTools on the backend
    const fields = JSON.parse(contents) as ReduxAnnotationContents;
    return { kind, time, point, ...fields };
  });
};

export const processReduxActions = (actions: ReduxAction[]): ReduxActionAnnotation[] => {
  return actions
    .map(({ point, time, actionType, shouldIgnoreAction = false, connectionType, instanceId }) => ({
      kind: "redux-devtools-data",
      point,
      time,
      event: "action",
      payload: { actionType, shouldIgnoreAction, connectionType, instanceId },
    }))
    .sort((a1, a2) => compareNumericStrings(a1.point, a2.point));
};
