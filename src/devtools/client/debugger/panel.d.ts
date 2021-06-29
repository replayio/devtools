import { ValueFront } from "protocol/thread";
import { DOMFront } from "protocol/thread/pause";

export class DebuggerPanel {
  open(): this;
  openLink(url: string): Promise<void>;
  openInspector(): void;
  openElementInInspector(valueFront: ValueFront): Promise<void>;
  highlightDomElement(gripOrFront: DOMFront): void;
  unHighlightDomElement(): void;
  destroy(): void;
}
