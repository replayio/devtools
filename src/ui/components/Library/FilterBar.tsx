import React, { ChangeEvent, KeyboardEvent, useContext } from "react";

import { TextInput } from "../shared/Forms";

import { FilterDropdown } from "./FilterDropdown";
import { LibraryFilters, LibraryFiltersContext } from "./useFilters";

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
        <InvalidFilterWarning />
      </div>
    </div>
  );
}

function InvalidFilterWarning() {
  const filters = useContext(LibraryFiltersContext);
  const errantQualifier = Object.entries(filters.qualifiers).find(q => q[1].error);

  if (!errantQualifier) {
    return null;
  }

  return (
    <div className="bg-errorBgcolor rounded-md border border-errorColor text-errorColor p-2 text-xs absolute transform translate-y-full mt-1">
      Invalid filter string: {errantQualifier[1].error}
    </div>
  );
}
