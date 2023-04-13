import { ExecutionPoint, Value } from "@replayio/protocol";
import { Cache, createCache } from "suspense";

import type { ThreadFront as TF } from "protocol/thread";
import { ThreadFront } from "protocol/thread";
import { topFrameCache } from "replay-next/src/suspense/FrameCache";
import { pauseIdCache } from "replay-next/src/suspense/PauseCache";
import { ReplayClientInterface } from "shared/client/types";

import type { Delta } from "./JSONDiff";

export type ReduxActionStateValues = readonly [pauseId: string, action: Value, state: Value];

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
    jsondiffpatch: any;
  }
}

// These types aren't actually attached to `window`, but _should_ be in
// scope when we evaluate code at the original annotation timestamps.
// Use `declare let x` to make code in _this_ file only accept those.
declare let latestDispatchedActions: Record<string, LastSavedValues>;
declare let action: AnyAction;
declare let state: any;
declare let extractedConfig: ExtractedExtensionConfig;
declare let config: Config;

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

function diffStates() {
  const { instanceId } = extractedConfig;

  let previousState = {};

  if (instanceId in latestDispatchedActions) {
    previousState = latestDispatchedActions[instanceId].state;
  }

  const diff = window.jsondiffpatch.diff(previousState, state);
  return JSON.stringify(diff);
}

async function evaluateNoArgsFunction(
  ThreadFront: typeof TF,
  replayClient: ReplayClientInterface,
  fn: Function,
  pauseId?: string,
  frameId?: string
) {
  return await ThreadFront.evaluate({
    replayClient,
    text: `(${fn})()`,
    pauseId,
    frameId,
  });
}

// Cache this at the module level, because the backend records all evaluations
// applied to a given pause in a session. So, we only need to do this once for
// a given Pause, and we want to retain the info even if the RDT component unmounts.
export const actionStateValuesCache: Cache<
  [replayClient: ReplayClientInterface, point: ExecutionPoint, time: number],
  ReduxActionStateValues | undefined
> = createCache({
  config: { immutable: true },
  debugLabel: "ActionStateValues",
  getKey: ([replayClient, point, time]) => point,
  load: async ([replayClient, point, time]) => {
    const pauseId = await pauseIdCache.readAsync(replayClient, point, time);
    if (!pauseId) {
      return;
    }

    const topFrame = await topFrameCache.readAsync(replayClient, pauseId);
    if (!topFrame) {
      return;
    }

    const actionRes = await evaluateNoArgsFunction(
      ThreadFront,
      replayClient,
      getActionObjectId,
      pauseId,
      topFrame.frameId
    );

    const stateRes = await evaluateNoArgsFunction(
      ThreadFront,
      replayClient,
      getStateObjectId,
      pauseId,
      topFrame.frameId
    );

    if (actionRes.returned && stateRes.returned) {
      const result = [pauseId, actionRes.returned!, stateRes.returned!] as const;
      return result;
    }
  },
});

export const diffCache: Cache<
  [replayClient: ReplayClientInterface, point: ExecutionPoint, time: number],
  Delta | undefined
> = createCache({
  config: { immutable: true },
  debugLabel: "Diff",
  getKey: ([replayClient, point, time]) => point,
  load: async ([replayClient, point, time]) => {
    const pauseId = await pauseIdCache.readAsync(replayClient, point, time);
    if (!pauseId) {
      return;
    }

    const topFrame = await topFrameCache.readAsync(replayClient, pauseId);
    if (!topFrame) {
      return;
    }

    const jsondiffpatchSource = require("./jsondiffpatch.umd.slim.raw.js").default;

    await ThreadFront.evaluate({
      replayClient,
      pauseId,
      text: jsondiffpatchSource,
    });

    const diffResult = await evaluateNoArgsFunction(
      ThreadFront,
      replayClient,
      diffStates,
      pauseId,
      topFrame.frameId
    );

    if (diffResult.returned?.value) {
      const diff = JSON.parse(diffResult.returned.value);
      return diff;
    }
  },
});
