import { CSSProperties } from "react";

import { getExecutionPoint } from "devtools/client/debugger/src/selectors";
import { isExecutionPointsGreaterThan } from "replay-next/src/utils/time";
import { ReduxActionAnnotation } from "ui/components/SecondaryToolbox/redux-devtools/annotations";
import { jumpToLocationForReduxDispatch } from "ui/components/SecondaryToolbox/redux-devtools/utils/jumpToLocationForReduxDispatch";
import { JumpToCodeButton } from "ui/components/shared/JumpToCodeButton";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import useReduxDevtoolsContextMenu from "./useReduxDevtoolsContextMenu";
import styles from "./ReduxDevToolsListItem.module.css";

export const ITEM_SIZE = 24;

export type ItemData = {
  annotations: ReduxActionAnnotation[];
  firstAnnotationAfterCurrentExecutionPoint: ReduxActionAnnotation | null;
  selectedAnnotation: ReduxActionAnnotation | null;
  selectAnnotation: (annotation: ReduxActionAnnotation | null) => void;
};

export type ItemDataWithScroll = ItemData & {
  scrollToPause: () => void;
};

export function ReduxDevToolsListItem({
  data,
  index,
  style,
}: {
  data: ItemDataWithScroll;
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

  const { contextMenu, onContextMenu } = useReduxDevtoolsContextMenu(
    annotation,
    data.scrollToPause
  );

  const dispatch = useAppDispatch();
  const currentExecutionPoint = useAppSelector(getExecutionPoint);

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
      title={annotation.payload.actionType}
      onContextMenu={onContextMenu}
    >
      <JumpToCodeButton
        className={styles.JumpToCodeButton}
        currentExecutionPoint={currentExecutionPoint}
        targetExecutionPoint={annotation.point}
        status="found"
        onClick={onSeek}
      />
      {annotation.payload.actionType}
      {contextMenu}
    </div>
  );
}
