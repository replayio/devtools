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

    setBreakpointOptions(cx, breakpoint.location, newOptions);

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

  renderForm() {
    const { syntaxErrors, logValue, condition } = this.state;
    const { inputToFocus, breakpoint } = this.props;

    return (
      <div>
        <form>
          <div className={classnames("form-row", { invalid: syntaxErrors.logValue })}>
            <PanelInput
              id="logpoint"
              autofocus={inputToFocus == "logValue"}
              defaultValue={logValue}
              onChange={cm => this.onChange("logValue", cm.getValue().trim())}
              onEnter={this.onEnter}
              onEscape={this.onEscape}
            />
          </div>
        </form>
      </div>
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
        {this.renderForm()}
      </div>
    );
  }
}

export default connect(state => ({ cx: getContext(state) }), {
  setBreakpointOptions: actions.setBreakpointOptions,
  validateSyntax: actions.validateSyntax,
})(PanelEditor);
