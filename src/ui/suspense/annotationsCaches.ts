import {
  Annotation,
  ComponentTreeRoot,
  ExecutionPoint,
  Interaction,
  Location,
  MappedLocation,
  TimeStampedPoint,
  getLibraryStatusResult,
} from "@replayio/protocol";
import { Cache, createCache, createSingleEntryCache } from "suspense";

import { assert, compareNumericStrings } from "protocol/utils";
import { ReplayClientInterface } from "shared/client/types";
import { InteractionEventKind } from "ui/actions/eventListeners/constants";
import { EventListenerWithFunctionInfo } from "ui/actions/eventListeners/eventListenerUtils";
import { generateComponentTreeOperations } from "ui/components/SecondaryToolbox/react-devtools/rdtProcessing";
import type { ReduxActionAnnotation } from "ui/components/SecondaryToolbox/redux-devtools/annotations";
import {
  processReduxActions,
  processReduxAnnotations,
} from "ui/components/SecondaryToolbox/redux-devtools/annotations";

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
  // TODO Processor sessions send a bare ExecutionPoint until the backend switches
  // Session.InteractionHandler.listenerPoint to a TimeStampedPoint.
  listenerPoint: TimeStampedPoint | ExecutionPoint;
  nextEventPoint?: TimeStampedPoint;
}

export const REACT_SETUP_ANNOTATIONS_KIND = "react-devtools-hook:v1:commit-fiber-root";
// The operations in these use the format of React DevTools 7.0+, which the bundled
// react-devtools-inline Store parses. The previous kind, "react-devtools-bridge", had the
// earlier format, indistinguishable to a parser; with a separate kind, a frontend and
// backend that disagree (e.g. during a deploy) show no React tree rather than a wrong one.
export const REACT_ANNOTATIONS_KIND = "react-devtools-bridge-v2";
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

// The backend only answers with final statuses (ready, failed, notApplicable), so this
// is read once per session and never refreshed.
export const libraryStatusCache = createSingleEntryCache<
  [client: ReplayClientInterface],
  getLibraryStatusResult | null
>({
  debugLabel: "LibraryStatus",
  load: async ([client]) => ((await client.isProcessorBacked()) ? client.getLibraryStatus() : null),
});

export type ReactOperationsAnnotation = Pick<ParsedReactDevToolsAnnotation, "point" | "contents">;

// TODO Processor sessions use a single React renderer ID; recordings with more than one
// React renderer need the backend to report the renderer for each root.
export const PROCESSOR_SESSION_REACT_RENDERER_ID = 1;

const componentTreeOperationsCache: Cache<
  [commitPoint: ExecutionPoint, roots: ComponentTreeRoot[]],
  ReactOperationsAnnotation[]
> = createCache({
  debugLabel: "ReactComponentTreeOperations",
  getKey: ([commitPoint]) => commitPoint,
  load: ([commitPoint, roots]) =>
    generateComponentTreeOperations(roots, PROCESSOR_SESSION_REACT_RENDERER_ID).map(payload => ({
      point: commitPoint,
      contents: { event: "operations", payload },
    })),
});

// Operations that build the tree committed at or before a point, in the same form as the
// react-devtools-bridge-v2 annotations, so the panel can apply them the same way.
export const reactComponentTreeCache: Cache<
  [client: ReplayClientInterface, point: ExecutionPoint],
  ReactOperationsAnnotation[]
> = createCache({
  debugLabel: "ReactComponentTree",
  getKey: ([client, point]) => point,
  load: async ([client, point]) => {
    const { commitPoint, roots } = await client.getReactComponentTree(point);
    if (commitPoint == null || roots.length === 0) {
      return [];
    }
    return componentTreeOperationsCache.readAsync(commitPoint, roots);
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

    receivedAnnotations.sort((a1, a2) => compareNumericStrings(a1.point, a2.point));

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
    if (await client.isProcessorBacked()) {
      return processReduxActions(await client.getReduxActions());
    }

    const receivedAnnotations: Annotation[] = [];

    await client.findAnnotations(REDUX_ANNOTATIONS_KIND, annotation => {
      receivedAnnotations.push(annotation);
    });

    receivedAnnotations.sort((a1, a2) => compareNumericStrings(a1.point, a2.point));

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
    if (await client.isProcessorBacked()) {
      return processInteractions(await client.getInteractionHandlers());
    }

    const receivedAnnotations: Annotation[] = [];

    await client.findAnnotations(JUMP_ANNOTATION_KIND, annotation => {
      receivedAnnotations.push(annotation);
    });

    receivedAnnotations.sort((a1, a2) => compareNumericStrings(a1.point, a2.point));

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

function pickHandlerLocation(location: MappedLocation, firstBreakablePosition: Location) {
  return (
    location.find(({ sourceId }) => sourceId === firstBreakablePosition.sourceId) ??
    location[0] ??
    firstBreakablePosition
  );
}

export function processInteractions(interactions: Interaction[]): ParsedJumpToCodeAnnotation[] {
  const parsedAnnotations: ParsedJumpToCodeAnnotation[] = [];
  for (const { point, time, kind, handler } of interactions) {
    if (!handler) {
      continue;
    }
    const { location, functionName = "", firstBreakablePosition, listenerPoint } = handler;
    parsedAnnotations.push({
      point,
      time,
      eventKind: kind,
      listenerPoint,
      eventListener: {
        type: kind,
        functionName,
        location: pickHandlerLocation(location, firstBreakablePosition),
        firstBreakablePosition,
        functionParameterNames: [],
      },
    });
  }
  return parsedAnnotations.sort((a1, a2) => compareNumericStrings(a1.point, a2.point));
}

// TODO Remove once Session.InteractionHandler.listenerPoint is a TimeStampedPoint.
// The backend picks listenerPoint as a hit of firstBreakablePosition, so searching
// for that location at exactly that point recovers its time.
export const listenerPointCache: Cache<
  [client: ReplayClientInterface, annotation: ParsedJumpToCodeAnnotation],
  TimeStampedPoint
> = createCache({
  debugLabel: "ListenerPoint",
  getKey: ([client, annotation]) => annotation.point,
  load: async ([client, { listenerPoint, eventListener }]) => {
    if (typeof listenerPoint !== "string") {
      return listenerPoint;
    }
    const [pointDescription] = await client.findPoints(
      { kind: "location", location: eventListener.firstBreakablePosition },
      { begin: listenerPoint, end: listenerPoint }
    );
    assert(pointDescription, `No hit of the event listener at point ${listenerPoint}`);
    return { point: pointDescription.point, time: pointDescription.time };
  },
});
