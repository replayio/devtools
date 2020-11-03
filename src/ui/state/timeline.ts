import { PauseDescription, ScreenShot, TimeRange } from "record-replay-protocol";
import { MouseAndClickPosition } from "../../protocol/graphics";

export interface Tooltip {
  screen?: ScreenShot;
  left: number;
}

export interface ZoomRegion {
  endTime: number;
  startTime: number;
  scale: number;
}

export interface TimelineState {
  currentTime: number;
  playback: {
    startTime: number;
    startDate: number;
    pauseTarget: PauseDescription;
    time: number;
  } | null;
  screenShot: ScreenShot | null;
  mouse: MouseAndClickPosition | null | undefined;
  recordingDuration: number | null;
  zoomRegion: ZoomRegion;
  timelineDimensions: { width: number; left: number; top: number };
  hoverTime: number | null;
  highlightedMessage: string | null;
  hoveredMessage: number | null;
  unprocessedRegions: TimeRange[];
  shouldAnimate: boolean;
  loaded: boolean;
  tooltip: Tooltip | null;
}
