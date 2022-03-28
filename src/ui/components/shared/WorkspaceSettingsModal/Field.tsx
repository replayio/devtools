import React from "react";
import { FieldRow } from "./FieldRow";

export interface FieldProps {
  label: string;
  id: string;
  className?: string;
}
export function Field({
  children,
  className,
  id,
  label,
}: FieldProps & { children: React.ReactNode }) {
  return (
    <FieldRow className={className}>
      <label htmlFor={id} className="mt-px block pt-2 text-sm font-medium text-bodyColor">
        {label}
      </label>
      <div className="col-span-2 mt-1 mt-0">{children}</div>
    </FieldRow>
  );
}
