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
  getSourceByActorId(id?: string): any;
  getSourceByURL(url?: string): any;
  selectSource(sourceId: string, line?: number, column?: number, openSourcesTab: boolean): any;
  getFrameId(): { asyncIndex: number; frameId?: string };
}
