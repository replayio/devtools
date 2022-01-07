import { Location } from "@recordreplay/protocol";
import { Breakpoint } from "../../actions/breakpoints";

export function getLocationKey(location: Location): string;
export function getLocationAndConditionKey(location: Location, condition: string): string;
export function isBreakable(breakpoint: Breakpoint): boolean;
export function isLogpoint(breakpoint: Breakpoint): boolean;
