import { SearchBox } from "devtools/client/inspector/rules/components/SearchBox";
import React, { FC } from "react";

type ToolbarProps = {
  rulesQuery: string;
  onRulesQueryChange: (query: string) => void;
};

export const Toolbar: FC<ToolbarProps> = ({ rulesQuery, onRulesQueryChange }) => {
  return (
    <div id="ruleview-toolbar-container">
      <div id="ruleview-toolbar" className="devtools-toolbar devtools-input-toolbar">
        <SearchBox query={rulesQuery} onQueryChange={onRulesQueryChange} />
      </div>
    </div>
  );
};
