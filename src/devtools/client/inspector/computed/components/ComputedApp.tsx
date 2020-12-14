import React, { FormEvent, useRef } from "react";
import { connect, ConnectedProps } from "react-redux";
const { debounce } = require("devtools/shared/debounce");
import { setComputedPropertySearch, setShowBrowserStyles } from "../actions";
import ComputedProperties from "./ComputedProperties";

function ComputedApp(props: PropsFromRedux) {
  const { setComputedPropertySearch, setShowBrowserStyles } = props;

  const searchFieldRef = useRef<HTMLInputElement>(null);

  const setSearch = debounce(() => {
    if (searchFieldRef.current) {
      setComputedPropertySearch(searchFieldRef.current.value);
    }
  }, 150);

  function clearSearch() {
    setComputedPropertySearch("");
    if (searchFieldRef.current) {
      searchFieldRef.current.value = "";
    }
  }

  function setShowAll(event: FormEvent<HTMLInputElement>) {
    setShowBrowserStyles(event.currentTarget.checked);
  }

  return (
    <div id="sidebar-panel-computedview" className="theme-sidebar inspector-tabpanel">
      <div id="computed-toolbar" className="devtools-toolbar devtools-input-toolbar">
        <div className="devtools-searchbox">
          <input
            id="computed-searchbox"
            className="devtools-filterinput"
            type="search"
            placeholder="Filter Styles"
            ref={searchFieldRef}
            onInput={setSearch}
          />
          <button
            id="computed-searchinput-clear"
            className="devtools-searchinput-clear"
            onClick={clearSearch}
          ></button>
        </div>
        <div className="devtools-separator"></div>
        <input
          id="browser-style-checkbox"
          type="checkbox"
          className="includebrowserstyles"
          onInput={setShowAll}
        />
        <label id="browser-style-checkbox-label" htmlFor="browser-style-checkbox">
          Browser Styles
        </label>
      </div>
      <ComputedProperties />
    </div>
  );
}

const mapDispatchToProps = {
  setComputedPropertySearch,
  setShowBrowserStyles,
};
const connector = connect(undefined, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(ComputedApp);
