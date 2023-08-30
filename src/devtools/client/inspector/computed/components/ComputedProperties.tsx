import React, { useContext } from "react";
import { shallowEqual } from "react-redux";
import { useImperativeCacheValue } from "suspense";

import { getPauseId } from "devtools/client/debugger/src/selectors";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { processedNodeDataCache } from "ui/suspense/nodeCaches";
import { cssRulesCache } from "ui/suspense/styleCaches";

import { getSelectedNodeId } from "../../markup/selectors/markup";
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

function ComputedProperties() {
  const dispatch = useAppDispatch();
  const { pauseId, selectedNodeId, expandedProperties, search, showBrowserStyles } = useAppSelector(
    state => ({
      pauseId: getPauseId(state),
      selectedNodeId: getSelectedNodeId(state),
      expandedProperties: state.computed.expandedProperties,
      search: state.computed.search,
      showBrowserStyles: state.computed.showBrowserStyles,
    }),
    shallowEqual
  );

  const replayClient = useContext(ReplayClientContext);

  const { value: node, status: nodeStatus } = useImperativeCacheValue(
    processedNodeDataCache,
    replayClient,
    pauseId!,
    selectedNodeId!
  );

  const canHaveRules = nodeStatus === "resolved" ? node?.isElement : false;

  const { value: cachedStyles, status } = useImperativeCacheValue(
    cssRulesCache,
    replayClient,
    canHaveRules ? pauseId : undefined,
    canHaveRules ? selectedNodeId : undefined
  );

  const properties = status === "resolved" ? cachedStyles?.computedProperties ?? [] : [];

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
    const toggleExpanded = () => dispatch(setComputedPropertyExpanded(property.name, !isExpanded));

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
        >
          {status === "pending" ? "Loading..." : "No CSS properties found"}
        </div>
      </div>
    </div>
  );
}

export default React.memo(ComputedProperties);
