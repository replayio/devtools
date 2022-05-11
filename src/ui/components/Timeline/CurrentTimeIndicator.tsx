import classNames from "classnames";
import { useSelector } from "react-redux";
import { selectors } from "ui/reducers";
import { getVisiblePosition } from "ui/utils/timeline";

import { EditMode } from ".";

export default function CurrentTimeIndicator({ editMode }: { editMode: EditMode | null }) {
  const currentTime = useSelector(selectors.getCurrentTime);
  const zoomRegion = useSelector(selectors.getZoomRegion);

  const percent = getVisiblePosition({ time: currentTime, zoom: zoomRegion }) * 100;

  // When the focus region is being resized, the video preview updates to track its drag handle.
  // During this time, the currentTime indicator should be de-emphasized.
  const isResizingFocusRegion =
    editMode?.type === "resize-end" || editMode?.type === "resize-start";

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
