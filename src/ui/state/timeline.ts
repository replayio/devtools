import { Location, TimeStampedPoint } from "@replayio/protocol";

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
    beginTime: number;
    beginDate: number;
    endTime: number;
    time: number;
  } | null;
  playbackFocusWindow: boolean;
  playbackPrecachedTime: number;
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
  beginTime: number | null;
  endTime: number | null;
};
