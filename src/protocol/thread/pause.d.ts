import { client } from "../socket";
import { defer, assert, Deferred } from "../utils";
import { ValueFront } from "./value";
import { ThreadFront } from "./thread";
import { NodeFront } from "./node";
import { RuleFront } from "./rule";
import { StyleFront } from "./style";
import { StyleSheetFront } from "./styleSheet";
import { NodeBoundsFront } from "./bounds";
import {
  ContainerEntry,
  ExecutionPoint,
  Frame,
  FrameId,
  NamedValue,
  NodeBounds,
  Object as ObjectDescription,
  ObjectId,
  ObjectPreview,
  PauseData,
  PauseId,
  PointDescription,
  Property,
  Scope,
  ScopeId,
  SessionId,
  Value,
} from "record-replay-protocol";

export type DOMFront = NodeFront | RuleFront | StyleFront | StyleSheetFront;

export type WiredObject = Omit<ObjectDescription, "preview"> & {
  preview?: WiredObjectPreview;
};

export type WiredObjectPreview = Omit<
  ObjectPreview,
  "properties" | "containerEntries" | "getterValues"
> & {
  properties: WiredProperty[];
  containerEntries: WiredContainerEntry[];
  getterValues: WiredNamedValue[];
  prototypeValue: ValueFront;
};

export interface WiredContainerEntry {
  key?: ValueFront;
  value: ValueFront;
}

export interface WiredProperty {
  name: string;
  value: ValueFront;
  writable: boolean;
  configurable: boolean;
  enumerable: boolean;
  get?: ValueFront;
  set?: ValueFront;
}

export interface WiredNamedValue {
  name: string;
  value: ValueFront;
}

export type WiredFrame = Omit<Frame, "this"> & {
  this: ValueFront;
};

export type WiredScope = Omit<Scope, "bindings" | "object"> & {
  bindings?: { name: string; value: ValueFront };
  object?: ValueFront;
};

export interface EvaluationResult {
  returned?: ValueFront;
  exception?: ValueFront;
  failed?: boolean;
}

// Information about a protocol pause.
export declare class Pause {
  sessionId: SessionId;
  pauseId: PauseId | null;
  point: ExecutionPoint | null;
  time: number | null;
  hasFrames: boolean | null;
  createWaiter: Promise<void> | null;
  frames: Map<FrameId, WiredFrame>;
  scopes: Map<ScopeId, WiredScope>;
  objects: Map<ObjectId, WiredObject>;
  frameSteps: Map<string, PointDescription[]>;
  documentNode: NodeFront | undefined;
  domFronts: Map<string, DOMFront>;
  stack: WiredFrame[] | undefined;
  loadMouseTargetsWaiter: Deferred<void> | undefined;
  mouseTargets: NodeBounds[] | undefined;
  constructor(sessionId: SessionId);
  create(point: ExecutionPoint, time: number): void;
  instantiate(
    pauseId: PauseId,
    point: ExecutionPoint,
    time: number,
    hasFrames: boolean,
    data?: PauseData
  ): void;
  addData(...datas: PauseData[]): void;
  getFrames(): Promise<WiredFrame[] | undefined>;
  ensureScopeChain(scopeChain: ScopeId[]): Promise<WiredScope[]>;
  getScopes(frameId: FrameId): Promise<WiredScope[]>;
  getObjectPreview(object: ObjectId): Promise<WiredObject>;
  evaluate(frameId: FrameId | undefined, expression: string): Promise<EvaluationResult>;
  getDOMFront(objectId: undefined): null;
  getDOMFront(objectId: ObjectId): DOMFront;
  getDOMFront(objectId: ObjectId | undefined): DOMFront | null;
  getNodeFront(objectId: ObjectId): NodeFront;
  getRuleFront(objectId: ObjectId): RuleFront;
  getStyleFront(objectId: ObjectId): StyleFront;
  getStyleSheetFront(objectId: ObjectId): StyleSheetFront;
  ensureDOMFrontAndParents(nodeId: ObjectId): Promise<NodeFront>;
  loadDocument(): Promise<void>;
  searchDOM(query: string): Promise<NodeFront[]>;
  loadMouseTargets(): Promise<void>;
  getMouseTarget(x: number, y: number): Promise<NodeBoundsFront | null>;
  getFrameSteps(frameId: FrameId): Promise<PointDescription[]>;
  sendMessage<P, R>(
    call: (parameters: P, sessionId?: SessionId, pauseId?: PauseId) => R,
    parameters: P
  ): R;
}
