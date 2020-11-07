import React, { useEffect, useState, PureComponent } from "react";
import classnames from "classnames";
import { connect } from "devtools/client/debugger/src/utils/connect";
import { getContext } from "devtools/client/debugger/src/selectors";
import { PanelInput } from "./PanelInput";
import actions from "devtools/client/debugger/src/actions";

class PanelEditor extends PureComponent {
  panelEditorNode;

  state = {
    logValue: null,
    conditionValue: null,
  };

  componentDidMount() {
    const { breakpoint } = this.props;

    this.setState({
      logValue: breakpoint.options.logValue,
      conditionValue: breakpoint.options.condition || null,
    });
  }

  setBreakpoint = () => {
    const { breakpoint, setBreakpointOptions, cx } = this.props;
    const { logValue, conditionValue } = this.state;

    const newOptions = { logValue };

    if (conditionValue) {
      newOptions.condition = conditionValue;
    }

    setBreakpointOptions(cx, breakpoint.location, newOptions);
  };

  handleCancel = e => {
    const { toggleEditingOff } = this.props;

    toggleEditingOff();
  };

  handleSave = () => {
    const { toggleEditingOff } = this.props;

    this.setBreakpoint();
    toggleEditingOff();
  };

  handleInputBlur = () => {
    setTimeout(() => {
      if (this.panelEditorNode && !this.panelEditorNode.contains(document.activeElement)) {
        this.handleCancel();
      }
    }, 500);
  };

  onEnter = () => {
    this.handleSave();
  };

  onEscape = () => {
    this.handleCancel();
  };

  renderActions() {
    const { conditionValue } = this.state;
    const hasCondition = conditionValue !== null;

    const saveButton = (
      <button className="save" type="button" onClick={this.handleSave}>
        Save
      </button>
    );
    const cancelButton = (
      <button className="cancel" type="button" onClick={this.handleCancel}>
        Cancel
      </button>
    );

    if (hasCondition) {
      return (
        <div className="edit-actions">
          {saveButton}
          {cancelButton}
        </div>
      );
    }

    return (
      <div className="edit-actions">
        {cancelButton}
        {saveButton}
      </div>
    );
  }

  renderForm() {
    const { logValue, conditionValue } = this.state;
    const { inputToFocus } = this.props;
    const hasCondition = conditionValue !== null;

    return (
      <form>
        <label htmlFor="logpoint">{`Log message (e.g. "x is", x)`}</label>
        <div className="input-container">
          <PanelInput
            id="logpoint"
            autofocus={inputToFocus == "logValue"}
            defaultValue={logValue}
            onChange={cm => this.setState({ logValue: cm.getValue().trim() })}
            onBlur={this.handleInputBlur}
            onEnter={this.onEnter}
            onEscape={this.onEscape}
          />
          {hasCondition ? (
            <>
              <label htmlFor="condition">Condition (e.g. x === true)</label>
              <PanelInput
                id="condition"
                autofocus={inputToFocus == "condition"}
                defaultValue={conditionValue}
                onChange={cm => this.setState({ conditionValue: cm.getValue().trim() })}
                onBlur={this.handleInputBlur}
                onEnter={this.onEnter}
                onEscape={this.onEscape}
              />
            </>
          ) : null}
          {this.renderActions()}
        </div>
      </form>
    );
  }

  renderHeader() {
    const { breakpoint } = this.props;
    const { conditionValue } = this.state;
    const hasCondition = conditionValue !== null;

    const addCondition = () => {
      this.props.setInputToFocus("condition");
      this.setState({ conditionValue: "" });
    };
    const removeCondition = () => {
      this.props.setInputToFocus("logValue");
      this.setState({ conditionValue: null });
    };

    return (
      <div className="header">
        <div className="type">Logpoint:</div>
        <div className="line">Line {breakpoint.location.line}</div>
        {hasCondition ? (
          <div className="action" tabIndex="0" onClick={removeCondition}>
            Remove Condition
          </div>
        ) : (
          <div className="action" tabIndex="0" onClick={addCondition}>
            Add Condition
          </div>
        )}
      </div>
    );
  }

  render() {
    const { conditionValue, logValue } = this.state;
    const hasCondition = conditionValue !== null;

    if (!logValue) {
      // Skip the first render. The state doesn't have the default values for
      // logValue and conditionValue until after the component mounts.
      return null;
    }

    return (
      <div
        className={classnames("panel-editor", { conditional: hasCondition })}
        ref={node => (this.panelEditorNode = node)}
      >
        {this.renderHeader()}
        {this.renderForm()}
      </div>
    );
  }
}

export default connect(state => ({ cx: getContext(state) }), {
  setBreakpointOptions: actions.setBreakpointOptions,
})(PanelEditor);
