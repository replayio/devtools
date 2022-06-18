import { Object as ProtocolObject, PauseId as ProtocolPauseId } from "@replayio/protocol";

export type ObjectPreviewRendererProps = {
  object: ProtocolObject;
  pauseId: ProtocolPauseId;
};
