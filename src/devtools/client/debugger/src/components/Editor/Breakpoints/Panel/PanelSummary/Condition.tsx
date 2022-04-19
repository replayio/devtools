import React from "react";

import { SummaryExpression, SummaryExpressionProps } from "./SummaryExpression";
import SummaryRow from "./SummaryRow";

type ConditionProps = SummaryExpressionProps & {
  onClick: () => void;
};

export default function Condition({ onClick, ...rest }: ConditionProps) {
  return (
    <SummaryRow onClick={onClick} label={"if"}>
      <SummaryExpression {...rest} />
    </SummaryRow>
  );
}
