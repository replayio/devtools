import { UIThunkAction } from "ui/actions";

export function openSourceLink(sourceId: string, line: number, column: number): UIThunkAction;
export function focusFullTextInput(focus: boolean): UIThunkAction;
export function expandSourcesPane(): UIThunkAction;
