import { Context } from "@apollo/client";
import { UIThunkAction } from "ui/actions";
import { Breakpoint } from ".";

export function removeBreakpoint(cx: Context, breakpoint: Breakpoint): UIThunkAction;
export function removeBreakpointOption(
  cx: Context,
  breakpoint: Breakpoint,
  option: "logValue" | "breakable"
): UIThunkAction;
export function removeBreakableBreakpoint(cx: Context, breakpoint: Breakpoint): UIThunkAction;
