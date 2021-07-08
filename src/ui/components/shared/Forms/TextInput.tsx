import React, { ChangeEvent } from "react";

export default function TextInput({
  placeholder,
  value,
  onChange,
  id,
}: {
  placeholder?: string;
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
      className="focus:ring-primaryAccent focus:primaryAccentHover block w-full text-lg border px-3 py-2 border-textFieldBorder rounded-md"
      placeholder={placeholder}
    />
  );
}
