import React, { useLayoutEffect, useRef, useState } from "react";
import { Annotation } from "@recordreplay/protocol";
import { Root, UPDATE_STATE } from "@redux-devtools/app";
import type { Action } from "@reduxjs/toolkit";
import { useSelector } from "react-redux";
import type { UIState } from "ui/state";
import type {
  UpdateStateRequest,
  SplitMessage,
  PageScriptToContentScriptMessageForwardedToMonitors,
} from "./redux-devtools/api";
import {
  getInitialAnnotations,
  setAnnotationsReceivedHandler,
} from "./redux-devtools/redux-annotations";

type RDTAppStore = NonNullable<Root["store"]>;

type RDTAppState = ReturnType<RDTAppStore["getState"]>;

interface UpdateStateAction<S, A extends Action<unknown>> {
  readonly type: typeof UPDATE_STATE;
  request: UpdateStateRequest<S, A>;
  readonly id: string | number;
}

const chunks: {
  [instanceId: string]: PageScriptToContentScriptMessageForwardedToMonitors<
    unknown,
    Action<unknown>
  >;
} = {};

// Copied from the guts of the RDT extension logic
const createDevtoolsAction = <S, A extends Action<unknown>>(
  tabId: number,
  request: UpdateStateRequest<S, A> | SplitMessage
) => {
  const action: UpdateStateAction<S, A> = {
    type: UPDATE_STATE,
    request,
    id: tabId,
  } as UpdateStateAction<S, A>;
  const instanceId = `${tabId}/${request.instanceId}`;
  if ("split" in request) {
    if (request.split === "start") {
      chunks[instanceId] = request as any;
      return;
    }
    if (request.split === "chunk") {
      (chunks[instanceId] as any)[request.chunk[0]] =
        ((chunks[instanceId] as any)[request.chunk[0]] || "") + request.chunk[1];
      return;
    }
    action.request = chunks[instanceId] as any;
    delete chunks[instanceId];
  }
  if (request.instanceId) {
    action.request.instanceId = instanceId;
  }

  return action;
};

export const ReduxDevToolsPanel = () => {
  const rootRef = useRef<Root | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const currentTimestamp = useSelector((state: UIState) => state.messages.pausedExecutionPointTime);

  const processAnnotations = (annotations: Annotation[]) => {
    const rootComponent = rootRef.current!;
    const store = rootComponent.store!;

    annotations.forEach(annotation => {
      const message = JSON.parse(annotation.contents);
      const action = createDevtoolsAction(1, message)!;
      store.dispatch(action);
    });
  };

  useLayoutEffect(() => {
    const initialAnnotations = getInitialAnnotations();

    setAnnotations(initialAnnotations);

    // Replace the setter in the other module so any future additions
    // get redirected to this component's state
    setAnnotationsReceivedHandler(newAnnotations => {
      processAnnotations(newAnnotations);
      setAnnotations(existingAnnotations => {
        return existingAnnotations.concat(newAnnotations);
      });
    });
  }, []);

  useLayoutEffect(() => {
    const rootComponent = rootRef.current!;
    const store = rootComponent.store!;

    const matchingAnnotationsByTimeRange = annotations.filter(annotation => {
      return currentTimestamp != null && annotation.time < currentTimestamp;
    });

    // TODO THIS IS A TERRIBLE IDEA COME UP WITH SOMETHING BETTER AND YET THIS WORKS
    // Seemingly reset the DevTools internal knowledge of actions,
    // so we can re-send in all actions up to this point in the recording
    store.dispatch({
      type: "devTools/UPDATE_STATE",
      request: {
        type: "LIFTED",
      },
    });

    // TODO We ought to be able to do the JSON parsing once ahead of time
    processAnnotations(matchingAnnotationsByTimeRange);

    // TODO This only gets updated when we actually _pause_, not during playback.
  }, [currentTimestamp, annotations]);

  // @ts-ignore Weird ref type error
  return <Root ref={rootRef} />;
};
