import React from "react";

export default function Checkbox({ id, checked, onChange }: React.HTMLProps<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className="focus:ring-primaryAccent h-4 w-4 text-primaryAccent border-gray-300 rounded"
      {...{ id, checked, onChange }}
    />
  );
}
