import Highlighter from "highlighter/highlighter";
import { getDevicePixelRatio } from "protocol/graphics";
import { ThreadFront } from "protocol/thread";

export interface NodePickerOpts {
  onHovering?: (nodeId: string | null) => void;
  onPicked: (nodeId: string | null) => void;
  enabledNodeIds?: string[];
}

interface Position {
  x: number;
  y: number;
}

class NodePicker {
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
    this.pickerPosition = pos;
    const nodeBounds = await this.nodeBounds(pos, this.opts?.enabledNodeIds);
    if (this.pickerPosition !== pos) {
      return;
    }
    if (nodeBounds) {
      Highlighter.highlight(nodeBounds);
      if (nodeBounds.nodeId !== this.hoveredNodeId) {
        this.hoveredNodeId = nodeBounds.nodeId;
        this.opts?.onHovering?.(nodeBounds.nodeId);
      }
    } else {
      Highlighter.unhighlight();
    }
  };

  private onMouseClick = async (e: MouseEvent) => {
    const opts = this.opts;
    this.disable();
    const pos = this.mouseEventCanvasPosition(e);
    const nodeBounds = await this.nodeBounds(pos, opts?.enabledNodeIds);
    opts?.onPicked(nodeBounds ? nodeBounds.nodeId : null);
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

  private async nodeBounds(pos: Position | undefined, enabledNodeIds: string[] | undefined) {
    return pos ? await ThreadFront.getMouseTarget(pos.x, pos.y, enabledNodeIds) : undefined;
  }
}

export default new NodePicker();
