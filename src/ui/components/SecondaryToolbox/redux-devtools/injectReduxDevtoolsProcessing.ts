import { ExecutionPoint, Value } from "@replayio/protocol";

import type { ThreadFront as TF } from "protocol/thread";
import { ThreadFront } from "protocol/thread";
import { getFramesAsync } from "replay-next/src/suspense/FrameCache";
import { getPauseIdAsync } from "replay-next/src/suspense/PauseCache";
import { ReplayClientInterface } from "shared/client/types";

export type ReduxActionStateValues = readonly [pauseId: string, action: Value, state: Value];

// Cache this at the module level, because the backend records all evaluations
// applied to a given pause in a session. So, we only need to do this once for
// a given Pause, and we want to retain the info even if the RDT component unmounts.
export const pausesWithDevtoolsInjected = new Map<string, ReduxActionStateValues>();

// types borrowed from the Redux DevTools source

interface LocalFilter {
  allowlist: string | undefined;
  denylist: string | undefined;
}

interface Action<T = any> {
  type: T;
}

interface AnyAction extends Action {
  // Allows any extra properties to be defined in an action.
  [extraProps: string]: any;
}

interface Config {
  readonly stateSanitizer?: <S>(state: S, index?: number) => S;
  readonly actionSanitizer?: <A extends Action<unknown>>(action: A, id?: number) => A;
  readonly predicate?: <S, A extends Action<unknown>>(state: S, action: A) => boolean;
}

type ExtractedExtensionConfig = Pick<Config, "stateSanitizer" | "actionSanitizer" | "predicate"> & {
  instanceId: number;
  isFiltered: <A extends Action<unknown>>(
    action: A | string,
    localFilter: LocalFilter | undefined
  ) => boolean | "" | RegExpMatchArray | null | undefined;
  localFilter: LocalFilter | undefined;
};

interface LastSavedValues {
  action: string | AnyAction;
  state: any;
  extractedConfig: ExtractedExtensionConfig;
  config: Config;
}

declare global {
  interface Window {
    evaluationLogs: string[];
    logMessage: (message: string) => void;
  }

  // These types aren't actually attached to `window`, but _should_ be in
  // scope when we evaluate code at the original annotation timestamps.
  let latestDispatchedActions: Record<string, LastSavedValues>;

  let action: AnyAction;
  let state: any;
  let extractedConfig: ExtractedExtensionConfig;
  let config: Config;
}

function mutateWindowForSetup() {
  window.evaluationLogs = [];
  window.logMessage = function (message) {
    window.evaluationLogs.push(message);
  };
}

function getMessages() {
  // Get the log messages for debugging
  return JSON.stringify({ messages: window.evaluationLogs });
}

function getActionObjectId() {
  const { actionSanitizer } = extractedConfig;
  if (actionSanitizer) {
    return actionSanitizer(action);
  }
  return action;
}

function getStateObjectId() {
  const { stateSanitizer } = extractedConfig;
  if (stateSanitizer) {
    return stateSanitizer(state);
  }
  return state;
}

async function evaluateNoArgsFunction(
  ThreadFront: typeof TF,
  replayClient: ReplayClientInterface,
  fn: Function,
  pauseId?: string,
  frameId?: string
) {
  return await ThreadFront.evaluateNew({
    replayClient,
    text: `(${fn})()`,
    pauseId,
    frameId,
  });
}

export async function fetchReduxValuesAtPoint(
  replayClient: ReplayClientInterface,
  point: ExecutionPoint,
  time: number
) {
  const pauseId = await getPauseIdAsync(replayClient, point, time);
  if (!pauseId) {
    return;
  }

  if (pausesWithDevtoolsInjected.has(point)) {
    return pausesWithDevtoolsInjected.get(point)!;
  }

  const frames = await getFramesAsync(replayClient, pauseId);
  if (!frames) {
    return;
  }

  const actionRes = await evaluateNoArgsFunction(
    ThreadFront,
    replayClient,
    getActionObjectId,
    pauseId,
    frames[0].frameId
  );

  const stateRes = await evaluateNoArgsFunction(
    ThreadFront,
    replayClient,
    getStateObjectId,
    pauseId,
    frames[0].frameId
  );

  if (actionRes.returned && stateRes.returned) {
    const result = [pauseId, actionRes.returned!, stateRes.returned!] as const;
    pausesWithDevtoolsInjected.set(point, result);
    return result;
  }
}
