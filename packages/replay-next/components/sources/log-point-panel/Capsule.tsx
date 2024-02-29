import { TimeStampedPoint } from "@replayio/protocol";
import { CSSProperties, MouseEvent, useLayoutEffect, useRef } from "react";

import { NumberEditor, NumberEditorHandle } from "replay-next/components/lexical/NumberEditor";
import Spinner from "replay-next/components/Spinner";
import { HitPointStatus, Point } from "shared/client/types";

import { getBadgeStyleVars } from "../utils/getBadgeStyleVars";
import useLogPointPanelContextMenu from "./useLogPointPanelContextMenu";
import styles from "./Capsule.module.css";

export default function Capsule({
  closestHitPointIndex,
  currentHitPoint,
  editable,
  goToIndex,
  hasConditional,
  hitPoints,
  hitPointStatus,
  point,
  shouldLog,
  toggleConditional,
  toggleShouldLog,
}: {
  closestHitPointIndex: number;
  currentHitPoint: TimeStampedPoint | null;
  editable: boolean;
  goToIndex: (index: number) => void;
  hasConditional: boolean;
  hitPoints: TimeStampedPoint[];
  hitPointStatus: HitPointStatus | null;
  point: Point;
  shouldLog: boolean;
  toggleConditional: () => void;
  toggleShouldLog: () => void;
}) {
  const { contextMenu, onContextMenu } = useLogPointPanelContextMenu({
    currentHitPoint,
    editable,
    hasConditional,
    lineNumber: point.location.line,
    shouldLog,
    toggleConditional,
    toggleShouldLog,
  });

  const editorRef = useRef<NumberEditorHandle>(null);
  useLayoutEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.getValue() !== closestHitPointIndex + 1) {
      editor.setValue(closestHitPointIndex + 1);
    }
  }, [closestHitPointIndex]);

  let tooManyPointsToFind = false;
  switch (hitPointStatus) {
    case "too-many-points-to-find":
    case "unknown-error":
      tooManyPointsToFind = true;
      break;
  }

  const badgeStyle = getBadgeStyleVars(point.badge);

  const onSave = (number: number) => {
    goToIndex(number - 1);
  };

  // Don't show "0/0" while hit points are loading.
  if (hitPointStatus === null) {
    return (
      <div
        className={styles.Capsule}
        data-loading
        data-test-name="LogPointCapsule"
        style={badgeStyle as CSSProperties}
      >
        <Spinner className={styles.Spinner} />
      </div>
    );
  }

  const onClickFocusContentEditable = (event: MouseEvent) => {
    const target = event.currentTarget;
    if (target instanceof HTMLElement) {
      const focusable = target.querySelector("[contenteditable]");
      if (focusable instanceof HTMLElement) {
        focusable.focus();
      }
    }
  };

  return (
    <>
      <div
        className={styles.Capsule}
        data-test-name="LogPointCapsule"
        style={badgeStyle as CSSProperties}
      >
        <div
          className={styles.Label}
          data-test-state={tooManyPointsToFind ? "too-many-points" : "valid"}
          onClick={onClickFocusContentEditable}
        >
          <NumberEditor
            data-exact={currentHitPoint !== null || undefined}
            data-test-name="LogPointCurrentStepInput"
            data-too-many-points-to-find={tooManyPointsToFind || undefined}
            data-value={closestHitPointIndex + 1}
            defaultValue={closestHitPointIndex + 1}
            editable={!tooManyPointsToFind}
            maxValue={Math.max(1, hitPoints.length)}
            minValue={1}
            onSave={onSave}
            ref={editorRef}
          />
          {tooManyPointsToFind || <span className={styles.Divider}>/</span>}
        </div>

        {tooManyPointsToFind || (
          <div className={styles.Denominator} data-test-name="LogPointDenominator">
            {hitPoints.length}
          </div>
        )}

        <div
          className={styles.CaretContainer}
          data-test-name="LogPointCapsule-DropDownTrigger"
          onClick={onContextMenu}
        >
          {/* Use a none-standard SVG component/size to simplify layout/margin/gap styles */}
          <svg className={styles.CaretIcon} viewBox="0 0 7 5" fill="none">
            <line x1="1.1749" y1="1.14187" x2="4.1749" y2="4.14187" stroke="currentColor" />
            <line
              y1="-0.5"
              x2="4.24264"
              y2="-0.5"
              transform="matrix(-0.707107 0.707107 0.707107 0.707107 6.82135 1.49542)"
              stroke="currentColor"
            />
          </svg>
        </div>
      </div>
      {contextMenu}
    </>
  );
}
