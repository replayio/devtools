import React, { ChangeEvent, KeyboardEvent, useContext } from "react";

import { TextInput } from "../shared/Forms";

import { FilterDropdown } from "./FilterDropdown";

export function FilterBar({
  displayedString,
  setDisplayedText,
  setAppliedText,
}: {
  displayedString: string;
  setDisplayedText: (str: string) => void;
  setAppliedText: (str: string) => void;
}) {
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDisplayedText(e.target.value);
  };
  const onKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setAppliedText(e.currentTarget.value);
    }
  };

  return (
    <div className="flex flex-grow relative items-center space-x-3">
      <FilterDropdown setAppliedText={setAppliedText} />
      <div className="flex flex-grow">
        <TextInput
          value={displayedString}
          onChange={onChange}
          placeholder="Search"
          onKeyDown={onKeyPress}
        />
      </div>
    </div>
  );
}
