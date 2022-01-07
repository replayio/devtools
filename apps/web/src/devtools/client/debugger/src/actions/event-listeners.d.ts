import { RecordingId } from "@recordreplay/protocol";
import { UIStore, UIThunkAction } from "ui/actions";

export declare function setupEventListeners(store: UIStore): Promise<void>;
export declare function addEventListenerBreakpoints(eventsToAdd: any[]): UIThunkAction;
export declare function removeEventListenerBreakpoints(eventsToRemove: any[]): UIThunkAction;
export declare function addEventListenerExpanded(category: any): UIThunkAction;
export declare function removeEventListenerExpanded(category: any): UIThunkAction;
export declare function getEventListenerBreakpointTypes(): UIThunkAction;
