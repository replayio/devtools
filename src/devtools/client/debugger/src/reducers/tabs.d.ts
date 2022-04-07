import { UIState } from "ui/state";
import { Tab } from "../utils/tabs";

export function getInitialTabsState(): Tab[];
export function getTabs(state: UIState): Tab[];
export function tabExists(state: UIState, sourceId: string): boolean;
