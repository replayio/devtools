import React, { FormEvent, useRef } from "react";
import { connect, ConnectedProps } from "react-redux";
const { debounce } = require("devtools/shared/debounce");
import { UIState } from "ui/state";
import {
  setComputedPropertySearch,
  setShowBrowserStyles,
  setComputedPropertyExpanded,
} from "../actions";
import { ComputedPropertyState } from "../state";
import ComputedProperty from "./ComputedProperty";

function isHidden(property: ComputedPropertyState, search: string, showBrowserStyles: boolean) {
  if (property.selectors.length === 0 && !showBrowserStyles) {
    return true;
  }

  const isValidSearchTerm = search.trim().length > 0;
  if (
    isValidSearchTerm &&
    !property.name.toLowerCase().includes(search) &&
    !property.value.toLowerCase().includes(search)
  ) {
    return true;
  }

  return false;
}

function ComputedApp(props: PropsFromRedux) {
  const {
    properties,
    expandedProperties,
    search,
    setComputedPropertySearch,
    showBrowserStyles,
    setShowBrowserStyles,
    setComputedPropertyExpanded,
  } = props;

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

  let dark = false;
  let allPropertiesHidden = true;
  const renderedProperties = properties.map((property, index) => {
    const hidden = isHidden(property, search, showBrowserStyles);
    if (!hidden) {
      dark = !dark;
      allPropertiesHidden = false;
    }
    const isExpanded = expandedProperties.indexOf(property.name) >= 0;
    const toggleExpanded = () => setComputedPropertyExpanded(property.name, !isExpanded);

    return (
      <ComputedProperty
        key={index}
        property={property}
        hidden={hidden}
        dark={dark}
        isExpanded={isExpanded}
        toggleExpanded={toggleExpanded}
      />
    );
  });

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

      <div id="computed-container">
        <div id="computed-container-focusable" tabIndex={-1}>
          <div
            id="computed-property-container"
            className="devtools-monospace"
            tabIndex={0}
            dir="ltr"
          >
            {renderedProperties}
          </div>
          <div
            id="computed-no-results"
            className="devtools-sidepanel-no-result"
            hidden={!allPropertiesHidden}
            data-localization="content=inspector.noProperties"
          >
            No CSS properties found.
          </div>
        </div>
      </div>
    </div>
  );
}

const mapStateToProps = (state: UIState) => ({
  properties: state.computed.properties,
  expandedProperties: state.computed.expandedProperties,
  search: state.computed.search,
  showBrowserStyles: state.computed.showBrowserStyles,
});
const mapDispatchToProps = {
  setComputedPropertySearch,
  setShowBrowserStyles,
  setComputedPropertyExpanded,
};
const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(ComputedApp);
