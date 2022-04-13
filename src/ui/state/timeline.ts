import { TimeRange, Location } from "@recordreplay/protocol";
import { SourceLocation } from "devtools/client/debugger/src/reducers/types";

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
  focusRegion: { startTime: number; endTime: number } | null;
}

export interface HoveredItem {
  target: "timeline" | "console" | "widget" | "transcript";
  point?: string;
  time?: number;
  location?: SourceLocation;
}

export enum FocusOperation {
  resizeStart = "resizeStart",
  resizeEnd = "resizeEnd",
}
