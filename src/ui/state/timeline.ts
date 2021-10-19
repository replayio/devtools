import { ScreenShot, TimeRange, Location, MouseEventKind } from "@recordreplay/protocol";
import { MouseAndClickPosition } from "../../protocol/graphics";

export interface Tooltip {
  left: number;
}

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
  screenShot: ScreenShot | null;
  mouse: MouseAndClickPosition | null | undefined;
  recordingDuration: number | null;
  zoomRegion: ZoomRegion;
  timelineDimensions: { width: number; left: number; top: number };
  hoverTime: number | null;
  unprocessedRegions: TimeRange[];
  shouldAnimate: boolean;
  tooltip: Tooltip | null;
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
