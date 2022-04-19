import React from "react";

import { SummaryExpression, SummaryExpressionProps } from "./SummaryExpression";
import SummaryRow from "./SummaryRow";

type LogProps = SummaryExpressionProps & { hasCondition: boolean; onClick: () => void };

export default function Log({ hasCondition, onClick, ...rest }: LogProps) {
  return (
    <SummaryRow onClick={onClick} label={hasCondition ? "log" : null}>
      <SummaryExpression {...rest} />
    </SummaryRow>
  );
}
