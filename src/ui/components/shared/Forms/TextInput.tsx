import React, { ChangeEvent } from "react";

export default function TextInput({
  placeholder,
  value,
  onChange,
  id,
}: {
  placeholder: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  id?: string;
}) {
  return (
    <input
      type="text"
      id={id}
      onChange={onChange}
      value={value}
      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full text-lg border-gray-300 rounded-md"
      placeholder={placeholder}
    />
  );
}
