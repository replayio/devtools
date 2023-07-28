import {
  ProtocolErrorMap,
  ProtocolRequestMap,
  ProtocolResponseMap,
} from "ui/reducers/protocolMessages";

export interface AllProtocolMessages {
  requestMap: ProtocolRequestMap;
  responseMap: ProtocolResponseMap;
  errorMap: ProtocolErrorMap;
}

export interface ProtocolMessageCommon {
  id: number;
  recordedAt: number;
}

export type RequestSummaryChunk = {
  class: string;
  errored: boolean;
  ids: number[];
  count: number;
  method: string;
  pending: boolean;
  startedAt: number;
};
