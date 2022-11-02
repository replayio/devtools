import "bvaughn-architecture-demo/pages/variables.css";
import { Value as ProtocolValue } from "@replayio/protocol";

import ErrorBoundary from "bvaughn-architecture-demo/components/ErrorBoundary";
import SourcePreviewInspector from "bvaughn-architecture-demo/components/inspector/SourcePreviewInspector";
import { useAppSelector } from "ui/setup/hooks";

export default function NewObjectInspector({ protocolValue }: { protocolValue: ProtocolValue }) {
  const pauseId = useAppSelector(state => state.pause.id);
  if (pauseId == null || protocolValue === null) {
    return null;
  }

  return (
    <ErrorBoundary>
      <div className="preview-popup">
        <SourcePreviewInspector pauseId={pauseId} protocolValue={protocolValue} />
      </div>
    </ErrorBoundary>
  );
}
