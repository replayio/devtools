import { Context } from "@apollo/client";
import { Location } from "@replayio/protocol";
import { UIThunkAction } from "ui/actions";
import { Breakpoint } from ".";

export function _removeBreakpoint(cx: Context, breakpoint: Breakpoint): UIThunkAction;
export function removeBreakpointOption(
  cx: Context,
  breakpoint: Breakpoint,
  option: "logValue" | "shouldPause"
): UIThunkAction;
export function addBreakpoint(
  cx: Context,
  initialLocation: Location,
  options?: unknown,
  disabled?: boolean,
  shouldTrack?: boolean,
  shouldCancel?: () => boolean
);
export function enableBreakpoint(cx: Context, initialBreakpoint: Breakpoint);
export function disableBreakpoint(cx: Context, initialBreakpoint: Breakpoint);
export function runAnalysis(cx: Context, location: Location, options: unknown);
export function setBreakpointOptions(cx: Context, location: Location, options: unknown);
