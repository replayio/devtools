import React, { ChangeEvent, Dispatch, SetStateAction } from "react";
import { TextInput } from "ui/components/shared/Forms";

export default function ReplayTitle({
  inputValue,
  setInputValue,
}: {
  inputValue: string;
  setInputValue: Dispatch<SetStateAction<string>>;
}) {
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <div>
      <label htmlFor="replay-title" className="block text-2xl font-medium text-gray-700">
        Title
      </label>
      <div className="mt-1">
        <TextInput
          placeholder="Your replay's title"
          value={inputValue}
          onChange={onChange}
          id="replay-title"
        />
      </div>
    </div>
  );
}
