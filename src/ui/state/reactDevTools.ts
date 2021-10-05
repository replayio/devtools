import { ExecutionPoint } from "@recordreplay/protocol";

export interface Annotation {
  point: ExecutionPoint;
  time: number;
  message: any;
}

export interface ReactDevToolsState {
  annotations: Annotation[];
  currentPoint: ExecutionPoint | null;
  hasReactComponents: boolean;
}
