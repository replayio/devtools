import { ValueFront } from "protocol/thread";
import { UIThunkAction } from "ui/actions";

export interface DebuggerLocation {
  url?: string;
  sourceId?: string;
  line?: number;
  column?: number;
}

export function setZoomedRegion(zoomStartTime: number, zoomEndTime: number, scale: number): any;
export function onViewSourceInDebugger(location: DebuggerLocation): UIThunkAction;
export function openNodeInInspector(valueFront: ValueFront): UIThunkAction;
export function openLink(url: string): UIThunkAction;
export function highlightDomElement(valueFront: ValueFront): UIThunkAction;
export function unHighlightDomElement(valueFront: ValueFront): UIThunkAction;
