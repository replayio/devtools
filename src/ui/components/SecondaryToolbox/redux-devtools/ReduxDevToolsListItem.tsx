import { CSSProperties, useContext } from "react";
import { Status, useCacheStatus } from "suspense";

import { getExecutionPoint } from "devtools/client/debugger/src/selectors";
import { isExecutionPointsGreaterThan } from "replay-next/src/utils/time";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { ReduxActionAnnotation } from "ui/components/SecondaryToolbox/redux-devtools/annotations";
import { jumpToLocationForReduxDispatch } from "ui/components/SecondaryToolbox/redux-devtools/utils/jumpToLocationForReduxDispatch";
import { JumpToCodeButton, JumpToCodeStatus } from "ui/components/shared/JumpToCodeButton";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { reduxDispatchJumpLocationCache } from "ui/suspense/jumpToLocationCache";

import useReduxDevtoolsContextMenu from "./useReduxDevtoolsContextMenu";
import styles from "./ReduxDevToolsListItem.module.css";

export const ITEM_SIZE = 26;

export type ItemData = {
  annotations: ReduxActionAnnotation[];
  firstAnnotationAfterCurrentExecutionPoint: ReduxActionAnnotation | null;
  selectedAnnotation: ReduxActionAnnotation | null;
  selectAnnotation: (annotation: ReduxActionAnnotation | null) => void;
};

export type ItemDataWithScroll = ItemData & {
  scrollToPause: () => void;
};

const suspenseStatusToJ2CStatus: Record<Status, JumpToCodeStatus> = {
  resolved: "found",
  pending: "loading",
  rejected: "no_hits",
  // Very unintuitive naming here, but the idea is that we haven't actually
  // fetched a value yet, so it's "not found" in terms of the _cache_ (no entry yet),
  // However, that means we don't know if there _will be_ a result (and given how
  // the Redux J2C cache works, there _should_ be a result every time).
  // So, if there isn't a cache entry, make the button active so we can fetch on click.
  "not-found": "found",
  aborted: "no_hits",
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
  const replayClient = useContext(ReplayClientContext);

  const cacheStatus = useCacheStatus(
    reduxDispatchJumpLocationCache,
    replayClient,
    annotation.point,
    annotation.time
  );
  // Translate the cache status into the "J2C" status for the button
  const j2cStatus = suspenseStatusToJ2CStatus[cacheStatus];

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
        status={j2cStatus}
        onClick={onSeek}
      />
      {annotation.payload.actionType}
      {contextMenu}
    </div>
  );
}
