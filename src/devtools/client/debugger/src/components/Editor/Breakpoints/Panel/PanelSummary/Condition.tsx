import React from "react";
import { Input } from ".";
import { SummaryExpression, SummaryExpressionProps } from "./SummaryExpression";
import SummaryRow from "./SummaryRow";

type ConditionProps = SummaryExpressionProps & {
  handleClick: (event: React.MouseEvent, input: Input) => void;
};

export default function Condition({ handleClick, ...rest }: ConditionProps) {
  const expression = <SummaryExpression {...rest} handleClick={e => handleClick(e, "condition")} />;

  return <SummaryRow label={"if"}>{expression}</SummaryRow>;
}
