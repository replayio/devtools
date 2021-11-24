import React, { ReactNode } from "react";
import Checkbox from "../Forms/Checkbox";

type CheckboxRowProps = React.HTMLProps<HTMLInputElement> & {
  children: ReactNode;
};

export function CheckboxRow({ id, checked, onChange, children }: CheckboxRowProps) {
  return (
    <label className="flex items-start space-x-2 cursor-pointer" data-private htmlFor={id}>
      <Checkbox id={id} checked={checked} onChange={onChange} />
      <div>{children}</div>
    </label>
  );
}
