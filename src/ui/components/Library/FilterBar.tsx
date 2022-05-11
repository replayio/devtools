import React, { ChangeEvent, KeyboardEvent } from "react";

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
    <>
      <FilterDropdown setAppliedText={setAppliedText} />
      <TextInput
        value={displayedString}
        onChange={onChange}
        placeholder="Search"
        onKeyDown={onKeyPress}
      />
    </>
  );
}
