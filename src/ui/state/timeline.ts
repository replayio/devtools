import { TimeRange, Location, TimeStampedPoint } from "@replayio/protocol";

export interface ZoomRegion {
  endTime: number;
  beginTime: number;
  scale: number;
}

export interface FocusRegion {
  // We are moving towards using TimeStampedPoints for all ranges on the client,
  // to that end, we should avoid using fields directly from this object, and
  // instead use the getters `beginTimeForFocusRegion` and
  // `endTimeForFocusRegion`. If you must access the fields directly, you can
  // cast instead to an `UnsafeFocusRegion`
}

export interface UnsafeFocusRegion {
  end: TimeStampedPoint;
  endTime: number;
  begin: TimeStampedPoint;
  beginTime: number;
}

export interface TimelineState {
  currentTime: number;
  hoveredItem: HoveredItem | null;
  hoverTime: number | null;
  focusRegion: FocusRegion | null;
  focusRegionBackup: FocusRegion | null;
  playback: {
    beginTime: number;
    beginDate: number;
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
