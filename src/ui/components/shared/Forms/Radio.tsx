import React from "react";

export default function Radio(overrides: React.HTMLProps<HTMLInputElement>) {
  return (
    <input
      type="radio"
      className="mt-1 h-4 w-4 border-gray-300 text-primaryAccent focus:ring-primaryAccent"
      {...overrides}
    />
  );
}
