import React, { useEffect, useState, PureComponent } from "react";
import classnames from "classnames";
import { connect } from "devtools/client/debugger/src/utils/connect";
import { getContext } from "devtools/client/debugger/src/selectors";
import { PanelInput } from "./PanelInput";
import actions from "devtools/client/debugger/src/actions";

class PanelEditor extends PureComponent {
  panelEditorNode;

  constructor(props) {
    const { breakpoint } = props;
    super(props);

    this.state = {
      logValue: breakpoint.options.logValue,
      conditionValue: breakpoint.options.condition || "",
    };
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

  onEnter = () => {
    this.handleSave();
  };

  onEscape = () => {
    this.handleCancel();
  };

  renderActions() {
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

    return (
      <form>
        <div className="form-row">
          <label htmlFor="logpoint">{`Log message`}</label>
          <PanelInput
            id="logpoint"
            autofocus={inputToFocus == "logValue"}
            defaultValue={logValue}
            onChange={cm => this.setState({ logValue: cm.getValue().trim() })}
            onEnter={this.onEnter}
            onEscape={this.onEscape}
          />
        </div>
        <div className="form-row">
          <label htmlFor="condition">Condition</label>
          <div className="input-container">
            <PanelInput
              id="condition"
              autofocus={inputToFocus == "condition"}
              defaultValue={conditionValue}
              onChange={cm => this.setState({ conditionValue: cm.getValue().trim() })}
              onEnter={this.onEnter}
              onEscape={this.onEscape}
            />
            {conditionValue == "" ? <div className="placeholder-text">e.g. x === true</div> : null}
          </div>
        </div>
      </form>
    );
  }

  render() {
    const { conditionValue } = this.state;
    const hasCondition = conditionValue !== null;

    return (
      <div
        className={classnames("panel-editor", { conditional: hasCondition })}
        ref={node => (this.panelEditorNode = node)}
      >
        {this.renderActions()}
        {this.renderForm()}
      </div>
    );
  }
}

export default connect(state => ({ cx: getContext(state) }), {
  setBreakpointOptions: actions.setBreakpointOptions,
})(PanelEditor);
