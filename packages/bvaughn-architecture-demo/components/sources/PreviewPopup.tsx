import { Value as ProtocolValue } from "@replayio/protocol";
import { RefObject, Suspense, useContext, useEffect, useRef } from "react";

import { SelectedFrameContext } from "bvaughn-architecture-demo/src/contexts/SelectedFrameContext";
import { evaluateSuspense } from "bvaughn-architecture-demo/src/suspense/PauseCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import SourcePreviewInspector from "../inspector/SourcePreviewInspector";
import Popup from "../Popup";
import styles from "./PreviewPopup.module.css";

type Props = {
  containerRef: RefObject<HTMLElement>;
  dismiss: () => void;
  expression: string;
  target: HTMLElement;
};

export default function PreviewPopup(props: Props) {
  return (
    <Suspense fallback={null}>
      <SuspendingPreviewPopup {...props} />
    </Suspense>
  );
}

function SuspendingPreviewPopup({ containerRef, dismiss, expression, target }: Props) {
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
          pauseId={pauseId}
          protocolValue={value}
          ref={popupRef}
        />
      </Popup>
    );
  } else {
    return null;
  }
}
