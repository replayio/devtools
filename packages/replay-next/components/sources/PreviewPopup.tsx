import { Value as ProtocolValue, SourceId } from "@replayio/protocol";
import {
  PropsWithChildren,
  ReactNode,
  RefObject,
  Suspense,
  useContext,
  useEffect,
  useRef,
} from "react";

import { InlineErrorBoundary } from "replay-next/components/errors/InlineErrorBoundary";
import { SelectedFrameContext } from "replay-next/src/contexts/SelectedFrameContext";
import { useCurrentFocusWindow } from "replay-next/src/hooks/useCurrentFocusWindow";
import { getFrameSuspense } from "replay-next/src/suspense/FrameCache";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import {
  getPointAndTimeForPauseId,
  pauseEvaluationsCache,
} from "replay-next/src/suspense/PauseCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { isPointInRegion } from "shared/utils/time";

import SourcePreviewInspector from "../inspector/SourcePreviewInspector";
import Popup, { PopupStyle } from "../Popup";
import styles from "./PreviewPopup.module.css";

type Props = {
  clientX?: number | null;
  containerRef: RefObject<HTMLElement>;
  dismiss: () => void;
  expression: string;
  sourceId: SourceId;
  target: HTMLElement;
};

export default function PreviewPopup(props: Props) {
  return (
    <InlineErrorBoundary name="PreviewPopup">
      <Suspense
        fallback={
          <PopupWithChildren {...props}>
            <div className={styles.Popup}>
              <div className={styles.LoadingMessage}>Loading...</div>
            </div>
          </PopupWithChildren>
        }
      >
        <SuspendingPreviewPopup {...props} />
      </Suspense>
    </InlineErrorBoundary>
  );
}

function SuspendingPreviewPopup({
  clientX = null,
  containerRef,
  dismiss,
  expression,
  sourceId,
  target,
}: Props) {
  const client = useContext(ReplayClientContext);
  const focusWindow = useCurrentFocusWindow();

  const popupRef = useRef<HTMLDivElement>(null);

  const { selectedPauseAndFrameId } = useContext(SelectedFrameContext);
  const frameId = selectedPauseAndFrameId?.frameId ?? null;
  const pauseId = selectedPauseAndFrameId?.pauseId ?? null;

  let value: ProtocolValue | null = null;
  let valueUnavailableMessage: string | null = null;
  if (frameId !== null && pauseId !== null) {
    const [point] = getPointAndTimeForPauseId(pauseId);
    if (focusWindow !== null && point !== null) {
      if (isPointInRegion(point, focusWindow)) {
        const frame = getFrameSuspense(client, pauseId, frameId);
        if (frame?.location.some(location => location.sourceId === sourceId)) {
          const result = pauseEvaluationsCache.read(
            client,
            pauseId,
            frameId,
            expression,
            undefined
          );

          if (result.exception?.object) {
            const exceptionPreview = objectCache.read(
              client,
              pauseId,
              result.exception.object,
              "canOverflow"
            );
            if (exceptionPreview?.preview?.properties) {
              const message = exceptionPreview.preview.properties.find(
                property => property.name === "message"
              );
              if (message) {
                valueUnavailableMessage = `${exceptionPreview.className}: ${message.value}`;
              }
            }
          }

          if (!valueUnavailableMessage) {
            if (result.failed || result.exception) {
              valueUnavailableMessage = "Value cannot be inspected";
            } else {
              value = result.returned || null;
            }
          }
        } else {
          valueUnavailableMessage = "Value cannot be inspected";
        }
      } else {
        valueUnavailableMessage = "Value is outside of focus range";
      }
    }
  }

  useEffect(() => {
    const onClick = ({ defaultPrevented, target }: MouseEvent) => {
      if (defaultPrevented) {
        return;
      }

      const popupElement = popupRef.current;
      if (popupElement && target) {
        if (popupElement !== target && !popupElement.contains(target as any)) {
          dismiss();
        }
      }
    };

    const onKeyDown = ({ key }: KeyboardEvent) => {
      switch (key) {
        case "Escape":
          dismiss();
          break;
      }
    };

    document.body.addEventListener("click", onClick);
    document.body.addEventListener("contextmenu", onClick);
    document.body.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.removeEventListener("click", onClick);
      document.body.removeEventListener("contextmenu", onClick);
      document.body.removeEventListener("keydown", onKeyDown);
    };
  });

  let children: ReactNode = null;
  if (valueUnavailableMessage !== null) {
    return (
      <PopupWithChildren
        clientX={clientX}
        containerRef={containerRef}
        dismiss={dismiss}
        style="error"
        target={target}
      >
        <div className={styles.Popup}>
          <div className={styles.UnavailableMessage}>{valueUnavailableMessage}</div>
        </div>
      </PopupWithChildren>
    );
  } else if (pauseId !== null && value !== null) {
    return (
      <PopupWithChildren
        clientX={clientX}
        containerRef={containerRef}
        dismiss={dismiss}
        target={target}
      >
        <SourcePreviewInspector
          className={styles.Popup}
          pauseId={pauseId}
          protocolValue={value}
          ref={popupRef}
        />
      </PopupWithChildren>
    );
  }

  return children !== null ? (
    <PopupWithChildren
      children={children}
      clientX={clientX}
      containerRef={containerRef}
      dismiss={dismiss}
      target={target}
    />
  ) : null;
}

function PopupWithChildren({
  children,
  clientX,
  containerRef,
  dismiss,
  style,
  target,
}: PropsWithChildren & {
  clientX?: number | null;
  containerRef: RefObject<HTMLElement>;
  dismiss: () => void;
  style?: PopupStyle;
  target: HTMLElement;
}) {
  return (
    <Popup
      children={children}
      clientX={clientX}
      containerRef={containerRef}
      dismiss={dismiss}
      style={style}
      target={target}
      showTail={true}
    />
  );
}
