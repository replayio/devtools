import { TimeStampedPoint } from "@replayio/protocol";
import { CSSProperties, ChangeEvent, FocusEvent, KeyboardEvent, useMemo, useRef } from "react";

import { HitPointStatus, Point } from "shared/client/types";
import { deselect, selectAll } from "shared/utils/selection";

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

  const inputRef = useRef<HTMLInputElement>(null);

  let tooManyPointsToFind = false;
  switch (hitPointStatus) {
    case "too-many-points-to-find":
    case "unknown-error":
      tooManyPointsToFind = true;
      break;
  }

  // This capsule contains various text depending on the state:
  // * Too many points to fetch? -> "–"
  // * 10 points, first one selected? -> "1/10"
  // * 10 points but none currently selected? -> "10"
  //
  // To prevent re-layout when stepping between the latter two states,
  // pre-calculate the max width of the capsule (e.g. "10/10").
  const minLabelWidthCh = useMemo(() => {
    if (tooManyPointsToFind) {
      return 1;
    } else {
      return `${hitPoints.length}/${hitPoints.length}`.length;
    }
  }, [hitPoints.length, tooManyPointsToFind]);

  const badgeStyle = getBadgeStyleVars(point.badge);

  const onLabelClick = () => {
    inputRef.current!.focus();
  };

  const onBlur = ({ currentTarget }: FocusEvent<HTMLDivElement>) => {
    deselect(currentTarget);
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = inputRef.current!;
    const numChars = input.value.length;
    const maxChars = `${hitPoints.length}`.length;
    input.style.width = `${Math.min(numChars, maxChars)}ch`;
  };

  const onKeyDown = (event: KeyboardEvent) => {
    switch (event.code) {
      case "Enter":
        event.preventDefault();

        const input = inputRef.current!;
        const value = input.value;
        const number = parseInt(value, 10);
        if (!isNaN(number)) {
          const index = Math.max(0, Math.min(hitPoints.length - 1, number - 1));

          goToIndex(index);

          input.value = `${index + 1}`;
          input.blur();
        }
        break;
      case "Escape":
        inputRef.current!.blur();
        break;
    }
  };

  const onFocus = ({ currentTarget }: FocusEvent<HTMLDivElement>) => {
    selectAll(currentTarget);
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
          onClick={onLabelClick}
          style={{
            minWidth: `${minLabelWidthCh}ch`,
          }}
        >
          <input
            className={styles.CurrentIndex}
            defaultValue={tooManyPointsToFind ? "10k" : closestHitPointIndex + 1}
            data-test-exact={currentHitPoint !== null || undefined}
            data-test-name="LogPointCurrentStepInput"
            disabled={tooManyPointsToFind}
            key={closestHitPointIndex}
            max={hitPoints.length}
            min={0}
            onBlur={onBlur}
            onChange={onChange}
            onFocus={onFocus}
            onKeyDown={onKeyDown}
            ref={inputRef}
            size={`${hitPoints.length}`.length}
            type={tooManyPointsToFind ? "text" : "number"}
          />
          <span className={styles.Divider}>/</span>
        </div>

        <div className={styles.Denominator} data-test-name="LogPointDenominator">
          {hitPoints.length}
        </div>

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
