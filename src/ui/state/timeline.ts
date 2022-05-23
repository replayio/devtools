import { TimeRange, Location, TimeStampedPoint } from "@recordreplay/protocol";

export interface ZoomRegion {
  endTime: number;
  startTime: number;
  scale: number;
}

export interface FocusRegion {
  // We are moving towards using TimeStampedPoints for all ranges on the client,
  // to that end, we should avoid using `endTime` and `startTime` from this
  // object whenever possible
  end: TimeStampedPoint;
  endTime: number;
  start: TimeStampedPoint;
  startTime: number;
}

export interface TimelineState {
  currentTime: number;
  hoveredItem: HoveredItem | null;
  hoverTime: number | null;
  focusRegion: FocusRegion | null;
  focusRegionBackup: FocusRegion | null;
  playback: {
    startTime: number;
    startDate: number;
    time: number;
  } | null;
  playbackPrecachedTime: number;
  points: TimeStampedPoint[];
  recordingDuration: number | null;
  shouldAnimate: boolean;
  showFocusModeControls: boolean;
  stalled?: boolean;
  timelineDimensions: { width: number; left: number; top: number };
  unprocessedRegions: TimeRange[];
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
