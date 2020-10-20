/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import React, { PureComponent } from "react";
import ReactDOM from "react-dom";
import { connect } from "../../utils/connect";
import classNames from "classnames";
import "./Panel.css";
import { toEditorLine } from "../../utils/editor";
import actions from "../../actions";

import { getContext } from "../../selectors";

export class Panel extends PureComponent {
  cbPanel;
  input;
  codeMirror;
  panelNode;
  scrollParent;

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

  onInput = e => {
    if (e.keyCode === 13) {
      return this.save();
    }

    if (!this.input || !this.codeMirror) {
      return;
    }

    this.toggleActionsPanel();
  };

  toggleActionsPanel() {
    const value = this.codeMirror.getValue();
    if (value == this.initialValue) {
      this.setViewing();
    } else {
      this.setEditing();
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
    this.setViewing();
  };

  delete = () => {
    this.removeLogpoint();
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

  removeLogpoint() {
    const { cx, breakpoint } = this.props;
    const location = breakpoint.location;
    const options = { ...breakpoint?.options } || {};
    delete options.logValue;

    return this.props.setBreakpointOptions(cx, location);
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

  setEditing = () => {
    this.editActionsNode.classList.remove("hidden");
    this.labelNode.classList.remove("hidden");
  };

  setViewing = () => {
    this.editActionsNode.classList.add("hidden");
    this.labelNode.classList.add("hidden");
  };

  UNSAFE_componentWillMount() {
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

    codeMirror.on("keydown", (cm, e) => {
      if (e.key === "Enter") {
        e.codemirrorIgnore = true;
        e.preventDefault();
      }
    });

    const codeMirrorWrapper = codeMirror.getWrapperElement();

    codeMirrorWrapper.addEventListener("keyup", e => {
      codeMirror.save();
      this.onInput(e);
    });

    codeMirrorWrapper.addEventListener("click", e => {
      this.setEditing();
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
        <div className="text title">Logpoint: Line {breakpoint.location.line}</div>
        <div className="text label hidden" ref={node => (this.labelNode = node)}>
          Log message (e.g. &apos;x is x&apos;, x)
        </div>
        <div className="input-row">
          <textarea defaultValue={defaultValue} ref={input => this.createEditor(input)} />
          <div className="edit-actions hidden" ref={node => (this.editActionsNode = node)}>
            <button className="text save" onClick={this.save}>
              Save
            </button>
            <button className="text cancel" onClick={this.cancel}>
              Cancel
            </button>
          </div>
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

export default connect(mapStateToProps, {
  setBreakpointOptions: actions.setBreakpointOptions,
})(Panel);
