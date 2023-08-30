import debounce from "lodash/debounce";
import React, { FormEvent, useRef } from "react";
import { ConnectedProps, connect } from "react-redux";

import Checkbox from "ui/components/shared/Forms/Checkbox";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import { setComputedPropertySearch, setShowBrowserStyles } from "../actions";

function ComputedToolbar() {
  const dispatch = useAppDispatch();
  const showBrowserStyles = useAppSelector(state => state.computed.showBrowserStyles);

  const searchFieldRef = useRef<HTMLInputElement>(null);

  const setSearch = debounce(() => {
    if (searchFieldRef.current) {
      dispatch(setComputedPropertySearch(searchFieldRef.current.value));
    }
  }, 150);

  function setShowAll(event: FormEvent<HTMLInputElement>) {
    dispatch(setShowBrowserStyles(event.currentTarget.checked));
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
      <Checkbox id="browser-style-checkbox" onChange={setShowAll} checked={showBrowserStyles} />
      <label id="browser-style-checkbox-label" htmlFor="browser-style-checkbox">
        Browser Styles
      </label>
    </div>
  );
}

export default React.memo(ComputedToolbar);
