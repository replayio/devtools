/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import React, { PureComponent } from "react";
import ReactDOM from "react-dom";
import classnames from "classnames";
import { connect } from "devtools/client/debugger/src/utils/connect";
import { toEditorLine } from "devtools/client/debugger/src/utils/editor";
import actions from "devtools/client/debugger/src/actions";
import { getContext } from "devtools/client/debugger/src/selectors";
import { BreakpointEditor } from "./Editor";

import "./Panel.css";

export class Panel extends PureComponent {
  cbPanel;
  input;
  codeMirror;
  panelNode;

  constructor() {
    super();
    this.cbPanel = null;

    this.panel = document.createElement("div");
    this.panel.classList.add("logpoint-panel");

    this.state = {
      editing: false,
      logValue: null,
      conditionValue: null,
      editCondition: false,
    };
  }

  componentDidMount() {
    this.renderToWidget(this.props);
    const { breakpoint } = this.props;
    this.setState({
      logValue: breakpoint.options.logValue,
      conditionValue: breakpoint.options.condition || null,
    });
  }

  componentDidUpdate(_, prevState) {
    const { editCondition } = this.state;

    if (editCondition) {
      this.setState({ editCondition: false });
    }
  }

  componentWillUnmount() {
    // This is called if CodeMirror is re-initializing itself before the
    // user closes the panel. Clear the widget, and re-render it
    // as soon as this component gets remounted
    return this.clearPanel();
  }

  renderToWidget() {
    const { breakpoint, editor } = this.props;
    const { location } = breakpoint;

    if (this.cbPanel) {
      this.clearPanel();
    }

    const editorLine = toEditorLine(location.sourceId, location.line || 0);
    this.cbPanel = editor.codeMirror.addLineWidget(editorLine, this.panel, {
      // coverGutter: true,
      noHScroll: true,
    });
  }

  clearPanel() {
    if (this.cbPanel) {
      this.cbPanel.clear();
      this.cbPanel = null;
    }
  }

  setBreakpoint() {
    const { cx, breakpoint } = this.props;
    const { logValue, conditionValue } = this.state;

    const newOptions = { ...breakpoint.options, logValue };

    if (conditionValue) {
      newOptions.condition = conditionValue;
    }

    this.props.setBreakpointOptions(cx, breakpoint.location, newOptions);
  }

  toggleEditingOn = () => {
    this.setState({ editing: true });
  };

  toggleEditingOff = () => {
    this.setState({ editing: false });
  };

  setConditionValue = conditionValue => {
    this.setState({ conditionValue });
  };

  handleInputBlur = () => {
    setTimeout(() => {
      if (!this.panelNode.contains(document.activeElement)) {
        this.handleCancel();
      }
    }, 500);
  };

  handleCancel = e => {
    const { breakpoint } = this.props;

    this.setState({
      logValue: breakpoint.options.logValue,
      conditionValue: breakpoint.options.condition || null,
    });
    this.toggleEditingOff();
  };

  handleSave = e => {
    const { conditionValue } = this.state;

    if (conditionValue === "") {
      this.setConditionValue(null);
    }

    this.setBreakpoint();
    this.toggleEditingOff();
  };

  handleKeyDown = e => {
    if (e.key == "Escape") {
      this.handleCancel();
    } else if (e.key == "Enter") {
      this.handleSave();
    }
  };

  renderEditActions() {
    const { conditionValue } = this.state;
    const hasCondition = conditionValue !== null;

    if (hasCondition) {
      return (
        <div className="edit-actions">
          <button className="save" type="button" onClick={this.handleSave}>
            Save
          </button>
          <button className="cancel" type="button" onClick={this.handleCancel}>
            Cancel
          </button>
        </div>
      );
    }

    return (
      <div className="edit-actions">
        <button className="cancel" type="button" onClick={this.handleCancel}>
          Cancel
        </button>
        <button className="save" type="button" onClick={this.handleSave}>
          Save
        </button>
      </div>
    );
  }

  renderLogpointForm() {
    const { logValue, conditionValue } = this.state;
    const hasCondition = conditionValue !== null;

    return (
      <form>
        <label htmlFor="logpoint">{`Log message (e.g. "x is", x)`}</label>
        <div className="input-container">
          <BreakpointEditor
            id="logpoint"
            autofocus={true}
            defaultValue={logValue}
            onChange={cm => this.setState({ logValue: cm.getValue().trim() })}
            onBlur={this.handleInputBlur}
            onKeyDown={this.handleKeyDown}
          />
          {hasCondition ? (
            <>
              <label htmlFor="condition">Condition (e.g. x === true)</label>
              <BreakpointEditor
                id="condition"
                defaultValue={conditionValue}
                onChange={cm => this.setState({ conditionValue: cm.getValue().trim() })}
                onBlur={this.handleInputBlur}
                onKeyDown={this.handleKeyDown}
              />
            </>
          ) : null}
          {this.renderEditActions()}
        </div>
      </form>
    );
  }

  renderLogSummary() {
    const { logValue } = this.state;

    return (
      <button className="log" type="button" onClick={this.toggleEditingOn}>
        console.log(<span className="expression">{logValue}</span>);
      </button>
    );
  }

  renderConditionSummary() {
    const { conditionValue } = this.state;

    const onClick = () => {
      this.toggleEditingOn();
      this.setState({ editCondition: true });
    };

    return (
      <button className="condition" type="button" onClick={onClick}>
        if (<span className="expression">{conditionValue}</span>)
      </button>
    );
  }

  renderSummary() {
    const { conditionValue } = this.state;
    const hasCondition = conditionValue !== null;

    return (
      <div className="summary" onClick={this.toggleEditingOn}>
        <div className="preview">
          {hasCondition ? (
            <>
              {this.renderConditionSummary()}
              {this.renderLogSummary()}
            </>
          ) : (
            this.renderLogSummary()
          )}
        </div>
        <div className="action" tabIndex="0" onClick={this.toggleEditingOn}>
          Edit
        </div>
      </div>
    );
  }

  renderHeaderAction() {
    const { editing, conditionValue } = this.state;
    const hasCondition = conditionValue !== null;

    if (!editing) {
      return (
        <div className="action" tabIndex="0" onClick={this.toggleEditingOn}>
          Edit
        </div>
      );
    }

    return hasCondition ? (
      <div className="action" tabIndex="0" onClick={() => this.setConditionValue(null)}>
        Remove Condition
      </div>
    ) : (
      <div className="action" tabIndex="0" onClick={() => this.setConditionValue("")}>
        Add Condition
      </div>
    );
  }

  renderHeader() {
    const { breakpoint } = this.props;
    const { conditionValue } = this.state;

    return (
      <div className="header">
        <div className="type">Logpoint:</div>
        <div className="line">Line {breakpoint.location.line}</div>
        {this.renderHeaderAction()}
      </div>
    );
  }

  render() {
    const { editing, conditionValue } = this.state;
    const hasCondition = conditionValue !== null;
    const panel = this.panel;

    const panelElem = (
      <div
        className={classnames("breakpoint-panel log-point", { editing, conditional: hasCondition })}
        ref={node => (this.panelNode = node)}
      >
        {editing ? this.renderHeader() : null}
        {editing ? this.renderLogpointForm() : this.renderSummary()}
      </div>
    );

    return ReactDOM.createPortal(panelElem, panel);
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
