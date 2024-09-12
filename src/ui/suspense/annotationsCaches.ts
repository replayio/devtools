import { Annotation, TimeStampedPoint } from "@replayio/protocol";
import { Cache, createCache, createSingleEntryCache } from "suspense";

import { compareExecutionPoints } from "protocol/utils";
import { ReplayClientInterface } from "shared/client/types";
import { InteractionEventKind } from "ui/actions/eventListeners/constants";
import { EventListenerWithFunctionInfo } from "ui/actions/eventListeners/eventListenerUtils";
import type { ReduxActionAnnotation } from "ui/components/SecondaryToolbox/redux-devtools/annotations";
import { processReduxAnnotations } from "ui/components/SecondaryToolbox/redux-devtools/annotations";

export interface ParsedReactDevToolsAnnotation extends TimeStampedPoint {
  contents: {
    event: "operations";
    payload: number[];
  };
}

export interface JumpToCodeAnnotationContents {
  eventKind: InteractionEventKind;
  eventListener: EventListenerWithFunctionInfo;
  listenerPoint: TimeStampedPoint;
  nextEventPoint: TimeStampedPoint;
}

export interface ParsedJumpToCodeAnnotation extends TimeStampedPoint {
  eventKind: InteractionEventKind;
  eventListener: EventListenerWithFunctionInfo;
  listenerPoint: TimeStampedPoint;
  nextEventPoint: TimeStampedPoint;
}

export const REACT_SETUP_ANNOTATIONS_KIND = "react-devtools-hook:v1:commit-fiber-root";
export const REACT_ANNOTATIONS_KIND = "react-devtools-bridge";
export const REDUX_SETUP_ANNOTATIONS_KIND = "redux-devtools-setup";
export const REDUX_ANNOTATIONS_KIND = "redux-devtools-data";
export const JUMP_ANNOTATION_KIND = "event-listeners-jump-location";

export const annotationKindsCache: Cache<
  [replayClient: ReplayClientInterface, kind: string],
  boolean
> = createCache({
  debugLabel: "AnnotationKinds",
  getKey: ([replayClient, kind]) => kind,
  load: async ([replayClient, kind]) => {
    return replayClient.hasAnnotationKind(kind);
  },
});

export const reactDevToolsAnnotationsCache = createSingleEntryCache<
  [client: ReplayClientInterface],
  ParsedReactDevToolsAnnotation[]
>({
  debugLabel: "ReactDevToolsAnnotations",
  load: async ([client]) => {
    const receivedAnnotations: Annotation[] = [];

    await client.findAnnotations(REACT_ANNOTATIONS_KIND, annotation => {
      receivedAnnotations.push(annotation);
    });

    receivedAnnotations.sort((a1, a2) => compareExecutionPoints(a1.point, a2.point));

    const parsedAnnotations: ParsedReactDevToolsAnnotation[] = receivedAnnotations.map(
      ({ point, time, contents }) => ({
        point,
        time,
        contents: JSON.parse(contents) as any,
      })
    );

    return parsedAnnotations;
  },
});

export const reduxDevToolsAnnotationsCache = createSingleEntryCache<
  [client: ReplayClientInterface],
  ReduxActionAnnotation[]
>({
  debugLabel: "ReduxDevToolsAnnotations",
  load: async ([client]) => {
    const receivedAnnotations: Annotation[] = [];

    await client.findAnnotations(REDUX_ANNOTATIONS_KIND, annotation => {
      receivedAnnotations.push(annotation);
    });

    receivedAnnotations.sort((a1, a2) => compareExecutionPoints(a1.point, a2.point));

    const parsedAnnotations = processReduxAnnotations(receivedAnnotations);

    return parsedAnnotations;
  },
});

export const eventListenersJumpLocationsCache = createSingleEntryCache<
  [client: ReplayClientInterface],
  ParsedJumpToCodeAnnotation[]
>({
  debugLabel: "EventListenersJumpLocations",
  load: async ([client]) => {
    const receivedAnnotations: Annotation[] = [];

    await client.findAnnotations(JUMP_ANNOTATION_KIND, annotation => {
      receivedAnnotations.push(annotation);
    });

    receivedAnnotations.sort((a1, a2) => compareExecutionPoints(a1.point, a2.point));

    const parsedAnnotations: ParsedJumpToCodeAnnotation[] = receivedAnnotations.map(
      ({ point, time, contents }) => ({
        point,
        time,
        ...(JSON.parse(contents) as any),
      })
    );

    return parsedAnnotations;
  },
});
