import { NodeBounds } from "@replayio/protocol";

import { getDevicePixelRatio } from "protocol/graphics";

export interface NodePickerOpts {
  onHovering?: (nodeId: string | null) => void;
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
    }
  }

  disable() {
    if (this.canvas) {
      this.canvas.removeEventListener("mousemove", this.onMouseMove);
      this.canvas.removeEventListener("click", this.onMouseClick);
    }
    this.opts = undefined;
    this.hoveredNodeId = undefined;
  }

  private onMouseMove = async (e: MouseEvent) => {
    const pos = this.mouseEventCanvasPosition(e);
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
    const pos = this.mouseEventCanvasPosition(e);
    let nodeBounds: NodeBounds | null = null;
    if (pos) {
      if (opts?.onCheckNodeBounds) {
        nodeBounds = await opts.onCheckNodeBounds(pos.x, pos.y, opts?.enabledNodeIds);
      }
    }
    opts?.onPicked(nodeBounds ? nodeBounds.node : null);
  };

  // Get the x/y coordinate of a mouse event wrt the recording's DOM.
  private mouseEventCanvasPosition(e: MouseEvent) {
    if (!this.canvas) {
      return undefined;
    }
    const bounds = this.canvas.getBoundingClientRect();
    if (
      e.clientX < bounds.left ||
      e.clientX > bounds.right ||
      e.clientY < bounds.top ||
      e.clientY > bounds.bottom
    ) {
      // Not in the canvas.
      return undefined;
    }

    const scale = bounds.width / this.canvas.offsetWidth;
    const pixelRatio = getDevicePixelRatio();
    if (!pixelRatio) {
      return undefined;
    }

    return {
      x: (e.clientX - bounds.left) / scale / pixelRatio,
      y: (e.clientY - bounds.top) / scale / pixelRatio,
    };
  }
}
