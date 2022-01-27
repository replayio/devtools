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
      <label htmlFor={id} className="block text-default font-medium text-gray-700 mt-px pt-2">
        {label}
      </label>
      <div className="mt-1 mt-0 col-span-2">{children}</div>
    </FieldRow>
  );
}
