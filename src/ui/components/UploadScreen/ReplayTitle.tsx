import React, { ChangeEvent, Dispatch, SetStateAction } from "react";

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
    <div className="flex flex-col space-y-3">
      <input
        type="textbox"
        className="rounded-lg bg-jellyfishBgcolor px-6 py-3.5 font-medium shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
        onChange={onChange}
        value={inputValue}
      />
    </div>
  );
}
