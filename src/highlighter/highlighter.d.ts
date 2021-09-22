import { NodeBoundsFront } from "protocol/thread/bounds";

export function highlight(node: NodeFront | NodeBoundsFront): void;
export function unhighlight(): void;
export let currentNode: NodeFront | NodeBoundsFront | null;
