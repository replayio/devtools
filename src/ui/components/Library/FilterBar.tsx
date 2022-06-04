import React, { ChangeEvent, KeyboardEvent, useContext } from "react";

import { TextInput } from "../shared/Forms";

import { FilterDropdown } from "./FilterDropdown";
import { View } from "./useFilters";

export function FilterBar({
  displayedString,
  setDisplayedText,
  setAppliedText,
  setView,
}: {
  displayedString: string;
  setDisplayedText: (str: string) => void;
  setAppliedText: (str: string) => void;
  setView: (view: View) => void;
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
      <FilterDropdown setAppliedText={setAppliedText} setView={setView} />
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
