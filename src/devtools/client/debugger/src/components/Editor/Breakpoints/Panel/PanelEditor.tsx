import React, { PureComponent } from "react";
import classnames from "classnames";
const { connect } = require("devtools/client/debugger/src/utils/connect");
const { getContext } = require("devtools/client/debugger/src/selectors");
import PanelForm, { SubmitButton } from "./PanelForm";
import actions from "devtools/client/debugger/src/actions";
import { UIState } from "ui/state";

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
      logValue: breakpoint.options.logValue,
      condition: breakpoint.options.condition || "",
      logSyntaxError: null,
      conditionSyntaxError: null,
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
    const newOptions: { logValue: string; condition?: string; prefixBadge?: string } = { logValue };

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

    toggleEditingOff();

    // Bail if either the logValue or condition hasn't changed.
    if (
      newOptions.logValue === breakpoint.options.logValue &&
      newOptions.condition === breakpoint.options.condition
    ) {
      return;
    }

    if (breakpoint.options.prefixBadge) {
      newOptions.prefixBadge = breakpoint.options.prefixBadge;
    }

    setBreakpointOptions(cx, breakpoint.location, newOptions);
  };

  setLogValue = (value: string) => this.setState({ logValue: value });
  setLogSyntaxError = (error: string | null) => this.setState({ logSyntaxError: error });
  setCondition = (value: string) => this.setState({ condition: value });
  setConditionSyntaxError = (error: string | null) =>
    this.setState({ conditionSyntaxError: error });

  render() {
    const { logSyntaxError, logValue, conditionSyntaxError, condition } = this.state;
    const { toggleEditingOff, inputToFocus, showCondition, breakpoint } = this.props;

    return (
      <div
        className={classnames(
          "panel-editor items-top flex flex-row items-center rounded-sm bg-breakpointEditfieldActive",
          {
            conditional: showCondition,
          }
        )}
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
        <div className="button-container ml-2 flex items-center">
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
