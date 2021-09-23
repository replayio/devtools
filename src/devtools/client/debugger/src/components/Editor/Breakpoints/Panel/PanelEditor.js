import React, { PureComponent } from "react";
import classnames from "classnames";
import { connect } from "devtools/client/debugger/src/utils/connect";
import { getContext } from "devtools/client/debugger/src/selectors";
import PanelForm, { SubmitButton } from "./PanelForm";
import actions from "devtools/client/debugger/src/actions";

class PanelEditor extends PureComponent {
  constructor(props) {
    const { breakpoint } = props;
    super(props);

    this.state = {
      logValue: breakpoint.options.logValue,
      condition: breakpoint.options.condition || "",
      logSyntaxError: null,
      conditionSyntaxError: null,
    };
  }

  handleSetBreakpoint = async () => {
    const { showCondition, toggleEditingOff, cx, breakpoint, setBreakpointOptions } = this.props;
    const { logValue, condition } = this.state;
    const newOptions = { logValue };

    // Only save the condition if it's showing. If it's dismissed, then we'll assume
    // that the user didn't intend to save it.
    if (condition && showCondition) {
      newOptions.condition = condition;
    }

    setBreakpointOptions(cx, breakpoint.location, newOptions);
    toggleEditingOff();
  };

  setLogValue = value => this.setState({ logValue: value });
  setLogSyntaxError = error => this.setState({ logSyntaxError: error });
  setCondition = value => this.setState({ condition: value });
  setConditionSyntaxError = error => this.setState({ conditionSyntaxError: error });

  render() {
    const { logSyntaxError, logValue, conditionSyntaxError, condition } = this.state;
    const { toggleEditingOff, inputToFocus, showCondition } = this.props;

    return (
      <div
        className={classnames("panel-editor flex flex-row bg-white space-x-2 items-top", {
          conditional: showCondition,
        })}
      >
        <PanelForm
          {...{
            logSyntaxError,
            logValue,
            conditionSyntaxError,
            condition,
            showCondition,
            toggleEditingOff,
            inputToFocus,
          }}
          handleSetBreakpoint={this.handleSetBreakpoint}
          setLogValue={this.setLogValue}
          setLogSyntaxError={this.setLogSyntaxError}
          setCondition={this.setCondition}
          setConditionSyntaxError={this.setConditionSyntaxError}
        />
        <SubmitButton
          handleSetBreakpoint={this.handleSetBreakpoint}
          disabled={logSyntaxError || conditionSyntaxError}
        />
      </div>
    );
  }
}

export default connect(state => ({ cx: getContext(state) }), {
  setBreakpointOptions: actions.setBreakpointOptions,
})(PanelEditor);
