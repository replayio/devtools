// Routines for finding framework-specific event listeners within a pause.

import { Dictionary } from "@reduxjs/toolkit";
import type { Location, ObjectPreview, Object as ProtocolObject } from "@replayio/protocol";

import { cachePauseData } from "replay-next/src/suspense/PauseCache";
import { getScopeMapAsync } from "replay-next/src/suspense/ScopeMapCache";
import { ReplayClientInterface } from "shared/client/types";
import {
  SourceDetails,
  getGeneratedLocation,
  getPreferredLocation,
  getSourceDetailsEntities,
} from "ui/reducers/sources";
import { UIState } from "ui/state";

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

const isFunctionPreview = (obj?: ObjectPreview): obj is FunctionPreview => {
  return (
    !!obj && "functionName" in obj && "functionLocation" in obj && "functionParameterNames" in obj
  );
};

const isFunctionWithPreview = (obj: ProtocolObject): obj is FunctionWithPreview => {
  return obj.className === "Function" && isFunctionPreview(obj.preview);
};

const REACT_16_EVENT_LISTENER_PROP_KEY = "__reactEventHandlers$";
const REACT_17_18_EVENT_LISTENER_PROP_KEY = "__reactProps$";

const formatEventListener = async (
  replayClient: ReplayClientInterface,
  listener: { type: string; capture: boolean },
  fnPreview: FunctionWithPreview,
  state: UIState,
  sourcesById: Dictionary<SourceDetails>,
  framework?: string
) => {
  const { functionLocation, functionName = "", functionParameterNames = [] } = fnPreview.preview;

  let location: Location | undefined = undefined;
  let locationUrl: string | undefined = undefined;
  if (functionLocation) {
    location = getPreferredLocation(state.sources, functionLocation);

    locationUrl = functionLocation?.length > 0 ? sourcesById[location.sourceId]?.url : undefined;
  }

  const scopeMap = await getScopeMapAsync(
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

export function getNodeEventListeners(
  nodeId: string
): UIThunkAction<Promise<EventListenerWithFunctionInfo[]>> {
  return async (dispatch, getState, { ThreadFront, protocolClient, replayClient, objectCache }) => {
    const pauseId = await ThreadFront.getCurrentPauseId(replayClient);

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
        const listenerHandler = objectCache.getObjectThrows(
          pauseId,
          listener.handler
        ) as FunctionWithPreview;

        return formatEventListener(replayClient, listener, listenerHandler, state, sourcesById);
      })
    );

    // Next, we want to find "framework listeners". As currently implemented,
    // this is really just finding React `onThing` events.
    // React normally points the "raw" event handlers like `"click"` to a `noop`
    // function. It's much more useful to see an `onClick` entry that points to
    // a real file like `Counter.tsx:27` instead.

    // Start by getting "the JS object that represents this DOM node".
    const domNodeObject = (await objectCache.getObjectWithPreviewHelper(
      replayClient,
      pauseId,
      nodeId
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
      const listenerPropObj = await objectCache.getObjectWithPreviewHelper(
        replayClient,
        pauseId,
        reactEventListenerProperty.object!
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
            value: (await objectCache.getObjectWithPreviewHelper(
              replayClient,
              pauseId,
              prop.object!
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
                obj.value,
                state,
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

export function logpointGetFrameworkEventListeners(frameId: string, frameworkListeners: string) {
  const evalText = `
(array => {
  const rv = [];
  for (const maybeEvent of array) {
    if (!(maybeEvent instanceof Event)) {
      continue;
    }
    for (let node = maybeEvent.target; node; node = node.parentNode) {
      const props = Object.getOwnPropertyNames(node);
      const reactProp = props.find(v => v.startsWith("__reactEventHandlers$") || v.startsWith("__reactProps$"));
      if (!reactProp) {
        continue;
      }
      const reactObj = node[reactProp];
      const eventProps = Object.getOwnPropertyNames(reactObj);
      for (const name of eventProps) {
        const v = reactObj[name];
        if (typeof v == "function") {
          rv.push(name, v);
        }
      }
    }
  }
  return rv;
})([...arguments])
`;

  return `
const { result: frameworkResult } = sendCommand(
  "Pause.evaluateInFrame",
  { ${frameId}, expression: \`${evalText}\` }
);
addPauseData(frameworkResult.data);
${frameworkListeners} = frameworkResult.returned;
`;
}
