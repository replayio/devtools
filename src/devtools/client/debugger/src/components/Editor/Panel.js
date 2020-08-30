/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// @flow
import React, { PureComponent } from "react";
import ReactDOM from "react-dom";
import { connect } from "../../utils/connect";
import classNames from "classnames";
import "./Panel.css";
import { toEditorLine } from "../../utils/editor";
import actions from "../../actions";

import { getContext } from "../../selectors";

import type { SourceLocation, Context, Breakpoint } from "../../types";

type OwnProps = {|
  editor: Object,
|};
type Props = {
  cx: Context,
  breakpoint: ?Object,
  setBreakpointOptions: typeof actions.setBreakpointOptions,
  location: SourceLocation,
  log: boolean,
  editor: Object,
};

export class Panel extends PureComponent<Props> {
  cbPanel: null | Object;
  input: ?HTMLTextAreaElement;
  codeMirror: ?Object;
  panelNode: ?HTMLDivElement;
  scrollParent: ?HTMLElement;

  constructor() {
    super();
    this.cbPanel = null;
  }

  componentDidMount() {
    const { breakpoint } = this.props;
    this.initialValue = breakpoint.options.logValue;
  }

  keepFocusOnInput() {
    if (this.input) {
      this.input.focus();
    }
  }

  onKey = e => {
    if (!this.input || !this.codeMirror) {
      return;
    }

    if (e.metaKey && e.which == 13) {
      return this.save();
    }

    this.toggleActionsPanel();
  };

  toggleActionsPanel() {
    const value = this.codeMirror.getValue();
    if (value == this.initialValue) {
      this.actionsNode.classList.remove("editing");
    } else {
      this.actionsNode.classList.add("editing");
    }
  }

  save = () => {
    const value = this.codeMirror.getValue();
    this.initialValue = value;
    this.toggleActionsPanel();
    this.setBreakpoint(value);
  };

  cancel = () => {
    this.codeMirror.doc.setValue(this.initialValue);
    this.toggleActionsPanel();
  };

  setBreakpoint(value) {
    const { cx, breakpoint } = this.props;
    const location = breakpoint.location;
    const options = breakpoint?.options || {};

    return this.props.setBreakpointOptions(cx, location, {
      ...options,
      logValue: value,
    });
  }

  clearPanel() {
    if (this.cbPanel) {
      this.cbPanel.clear();
      this.cbPanel = null;
    }
    if (this.scrollParent) {
      this.scrollParent.removeEventListener("scroll", this.repositionOnScroll);
    }
  }

  repositionOnScroll = () => {
    if (this.panelNode && this.scrollParent) {
      const { scrollLeft } = this.scrollParent;
      this.panelNode.style.transform = `translateX(${scrollLeft}px)`;
    }
  };

  componentWillMount() {
    return this.renderToWidget(this.props);
  }

  componentWillUnmount() {
    // This is called if CodeMirror is re-initializing itself before the
    // user closes the panel. Clear the widget, and re-render it
    // as soon as this component gets remounted
    return this.clearPanel();
  }

  renderToWidget(props) {
    if (this.cbPanel) {
      this.clearPanel();
    }
    const { breakpoint, editor } = props;
    const { location } = breakpoint;

    const editorLine = toEditorLine(location.sourceId, location.line || 0);
    this.cbPanel = editor.codeMirror.addLineWidget(editorLine, this.renderPanel(props), {
      coverGutter: true,
      noHScroll: true,
    });

    if (this.input) {
      let parent = this.input.parentNode;
      while (parent) {
        if (parent instanceof HTMLElement && parent.classList.contains("CodeMirror-scroll")) {
          this.scrollParent = parent;
          break;
        }
        parent = parent.parentNode;
      }

      if (this.scrollParent) {
        this.scrollParent.addEventListener("scroll", this.repositionOnScroll);
        this.repositionOnScroll();
      }
    }
  }

  createEditor = input => {
    const { log, editor } = this.props;
    const codeMirror = editor.CodeMirror.fromTextArea(input, {
      mode: "javascript",
      theme: "mozilla",
      placeholder: "Log message, e.g. displayName",
    });

    // codeMirror.on("keydown", (cm, e) => {
    //   if (e.key === "Enter") {
    //     e.codemirrorIgnore = true;
    //   } else {
    //     e.codemirrorIgnore = false;
    //   }
    // });

    const codeMirrorWrapper = codeMirror.getWrapperElement();

    codeMirrorWrapper.addEventListener("keydown", e => {
      codeMirror.save();
      this.onKey(e);
    });

    this.input = input;
    this.codeMirror = codeMirror;
    setTimeout(() => codeMirror.focus(), 0);
    codeMirror.setCursor(codeMirror.lineCount(), 0);
  };

  renderPanel(props) {
    const { breakpoint } = props;
    const defaultValue = breakpoint?.options.logValue;

    const panel = document.createElement("div");
    ReactDOM.render(
      <div
        className="breakpoint-panel log-point"
        onClick={() => this.keepFocusOnInput()}
        ref={node => (this.panelNode = node)}
      >
        <div className="prompt">»</div>
        <textarea defaultValue={defaultValue} ref={input => this.createEditor(input)} />
        <div className="actions" ref={node => (this.actionsNode = node)}>
          <button className="save" onClick={this.save}>
            Save
          </button>
          <a className="cancel" onClick={this.cancel}>
            Cancel
          </a>
        </div>
      </div>,
      panel
    );
    return panel;
  }

  render() {
    return null;
  }
}

const mapStateToProps = state => {
  return {
    cx: getContext(state),
  };
};

export default connect<Props, OwnProps, _, _, _, _>(mapStateToProps, {
  setBreakpointOptions: actions.setBreakpointOptions,
})(Panel);
