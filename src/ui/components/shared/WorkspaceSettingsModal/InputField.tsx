import React from "react";
import { FieldProps, Field } from "./Field";

export function InputField({
  className,
  id,
  label,
  ...rest
}: FieldProps & React.HTMLProps<HTMLInputElement>) {
  return (
    <Field id={id} className={className} label={label}>
      <div className="max-w-lg flex rounded-md shadow-sm">
        <input
          type="text"
          {...rest}
          name={id}
          id={id}
          className="flex-1 block w-full focus:ring-indigo-500 focus:border-indigo-500 min-w-0 rounded-md text-default border-gray-300"
        />
      </div>
    </Field>
  );
}
