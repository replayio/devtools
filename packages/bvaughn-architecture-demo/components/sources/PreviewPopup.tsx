import useCurrentPause from "@bvaughn/src/hooks/useCurrentPause";
import { evaluate } from "@bvaughn/src/suspense/PauseCache";
import { createPauseResult as Pause, Value as ProtocolValue } from "@replayio/protocol";
import { RefObject, Suspense, useContext } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import SourcePreviewInspector from "../inspector/SourcePreviewInspector";
import Loader from "../Loader";
import Popup from "../Popup";

type Props = {
  containerRef: RefObject<HTMLElement>;
  dismiss: () => void;
  expression: string;
  pause: Pause;
  target: HTMLElement;
};

function SuspendingPreviewPopup({ containerRef, dismiss, expression, pause, target }: Props) {
  const client = useContext(ReplayClientContext);

  const pauseId = pause.pauseId;
  const frameId = pause.data.frames?.[0]?.frameId ?? null;

  let value: ProtocolValue | null = null;
  if (frameId !== null && pauseId !== null) {
    const result = evaluate(client, pauseId, frameId, expression);

    value = result.returned || null;
  }

  if (pauseId !== null && value !== null) {
    return (
      <Popup containerRef={containerRef} onMouseLeave={dismiss} target={target} showTail={true}>
        <SourcePreviewInspector pauseId={pause.pauseId} protocolValue={value} />
      </Popup>
    );
  } else {
    return null;
  }
}

export default function PreviewPopup(props: Omit<Props, "pause">) {
  const pause = useCurrentPause();
  if (pause === null) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <SuspendingPreviewPopup {...props} pause={pause} />
    </Suspense>
  );
}
