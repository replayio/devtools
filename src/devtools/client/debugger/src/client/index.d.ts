import { UIStore } from "ui/actions";

export function loadInitialState(): Promise<object>;
export function bootstrap(store: UIStore): void;
export function onConnect(): object;
