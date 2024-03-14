import { ExecutionPoint, Location, TimeStampedPoint } from "@replayio/protocol";

export interface TimeRange {
  begin: number;
  end: number;
}

export interface ZoomRegion {
  endTime: number;
  beginTime: number;
  scale: number;
}

export interface TimelineState {
  currentTime: number;
  dragging: boolean;
  focusWindow: TimeRange | null;
  hoveredItem: HoveredItem | null;
  hoverTime: number | null;
  markTimeStampedPoint: TimeStampedPoint | null;
  maxRecordingDurationForRoutines: number;
  playback: {
    beginPoint: ExecutionPoint | null;
    beginTime: number;
    endPoint: ExecutionPoint | null;
    endTime: number;
    time: number;
  } | null;
  playbackFocusWindow: boolean;
  endpoint: TimeStampedPoint;
  recordingDuration: number | null;
  shouldAnimate: boolean;
  showFocusModeControls: boolean;
  showHoverTimeGraphics: boolean;
  stalled?: boolean;
  timelineDimensions: { width: number; left: number; top: number };
  zoomRegion: ZoomRegion;
}

export interface HoveredItem {
  point?: string;
  target: "timeline" | "console" | "widget" | "transcript";
  time?: number;
  location?: HoveredLocation;
}

interface HoveredLocation extends Location {
  line: number;
  column: number;
}

export enum FocusOperation {
  resizeStart = "resizeStart",
  resizeEnd = "resizeEnd",
}

export type PlaybackOptions = {
  beginPoint?: ExecutionPoint | null;
  beginTime: number | null;
  endPoint?: ExecutionPoint | null;
  endTime: number | null;
};
