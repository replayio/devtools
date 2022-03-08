import React, { FC } from "react";

type SearchBoxProps = {
  query: string;
  onQueryChange: (query: string) => void;
};

export const SearchBox: FC<SearchBoxProps> = ({ query, onQueryChange }) => {
  return (
    <div id="ruleview-search" className="devtools-searchbox text-themeTextFieldColor">
      <input
        id="ruleview-searchbox"
        type="text"
        autoComplete="off"
        className="devtools-filterinput text-themeTextFieldColor"
        placeholder="Filter Styles"
        value={query}
        onChange={e => onQueryChange(e.target.value)}
      />
    </div>
  );
};
