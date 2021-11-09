import { TimeRange, Location } from "@recordreplay/protocol";

export interface ZoomRegion {
  endTime: number;
  startTime: number;
  scale: number;
}

export interface TrimRegion {
  endTime: number;
  startTime: number;
}

export interface TimelineState {
  currentTime: number;
  playback: {
    startTime: number;
    startDate: number;
    time: number;
    stalled?: boolean;
  } | null;
  playbackPrecachedTime: number;
  recordingDuration: number | null;
  zoomRegion: ZoomRegion;
  timelineDimensions: { width: number; left: number; top: number };
  hoverTime: number | null;
  unprocessedRegions: TimeRange[];
  shouldAnimate: boolean;
  hoveredItem: HoveredItem | null;
  trimRegion: { startTime: number; endTime: number } | null;
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

export enum TrimOperation {
  resizeStart = "resizeStart",
  resizeEnd = "resizeEnd",
  moveSpan = "moveSpan",
}
