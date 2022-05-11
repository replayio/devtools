import { TimeRange, Location } from "@recordreplay/protocol";

export interface ZoomRegion {
  endTime: number;
  startTime: number;
  scale: number;
}

export interface FocusRegion {
  endTime: number;
  startTime: number;
}

export interface TimelineState {
  currentTime: number;
  playback: {
    startTime: number;
    startDate: number;
    time: number;
  } | null;
  stalled?: boolean;
  playbackPrecachedTime: number;
  recordingDuration: number | null;
  zoomRegion: ZoomRegion;
  timelineDimensions: { width: number; left: number; top: number };
  hoverTime: number | null;
  unprocessedRegions: TimeRange[];
  shouldAnimate: boolean;
  hoveredItem: HoveredItem | null;
  focusRegion: FocusRegion | null;
  focusRegionBackup: FocusRegion | null;
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
