import { ScreenShot, TimeRange, Location, MouseEventKind } from "@recordreplay/protocol";
import { MouseAndClickPosition } from "../../protocol/graphics";

export interface Tooltip {
  screen?: ScreenShot;
  left: number;
}

export interface ZoomRegion {
  endTime: number;
  startTime: number;
  scale: number;
}

export interface TimelineState {
  currentTime: number;
  playback: {
    startTime: number;
    startDate: number;
    time: number;
  } | null;
  screenShot: ScreenShot | null;
  mouse: MouseAndClickPosition | null | undefined;
  recordingDuration: number | null;
  zoomRegion: ZoomRegion;
  timelineDimensions: { width: number; left: number; top: number };
  hoverTime: number | null;
  hoveredMessageId: string | null;
  unprocessedRegions: TimeRange[];
  shouldAnimate: boolean;
  tooltip: Tooltip | null;
  hoveredPoint: HoveredPoint | null;
}

export interface HoveredPoint {
  target: "timeline" | "console" | "widget";
  point: string;
  time: number;
  location?: HoveredLocation;
}

interface HoveredLocation extends Location {
  line: number;
  column: number;
}

export interface RecordingEvent {
  clientX: number;
  clientY: number;
  kind: MouseEventKind;
  point: string;
  time: number;
}
