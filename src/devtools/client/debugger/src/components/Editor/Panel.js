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

  getConditionValue() {
    const { breakpoint } = this.props;
    const options = breakpoint?.options;
    return options?.condition;
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
      this.hideLogpointEditor();
    } else {
      this.showLogpointEditor();
    }
  }

  save = () => {
    if (this.conditionCodeMirror.getValue() === "") {
      this.deleteCondition();
      this.hideConditionalEditor();
    }

    console.log(this.conditionInput.value);
    const value = this.codeMirror.getValue();
    this.initialValue = value;
    this.toggleActionsPanel();
    this.setBreakpoint(value);
    this.conditionInput.blur();
    this.input.blur();
  };

  cancel = () => {
    if (this.conditionCodeMirror.getValue() === "") {
      this.hideConditionalEditor();
    }

    this.codeMirror.doc.setValue(this.initialValue);
    this.hideLogpointEditor();
    this.conditionInput.blur();
    this.input.blur();
  };

  delete = () => {
    this.deleteCondition();
    this.deleteLogpoint();
  };

  setBreakpoint(value) {
    const { cx, breakpoint } = this.props;
    const location = breakpoint.location;
    const options = breakpoint?.options || {};

    return this.props.setBreakpointOptions(cx, location, {
      ...options,
      logValue: value,
      condition: this.conditionInput.value.trim(),
    });
  }

  removeCondition = () => {
    this.hideConditionalEditor();
    this.deleteCondition();
  };

  deleteCondition = () => {
    const { cx, breakpoint } = this.props;
    const location = breakpoint.location;
    const options = { ...breakpoint?.options } || {};
    delete options.condition;
    console.log(options);

    return this.props.setBreakpointOptions(cx, location, options);
  };

  deleteLogpoint() {
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

  showLogpointEditor = () => {
    if (this.hasConditionalOpen) {
      this.fullEditActionsNode.classList.remove("hidden");
    } else {
      this.compactEditActionsNode.classList.remove("hidden");
    }

    this.conditionTinyLabelNode.classList.add("hidden");
    this.logpointTinyLabelNode.classList.add("hidden");

    this.conditionalLabelNode.classList.remove("hidden");
    this.labelNode.classList.remove("hidden");
    this.addConditionNode.classList.remove("hidden");
    this.removeConditionNode.classList.remove("hidden");
  };

  hideLogpointEditor = () => {
    this.conditionTinyLabelNode.classList.remove("hidden");
    this.logpointTinyLabelNode.classList.remove("hidden");

    this.compactEditActionsNode.classList.add("hidden");
    this.fullEditActionsNode.classList.add("hidden");
    this.conditionalLabelNode.classList.add("hidden");
    this.labelNode.classList.add("hidden");
    this.addConditionNode.classList.add("hidden");
    this.removeConditionNode.classList.add("hidden");
  };

  showConditionalEditor = () => {
    this.hasConditionalOpen = true;

    this.conditionalNode.classList.remove("hidden");
    this.conditionalLogpointHeader.classList.remove("hidden");
    this.logpointHeader.classList.add("hidden");
    this.fullEditActionsNode.classList.remove("hidden");
    this.compactEditActionsNode.classList.add("hidden");
  };

  hideConditionalEditor = () => {
    this.hasConditionalOpen = false;

    this.conditionalNode.classList.add("hidden");
    this.conditionalLogpointHeader.classList.add("hidden");
    this.logpointHeader.classList.remove("hidden");
    this.fullEditActionsNode.classList.add("hidden");
    this.compactEditActionsNode.classList.remove("hidden");
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
      if (this.scrollParent) {
        this.scrollParent.addEventListener("scroll", this.repositionOnScroll);
        this.repositionOnScroll();
      }
    }
  }

  createConditionEditor = input => {
    const { log, editor } = this.props;
    const codeMirror = editor.CodeMirror.fromTextArea(input, {
      mode: "javascript",
      theme: "mozilla",
      placeholder: L10N.getStr("editor.conditionalPanel.logPoint.placeholder2"),
    });

    codeMirror.on("keydown", (cm, e) => {
      if (e.key.length > 1 && e.key != "Backspace") {
        e.codemirrorIgnore = true;
        e.preventDefault();
      }
    });

    const codeMirrorWrapper = codeMirror.getWrapperElement();

    codeMirrorWrapper.addEventListener("keyup", e => {
      console.log(e);
      if (e.key.length > 1 && e.key != "Enter" && e.key != "Backspace") {
        return;
      } else if (e.key == "Enter") {
        this.save();
      }
      codeMirror.save();
    });

    codeMirrorWrapper.addEventListener("click", e => {
      this.showLogpointEditor();
    });

    this.conditionInput = input;
    this.conditionCodeMirror = codeMirror;
  };

  createLogpointEditor = input => {
    const { editor } = this.props;
    const codeMirror = editor.CodeMirror.fromTextArea(input, {
      mode: "javascript",
      theme: "mozilla",
      placeholder: "Log message, e.g. displayName",
    });

    codeMirror.on("keydown", (cm, e) => {
      if (e.key.length > 1 && e.key != "Backspace") {
        e.codemirrorIgnore = true;
        e.preventDefault();
      }
    });

    const codeMirrorWrapper = codeMirror.getWrapperElement();

    codeMirrorWrapper.addEventListener("keyup", e => {
      if (e.key.length > 1 && e.key != "Enter" && e.key != "Backspace") {
        return;
      }

      codeMirror.save();
      this.onInput(e);
    });

    codeMirrorWrapper.addEventListener("click", e => {
      this.showLogpointEditor();
    });

    this.input = input;
    this.codeMirror = codeMirror;
    setTimeout(() => codeMirror.focus(), 0);
    codeMirror.setCursor(codeMirror.lineCount(), 0);
  };

  renderPanel(props) {
    const { breakpoint } = props;
    const line = breakpoint.location.line;
    const defaultValue = breakpoint?.options.logValue;

    const panel = document.createElement("div");
    ReactDOM.render(
      <div
        className="breakpoint-panel log-point"
        onClick={() => this.keepFocusOnInput()}
        ref={node => (this.panelNode = node)}
      >
        <div className="row header logpoint" ref={node => (this.logpointHeader = node)}>
          <div className="text title">Logpoint: Line {line}</div>
          <div
            className="text add-condition hidden"
            ref={node => (this.addConditionNode = node)}
            onClick={this.showConditionalEditor}
          >
            Add a condition
          </div>
        </div>
        <div
          className="row header conditional-logpoint hidden"
          ref={node => (this.conditionalLogpointHeader = node)}
        >
          <div className="text title">Conditional Logpoint: Line {line}</div>
          <div
            className="text remove-condition hidden"
            ref={node => (this.removeConditionNode = node)}
            onClick={this.removeCondition}
          >
            Remove the condition
          </div>
        </div>
        <div className="conditional-row hidden" ref={node => (this.conditionalNode = node)}>
          <div className="text label" ref={node => (this.conditionalLabelNode = node)}>
            Conditional expression (e.g. x === true)
          </div>
          <div className="input-row">
            <div
              className="text label"
              ref={node => {
                this.conditionTinyLabelNode = node;
              }}
            >
              Condition:
            </div>
            <textarea
              defaultValue={this.getConditionValue()}
              ref={input => this.createConditionEditor(input)}
            />
          </div>
        </div>
        <div className="text label log-message hidden" ref={node => (this.labelNode = node)}>
          Log message (e.g. &apos;x is x&apos;, x)
        </div>
        <div className="input-row">
          <div
            className="text label"
            ref={node => {
              this.logpointTinyLabelNode = node;
            }}
          >
            Log:
          </div>
          <textarea defaultValue={defaultValue} ref={input => this.createLogpointEditor(input)} />
          <div className="edit-actions hidden" ref={node => (this.compactEditActionsNode = node)}>
            <button className="text save" onClick={this.save}>
              Save
            </button>
            <button className="text cancel" onClick={this.cancel}>
              Cancel
            </button>
          </div>
        </div>
        <div className="edit-actions full hidden" ref={node => (this.fullEditActionsNode = node)}>
          <button className="text save" onClick={this.save}>
            Save
          </button>
          <button className="text cancel" onClick={this.cancel}>
            Cancel
          </button>
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
