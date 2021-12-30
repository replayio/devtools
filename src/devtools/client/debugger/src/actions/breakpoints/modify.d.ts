import { Context } from "@apollo/client";
import { Location } from "@recordreplay/protocol";
import { UIThunkAction } from "ui/actions";
import { Breakpoint } from ".";

export function _removeBreakpoint(cx: Context, breakpoint: Breakpoint): UIThunkAction;
export function removeBreakpointOption(
  cx: Context,
  breakpoint: Breakpoint,
  option: "logValue" | "breakable"
): UIThunkAction;
export function removeRequestedBreakpoint(
  location: Omit<Location, "column">
): Action<"REMOVE_REQUESTED_BREAKPOINT"> & {
  location: Omit<Location, "column">;
};
