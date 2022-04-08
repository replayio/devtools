import { AnyAction } from "@reduxjs/toolkit";
import { UIThunkAction } from "ui/actions";
import { Context } from "../reducers/pause";

export function openSourceLink(sourceId: string, line: number, column: number): UIThunkAction;
export function focusFullTextInput(focus: boolean): UIThunkAction;
export function expandSourcesPane(): UIThunkAction;
export function updateActiveFileSearch(cx: Context): UIThunkAction;
export function closeActiveSearch(): AnyAction;
