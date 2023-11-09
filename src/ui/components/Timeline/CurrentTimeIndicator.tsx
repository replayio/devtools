import classNames from "classnames";

import { selectors } from "ui/reducers";
import { useAppSelector } from "ui/setup/hooks";
import { getVisiblePosition } from "ui/utils/timeline";

import { EditMode } from "./Timeline";

export default function CurrentTimeIndicator({ editMode }: { editMode: EditMode | null }) {
  const currentTime = useAppSelector(selectors.getCurrentTime);
  const zoomRegion = useAppSelector(selectors.getZoomRegion);
  const isPlaying = useAppSelector(selectors.isPlaying);
  const isSeeking = useAppSelector(selectors.getSeekState) !== "paused";

  const percent = getVisiblePosition({ time: currentTime, zoom: zoomRegion }) * 100;
  const dimmed = !isPlaying && isSeeking;

  // When the focus region is being resized, the video preview updates to track its drag handle.
  // During this time, the currentTime indicator should be de-emphasized.
  // Same for when the region is being dragged.
  const isResizingFocusWindow = editMode !== null;

  return (
    <div
      className={classNames({
        "progress-line-paused-edit-mode-inactive": !isResizingFocusWindow,
        "progress-line-paused-edit-mode-active": isResizingFocusWindow,
        dimmed,
      })}
      style={{ left: `${percent}%` }}
    />
  );
}
