import { Annotation } from "@recordreplay/protocol";
// import { Root, UPDATE_STATE } from "@redux-devtools/app";
import type { Root } from "@redux-devtools/app";
import type { Action } from "@reduxjs/toolkit";
import React, { useLayoutEffect, useRef, useState, useContext } from "react";
import { useSelector, batch } from "react-redux";
import type { UIState } from "ui/state";

import { ReduxAnnotationsContext } from "./redux-devtools/redux-annotations";

type RDTAppStore = NonNullable<Root["store"]>;

export const ReduxDevToolsPanel = () => {
  const [ReduxDevToolsAppRoot, setRoot] = useState<typeof Root | null>(null);
  const rootRef = useRef<Root | null>(null);
  const reduxAnnotations = useContext(ReduxAnnotationsContext);
  const currentTimestamp = useSelector((state: UIState) => state.messages.pausedExecutionPointTime);

  useLayoutEffect(() => {
    // Code-split and lazy-import the main Redux DevTools `<Root>` component.
    // This saves on bundle size, and also ensures it's only added if needed.
    import("@redux-devtools/app").then(rdtapp => {
      setRoot(() => rdtapp.Root);
    });
  }, []);

  useLayoutEffect(() => {
    if (!rootRef.current) {
      return;
    }

    const rootComponent = rootRef.current;
    const store = rootComponent.store!;

    const matchingAnnotationsByTimeRange = reduxAnnotations.filter(annotation => {
      return currentTimestamp != null && annotation.time < currentTimestamp;
    });

    if (!matchingAnnotationsByTimeRange.length) {
      return;
    }

    batch(() => {
      // TODO THIS IS A TERRIBLE IDEA COME UP WITH SOMETHING BETTER AND YET THIS WORKS
      // Seemingly reset the DevTools internal knowledge of actions,
      // so we can re-send in all actions up to this point in the recording
      store.dispatch({
        type: "devTools/UPDATE_STATE",
        request: {
          type: "LIFTED",
          id: "default",
        },
      });

      // TODO Is this how we want to actually behave here?
      // Update the store with the actions up to this point in time
      matchingAnnotationsByTimeRange.forEach(annotation => {
        store.dispatch(annotation.action);
      });
    });

    // TODO This only gets updated when we actually _pause_, not during playback.
  }, [ReduxDevToolsAppRoot, currentTimestamp, reduxAnnotations]);

  if (!ReduxDevToolsAppRoot) {
    return null;
  }

  // @ts-ignore Weird ref type error
  return <ReduxDevToolsAppRoot ref={rootRef} />;
};
