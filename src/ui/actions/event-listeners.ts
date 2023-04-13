// Routines for finding framework-specific event listeners within a pause.

import { Dictionary } from "@reduxjs/toolkit";
import type { Location, ObjectPreview, Object as ProtocolObject } from "@replayio/protocol";
import { Cache, createCache } from "suspense";

import type { ThreadFront as TF } from "protocol/thread";
import { topFrameCache } from "replay-next/src/suspense/FrameCache";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { cachePauseData, updateMappedLocation } from "replay-next/src/suspense/PauseCache";
import { pauseEvaluationsCache } from "replay-next/src/suspense/PauseCache";
import { scopeMapCache } from "replay-next/src/suspense/ScopeMapCache";
import { ReplayClientInterface } from "shared/client/types";
import {
  SourceDetails,
  SourcesState,
  getGeneratedLocation,
  getPreferredLocation,
  getSourceDetailsEntities,
} from "ui/reducers/sources";
import { UIState } from "ui/state";
import { getJSON } from "ui/utils/objectFetching";

import { UIThunkAction } from "./index";

export type FunctionPreview = Required<
  Pick<ObjectPreview, "functionName" | "functionLocation" | "functionParameterNames">
>;

export interface EventListenerWithFunctionInfo {
  type: string;
  capture: boolean;
  functionName: string;
  locationUrl?: string;
  location?: Location;
  functionParameterNames: string[];
  framework?: string;
}

export type FunctionWithPreview = Omit<ProtocolObject, "preview"> & {
  preview: FunctionPreview;
};

// TS magic: https://stackoverflow.com/a/57837897/62937
type DeepRequired<T, P extends string[]> = T extends object
  ? Omit<T, Extract<keyof T, P[0]>> &
      Required<{
        [K in Extract<keyof T, P[0]>]: NonNullable<DeepRequired<T[K], ShiftUnion<P>>>;
      }>
  : T;

// Analogues to array.prototype.shift
export type Shift<T extends any[]> = ((...t: T) => any) extends (
  first: any,
  ...rest: infer Rest
) => any
  ? Rest
  : never;

// use a distributed conditional type here
type ShiftUnion<T> = T extends any[] ? Shift<T> : never;

export type NodeWithPreview = DeepRequired<
  ProtocolObject,
  ["preview", "node"] | ["preview", "getterValues"]
>;

export const isFunctionPreview = (obj?: ObjectPreview): obj is FunctionPreview => {
  return !!obj && "functionName" in obj && "functionLocation" in obj;
};

export const isFunctionWithPreview = (obj: ProtocolObject): obj is FunctionWithPreview => {
  return (
    (obj.className === "Function" || obj.className === "AsyncFunction") &&
    isFunctionPreview(obj.preview)
  );
};

export const REACT_16_EVENT_LISTENER_PROP_KEY = "__reactEventHandlers$";
export const REACT_17_18_EVENT_LISTENER_PROP_KEY = "__reactProps$";

export type FormattedEventListener = Awaited<ReturnType<typeof formatEventListener>>;

export const formatEventListener = async (
  replayClient: ReplayClientInterface,
  listener: { type: string; capture: boolean },
  fnPreview: FunctionWithPreview["preview"],
  sourcesState: SourcesState,
  sourcesById: Dictionary<SourceDetails>,
  framework?: string
) => {
  const { functionLocation, functionName = "", functionParameterNames = [] } = fnPreview;

  updateMappedLocation(replayClient, functionLocation);

  let location: Location | undefined = undefined;
  let locationUrl: string | undefined = undefined;
  if (functionLocation) {
    location = getPreferredLocation(sourcesState, functionLocation);

    locationUrl = functionLocation?.length > 0 ? sourcesById[location.sourceId]?.url : undefined;
  }

  const scopeMap = await scopeMapCache.readAsync(
    replayClient,
    getGeneratedLocation(sourcesById, functionLocation)
  );
  const originalFunctionName = scopeMap?.find(mapping => mapping[0] === functionName)?.[1];

  return {
    ...listener,
    location,
    locationUrl,
    functionName: originalFunctionName || functionName,
    functionParameterNames,
    framework,
  };
};

const eventListenersCacheByPause = new Map<string, Map<string, EventListenerWithFunctionInfo[]>>();

// Also see the related implementation specific to the info sidebar
// "Click" event list items over in `src/ui/components/Events/Event.tsx`
export function getNodeEventListeners(
  nodeId: string,
  pauseId?: string
): UIThunkAction<Promise<EventListenerWithFunctionInfo[]>> {
  return async (dispatch, getState, { ThreadFront, protocolClient, replayClient, objectCache }) => {
    if (!pauseId) {
      pauseId = await ThreadFront.getCurrentPauseId(replayClient);
    }

    if (!eventListenersCacheByPause.has(pauseId)) {
      eventListenersCacheByPause.set(pauseId, new Map());
    }

    // Reuse cached event listener entries if we've done this work already
    const eventListenersCache = eventListenersCacheByPause.get(pauseId)!;
    const cachedListeners = eventListenersCache.get(nodeId);

    if (cachedListeners) {
      return cachedListeners;
    }

    const state = getState();
    const sourcesById = getSourceDetailsEntities(state);

    // We need to fetch "basic" event listeners from the protocol API
    const { listeners, data } = await protocolClient.DOM.getEventListeners(
      { node: nodeId },
      ThreadFront.sessionId!,
      pauseId
    );

    cachePauseData(replayClient, pauseId, data);

    // Reformat those entries to add location/name/params data
    const formattedListenerEntries = await Promise.all(
      listeners.map(listener => {
        // TODO These entries exist in current testing, but what's fetching them earlier?
        const listenerHandler = objectCache.getValue(
          replayClient,
          pauseId!,
          listener.handler,
          "none"
        ) as FunctionWithPreview;

        return formatEventListener(
          replayClient,
          listener,
          listenerHandler.preview,
          state.sources,
          sourcesById
        );
      })
    );

    // Next, we want to find "framework listeners". As currently implemented,
    // this is really just finding React `onThing` events.
    // React normally points the "raw" event handlers like `"click"` to a `noop`
    // function. It's much more useful to see an `onClick` entry that points to
    // a real file like `Counter.tsx:27` instead.

    // Start by getting "the JS object that represents this DOM node".
    const domNodeObject = (await objectCache.readAsync(
      replayClient,
      pauseId,
      nodeId,
      "canOverflow"
    )) as NodeWithPreview;

    // DOM nodes can have normal JS object properties.
    const { properties = [] } = domNodeObject.preview;

    // React adds special secret expando properties to DOM nodes to store
    // metadata about props and component args.
    // HACK This is groveling into the guts of React and can easily break!
    const reactEventListenerProperty = properties.find(
      prop =>
        prop.name.startsWith(REACT_16_EVENT_LISTENER_PROP_KEY) ||
        prop.name.startsWith(REACT_17_18_EVENT_LISTENER_PROP_KEY)
    );

    if (reactEventListenerProperty) {
      // Assuming we found the magic "props metadata" object name/ID,
      // retrieve the actual object contents.
      const listenerPropObj = await objectCache.readAsync(
        replayClient,
        pauseId,
        reactEventListenerProperty.object!,
        "canOverflow"
      );

      // The object might contain both primitives and objects/functions.
      // Narrow down the props fields to just objects (including functions)
      const objectProperties =
        listenerPropObj.preview?.properties?.filter(prop => !!prop.object) ?? [];

      if (objectProperties.length) {
        // Then retrieve full preview data for all of those "object" fields
        const allPropertyPreviews = await Promise.all(
          objectProperties.map(async prop => ({
            name: prop.name,
            value: (await objectCache.readAsync(
              replayClient,
              pauseId!,
              prop.object!,
              "canOverflow"
            )) as FunctionWithPreview,
          }))
        );

        // Finally, we can filter that down to "objects" that are actually functions.
        // We can assume that any function this far down is a React event handler,
        // defined in actual user code.
        const formattedFrameworkListeners = await Promise.all(
          allPropertyPreviews
            .filter(obj => obj.value.className === "Function")
            .map(obj => {
              // Add an entry like `{name: "onClick", location, locationUrl}
              return formatEventListener(
                replayClient,
                { type: obj.name, capture: false },
                obj.value.preview,
                state.sources,
                sourcesById,
                // We're only finding React-specific event handlers atm
                "react"
              );
            })
        );

        // Merge the React event entries into the list of all event listeners
        formattedListenerEntries.push(...formattedFrameworkListeners);
      }
    }

    // Cache all that work for later
    eventListenersCache.set(nodeId, formattedListenerEntries);
    return formattedListenerEntries;
  };
}

export type SEARCHABLE_EVENT_TYPES = "mousedown" | "keypress";

const REACT_EVENT_PROPS: Record<SEARCHABLE_EVENT_TYPES, string[]> = {
  mousedown: ["onClick"],
  // Users may have added `onChange` to an <input>, or `onkeyPress` to other elements
  keypress: ["onChange", "onKeyPress"],
};

const EVENT_CLASS_FOR_EVENT_TYPE: Record<SEARCHABLE_EVENT_TYPES, string[]> = {
  mousedown: ["MouseEvent"],
  keypress: ["InputEvent", "KeyboardEvent"],
};

export const IGNORABLE_PARTIAL_SOURCE_URLS = [
  // Don't jump into React internals
  "react-dom",
  // or CodeSandbox
  "webpack:///src/sandbox/",
  "webpack:///sandpack-core/",
  "webpack:////home/circleci/codesandbox-client",
  // or Cypress
  "__cypress/runner/",
];

export function shouldIgnoreEventFromSource(
  sourceDetails?: SourceDetails,
  ignorableURLS = IGNORABLE_PARTIAL_SOURCE_URLS
) {
  const url = sourceDetails?.url ?? "";

  return ignorableURLS.some(partialUrl => url.includes(partialUrl));
}

// TODO This cache looks unsafe because it's not idempotent;
// it accepts a state getter function but does not reflect the state it reads as part of the cache key.
export const eventListenerLocationCache: Cache<
  [
    ThreadFront: typeof TF,
    replayClient: ReplayClientInterface,
    getState: () => UIState,
    pauseId: string,
    replayEventType: SEARCHABLE_EVENT_TYPES
  ],
  Location | undefined
> = createCache({
  config: { immutable: true },
  debugLabel: "EventListenerLocation",
  getKey: ([threadFront, replayClient, getState, pauseId, replayEventType]) =>
    `${pauseId}:${replayEventType}`,
  load: async ([threadFront, replayClient, getState, pauseId, replayEventType]) => {
    const topFrame = await topFrameCache.readAsync(replayClient, pauseId);

    if (!topFrame) {
      return;
    }
    const { frameId } = topFrame;

    await threadFront.ensureAllSources();

    const state = getState();

    const evaluatedEventMapper = createReactEventMapper(replayEventType);

    // Introspect the event's target DOM node, and find the nearest
    // React event handler if any exists.
    const res = await pauseEvaluationsCache.readAsync(
      replayClient,
      pauseId,
      frameId,
      evaluatedEventMapper
    );

    let sourceLocation: Location | undefined;
    const sourcesById = getSourceDetailsEntities(state);

    if (res.returned?.object) {
      const preview = await objectCache.readAsync(
        replayClient,
        pauseId,
        res.returned.object,
        "canOverflow"
      );
      // The evaluation may have found a React prop function somewhere.
      const handlerProp = preview?.preview?.properties?.find(p => p.name === "handlerProp");

      if (handlerProp) {
        // If it did find a React prop function, get its
        // preview and format it so we know the preferred location.
        const onClickPreview = await objectCache.readAsync(
          replayClient,
          pauseId,
          handlerProp.object!,
          "full"
        );

        // As of RUN-1709 Chromium _should_ be sending back previews with function locations,
        // but doesn't hurt to double-check.
        if (!onClickPreview || !isFunctionPreview(onClickPreview.preview)) {
          return undefined;
        }

        const formattedEventListener = await formatEventListener(
          replayClient,
          { type: "onClick", capture: false },
          onClickPreview.preview,
          state.sources,
          sourcesById,
          "react"
        );

        sourceLocation = formattedEventListener.location;
      }
    } else if (res.exception?.object) {
      const error = await objectCache.readAsync(
        replayClient,
        pauseId,
        res.exception.object,
        "canOverflow"
      );
      console.error("Error fetching event listener location: ", error);
    }

    if (!sourceLocation) {
      // Otherwise, use the location from the actual JS event handler.
      sourceLocation = getPreferredLocation(state.sources, topFrame.location);
      const sourceDetails = sourcesById[sourceLocation.sourceId];

      if (shouldIgnoreEventFromSource(sourceDetails)) {
        // Intentionally _don't_ jump to into specific ignorable libraries, like React
        sourceLocation = undefined;
      }
    }

    return sourceLocation!;
  },
});

// Local variables in scope at the time of evaluation
declare let event: MouseEvent | KeyboardEvent;

interface InjectedValues {
  eventType: SEARCHABLE_EVENT_TYPES;
  $REACT_16_EVENT_LISTENER_PROP_KEY: string;
  $REACT_17_18_EVENT_LISTENER_PROP_KEY: string;
  EVENT_CLASS_NAMES: string[];
  possibleReactPropNames: string[];
  args: any[];
}

interface SearchedNode {
  name: string;
  searchPropKeys?: string[];
  propKeys?: string[];
}

interface EventMapperResult {
  target: HTMLElement;
  fieldName?: string;
  handlerProp?: Function;
  handlerNode?: HTMLElement;
  searchedNodes: SearchedNode[];
  clickWasInsideSubmitButton?: boolean;
}

function createReactEventMapper(eventType: SEARCHABLE_EVENT_TYPES) {
  const reactEventPropNames = REACT_EVENT_PROPS[eventType];
  const eventClassNames = EVENT_CLASS_FOR_EVENT_TYPE[eventType];

  // This will became evaluated JS code
  function findEventTargetAndHandler(injectedValues: InjectedValues) {
    // One of the args should be a browser event. There could be multiple event class types we're looking for,
    // such as `MouseEvent` or `InputEvent`, so loop over the args _and_ the class names.
    const eventArgs = injectedValues.args.filter(a => typeof a === "object" && a instanceof Event);
    const matchingEvent = eventArgs.find(a => {
      const matchesEventType = injectedValues.EVENT_CLASS_NAMES.some(eventClassName => {
        const eventClass: any = window[eventClassName as any];
        return a instanceof eventClass;
      });
      return matchesEventType;
    });

    if (matchingEvent) {
      const searchedNodes: SearchedNode[] = [];
      const res: EventMapperResult = {
        target: event.target as HTMLElement,
        searchedNodes,
      };

      // Debugging: trace nodes we've looked at, like `"input#id.classname"`
      function stringifyNode(node: HTMLElement) {
        const tokens = [node.nodeName];

        if (node.id) {
          tokens.push("#" + node.id);
        }

        if (typeof node.className === "string") {
          for (let className of node.className.split(" ")) {
            tokens.push("." + className);
          }
        }

        return tokens.join("").toLowerCase();
      }

      let clickWasInsideSubmitButton = false;

      // Search the event target node and all of its ancestors
      // for React internal props data, and specifically look
      // for the nearest node with a relevant React event handler prop if any.
      const startingNode = event.target as HTMLElement;
      let currentNode = startingNode;
      while (currentNode) {
        const searchedNode: SearchedNode = {
          name: stringifyNode(currentNode),
        };
        searchedNodes.push(searchedNode);

        const currentNodeName = currentNode.nodeName.toLowerCase();

        if (
          injectedValues.eventType === "mousedown" &&
          currentNodeName === "button" &&
          (currentNode as HTMLButtonElement).type === "submit"
        ) {
          res.clickWasInsideSubmitButton = true;
        }

        const keys = Object.keys(currentNode);
        const reactPropsKey = keys.find(key => {
          return (
            key.startsWith(injectedValues.$REACT_16_EVENT_LISTENER_PROP_KEY) ||
            key.startsWith(injectedValues.$REACT_17_18_EVENT_LISTENER_PROP_KEY)
          );
        });

        if (reactPropsKey) {
          let props: Record<string, Function> = {};
          if (reactPropsKey in currentNode) {
            // @ts-ignore
            props = currentNode[reactPropsKey];
            searchedNode.propKeys = Object.keys(props);
          }

          // Depending on the type of event, there could be different
          // React event handler prop names in use.
          // For example, an input is likely to have "onChange",
          // whereas some other element might have "onKeyPress".
          let handler = undefined;
          let name: string | undefined = undefined;
          const possibleReactPropNames = injectedValues.possibleReactPropNames.slice();

          // `<input>` tags often have an `onChange` prop, including checkboxes;
          // _If_ the original target DOM node is an input, add that to the list of prop names.
          if (currentNode === startingNode && currentNodeName === "input") {
            possibleReactPropNames.push("onChange");
          }

          if (res.clickWasInsideSubmitButton && currentNodeName === "form") {
            possibleReactPropNames.push("onSubmit");
          }

          searchedNode.searchPropKeys = possibleReactPropNames;

          for (let possibleReactProp of possibleReactPropNames) {
            if (possibleReactProp in props) {
              handler = props[possibleReactProp];
              name = possibleReactProp;
            }
          }

          if (handler) {
            res.handlerProp = handler;
            res.handlerNode = currentNode as HTMLElement;
            res.fieldName = name;
            break;
          }
        }
        currentNode = (currentNode!.parentNode as HTMLElement)!;
      }

      return res;
    } else {
      throw new Error(`no event found! eventClass: ${injectedValues.EVENT_CLASS_NAMES}`);
    }
  }

  const evaluatedEventMapperBody = `
    (${findEventTargetAndHandler})({
      eventType: "${eventType}",
      $REACT_16_EVENT_LISTENER_PROP_KEY: "${REACT_16_EVENT_LISTENER_PROP_KEY}",
      $REACT_17_18_EVENT_LISTENER_PROP_KEY: "${REACT_17_18_EVENT_LISTENER_PROP_KEY}",
      EVENT_CLASS_NAMES: ${JSON.stringify(eventClassNames)},
      possibleReactPropNames: ${JSON.stringify(reactEventPropNames)},
      
      // Outer body runs in scope of the "current" event handler.
      // Grab the event handler's arguments.
      args: [...arguments]
    })
  `;

  return evaluatedEventMapperBody;
}
