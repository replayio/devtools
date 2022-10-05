import { getDevicePixelRatio } from "protocol/graphics";
import { NodeBounds } from "@replayio/protocol";

export interface NodePickerOpts {
  onHovering?: (nodeId: string | null) => void;
  onPicked: (nodeId: string | null) => void;
  onHighlightNode: (nodeId: string) => void;
  onUnhighlightNode: () => void;
  onCheckNodeBounds: (x: number, y: number, nodeIds?: string[]) => Promise<NodeBounds | null>;
  enabledNodeIds?: string[];
}

interface Position {
  x: number;
  y: number;
}

export class NodePicker {
  private opts: NodePickerOpts | undefined;
  private pickerPosition: Position | undefined;
  private hoveredNodeId: string | undefined;

  enable(opts: NodePickerOpts) {
    this.opts = opts;
    document.body.addEventListener("mousemove", this.onMouseMove);
    document.body.addEventListener("mouseup", this.onMouseClick);
  }

  disable() {
    document.body.removeEventListener("mousemove", this.onMouseMove);
    document.body.removeEventListener("mouseup", this.onMouseClick);
    this.opts = undefined;
    this.pickerPosition = undefined;
    this.hoveredNodeId = undefined;
  }

  private onMouseMove = async (e: MouseEvent) => {
    const pos = this.mouseEventCanvasPosition(e);
    const opts = this.opts;
    this.pickerPosition = pos;
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
    const canvas = document.getElementById("graphics");
    if (!canvas) {
      return undefined;
    }
    const bounds = canvas.getBoundingClientRect();
    if (
      e.clientX < bounds.left ||
      e.clientX > bounds.right ||
      e.clientY < bounds.top ||
      e.clientY > bounds.bottom
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
      x: (e.clientX - bounds.left) / scale / pixelRatio,
      y: (e.clientY - bounds.top) / scale / pixelRatio,
    };
  }
}
