import React from "react";
import { Input } from ".";
import { SummaryExpression, SummaryExpressionProps } from "./SummaryExpression";
import SummaryRow from "./SummaryRow";

type LogProps = SummaryExpressionProps & {
  handleClick?: (event: React.MouseEvent, input: Input) => void;
  hasCondition: boolean;
};

export default function Log({ handleClick = () => {}, hasCondition, ...rest }: LogProps) {
  const expression = <SummaryExpression {...rest} handleClick={e => handleClick(e, "logValue")} />;

  return <SummaryRow label={hasCondition ? "log" : null} expression={expression} />;
}
