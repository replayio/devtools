import React, { ChangeEvent, KeyboardEvent, useState } from "react";
import { connect } from "react-redux";
import MaterialIcon from "ui/components/shared/MaterialIcon";
const actions = require("devtools/client/webconsole/actions/index");

function TextInput(props: React.HTMLProps<HTMLInputElement>) {
  return (
    <input
      {...props}
      type="text"
      className="flex-grow text-xs focus:ring-transparent p-0 border-0 bg-gray-100"
      spellCheck={false}
    />
  );
}

export function FilterSearchBox({ filterTextSet }: { filterTextSet: any }) {
  const [searchString, _setSearchString] = useState("");
  const setSearchString = (value: string) => {
    _setSearchString(value);
    filterTextSet(value);
  };
  const onChange = (e: ChangeEvent<HTMLInputElement>) => setSearchString(e.target.value);
  const clearInput = () => setSearchString("");
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      clearInput();
    }
  };

  return (
    <div className="devtools-searchbox flex items-center flex-grow relative">
      <div className="flex flex-row focus:ring-primaryAccent w-full px-2 py-1 rounded-md bg-gray-100 text-gray-500">
        <TextInput
          value={searchString}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder="Filter Output"
        />
        {searchString ? (
          <button className="flex" onClick={clearInput}>
            <MaterialIcon>close</MaterialIcon>
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default connect(state => ({}), {
  filterTextSet: actions.filterTextSet,
})(FilterSearchBox);
