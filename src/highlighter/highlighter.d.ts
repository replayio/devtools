import { NodeBoundsFront } from "protocol/thread/bounds";

export function highlight(node: NodeBoundsFront): void;
export function unhighlight(): void;
export let currentNode: NodeBoundsFront | null;
