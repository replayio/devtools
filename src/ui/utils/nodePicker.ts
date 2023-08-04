import { NodeBounds } from "@replayio/protocol";

import { getDevicePixelRatio } from "protocol/graphics";

export interface NodePickerOpts {
  name: string;
  onHovering?: (nodeId: string | null) => void;
  onClickOutsideCanvas?: () => void;
  onPicked: (nodeId: string | null) => void;
  onHighlightNode: (nodeId: string) => void;
  onUnhighlightNode: () => void;
  onCheckNodeBounds: (x: number, y: number, nodeIds?: string[]) => Promise<NodeBounds | null>;
  enabledNodeIds?: string[];
}

export class NodePicker {
  private opts: NodePickerOpts | undefined;
  private hoveredNodeId: string | undefined;

  private canvas: HTMLElement | null = null;

  enable(opts: NodePickerOpts) {
    this.opts = opts;
    this.canvas = document.getElementById("graphics");
    if (this.canvas) {
      this.canvas.addEventListener("mousemove", this.onMouseMove);
      this.canvas.addEventListener("click", this.onMouseClick);
      document.addEventListener("click", this.onDocumentClicked);
      console.log("Added document click listener");
    }
  }

  disable() {
    console.log("Disabling node picker");
    if (this.canvas) {
      this.canvas.removeEventListener("mousemove", this.onMouseMove);
      this.canvas.removeEventListener("click", this.onMouseClick);
      document.removeEventListener("click", this.onDocumentClicked);
      this.opts?.onUnhighlightNode();
    }
    this.opts = undefined;
    this.hoveredNodeId = undefined;
  }

  private onMouseMove = async (e: MouseEvent) => {
    const pos = mouseEventCanvasPosition(e, this.canvas);
    const opts = this.opts;
    let nodeBounds: NodeBounds | null = null;
    if (pos) {
      if (opts?.onCheckNodeBounds) {
        nodeBounds = await opts.onCheckNodeBounds(pos.x, pos.y, opts?.enabledNodeIds);
      }
    }

    if (nodeBounds) {
      this.opts?.onHighlightNode(nodeBounds.node);
      if (nodeBounds.node !== this.hoveredNodeId) {
        this.hoveredNodeId = nodeBounds.node;
        this.opts?.onHovering?.(nodeBounds.node);
      }
    } else {
      this.opts?.onUnhighlightNode();
    }
  };

  private onMouseClick = async (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const opts = this.opts;
    this.disable();
    const pos = mouseEventCanvasPosition(e, this.canvas);
    let nodeBounds: NodeBounds | null = null;
    if (pos) {
      if (opts?.onCheckNodeBounds) {
        nodeBounds = await opts.onCheckNodeBounds(pos.x, pos.y, opts?.enabledNodeIds);
      }
    }
    opts?.onPicked(nodeBounds ? nodeBounds.node : null);
  };

  private onDocumentClicked = (event: MouseEvent) => {
    console.log("Document clicked: " + event.defaultPrevented);
    if (event.defaultPrevented) {
      return;
    }

    if (this.canvas) {
      if (!this.canvas.contains(event.target as Node)) {
        this.opts?.onClickOutsideCanvas?.();
      }
    }
  };
}

// Get the x/y coordinate of a mouse event wrt the recording's DOM.
export function mouseEventCanvasPosition(
  event: MouseEvent,
  canvas: HTMLElement | null
): { x: number; y: number } | undefined {
  if (!canvas) {
    return undefined;
  }

  const bounds = canvas.getBoundingClientRect();
  if (
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom
  ) {
    // Not in the canvas.
    return undefined;
  }

  const scale = bounds.width / canvas.offsetWidth;
  const pixelRatio = getDevicePixelRatio();
  if (!pixelRatio) {
    return undefined;
  }

  return {
    x: (event.clientX - bounds.left) / scale / pixelRatio,
    y: (event.clientY - bounds.top) / scale / pixelRatio,
  };
}
