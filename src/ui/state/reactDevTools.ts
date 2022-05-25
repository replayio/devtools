import { ExecutionPoint } from "@replayio/protocol";

export interface Annotation {
  point: ExecutionPoint;
  time: number;
  message: any;
}

export interface ReactDevToolsState {
  annotations: Annotation[];
  hasReactComponents: boolean;
  reactInitPoint: ExecutionPoint | null;
  protocolCheckFailed: boolean;
}
