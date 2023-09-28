import { CSSProperties } from "react";

import { isExecutionPointsGreaterThan } from "replay-next/src/utils/time";
import { ReduxActionAnnotation } from "ui/components/SecondaryToolbox/redux-devtools/annotations";
import { jumpToLocationForReduxDispatch } from "ui/components/SecondaryToolbox/redux-devtools/utils/jumpToLocationForReduxDispatch";
import { JumpToCodeButton } from "ui/components/shared/JumpToCodeButton";
import { getCurrentPoint } from "ui/reducers/app";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import styles from "./ReduxDevToolsListItem.module.css";

export const ITEM_SIZE = 24;

export type ItemData = {
  annotations: ReduxActionAnnotation[];
  firstAnnotationAfterCurrentExecutionPoint: ReduxActionAnnotation | null;
  selectedAnnotation: ReduxActionAnnotation | null;
  selectAnnotation: (annotation: ReduxActionAnnotation | null) => void;
};

export function ReduxDevToolsListItem({
  data,
  index,
  style,
}: {
  data: ItemData;
  index: number;
  style: CSSProperties;
}) {
  const {
    annotations,
    firstAnnotationAfterCurrentExecutionPoint,
    selectedAnnotation,
    selectAnnotation,
  } = data;

  const annotation = annotations[index];

  const dispatch = useAppDispatch();
  const currentExecutionPoint = useAppSelector(getCurrentPoint);

  const onSeek = () => {
    selectAnnotation(annotation);
    dispatch(jumpToLocationForReduxDispatch(annotation.point, annotation.time));
  };

  let relativePosition;
  if (currentExecutionPoint) {
    if (annotation === firstAnnotationAfterCurrentExecutionPoint) {
      relativePosition = "first-after";
    } else if (isExecutionPointsGreaterThan(annotation.point, currentExecutionPoint)) {
      relativePosition = "after";
    } else {
      relativePosition = "before";
    }
  }

  return (
    <div
      className={styles.ListItem}
      data-relative-position={relativePosition}
      data-selected={annotation === selectedAnnotation || undefined}
      data-test-id="ReduxDevToolsListItem"
      onClick={() => selectAnnotation(annotation)}
      style={style}
    >
      <JumpToCodeButton
        className={styles.JumpToCodeButton}
        currentExecutionPoint={currentExecutionPoint}
        targetExecutionPoint={annotation.point}
        status="found"
        onClick={onSeek}
      />
      {annotation.payload.actionType}
    </div>
  );
}
