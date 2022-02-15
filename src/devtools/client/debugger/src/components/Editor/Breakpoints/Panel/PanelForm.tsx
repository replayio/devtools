import React from "react";
import classnames from "classnames";
import { PanelInput } from "./PanelInput";
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
      title={disabled ? "Syntax error" : "Save expression"}
      className={classnames(
        "inline-flex flex-shrink-0 items-center rounded-md border border-transparent p-1 font-sans text-xs font-medium leading-4 text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primaryAccent focus:ring-offset-2",
        disabled ? "cursor-default bg-gray-400" : "bg-primaryAccent hover:bg-primaryAccentHover"
      )}
    >
      Save
    </button>
  );
}

interface PanelFormProps {
  logValue: string;
  setLogValue: (value: string) => void;
  setLogSyntaxError: (value: string | null) => void;
  condition: string;
  setCondition: (value: string) => void;
  setConditionSyntaxError: (value: string | null) => void;
  handleSetBreakpoint: () => void;
  toggleEditingOff: () => void;
  inputToFocus: "condition" | "logValue";
  showCondition: boolean;
}

export default function PanelForm({
  condition,
  handleSetBreakpoint,
  inputToFocus,
  logValue,
  setCondition,
  setConditionSyntaxError,
  setLogSyntaxError,
  setLogValue,
  showCondition,
  toggleEditingOff,
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
    <form className="flex flex-grow flex-col overflow-hidden pl-2">
      {showCondition ? (
        <div className={classnames("form-row")}>
          <div className="mr-1 w-6 flex-shrink-0">if</div>
          <PanelInput
            autofocus={inputToFocus == "condition"}
            defaultValue={condition}
            onChange={(cm: any) => onConditionChange(cm.getValue().trim())}
            onEnter={handleSetBreakpoint}
            onEscape={toggleEditingOff}
          />
        </div>
      ) : null}
      <div className={classnames("form-row")}>
        {showCondition ? <div className="mr-1 w-6 flex-shrink-0">log</div> : null}
        <PanelInput
          autofocus={inputToFocus == "logValue"}
          defaultValue={logValue}
          onChange={(cm: any) => onLogValueChange(cm.getValue().trim())}
          onEnter={handleSetBreakpoint}
          onEscape={toggleEditingOff}
        />
      </div>
    </form>
  );
}
