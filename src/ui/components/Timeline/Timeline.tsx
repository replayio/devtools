import { Suspense, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";

import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { useGraphQLUserData } from "shared/user-data/GraphQL/useGraphQLUserData";
import { throttle } from "shared/utils/function";
import { seek, setDisplayedFocusWindow, setHoverTime, stopPlayback } from "ui/actions/timeline";
import useTimelineContextMenu from "ui/components/Timeline/useTimelineContextMenu";
import { selectors } from "ui/reducers";
import { isPlaying as isPlayingSelector, setTimelineState } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { AppDispatch } from "ui/setup/store";
import { getTimeFromPosition } from "ui/utils/timeline";

import Comments from "../Comments";
import ProtocolTimeline from "../ProtocolTimeline";
import Capsule from "./Capsule";
import CurrentTimeIndicator from "./CurrentTimeIndicator";
import Focuser from "./Focuser";
import FocusModePopout from "./FocusModePopout";
import LoadingProgressBars from "./LoadingProgressBars";
import NonLoadingRegions from "./NonLoadingRegions";
import PlayPauseButton from "./PlaybackControls";
import PreviewMarkers from "./PreviewMarkers";
import ProgressBars from "./ProgressBars";
import Tooltip from "./Tooltip";
import UnfocusedRegion from "./UnfocusedRegion";

export type EditMode = {
  dragOffset?: number;
  type: "drag" | "resize-end" | "resize-start";
};

export default function Timeline() {
  const dispatch = useAppDispatch();
  const hoverTime = useAppSelector(selectors.getHoverTime);
  const timelineDimensions = useAppSelector(selectors.getTimelineDimensions);
  const zoomRegion = useAppSelector(selectors.getZoomRegion);
  const isPlaying = useAppSelector(isPlayingSelector);

  const [showProtocolTimeline] = useGraphQLUserData("feature_protocolTimeline");

  const { rangeForDisplay } = useContext(FocusContext);

  const progressBarRef = useRef<HTMLDivElement>(null);

  const [isHovered, setIsHovered] = useState<boolean>(false);

  const [editMode, setEditMode] = useState<EditMode | null>(null);
  const [showLoadingProgress, setShowLoadingProgress] = useState<boolean>(false);

  const committedValuesRef = useRef({
    editMode,
    hoverTime,
    mouseDown: false,
    zoomRegion,
  });
  useLayoutEffect(() => {
    committedValuesRef.current.editMode = editMode;
    committedValuesRef.current.hoverTime = hoverTime;
    committedValuesRef.current.zoomRegion = zoomRegion;
  });

  const { contextMenu, onContextMenu } = useTimelineContextMenu();

  useLayoutEffect(() => {
    const progressBar = progressBarRef.current;

    const onWindowResize = () => {
      const rect = progressBar!.getBoundingClientRect();
      dispatch(
        setTimelineState({
          timelineDimensions: { width: rect.width, left: rect.left, top: rect.top },
        })
      );
    };

    // Set initial dimensions on-mount
    onWindowResize();

    // Update dimensions when the browser resizes
    window.addEventListener("resize", onWindowResize);
    return () => {
      window.removeEventListener("resize", onWindowResize);
    };
  }, [dispatch]);

  const onMouseDown = () => {
    committedValuesRef.current.mouseDown = true;

    if (isPlaying) {
      dispatch(stopPlayback());
    }
  };

  const onMouseLeave = () => {
    setIsHovered(false);

    dispatch(setHoverTime(null, false));
  };

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      const { hoverTime, mouseDown, zoomRegion } = committedValuesRef.current;

      if (!mouseDown) {
        return;
      }

      const mouseTime = getTimeFromPosition(
        event.pageX,
        progressBarRef.current!.getBoundingClientRect(),
        zoomRegion
      );

      const isDragging = event.buttons === 1;

      if (hoverTime != mouseTime) {
        dispatch(setHoverTime(mouseTime, isDragging));
      }

      if (isDragging) {
        dispatch(setTimelineState({ currentTime: mouseTime }));
      }
    };

    const onMouseUp = (event: MouseEvent) => {
      const { editMode, mouseDown, zoomRegion } = committedValuesRef.current;

      committedValuesRef.current.mouseDown = false;

      if (mouseDown && !editMode) {
        const progressBar = progressBarRef.current;
        if (!progressBar) {
          return;
        }

        const mouseTime = getTimeFromPosition(
          event.pageX,
          progressBar.getBoundingClientRect(),
          zoomRegion
        );

        // If we're editing focus mode, don't update the current time marker.
        dispatch(seek({ time: mouseTime }));
      }
    };

    document.body.addEventListener("mousemove", onMouseMove);
    document.body.addEventListener("mouseup", onMouseUp);

    return () => {
      document.body.removeEventListener("mousemove", onMouseMove);
      document.body.removeEventListener("mouseup", onMouseUp);
    };
  }, [dispatch]);

  return (
    <>
      <FocusModePopout />
      <div
        className="timeline"
        data-protocol-timeline-enabled={showProtocolTimeline || undefined}
        data-test-id="Timeline"
        data-test-focus-begin-time={rangeForDisplay?.begin}
        data-test-focus-end-time={rangeForDisplay?.end}
      >
        <div className="commands">
          <PlayPauseButton />
        </div>

        <div
          className="progress-bar-container"
          onMouseDown={onMouseDown}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={onMouseLeave}
        >
          <div className="progress-bar-stack" onContextMenu={onContextMenu}>
            {showProtocolTimeline && (
              <Suspense>
                <ProtocolTimeline />
              </Suspense>
            )}
            <div className="progress-bar" data-test-id="Timeline-ProgressBar" ref={progressBarRef}>
              <ProgressBars />
              <PreviewMarkers />
              <div className="comments-container">
                <Comments />
                <CurrentTimeIndicator editMode={editMode} />
              </div>
              <NonLoadingRegions />
              <UnfocusedRegion />
              {showLoadingProgress && <LoadingProgressBars />}
              <Focuser editMode={editMode} setEditMode={setEditMode} />
            </div>
          </div>

          {isHovered && <Tooltip timelineWidth={timelineDimensions.width} />}
        </div>

        <Capsule setShowLoadingProgress={setShowLoadingProgress} />
      </div>
      {contextMenu}
    </>
  );
}
