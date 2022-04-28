import {
  CustomAction,
  DispatchAction as AppDispatchAction,
  LibConfig,
  LIFTED_ACTION,
  nonReduxDispatch,
  REMOVE_INSTANCE,
  SET_PERSIST,
  SetPersistAction,
  stringifyJSON,
  TOGGLE_PERSIST,
  UPDATE_STATE,
} from "@redux-devtools/app";
import syncOptions, {
  Options,
  OptionsMessage,
  SyncOptions,
} from "../../browser/extension/options/syncOptions";
import openDevToolsWindow, {
  DevToolsPosition,
} from "../../browser/extension/background/openWindow";
import { getReport } from "../../browser/extension/background/logging";
import { Action, Dispatch, MiddlewareAPI } from "redux";
import { ContentScriptToBackgroundMessage, SplitMessage } from "./contentScript";
import {
  ErrorMessage,
  PageScriptToContentScriptMessageForwardedToMonitors,
  PageScriptToContentScriptMessageWithoutDisconnectOrInitInstance,
} from "./api";
import { LiftedState } from "@redux-devtools/instrument";
import { BackgroundAction, LiftedActionAction } from "../stores/backgroundStore";
import { Position } from "../api/openWindow";
import { BackgroundState } from "../reducers/background";

interface TabMessageBase {
  readonly type: string;
  readonly state?: string | undefined;
  readonly id?: string;
}

interface StartAction extends TabMessageBase {
  readonly type: "START";
  readonly state?: never;
  readonly id?: never;
}

interface StopAction extends TabMessageBase {
  readonly type: "STOP";
  readonly state?: never;
  readonly id?: never;
}

interface DispatchAction extends TabMessageBase {
  readonly type: "DISPATCH";
  readonly action: AppDispatchAction;
  readonly state: string | undefined;
  readonly id: string;
}

interface ImportAction extends TabMessageBase {
  readonly type: "IMPORT";
  readonly action: undefined;
  readonly state: string | undefined;
  readonly id: string;
}

interface ActionAction extends TabMessageBase {
  readonly type: "ACTION";
  readonly action: string | CustomAction;
  readonly state: string | undefined;
  readonly id: string;
}

interface ExportAction extends TabMessageBase {
  readonly type: "EXPORT";
  readonly action: undefined;
  readonly state: string | undefined;
  readonly id: string;
}

export interface NAAction {
  readonly type: "NA";
  readonly id: string | number;
}

interface InitMessage<S, A extends Action<unknown>> {
  readonly type: "INIT";
  readonly payload: string;
  instanceId: string;
  readonly source: "@devtools-page";
  action?: string;
  name?: string | undefined;
  liftedState?: LiftedState<S, A, unknown>;
  libConfig?: LibConfig;
}

interface LiftedMessage {
  type: "LIFTED";
  liftedState: { isPaused: boolean | undefined };
  instanceId: number;
  source: "@devtools-page";
}

interface SerializedPartialLiftedState {
  readonly stagedActionIds: readonly number[];
  readonly currentStateIndex: number;
  readonly nextActionId: number;
}

interface SerializedPartialStateMessage {
  readonly type: "PARTIAL_STATE";
  readonly payload: SerializedPartialLiftedState;
  readonly source: "@devtools-page";
  instanceId: number;
  readonly maxAge: number;
  readonly actionsById: string;
  readonly computedStates: string;
  readonly committedState: boolean;
}

interface SerializedExportMessage {
  readonly type: "EXPORT";
  readonly payload: string;
  readonly committedState: string | undefined;
  readonly source: "@devtools-page";
  instanceId: number;
}

interface SerializedActionMessage {
  readonly type: "ACTION";
  readonly payload: string;
  readonly source: "@devtools-page";
  instanceId: number;
  readonly action: string;
  readonly maxAge: number;
  readonly nextActionId: number;
}

interface SerializedStateMessage<S, A extends Action<unknown>> {
  readonly type: "STATE";
  readonly payload: Omit<
    LiftedState<S, A, unknown>,
    "actionsById" | "computedStates" | "committedState"
  >;
  readonly source: "@devtools-page";
  instanceId: string | number;
  readonly libConfig?: LibConfig;
  readonly actionsById: string;
  readonly computedStates: string;
  readonly committedState: boolean;
}

export type UpdateStateRequest<S, A extends Action<unknown>> =
  | InitMessage<S, A>
  | LiftedMessage
  | SerializedPartialStateMessage
  | SerializedExportMessage
  | SerializedActionMessage
  | SerializedStateMessage<S, A>;

export interface EmptyUpdateStateAction {
  readonly type: typeof UPDATE_STATE;
}

export interface UpdateStateAction<S, A extends Action<unknown>> {
  readonly type: typeof UPDATE_STATE;
  request: UpdateStateRequest<S, A>;
  readonly id: string | number;
}

interface SplitMessageBase {
  readonly type?: never;
}

interface SplitMessageStart extends SplitMessageBase {
  readonly instanceId: number;
  readonly source: typeof pageSource;
  readonly split: "start";
}

interface SplitMessageChunk extends SplitMessageBase {
  readonly instanceId: number;
  readonly source: typeof pageSource;
  readonly split: "chunk";
  readonly chunk: [string, string];
}

interface SplitMessageEnd extends SplitMessageBase {
  readonly instanceId: number;
  readonly source: typeof pageSource;
  readonly split: "end";
}

export type SplitMessage = SplitMessageStart | SplitMessageChunk | SplitMessageEnd;

export type TabMessage =
  | StartAction
  | StopAction
  | OptionsMessage
  | DispatchAction
  | ImportAction
  | ActionAction
  | ExportAction;
export type PanelMessage<S, A extends Action<unknown>> =
  | NAAction
  | ErrorMessage
  | UpdateStateAction<S, A>
  | SetPersistAction;
export type MonitorMessage = NAAction | ErrorMessage | EmptyUpdateStateAction | SetPersistAction;

export const CONNECTED = "socket/CONNECTED";
export const DISCONNECTED = "socket/DISCONNECTED";

export type PageScriptToContentScriptMessageForwardedToMonitors<S, A extends Action<unknown>> =
  | InitMessage<S, A>
  | LiftedMessage
  | SerializedPartialStateMessage
  | SerializedExportMessage
  | SerializedActionMessage
  | SerializedStateMessage<S, A>;

interface ImportMessage {
  readonly message: "IMPORT";
  readonly id: string | number;
  readonly instanceId: string;
  readonly state: string;
  readonly action?: never;
}

type ToContentScriptMessage = ImportMessage | LiftedActionAction;

function getReducerError() {
  // @ts-ignore
  const instancesState = window.store.getState().instances;
  const payload = instancesState.states[instancesState.current];
  const computedState = payload.computedStates[payload.currentStateIndex];
  if (!computedState) {
    return false;
  }
  return computedState.error;
}

interface OpenMessage {
  readonly type: "OPEN";
  readonly position: Position;
}

interface OpenOptionsMessage {
  readonly type: "OPEN_OPTIONS";
}

interface GetOptionsMessage {
  readonly type: "GET_OPTIONS";
}

export type SingleMessage = OpenMessage | OpenOptionsMessage | GetOptionsMessage;

type BackgroundStoreMessage<S, A extends Action<unknown>> =
  | PageScriptToContentScriptMessageWithoutDisconnectOrInitInstance<S, A>
  | SplitMessage
  | SingleMessage;
type BackgroundStoreResponse = { readonly options: Options };
