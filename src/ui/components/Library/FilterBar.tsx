import React, { ChangeEvent, KeyboardEvent, useContext } from "react";

import { TextInput } from "../shared/Forms";

import { FilterDropdown } from "./FilterDropdown";
import { View } from "./useFilters";

export function FilterBar({
  displayedString,
  setDisplayedText,
  setAppliedText,
  setView,
  view,
}: {
  displayedString: string;
  setDisplayedText: (str: string) => void;
  setAppliedText: (str: string) => void;
  setView: (view: View) => void;
  view: View;
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
    <div className="relative flex flex-grow items-center space-x-3">
      <FilterDropdown setAppliedText={setAppliedText} setView={setView} view={view} />
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
