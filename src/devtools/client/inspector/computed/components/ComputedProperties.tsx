import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { UIState } from "ui/state";

import { setComputedPropertyExpanded } from "../actions";
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

function ComputedProperties(props: PropsFromRedux) {
  const { properties, expandedProperties, setComputedPropertyExpanded, search, showBrowserStyles } =
    props;

  let dark = false;
  let allPropertiesHidden = true;
  const renderedProperties = properties.map(property => {
    const hidden = isHidden(property, search, showBrowserStyles);
    if (hidden) {
      return null;
    }
    dark = !dark;
    allPropertiesHidden = false;
    const isExpanded = expandedProperties.has(property.name);
    const toggleExpanded = () => setComputedPropertyExpanded(property.name, !isExpanded);

    return (
      <ComputedProperty
        key={property.name}
        property={property}
        dark={dark}
        isExpanded={isExpanded}
        toggleExpanded={toggleExpanded}
      />
    );
  });

  return (
    <div id="computed-container">
      <div id="computed-container-focusable" tabIndex={-1}>
        <div id="computed-property-container" className="devtools-monospace" tabIndex={0} dir="ltr">
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
  );
}

const mapStateToProps = (state: UIState) => ({
  expandedProperties: state.computed.expandedProperties,
  properties: state.computed.properties,
  search: state.computed.search,
  showBrowserStyles: state.computed.showBrowserStyles,
});
const mapDispatchToProps = {
  setComputedPropertyExpanded,
};
const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(ComputedProperties);
