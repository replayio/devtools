import { Annotation } from "@recordreplay/protocol";
// import { Root, UPDATE_STATE } from "@redux-devtools/app";
import type { Root } from "@redux-devtools/app";
import type { Action } from "@reduxjs/toolkit";
import React, { useLayoutEffect, useRef, useState, useContext } from "react";
import { useSelector, batch } from "react-redux";
import type { UIState } from "ui/state";

import { ReduxAnnotationsContext } from "./redux-devtools/redux-annotations";

type RDTAppStore = NonNullable<Root["store"]>;

type RDTThemes = "light" | "dark" | "auto";

const replayThemesToRDTThemes = {
  light: "light",
  dark: "dark",
  system: "auto",
} as const;

export const ReduxDevToolsPanel = () => {
  const [ReduxDevToolsAppRoot, setRoot] = useState<typeof Root | null>(null);
  const rootRef = useRef<Root | null>(null);
  const reduxAnnotations = useContext(ReduxAnnotationsContext);
  const currentTimestamp = useSelector((state: UIState) => state.messages.pausedExecutionPointTime);
  // Collect the current Replay app theme so we can apply it to the Redux DevTools
  const appTheme = useSelector((state: UIState) => state.app.theme);
  // Also save the current RDT theme in state, so we can do stupid syncing tricks
  const [currentRDTTheme, setCurrentRDTTheme] = useState<RDTThemes>(
    replayThemesToRDTThemes[appTheme]
  );

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

    const store = rootRef.current.store!;

    const colorPreference = replayThemesToRDTThemes[appTheme];

    store.dispatch({
      type: "main/CHANGE_THEME",
      theme: "default",
      scheme: "default",
      colorPreference,
    });

    // HACK The RDT store overwrites our initial dispatch when it reloads its own persisted prefs.
    // By subscribing to the store, diffing that value, and setting React state,
    // we can loop back through here and re-dispatch based on the Replay theme,
    // thus effectively keeping them in sync.
    // We unsubscribe and resubscribe every time to avoid leaks.
    return store.subscribe(() => {
      const updatedRDTTheme = store.getState().theme.colorPreference;
      if (currentRDTTheme !== updatedRDTTheme) {
        setCurrentRDTTheme(updatedRDTTheme);
      }
    });
  }, [ReduxDevToolsAppRoot, appTheme, currentRDTTheme]);

  useLayoutEffect(() => {
    if (!rootRef.current) {
      return;
    }

    const rootComponent = rootRef.current;
    const store = rootComponent.store!;

    /*

     The Redux DevTools UI has its own Redux store with its own reducers.
     The primary part that we care about is the slice reducer that manages 
     which "store instances" are connected, and calculates the "lifted state" 
     for each store (ie, "after 3 increment actions, the state is `{value: 3}`".
     See [`reducers/instances.ts` in the Redux DevTools repo for the logic](https://github.com/reduxjs/redux-devtools/blob/b82de745928211cd9b7daa7a61b197ad9e11ec36/packages/redux-devtools-app/src/reducers/instances.ts).

     The RDT internals first pass along an `INIT_INSTANCE` action to let the UI 
     know that a given store instance exists, and then later pass along the serialized  
     actions  for processing to update that instance's calculated state.

     Internally, the `instances` reducer appears to have handling for a 
     "default" state, and falls back to that value if no instances are connected.  
     In my experimenting I found I needed to dispatch an action related to that 
     as part of resetting the internal state.

    */

    const allInstanceIds: string[] = ["default"];

    reduxAnnotations.forEach(annotation => {
      // @ts-ignore ignore "this comparison never matches" error
      if (annotation.action?.request?.type === "INIT_INSTANCE") {
        // @ts-ignore-error TS is _really_ getting confused here
        allInstanceIds.push(annotation.action.request.instanceId);
      }
    });

    batch(() => {
      // We may receive the Redux annotations in several groups over time.
      // Rather than try to figure out which ones we have and haven't loaded into
      // the RDT Redux store, we'll just try to reset its internal instance state entirely,
      // and always reload all of the received annotation actions.

      // TODO THIS IS A TERRIBLE IDEA COME UP WITH SOMETHING BETTER AND YET THIS WORKS
      // Seemingly reset the DevTools internal knowledge of actions.
      // @ts-ignore this is legal to dispatch
      store.dispatch({
        type: "socket/DISCONNECTED",
      });

      // For each connection instance that we know will exist from annotations,
      // re-create an empty state value in the instances data.
      allInstanceIds.forEach(instanceId => {
        store.dispatch({
          type: "devTools/UPDATE_STATE",
          request: {
            type: "LIFTED",
            id: instanceId,
          },
        });
      });

      // Originally I had this showing only actions up to the current pause point,
      // but that led to a situation where there could be partly-initialized state and
      // the RDT UI would end up crashing. Now, always load everything we've received.
      reduxAnnotations.forEach(annotation => {
        store.dispatch(annotation.action);
      });
    });
  }, [ReduxDevToolsAppRoot, reduxAnnotations]);

  if (!ReduxDevToolsAppRoot) {
    return null;
  }

  // @ts-ignore Weird ref type error
  return <ReduxDevToolsAppRoot ref={rootRef} />;
};
