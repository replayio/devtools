import React from "react";
import SummaryRow from "./SummaryRow";

export type Input = "condition" | "logValue";

interface ConditionProps {
  isEditable: boolean;
  handleClick: (event: React.MouseEvent, input: Input) => void;
  conditionValue: string;
}

export function Condition({ isEditable, handleClick, conditionValue }: ConditionProps) {
  if (!conditionValue) {
    return null;
  }

  return (
    <SummaryRow
      label="if"
      value={conditionValue}
      handleClick={e => handleClick(e, "condition")}
      {...{ isEditable }}
    />
  );
}
