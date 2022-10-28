import { SelectedFrameContext } from "@bvaughn/src/contexts/SelectedFrameContext";
import useCurrentPause from "@bvaughn/src/hooks/useCurrentPause";
import { evaluateSuspense } from "@bvaughn/src/suspense/PauseCache";
import { createPauseResult as Pause, Value as ProtocolValue } from "@replayio/protocol";
import { RefObject, Suspense, useContext, useEffect, useRef } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import SourcePreviewInspector from "../inspector/SourcePreviewInspector";
import Popup from "../Popup";

import styles from "./PreviewPopup.module.css";

type Props = {
  containerRef: RefObject<HTMLElement>;
  dismiss: () => void;
  expression: string;
  pause: Pause;
  target: HTMLElement;
};

function SuspendingPreviewPopup({ containerRef, dismiss, expression, pause, target }: Props) {
  const client = useContext(ReplayClientContext);

  const popupRef = useRef<HTMLDivElement>(null);

  const { selectedPauseAndFrameId } = useContext(SelectedFrameContext);
  const frameId = selectedPauseAndFrameId?.frameId ?? null;
  const pauseId = selectedPauseAndFrameId?.pauseId ?? null;

  let value: ProtocolValue | null = null;
  if (frameId !== null && pauseId !== null) {
    const result = evaluateSuspense(client, pauseId, frameId, expression);

    value = result.returned || null;
  }

  useEffect(() => {
    const onClick = ({ target }: MouseEvent) => {
      const popupElement = popupRef.current;
      if (popupElement && target) {
        if (popupElement !== target && !popupElement.contains(target as any)) {
          dismiss();
        }
      }
    };

    document.body.addEventListener("click", onClick);

    return () => {
      document.body.removeEventListener("click", onClick);
    };
  });

  if (pauseId !== null && value !== null) {
    return (
      <Popup containerRef={containerRef} dismiss={dismiss} target={target} showTail={true}>
        <SourcePreviewInspector
          className={styles.Popup}
          pauseId={pause.pauseId}
          protocolValue={value}
          ref={popupRef}
        />
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
