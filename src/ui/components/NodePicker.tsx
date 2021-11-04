import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";

import { EventEmitter } from "protocol/utils";
import classnames from "classnames";
import { ThreadFront } from "protocol/thread";
import Highlighter from "highlighter/highlighter";

export const nodePicker: any = {};

interface Position {
  x: number;
  y: number;
}

interface NodePickerState {
  nodePickerActive?: any;
}

class NodePicker extends React.Component<PropsFromRedux, NodePickerState> {
  lastPickerPosition: Position | null = null;
  nodePickerRemoveTime?: number;

  constructor(props: PropsFromRedux) {
    super(props);

    this.state = {};

    EventEmitter.decorate(nodePicker);
    // Used in the test harness for picking a node.
    gToolbox.nodePicker = this;
  }

  getHighlighter() {
    return Highlighter;
  }

  async clickNodePickerButton() {
    const { nodePickerActive } = this.state;
    if (nodePickerActive) {
      // The node picker mousedown listener will take care of deactivation.
      return;
    }

    // Hacky workaround to make sure the picker stays deactivated when
    // clicking on its icon.
    const now = Date.now();
    if (this.nodePickerRemoveTime && now - this.nodePickerRemoveTime < 200) {
      return;
    }

    this.setState({ nodePickerActive: true });

    ThreadFront.loadMouseTargets();
    this.addNodePickerListeners();
    this.props.setIsNodePickerActive(true);
    this.props.setSelectedPanel("inspector");
  }

  addNodePickerListeners() {
    document.body.addEventListener("mousemove", this.nodePickerMouseMove);
    document.body.addEventListener("mouseup", this.nodePickerMouseClick);
  }

  removeNodePickerListeners() {
    document.body.removeEventListener("mousemove", this.nodePickerMouseMove);
    document.body.removeEventListener("mouseup", this.nodePickerMouseClick);
  }

  // Get the x/y coordinate of a mouse event wrt the recording's DOM.
  mouseEventCanvasPosition(e: MouseEvent) {
    const canvas = document.getElementById("graphics");
    if (!canvas) {
      return null;
    }
    const bounds = canvas.getBoundingClientRect();
    if (
      e.clientX < bounds.left ||
      e.clientX > bounds.right ||
      e.clientY < bounds.top ||
      e.clientY > bounds.bottom
    ) {
      // Not in the canvas.
      return null;
    }

    const scale = bounds.width / canvas.offsetWidth;

    return {
      x: (e.clientX - bounds.left) / scale,
      y: (e.clientY - bounds.top) / scale,
    };
  }

  nodePickerMouseMove = async (e: MouseEvent) => {
    const pos = this.mouseEventCanvasPosition(e);
    this.lastPickerPosition = pos;
    const nodeBounds = pos && (await ThreadFront.getMouseTarget(pos.x, pos.y));
    if (this.lastPickerPosition == pos && nodeBounds) {
      this.getHighlighter().highlight(nodeBounds);
    } else {
      this.getHighlighter().unhighlight();
    }
  };

  nodePickerMouseClick = (e: MouseEvent) => {
    this.props.setIsNodePickerActive(false);
    this.nodePickerMouseClickInCanvas(this.mouseEventCanvasPosition(e));
    gToolbox.selectTool("inspector");
  };

  // This is exposed separately for use in testing.
  async nodePickerMouseClickInCanvas(pos: Position | null) {
    this.setState({ nodePickerActive: false });
    this.removeNodePickerListeners();
    this.nodePickerRemoveTime = Date.now();

    const nodeBounds = pos && (await ThreadFront.getMouseTarget(pos.x, pos.y));
    if (nodeBounds) {
      this.getHighlighter().highlight(nodeBounds);
      const node = await ThreadFront.ensureNodeLoaded(nodeBounds.nodeId);
      if (node && this.getHighlighter().currentNode == nodeBounds) {
        gToolbox.selection.setNodeFront(node);
      }
    } else {
      this.getHighlighter().unhighlight();
    }
  }

  render() {
    const { nodePickerActive } = this.state;

    return (
      <div
        id="command-button-pick"
        className={classnames("devtools-button toolbar-panel-button", {
          active: nodePickerActive,
        })}
        onClick={() => this.clickNodePickerButton()}
      ></div>
    );
  }
}

const connector = connect(null, {
  setIsNodePickerActive: actions.setIsNodePickerActive,
  setSelectedPanel: actions.setSelectedPanel,
});
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(NodePicker);
