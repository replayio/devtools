import { NodeBoundsFront } from "protocol/thread/bounds";
import { NodeFront } from "protocol/thread/node";

export class BoxModelHighlighter {
  show(node: NodeFront | NodeBoundsFront): boolean;
  hide(): void;
  destroy(): void;
}
