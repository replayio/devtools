import classnames from "classnames";
import React, { useContext, useEffect, useRef } from "react";
import { shallowEqual } from "react-redux";
import { useImperativeCacheValue } from "suspense";

import { getPauseId } from "devtools/client/debugger/src/selectors";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { processedNodeDataCache } from "ui/suspense/nodeCaches";

import { highlightNode, selectNode, unhighlightNode } from "../actions/markup";
import { NodeInfo } from "../reducers/markup";
import { getMarkupNodes, getRootNodeId, getSelectedNodeId } from "../selectors/markup";

export function HTMLBreadcrumbs() {
  const dispatch = useAppDispatch();
  const replayClient = useContext(ReplayClientContext);
  const { pauseId, rootNodeId, selectedNodeId } = useAppSelector(
    state => ({
      pauseId: getPauseId(state),
      rootNodeId: getRootNodeId(state),
      selectedNodeId: getSelectedNodeId(state),
    }),
    shallowEqual
  );

  const containerRef = useRef<HTMLDivElement>(null);

  // By default, the breadcrumbs list is empty
  let breadcrumbsContent: React.ReactNode[] = [];

  if (rootNodeId && selectedNodeId) {
    let currentNodeId: string | undefined = selectedNodeId;
    let nodeHierarchy: NodeInfo[] = [];

    // Assuming we have markup node data and a valid selected node, traverse up
    // the node tree to find all ancestors (minus the `<document>`)
    while (currentNodeId && currentNodeId !== rootNodeId) {
      const node = processedNodeDataCache.getValueIfCached(replayClient, pauseId!, currentNodeId!);
      if (!node) {
        breadcrumbsContent = ["Loading..."];
        break;
      }
      nodeHierarchy.push(node);
      currentNodeId = node.parentNodeId;
    }

    // Reverse this so the `<html>` node is first, and selected is last
    nodeHierarchy.reverse();

    breadcrumbsContent = nodeHierarchy.map(node => {
      const buttonClassnames = classnames("breadcrumbs-widget-item", "flex", {
        selectedBreadcrumb: node.id === selectedNodeId,
      });

      // Extract `id` and `class` attribute data
      const nodeIdAttribute = node.attributes.find(attr => attr.name === "id");
      const nodeClassAttribute = node.attributes.find(attr => attr.name === "class");
      const nodeClassNames = nodeClassAttribute?.value.split(" ") ?? [];

      // Construct textual tag/id/class values for display
      const nodeTagLabel = `${node.pseudoType ? "::" : ""}${node.displayName}`;
      const nodeIdLabel = nodeIdAttribute ? `#${nodeIdAttribute.value}` : "";
      const nodeClassLabel = [""].concat(nodeClassNames).join(".");

      // The `title` attribute will be a plain concatenated string form
      const titleText = `${nodeTagLabel}${nodeIdLabel}${nodeClassLabel}`;

      const handleButtonClick = () => {
        dispatch(selectNode(node.id));
      };

      const handleMouseOver = () => {
        dispatch(highlightNode(node.id));
      };

      const handleMouseLeave = () => {
        dispatch(unhighlightNode());
      };

      return (
        <button
          key={node.id}
          className={buttonClassnames}
          onClick={handleButtonClick}
          onMouseOver={handleMouseOver}
          onMouseLeave={handleMouseLeave}
          id={`breadcrumbs-widget-item-${node.id}`}
          tabIndex={-1}
          title={titleText}
        >
          <span className="breadcrumbs-widget-item-tag plain">{nodeTagLabel}</span>
          <span className="breadcrumbs-widget-item-id plain">{nodeIdLabel}</span>
          <span className="breadcrumbs-widget-item-classes plain">{nodeClassLabel}</span>
        </button>
      );
    });
  }
  useEffect(() => {
    if (!selectedNodeId) {
      return;
    }

    // Find the last button DOM node
    const buttons = [...(containerRef.current?.querySelectorAll(".breadcrumbs-widget-item") || [])];
    const [lastButton] = buttons.slice(-1);

    if (lastButton) {
      // Scroll sideways so the entire last button is in view
      const rect = lastButton.getBoundingClientRect();
      containerRef.current!.scroll({ left: rect.right, behavior: "smooth" });
    }
  }, [selectedNodeId]);

  // Carry over some ARIA attributes from the old impl, because why not
  let activeDescendant = selectedNodeId ? `breadcrumbs-widget-item-${selectedNodeId}` : undefined;

  return (
    <div className="inspector-breadcrumbs-toolbar devtools-toolbar">
      <div
        className="breadcrumbs-widget-container overflow-y-none flex max-h-8 overflow-x-auto"
        role="toolbar"
        aria-label="Breadcrumbs"
        tabIndex={0}
        ref={containerRef}
        aria-activedescendant={activeDescendant}
      >
        {breadcrumbsContent}
      </div>
    </div>
  );
}
