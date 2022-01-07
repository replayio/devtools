import React from "react";
import { FieldProps, Field } from "./Field";

export function SelectField({
  children,
  className,
  id,
  label,
  ...rest
}: FieldProps & React.HTMLProps<HTMLSelectElement>) {
  return (
    <Field id={id} className={className} label={label}>
      <select
        {...rest}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
      >
        {children}
      </select>
    </Field>
  );
}
