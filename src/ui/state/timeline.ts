import { Location, TimeStampedPoint, TimeStampedPointRange } from "@replayio/protocol";

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
  allPaintsReceived: boolean;
  currentTime: number;
  dragging: boolean;
  displayedFocusWindow: TimeStampedPointRange | null;
  displayedFocusWindowBackup: TimeStampedPointRange | null;
  activeFocusWindow: TimeStampedPointRange | null;
  hoveredItem: HoveredItem | null;
  hoverTime: number | null;
  markTimeStampedPoint: TimeStampedPoint | null;
  paints: TimeStampedPoint[];
  playback: {
    beginTime: number;
    beginDate: number;
    time: number;
  } | null;
  playbackFocusWindow: boolean;
  playbackPrecachedTime: number;
  points: TimeStampedPoint[];
  recordingDuration: number | null;
  shouldAnimate: boolean;
  showFocusModeControls: boolean;
  stalled?: boolean;
  timelineDimensions: { width: number; left: number; top: number };
  zoomRegion: ZoomRegion;
}

export interface HoveredItem {
  target: "timeline" | "console" | "widget" | "transcript";
  point?: string;
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
  beginPoint?: string;
  endPoint?: string;
  beginTime: number | null;
  endTime: number | null;
};
