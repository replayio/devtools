import classNames from "classnames";

import { selectors } from "ui/reducers";
import { useAppSelector } from "ui/setup/hooks";
import { getVisiblePosition } from "ui/utils/timeline";

import { EditMode } from "./Timeline";

export default function CurrentTimeIndicator({ editMode }: { editMode: EditMode | null }) {
  const currentTime = useAppSelector(selectors.getCurrentTime);
  const zoomRegion = useAppSelector(selectors.getZoomRegion);

  const percent = getVisiblePosition({ time: currentTime, zoom: zoomRegion }) * 100;

  // When the focus region is being resized, the video preview updates to track its drag handle.
  // During this time, the currentTime indicator should be de-emphasized.
  // Same for when the region is being dragged.
  const isResizingFocusRegion = editMode !== null;

  return (
    <div
      className={classNames({
        "progress-line-paused-edit-mode-inactive": !isResizingFocusRegion,
        "progress-line-paused-edit-mode-active": isResizingFocusRegion,
      })}
      style={{ left: `${percent}%` }}
    />
  );
}
