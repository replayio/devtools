import React, { useLayoutEffect, useRef, useState } from "react";
import { Annotation } from "@recordreplay/protocol";
import { Root, UPDATE_STATE } from "@redux-devtools/app";
import type { Action } from "@reduxjs/toolkit";
import { useSelector } from "react-redux";
import { ThreadFront } from "protocol/thread";
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
interface ReduxDevToolsProps {}

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

const receivedActions: UpdateStateRequest<RDTAppState, Action>[] = [
  // {
  //   type: "INIT_INSTANCE",
  //   source: "@devtools-page",
  //   instanceId: 1,
  // },
  {
    type: "STATE",
    payload: {
      monitorState: {},
      nextActionId: 1,
      stagedActionIds: [0],
      skippedActionIds: [],
      currentStateIndex: 0,
      isLocked: false,
      isPaused: false,
    },
    source: "@devtools-page",
    instanceId: 1,
    libConfig: {
      name: "React Redux App",
      serialize: false,
      type: "redux",
    },
    actionsById:
      '{"0":{"type":"PERFORM_ACTION","action":{"type":"@@INIT"},"timestamp":1651171950090}}',
    computedStates: '[{"state":{"counter":{"value":0}}}]',
    committedState: false,
  },
  {
    type: "ACTION",
    payload: '{"counter":{"value":1}}',
    source: "@devtools-page",
    instanceId: 1,
    action:
      '{"type":"PERFORM_ACTION","action":{"type":"counter/increment"},"timestamp":1651171952106,"stack":"performAction@debugger eval code:293:21\\nliftAction@debugger eval code:500:25\\ndispatch@debugger eval code:957:26\\ncreateSerializableStateInvariantMiddleware/</</<@https://un8my.csb.app/node_modules/@reduxjs/toolkit/dist/redux-toolkit.esm.js:739:26\\nmiddleware/</<@https://un8my.csb.app/node_modules/redux-thunk/es/index.js:13:16\\ncreateImmutableStateInvariantMiddleware/</</<@https://un8my.csb.app/node_modules/@reduxjs/toolkit/dist/redux-toolkit.esm.js:662:36\\ndispatch@debugger eval code:10430:80\\nonClick@https://un8my.csb.app/src/features/counter/Counter.js:52:28\\ncallCallback@https://un8my.csb.app/node_modules/react-dom/cjs/react-dom.development.js:188:14\\ninvokeGuardedCallbackDev@https://un8my.csb.app/node_modules/react-dom/cjs/react-dom.development.js:237:16\\ninvokeGuardedCallback@https://un8my.csb.app/node_modules/react-dom/cjs/react-dom.development.js:292:31\\ninvokeGuardedCallbackAndCatchFirstError@https://un8my.csb.app/node_modules/react-dom/cjs/react-dom.development.js:306:25\\nexecuteDispatch@https://un8my.csb.app/node_modules/react-dom/cjs/react-dom.development.js:389:42"}',
    maxAge: 50,
    nextActionId: 2,
  },
];

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
  // window.store.dispatch(action);
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

    // processAnnotations(initialAnnotations);

    setAnnotations(initialAnnotations);

    setAnnotationsReceivedHandler(newAnnotations => {
      processAnnotations(newAnnotations);
      setAnnotations(existingAnnotations => {
        return existingAnnotations.concat(newAnnotations);
      });
    });

    // console.log("RDT store state: ", store.getState());

    // console.log("Updated RDT store state: ", store.getState());
  }, []);

  useLayoutEffect(() => {
    const rootComponent = rootRef.current!;
    const store = rootComponent.store!;

    // console.log("Current execution point: ", executionPoint);
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

    processAnnotations(matchingAnnotationsByTimeRange);
  }, [currentTimestamp, annotations]);

  // @ts-ignore
  return <Root ref={rootRef} />;
};
