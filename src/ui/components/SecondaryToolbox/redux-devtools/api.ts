import {
  CustomAction,
  DispatchAction as AppDispatchAction,
  LibConfig,
  SetPersistAction,
  UPDATE_STATE,
} from "@redux-devtools/app";
import { LiftedState } from "@redux-devtools/instrument";
import { Action, Dispatch, MiddlewareAPI } from "redux";

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
  readonly source: any; // typeof pageSource;
  readonly split: "start";
}

interface SplitMessageChunk extends SplitMessageBase {
  readonly instanceId: number;
  readonly source: any; // typeof pageSource;
  readonly split: "chunk";
  readonly chunk: [string, string];
}

interface SplitMessageEnd extends SplitMessageBase {
  readonly instanceId: number;
  readonly source: any; // typeof pageSource;
  readonly split: "end";
}

export type SplitMessage = SplitMessageStart | SplitMessageChunk | SplitMessageEnd;

export type TabMessage =
  | StartAction
  | StopAction
  | DispatchAction
  | ImportAction
  | ActionAction
  | ExportAction;
export type PanelMessage<S, A extends Action<unknown>> =
  | NAAction
  | UpdateStateAction<S, A>
  | SetPersistAction;
export type MonitorMessage = NAAction | EmptyUpdateStateAction | SetPersistAction;

export const CONNECTED = "socket/CONNECTED";
export const DISCONNECTED = "socket/DISCONNECTED";

export type PageScriptToContentScriptMessageForwardedToMonitors<S, A extends Action<unknown>> =
  | InitMessage<S, A>
  | LiftedMessage
  | SerializedPartialStateMessage
  | SerializedExportMessage
  | SerializedActionMessage
  | SerializedStateMessage<S, A>;
