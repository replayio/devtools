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
        className="mt-1 block w-full rounded-md border-themeBorder bg-themeTextFieldBgcolor py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
      >
        {children}
      </select>
    </Field>
  );
}
