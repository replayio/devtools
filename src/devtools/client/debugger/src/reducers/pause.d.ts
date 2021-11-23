import { string } from "prop-types";
import { UIState } from "ui/state";

declare function getExecutionPoint(state: UIState): string | null;
export function getAlternateSourceId(state: UIState, selectedSource: Source): string;
