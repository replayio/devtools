import React, { ChangeEvent, KeyboardEvent, useContext } from "react";

import { TextInput } from "../shared/Forms";

import { FilterDropdown } from "./FilterDropdown";
import { LibraryContext, View } from "./useFilters";

export function FilterBar({
  displayedString,
  setDisplayedText,
  setView,
}: {
  displayedString: string;
  setDisplayedText: (str: string) => void;
  setView: (view: View) => void;
}) {
  const { setAppliedText } = useContext(LibraryContext);
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDisplayedText(e.target.value);
  };
  const onKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setAppliedText(e.currentTarget.value);
    }
  };

  return (
    <div className="relative flex items-center flex-grow space-x-3">
      <FilterDropdown />
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
