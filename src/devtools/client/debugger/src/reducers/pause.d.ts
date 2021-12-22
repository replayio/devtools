import { string } from "prop-types";
import { UIState } from "ui/state";
import { Source } from "./source";

declare function getExecutionPoint(state: UIState): string | null;
export function getAlternateSource(state: UIState): Source | null;
export function getShouldLogExceptions(state: UIState): boolean;
