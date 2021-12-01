import { TimeStampedPoint } from "@recordreplay/protocol";
import { Reducer } from "redux";
import { UIState } from "ui/state";

export type EventListenerPoint = TimeStampedPoint & { frame: any[] };
type EventListenerPoints = EventListenerPoint[];
export type EventTypePoints = { [eventType: string]: EventListenerPoints };

declare const update: Reducer;
export default update;
export function getEventListenerPoints(state: UIState): EventTypePoints;
