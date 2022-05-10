import React, { ChangeEvent, KeyboardEvent } from "react";

import { TextInput } from "../shared/Forms";

import { FilterDropdown } from "./FilterDropdown";

export function FilterBar({
  displayedString,
  setAppliedString,
  setDisplayedString,
  applyDisplayedString,
}: {
  displayedString: string;
  setAppliedString: (str: string) => void;
  setDisplayedString: (str: string) => void;
  applyDisplayedString: () => void;
}) {
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDisplayedString(e.target.value);
  };
  const onKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      applyDisplayedString();
    }
  };

  return (
    <>
      <FilterDropdown setSearchString={setAppliedString} />
      <TextInput
        value={displayedString}
        onChange={onChange}
        placeholder="Search"
        onKeyDown={onKeyPress}
      />
    </>
  );
}
