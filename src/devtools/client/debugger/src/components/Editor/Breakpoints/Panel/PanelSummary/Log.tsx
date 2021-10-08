import React from "react";
import { Input } from "./Condition";
import SummaryRow from "./SummaryRow";

interface LogProps {
  isEditable: boolean;
  handleClick: (event: React.MouseEvent, input: Input) => void;
  hasCondition: boolean;
  logValue: string;
}

export default function Log({ hasCondition, isEditable, handleClick, logValue }: LogProps) {
  return (
    <SummaryRow
      label={hasCondition ? "log" : null}
      value={logValue}
      handleClick={e => handleClick(e, "logValue")}
      {...{ isEditable }}
    />
  );
}
