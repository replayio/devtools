import { Annotation, TimeStampedPoint } from "@recordreplay/protocol";
import type { UPDATE_STATE } from "@redux-devtools/app";
import type { Action } from "@reduxjs/toolkit";
import { createContext } from "react";

import type {
  UpdateStateRequest,
  SplitMessage,
  PageScriptToContentScriptMessageForwardedToMonitors,
} from "./api";

export interface ReduxActionAnnotation<State = unknown> extends TimeStampedPoint {
  /** The Redux DevTools update action, with data parsed from a JSON string and wrapped in an action.
   * Contents may vary. */
  action: UpdateStateAction<State, Action>;
}

export const ReduxAnnotationsContext = createContext<ReduxActionAnnotation[]>([]);

export interface UpdateStateAction<S, A extends Action<unknown>> {
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
export const createDevtoolsAction = <S, A extends Action<unknown>>(
  tabId: number,
  request: UpdateStateRequest<S, A> | SplitMessage
) => {
  const action: UpdateStateAction<S, A> = {
    type: "devTools/UPDATE_STATE",
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

export const processReduxAnnotations = (annotations: Annotation[]): ReduxActionAnnotation[] => {
  return annotations.map(annotation => {
    const { contents, kind, point, time } = annotation;
    // Parse the stringified data from the Redux DevTools on the backend
    const message = JSON.parse(contents);
    // Wrap that data in an action we can use to update the DevTools store in the panel
    const action = createDevtoolsAction(1, message)!;
    return { kind, point, time, action };
  });
};
