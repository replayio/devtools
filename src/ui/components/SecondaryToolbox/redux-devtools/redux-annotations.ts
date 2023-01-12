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

export const exampleReduxAnnotations: Annotation[] = [
  {
    point: "5841333965870490996444469078786217",
    time: 3912,
    kind: "redux-devtools-data",
    contents:
      '{"event":"action","payload":{"actionType":"counter/increment","shouldIgnoreAction":false,"connectionType":"redux","instanceId":1}}',
  },
  {
    point: "8112963841484235038054569073442992",
    time: 5300,
    kind: "redux-devtools-data",
    contents:
      '{"event":"action","payload":{"actionType":"counter/increment","shouldIgnoreAction":false,"connectionType":"redux","instanceId":1}}',
  },
  {
    point: "9735556609780795890548039468712121",
    time: 6467,
    kind: "redux-devtools-data",
    contents:
      '{"event":"action","payload":{"actionType":"counter/increment","shouldIgnoreAction":false,"connectionType":"redux","instanceId":1}}',
  },
  {
    point: "12331705039059159000342538859053263",
    time: 7864,
    kind: "redux-devtools-data",
    contents:
      '{"event":"action","payload":{"actionType":"counter/decrement","shouldIgnoreAction":false,"connectionType":"redux","instanceId":1}}',
  },
  {
    point: "14603334914677673831138701986496738",
    time: 9252,
    kind: "redux-devtools-data",
    contents:
      '{"event":"action","payload":{"actionType":"counter/incrementByAmount","shouldIgnoreAction":false,"connectionType":"redux","instanceId":1}}',
  },
];
