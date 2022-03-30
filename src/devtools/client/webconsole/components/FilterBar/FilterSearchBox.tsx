import React, { ChangeEvent, KeyboardEvent, useState } from "react";
import { useDispatch } from "react-redux";
import MaterialIcon from "ui/components/shared/MaterialIcon";
const actions = require("devtools/client/webconsole/actions/index");

function TextInput(props: React.HTMLProps<HTMLInputElement>) {
  return (
    <input
      {...props}
      type="text"
      className="flex-grow border-0 bg-gray-100 p-0 text-xs focus:ring-transparent"
      spellCheck={false}
    />
  );
}

export function FilterSearchBox() {
  const dispatch = useDispatch();

  const [searchString, _setSearchString] = useState("");
  const setSearchString = (value: string) => {
    _setSearchString(value);
    dispatch(actions.filterTextUpdated(value));
  };
  const onChange = (e: ChangeEvent<HTMLInputElement>) => setSearchString(e.target.value);
  const clearInput = () => setSearchString("");
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      clearInput();
    }
  };

  return (
    <div className="devtools-searchbox relative flex flex-grow items-center">
      <div className="flex w-full flex-row rounded-md bg-themeTextFieldBgcolor px-2 py-1 text-themeTextFieldColor focus:ring-primaryAccent">
        <TextInput
          value={searchString}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder="Filter Output"
          style={{
            backgroundColor: "var(--bg-themeTextFieldBgcolor)",
            color: "var(--bg-themeTextFieldColor)",
          }}
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

export default FilterSearchBox;
