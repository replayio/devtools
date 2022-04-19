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
      <div className="flex max-w-lg rounded-md shadow-sm">
        <input
          type="text"
          {...rest}
          name={id}
          id={id}
          className="block w-full min-w-0 flex-1 rounded-md border-themeBorder bg-themeTextFieldBgcolor text-sm text-themeTextFieldColor focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>
    </Field>
  );
}
