import { ExecutionPoint } from "@replayio/protocol";

export interface Annotation {
  point: ExecutionPoint;
  time: number;
  message: any;
}

export interface ReporterState {
  annotations: Annotation[];
}
