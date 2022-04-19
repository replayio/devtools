import classnames from "classnames";
import actions from "devtools/client/debugger/src/actions";
import React, { PureComponent } from "react";
import { UIState } from "ui/state";

import PanelForm, { SubmitButton } from "./PanelForm";

const { getContext } = require("devtools/client/debugger/src/selectors");
const { connect } = require("devtools/client/debugger/src/utils/connect");

interface Props {
  showCondition: boolean;
  setShowCondition: (value: boolean) => void;
  toggleEditingOff: () => void;
  cx: any;
  breakpoint: any;
  setBreakpointOptions: (cx: any, location: any, options: any) => void;
  inputToFocus: "condition" | "logValue";
}
interface State {
  logValue: string;
  condition: string;
  logSyntaxError: string | null;
  conditionSyntaxError: string | null;
}

class PanelEditor extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    const { breakpoint } = props;

    this.state = {
      condition: breakpoint.options.condition || "",
      conditionSyntaxError: null,
      logSyntaxError: null,
      logValue: breakpoint.options.logValue,
    };
  }

  hasError = () => !!this.state.logSyntaxError || this.state.conditionSyntaxError;

  handleSetBreakpoint = async () => {
    const {
      showCondition,
      toggleEditingOff,
      cx,
      breakpoint,
      setBreakpointOptions,
      setShowCondition,
    } = this.props;
    const { logValue, condition } = this.state;
    const newOptions: { logValue: string; condition?: string } = { logValue };

    // Bail if there is an error.
    if (this.hasError()) {
      return;
    }

    if (condition && showCondition) {
      // Only save the condition if it's showing. If it's dismissed, then we'll assume
      // that the user didn't intend to save it.
      newOptions.condition = condition;
    } else if (!condition) {
      // If there's no condition, toggle the input box off.
      setShowCondition(false);
    }

    setBreakpointOptions(cx, breakpoint.location, newOptions);
    toggleEditingOff();
  };

  setLogValue = (value: string) => this.setState({ logValue: value });
  setLogSyntaxError = (error: string | null) => this.setState({ logSyntaxError: error });
  setCondition = (value: string) => this.setState({ condition: value });
  setConditionSyntaxError = (error: string | null) =>
    this.setState({ conditionSyntaxError: error });

  render() {
    const { logSyntaxError, logValue, conditionSyntaxError, condition } = this.state;
    const { toggleEditingOff, inputToFocus, showCondition } = this.props;

    return (
      <div
        className={classnames(
          "panel-editor items-top flex flex-row items-center space-x-2 bg-breakpointEditfieldActive",
          {
            conditional: showCondition,
          }
        )}
      >
        <PanelForm
          {...{
            condition,
            conditionSyntaxError,
            inputToFocus,
            logSyntaxError,
            logValue,
            showCondition,
            toggleEditingOff,
          }}
          handleSetBreakpoint={this.handleSetBreakpoint}
          setLogValue={this.setLogValue}
          setLogSyntaxError={this.setLogSyntaxError}
          setCondition={this.setCondition}
          setConditionSyntaxError={this.setConditionSyntaxError}
        />
        <div className="button-container flex items-center">
          <SubmitButton
            handleSetBreakpoint={this.handleSetBreakpoint}
            disabled={!!logSyntaxError || !!conditionSyntaxError}
          />
        </div>
      </div>
    );
  }
}

export default connect((state: UIState) => ({ cx: getContext(state) }), {
  setBreakpointOptions: actions.setBreakpointOptions,
})(PanelEditor);
