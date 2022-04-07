import { UIThunkAction } from "ui/actions";
import { Breakpoint } from "../../reducers/breakpoints";

export interface Context {
  isPaused: boolean;
  navigateCounter: number;
  pauseCounter: number;
}

export declare function deselectSource(): UIThunkAction;

export function selectLocation(cx: Context, location: any, openSourceTab?: boolean): UIThunkAction;
