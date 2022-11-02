import React, { ChangeEvent, KeyboardEvent, useContext } from "react";

import { TextInput } from "../../../shared/Forms";
import { FilterContext } from "./FilterContext";
import { FilterDropdown } from "./FilterDropdown";
import { ViewContext } from "./ViewContextRoot";

export function FilterBar() {
  const { displayedString, setDisplayedText, setAppliedText } = useContext(FilterContext);
  const { view } = useContext(ViewContext);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDisplayedText(e.target.value);
  };
  const onKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setAppliedText(e.currentTarget.value);
    }
  };

  const showFilterInput = ["recordings", "results"].includes(view);

  return (
    <div className="relative flex flex-grow items-center space-x-3">
      <FilterDropdown />
      {showFilterInput ? (
        <div className="flex flex-grow">
          <TextInput
            value={displayedString}
            onChange={onChange}
            placeholder="Search"
            onKeyDown={onKeyPress}
          />
        </div>
      ) : null}
    </div>
  );
}
