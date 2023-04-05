import { FocusWindowRequest as FocusWindow, Location, TimeStampedPoint } from "@replayio/protocol";

export interface ZoomRegion {
  endTime: number;
  beginTime: number;
  scale: number;
}

export interface FocusRegion {
  end: TimeStampedPoint;
  begin: TimeStampedPoint;
}

export interface TimelineState {
  allPaintsReceived: boolean;
  currentTime: number;
  dragging: boolean;
  focusRegion: FocusRegion | null;
  focusRegionBackup: FocusRegion | null;
  hoveredItem: HoveredItem | null;
  hoverTime: number | null;
  markTimeStampedPoint: TimeStampedPoint | null;
  paints: TimeStampedPoint[];
  playback: {
    beginTime: number;
    beginDate: number;
    time: number;
  } | null;
  playbackFocusRegion: boolean;
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
