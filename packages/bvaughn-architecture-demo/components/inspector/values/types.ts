import {
  ExecutionPoint,
  Object as ProtocolObject,
  PauseId as ProtocolPauseId,
  Value as ProtocolValue,
} from "@replayio/protocol";

export type ObjectPreviewRendererProps = {
  executionPoint: ExecutionPoint;
  object: ProtocolObject;
  pauseId: ProtocolPauseId;
  protocolValue: ProtocolValue;
};
