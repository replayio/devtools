import { Location } from "@recordreplay/protocol";
import { Breakpoint } from "../../actions/breakpoints";
import { PendingBreakpoint, SourceLocation } from "../../reducers/types";

export function getLocationKey(location: SourceLocation): string;
export function isMatchingLocation(location1: Location, location2: Location): boolean;
export function getLocationAndConditionKey(
  location: SourceLocation,
  condition?: string | null
): string;
export function isBreakable(breakpoint: Breakpoint): boolean;
export function isLogpoint(breakpoint: Breakpoint): boolean;
export function createPendingBreakpoint(breakpoint: Breakpoint): PendingBreakpoint;
export function makePendingLocationId(location: Location): string;
