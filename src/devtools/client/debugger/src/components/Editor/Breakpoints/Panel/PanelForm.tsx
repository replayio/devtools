import React from "react";
import classnames from "classnames";
const PanelInput = require("./PanelInput");
import { parser } from "devtools/client/debugger/src/utils/bootstrap";

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
      title="Save log expression"
      className={classnames(
        "hover:bg-primaryAccentHover inline-flex items-center p-1 border border-transparent text-xs leading-4 font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent flex-shrink-0 font-sans",
        disabled ? "text-gray-700 bg-gray-300" : "bg-primaryAccent text-white"
      )}
    >
      Save
    </button>
  );
}

interface PanelFormProps {
  logValue: string;
  logSyntaxError: string;
  setLogValue: (value: string) => void;
  setLogSyntaxError: (value: string | null) => void;
  condition: string;
  conditionSyntaxError: string;
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
    setLogValue(value);
    setLogSyntaxError(await parser.hasSyntaxError(value));
  };
  const onConditionChange = async (value: string) => {
    setCondition(value);

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
          <div className={classnames("form-row space-x-1", { invalid: conditionSyntaxError })}>
            <div className="w-6 flex-shrink-0">if</div>
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
        <div className={classnames("form-row space-x-1", { invalid: logSyntaxError })}>
          {showCondition ? <div className="w-6 flex-shrink-0">log</div> : null}
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
