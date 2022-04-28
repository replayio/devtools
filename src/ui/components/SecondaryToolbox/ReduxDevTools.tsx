import React, { useLayoutEffect, useRef } from "react";
import { Root, UPDATE_STATE } from "@redux-devtools/app";
import type { Action } from "@reduxjs/toolkit";
import type {
  UpdateStateRequest,
  SplitMessage,
  PageScriptToContentScriptMessageForwardedToMonitors,
} from "./redux-devtools/api";
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

  useLayoutEffect(() => {
    const rootComponent = rootRef.current!;
    const store = rootComponent.store!;

    console.log("RDT store state: ", store.getState());

    receivedActions.forEach(originalRequest => {
      const action = createDevtoolsAction(1, originalRequest);
      store.dispatch(action!);
    });

    console.log("Updated RDT store state: ", store.getState());
  });

  // @ts-ignore
  return <Root ref={rootRef} />;
};
