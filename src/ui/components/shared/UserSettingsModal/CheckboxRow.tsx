import React from "react";
import Checkbox from "../Forms/Checkbox";

type CheckboxRowProps = React.HTMLProps<HTMLInputElement> & {
  label: string;
  description?: string;
};

export function CheckboxRow({ id, checked, onChange, label, description }: CheckboxRowProps) {
  return (
    <label
      className="grid cursor-pointer items-center"
      style={{ gridTemplateColumns: "auto minmax(0, 1fr)", gap: "0 0.5rem" }}
      data-private
      htmlFor={id}
    >
      <Checkbox id={id} checked={checked} onChange={onChange} />
      <div>{label}</div>
      {description ? (
        <div className="text-gray-500 text-xs mb-1" style={{ gridColumnStart: "2" }}>
          {description}
        </div>
      ) : null}
    </label>
  );
}
