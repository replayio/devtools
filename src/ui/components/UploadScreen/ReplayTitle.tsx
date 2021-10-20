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
      <div>Replay Title</div>
      <input
        type="textbox"
        className="bg-white rounded-lg shadow-xl py-3.5 px-6 font-medium focus:outline-none focus:ring-2 focus:ring-primaryAccent"
        onChange={onChange}
        value={inputValue}
      />
    </div>
  );
}
