import { Annotation, TimeStampedPoint } from "@replayio/protocol";

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
