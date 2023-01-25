import { Location, TimeRange, TimeStampedPoint } from "@replayio/protocol";

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
  hoveredItem: HoveredItem | null;
  hoverTime: number | null;
  focusRegion: FocusRegion | null;
  focusRegionBackup: FocusRegion | null;
  displayedFocusRegion: TimeRange | null;
  playback: {
    beginTime: number;
    beginDate: number;
    time: number;
  } | null;
  playbackPrecachedTime: number;
  paints: TimeStampedPoint[];
  points: TimeStampedPoint[];
  recordingDuration: number | null;
  shouldAnimate: boolean;
  showFocusModeControls: boolean;
  stalled?: boolean;
  timelineDimensions: { width: number; left: number; top: number };
  unprocessedRegions: TimeRange[];
  zoomRegion: ZoomRegion;
  dragging: boolean;
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
