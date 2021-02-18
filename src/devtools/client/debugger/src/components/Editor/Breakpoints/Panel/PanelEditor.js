import React, { PureComponent } from "react";
import classnames from "classnames";
import { connect } from "devtools/client/debugger/src/utils/connect";
import { getContext } from "devtools/client/debugger/src/selectors";
import { PanelInput } from "./PanelInput";
import actions from "devtools/client/debugger/src/actions";
import { parser } from "devtools/client/debugger/src/utils/bootstrap";

class PanelEditor extends PureComponent {
  panelEditorNode;

  constructor(props) {
    const { breakpoint } = props;
    super(props);

    this.state = {
      logValue: breakpoint.options.logValue,
      condition: breakpoint.options.condition || "",
      syntaxErrors: { logValue: null, condition: null },
    };
  }

  setBreakpoint = async () => {
    const { breakpoint, setBreakpointOptions, toggleEditingOff, cx } = this.props;
    const { logValue, condition } = this.state;

    const newOptions = { logValue };

    if (condition) {
      newOptions.condition = condition;
    }

    await setBreakpointOptions(cx, breakpoint.location, newOptions);

    return toggleEditingOff();
  };

  handleCancel = e => {
    const { toggleEditingOff } = this.props;

    toggleEditingOff();
  };

  handleSave = () => {
    this.setBreakpoint();
  };

  onEnter = () => {
    this.handleSave();
  };

  onChange = async (key, value) => {
    const { logValue, condition, syntaxErrors } = this.state;
    this.setState({ [key]: value });

    const syntaxError = await parser.hasSyntaxError(value);
    this.setState({ syntaxErrors: { ...syntaxErrors, [key]: syntaxError } });
  };

  onEscape = () => {
    this.handleCancel();
  };

  renderActions() {
    const { syntaxErrors } = this.state;
    const hasError = syntaxErrors.logValue || syntaxErrors.condition;

    return (
      <div className="edit-actions">
        <button disabled={hasError} className="save" type="button" onClick={this.handleSave}>
          Save
        </button>
        <button className="cancel" type="button" onClick={this.handleCancel}>
          Cancel
        </button>
      </div>
    );
  }

  renderForm() {
    const { syntaxErrors, logValue, condition } = this.state;
    const { inputToFocus } = this.props;

    return (
      <form>
        <div className={classnames("form-row", { invalid: syntaxErrors.logValue })}>
          <label htmlFor="logpoint">Log</label>
          <PanelInput
            id="logpoint"
            autofocus={inputToFocus == "logValue"}
            defaultValue={logValue}
            onChange={cm => this.onChange("logValue", cm.getValue().trim())}
            onEnter={this.onEnter}
            onEscape={this.onEscape}
          />
        </div>
        <div className={classnames("form-row", { invalid: syntaxErrors.condition })}>
          <label htmlFor="condition">Condition</label>
          <div className="input-container">
            <PanelInput
              id="condition"
              autofocus={inputToFocus == "condition"}
              defaultValue={condition}
              onChange={cm => this.onChange("condition", cm.getValue().trim())}
              onEnter={this.onEnter}
              onEscape={this.onEscape}
            />
            {condition == "" ? <div className="placeholder-text">e.g. x === true</div> : null}
          </div>
        </div>
      </form>
    );
  }

  render() {
    const { condition } = this.state;
    const hasCondition = condition !== null;

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
  validateSyntax: actions.validateSyntax,
})(PanelEditor);
