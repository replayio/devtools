import React, { FormEvent, useRef } from "react";
import { connect, ConnectedProps } from "react-redux";
import Checkbox from "ui/components/shared/Forms/Checkbox";
const { debounce } = require("devtools/shared/debounce");
import { setComputedPropertySearch, setShowBrowserStyles } from "../actions";

function ComputedToolbar(props: PropsFromRedux) {
  const { setComputedPropertySearch, setShowBrowserStyles } = props;

  const searchFieldRef = useRef<HTMLInputElement>(null);

  const setSearch = debounce(() => {
    if (searchFieldRef.current) {
      setComputedPropertySearch(searchFieldRef.current.value);
    }
  }, 150);

  function setShowAll(event: FormEvent<HTMLInputElement>) {
    setShowBrowserStyles(event.currentTarget.checked);
  }

  return (
    <div id="computed-toolbar" className="devtools-toolbar devtools-input-toolbar">
      <div id="computed-search" className="devtools-searchbox text-themeTextFieldColor">
        <input
          id="computed-searchbox"
          className="devtools-filterinput"
          type="input"
          autoComplete="off"
          placeholder="Filter Styles"
          ref={searchFieldRef}
          onInput={setSearch}
        />
      </div>
      <div className="devtools-separator"></div>
      <Checkbox id="browser-style-checkbox" onChange={setShowAll} />
      <label id="browser-style-checkbox-label" htmlFor="browser-style-checkbox">
        Browser Styles
      </label>
    </div>
  );
}

const mapDispatchToProps = {
  setComputedPropertySearch,
  setShowBrowserStyles,
};
const connector = connect(undefined, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(ComputedToolbar);
