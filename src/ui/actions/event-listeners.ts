// Routines for finding framework-specific event listeners within a pause.

import { cachePauseData } from "replay-next/src/suspense/PauseCache";
import { sourcesByIdCache } from "replay-next/src/suspense/SourcesCache";
import { getSourceDetailsEntities } from "ui/reducers/sources";

import {
  REACT_16_EVENT_LISTENER_PROP_KEY,
  REACT_17_18_EVENT_LISTENER_PROP_KEY,
} from "./eventListeners/constants";
import {
  EventListenerWithFunctionInfo,
  FormattedEventListener,
  FunctionWithPreview,
  NodeWithPreview,
  formatEventListener,
} from "./eventListeners/eventListenerUtils";
import { UIThunkAction } from "./index";

const eventListenersCacheByPause = new Map<string, Map<string, EventListenerWithFunctionInfo[]>>();

// Also see the related implementation specific to the info sidebar
// "Click" event list items over in `src/ui/components/Events/Event.tsx`
export function getNodeEventListeners(
  nodeId: string,
  pauseId?: string
): UIThunkAction<Promise<FormattedEventListener[]>> {
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

    const sources = await sourcesByIdCache.readAsync(replayClient);
    cachePauseData(replayClient, sources, pauseId, data);

    // Reformat those entries to add location/name/params data
    const initialEventListenerEntries = await Promise.all(
      listeners.map(listener => {
        // TODO These entries exist in current testing, but what's fetching them earlier?
        const listenerHandler = objectCache.getValue(
          replayClient,
          pauseId!,
          listener.handler,
          "canOverflow"
        ) as FunctionWithPreview;

        return formatEventListener(
          replayClient,
          listener.type,
          listenerHandler.preview,
          state.sources
        );
      })
    );

    const formattedListenerEntries = initialEventListenerEntries.filter(
      Boolean
    ) as FormattedEventListener[];

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
                obj.name,
                obj.value.preview,
                state.sources,
                // We're only finding React-specific event handlers atm
                "react"
              );
            })
        );

        const onlyValidListeners = formattedFrameworkListeners.filter(
          Boolean
        ) as FormattedEventListener[];

        // Merge the React event entries into the list of all event listeners
        formattedListenerEntries.push(...onlyValidListeners);
      }
    }

    // Cache all that work for later
    eventListenersCache.set(nodeId, formattedListenerEntries);
    return formattedListenerEntries;
  };
}
