import { NodeFront } from "protocol/thread/node";
import { NodeBoundsFront } from "protocol/thread/bounds";

export class BoxModelHighlighter {
  show(node: NodeFront | NodeBoundsFront): boolean;
  hide(): void;
  destroy(): void;
}
