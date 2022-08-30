import React, { useEffect } from "react";

import { useAppSelector } from "ui/setup/hooks";
import { UIState } from "ui/state";
import { getNodeInfo, getMarkupNodes, getSelectedNodeId } from "../selectors/markup";

export function HTMLBreadcrumbs() {
  const markupNodes = useAppSelector(getMarkupNodes);
  const selectedNodeId = useAppSelector(getSelectedNodeId);

  return (
    <div className="inspector-breadcrumbs-toolbar devtools-toolbar">
      <div
        id="inspector-breadcrumbs"
        className="breadcrumbs-widget-container"
        role="toolbar"
        aria-label="Breadcrumbs"
        tabIndex={0}
      >
        New HTML Breadcrumbs Here
      </div>
    </div>
  );
}
