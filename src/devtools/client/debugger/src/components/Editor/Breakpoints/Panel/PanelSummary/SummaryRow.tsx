import React from "react";

export default function SummaryRow({
  expression,
  label,
}: {
  expression: React.ReactElement;
  label: string | null;
}) {
  return (
    <div className="flex flex-row space-x-1 items-center">
      {label ? <div className="w-6 flex-shrink-0">{label}</div> : null}
      {expression}
    </div>
  );
}
