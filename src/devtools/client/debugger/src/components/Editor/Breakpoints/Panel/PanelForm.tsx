import React from "react";
import classnames from "classnames";
const { PanelInput } = require("./PanelInput");
import { parser } from "devtools/client/debugger/src/utils/bootstrap";
import { trackEvent } from "ui/utils/telemetry";

export function SubmitButton({
  handleSetBreakpoint,
  disabled,
}: {
  handleSetBreakpoint: () => void;
  disabled: boolean;
}) {
  if (disabled) {
  }
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleSetBreakpoint}
      title={disabled ? "Invalid expression(s)" : "Save expression(s)"}
      className={classnames(
        "inline-flex items-center p-1 border border-transparent text-xs leading-4 font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent flex-shrink-0 font-sans text-white",
        disabled ? "bg-gray-400 cursor-default" : "bg-primaryAccent hover:bg-primaryAccentHover"
      )}
    >
      Save
    </button>
  );
}

interface PanelFormProps {
  logValue: string;
  logSyntaxError: string | null;
  setLogValue: (value: string) => void;
  setLogSyntaxError: (value: string | null) => void;
  condition: string;
  conditionSyntaxError: string | null;
  setCondition: (value: string) => void;
  setConditionSyntaxError: (value: string | null) => void;
  handleSetBreakpoint: () => void;
  toggleEditingOff: () => void;
  inputToFocus: "condition" | "logValue";
  showCondition: boolean;
}

export default function PanelForm({
  logValue,
  logSyntaxError,
  setLogValue,
  setLogSyntaxError,
  condition,
  conditionSyntaxError,
  setCondition,
  setConditionSyntaxError,
  handleSetBreakpoint,
  toggleEditingOff,
  inputToFocus,
  showCondition,
}: PanelFormProps) {
  const onLogValueChange = async (value: string) => {
    trackEvent("breakpoint.set_log");
    setLogValue(value);
    setLogSyntaxError(await parser.hasSyntaxError(value));
  };
  const onConditionChange = async (value: string) => {
    setCondition(value);
    trackEvent("breakpoint.set_condition");
    if (value === "") {
      setConditionSyntaxError(null);
    } else {
      setConditionSyntaxError(await parser.hasSyntaxError(value));
    }
  };

  return (
    <div className="flex-grow overflow-hidden">
      <form className="flex flex-col space-y-1">
        {showCondition ? (
          <div className={classnames("form-row", { invalid: conditionSyntaxError })}>
            <div className="w-6 flex-shrink-0 mr-1">if</div>
            <PanelInput
              id="condition"
              autofocus={inputToFocus == "condition"}
              defaultValue={condition}
              onChange={(cm: any) => onConditionChange(cm.getValue().trim())}
              onEnter={handleSetBreakpoint}
              onEscape={toggleEditingOff}
            />
          </div>
        ) : null}
        <div className={classnames("form-row", { invalid: logSyntaxError })}>
          {showCondition ? <div className="w-6 flex-shrink-0 mr-1">log</div> : null}
          <PanelInput
            id="logpoint"
            autofocus={inputToFocus == "logValue"}
            defaultValue={logValue}
            onChange={(cm: any) => onLogValueChange(cm.getValue().trim())}
            onEnter={handleSetBreakpoint}
            onEscape={toggleEditingOff}
          />
        </div>
      </form>
    </div>
  );
}
