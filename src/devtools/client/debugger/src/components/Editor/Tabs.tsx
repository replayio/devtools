/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { SourceId } from "@replayio/protocol";
import React, { PureComponent } from "react";
import ReactDOM from "react-dom";
import { ConnectedProps, connect } from "react-redux";

import { getToolboxLayout } from "ui/reducers/layout";
import { SourceDetails, getSelectedSource } from "ui/reducers/sources";
import type { UIState } from "ui/state";

import actions from "../../actions";
import { openQuickOpen as openQuickOpenAction } from "../../actions/quick-open";
import { getSourcesForTabs } from "../../selectors";
import { isPretty } from "../../utils/source";
import CommandPaletteButton from "./CommandPaletteButton";
import Tab from "./Tab";

const mapStateToProps = (state: UIState) => ({
  selectedSource: getSelectedSource(state),
  tabSources: getSourcesForTabs(state),
  toolboxLayout: getToolboxLayout(state),
});

const connector = connect(mapStateToProps, {
  moveTabBySourceId: actions.moveTabBySourceId,
  openQuickOpen: openQuickOpenAction,
});

type PropsFromRedux = ConnectedProps<typeof connector>;

class Tabs extends PureComponent<PropsFromRedux> {
  _draggedSource: SourceDetails | { url: null; id: null } | null = null;
  _draggedSourceIndex: number | null = null;

  sourceTabsRef = React.createRef<HTMLDivElement>();

  componentDidUpdate(prevProps: PropsFromRedux) {
    const { selectedSource } = this.props;

    if (selectedSource && selectedSource != prevProps.selectedSource) {
      const sourceNodes = [...this.sourceTabsRef.current!.children];
      const selectedSourceNode = sourceNodes.find(node => node.classList.contains("active"));

      const isSelectedSourceNodeVisible = this.getIsSelectedSourceNodeVisible();

      if (selectedSourceNode && !isSelectedSourceNodeVisible) {
        selectedSourceNode.scrollIntoView({ block: "center" });
      }
    }
  }

  getIsSelectedSourceNodeVisible() {
    const containerNode = this.sourceTabsRef.current!.parentElement!;
    const sourceNodes = [...this.sourceTabsRef.current!.children];

    const selectedSourceNode = sourceNodes.find(node => node.classList.contains("active"));

    if (!selectedSourceNode) {
      return false;
    }

    const { x: containerX, width: containerWidth } = containerNode.getBoundingClientRect();
    const { x: childX, width: childWidth } = selectedSourceNode.getBoundingClientRect();

    const visibleLeft = containerX;
    const visibleRight = containerX + containerWidth;
    const selectedSourceNodeLeft = childX;
    const selectedSourceNodeRight = childX + childWidth;

    const leftIsVisible = visibleLeft < selectedSourceNodeLeft;
    const rightIsVisible = visibleRight > selectedSourceNodeRight;

    return leftIsVisible && rightIsVisible;
  }

  get draggedSource() {
    return this._draggedSource == null ? { url: null, id: null } : this._draggedSource;
  }

  set draggedSource(source: SourceDetails | { url: null; id: null } | null) {
    this._draggedSource = source;
  }

  get draggedSourceIndex() {
    return this._draggedSourceIndex == null ? -1 : this._draggedSourceIndex;
  }

  set draggedSourceIndex(index: number | null) {
    this._draggedSourceIndex = index;
  }

  _tabRefs: { [key: SourceId]: HTMLElement } = {};
  _setTabRef = (sourceId: SourceId, elementRef: HTMLDivElement | null) => {
    if (elementRef !== null) {
      this._tabRefs[sourceId] = elementRef;
    } else {
      delete this._tabRefs[sourceId];
    }
  };

  getIconClass(source: SourceDetails) {
    if (isPretty(source)) {
      return "prettyPrint";
    }

    return "file";
  }

  onTabDragStart = (source: SourceDetails, index: number) => {
    this.draggedSource = source;
    this.draggedSourceIndex = index;
  };

  onTabDragEnd = () => {
    this.draggedSource = null;
    this.draggedSourceIndex = null;
  };

  onTabDragOver = (e: React.MouseEvent, source: SourceDetails, hoveredTabIndex: number) => {
    const { moveTabBySourceId } = this.props;
    if (hoveredTabIndex === this.draggedSourceIndex) {
      return;
    }

    const tabDOM = this._tabRefs[source.id];
    if (tabDOM == null) {
      return;
    }

    /* $FlowIgnore: tabDOM.nodeType will always be of Node.ELEMENT_NODE since it comes from a ref;
      however; the return type of findDOMNode is null | Element | Text */
    const tabDOMRect = tabDOM!.getBoundingClientRect()!;
    const { pageX: mouseCursorX } = e;
    if (
      /* Case: the mouse cursor moves into the left half of any target tab */
      mouseCursorX - tabDOMRect.left <
      tabDOMRect.width / 2
    ) {
      // The current tab goes to the left of the target tab
      const targetTab =
        hoveredTabIndex > this.draggedSourceIndex! ? hoveredTabIndex - 1 : hoveredTabIndex;
      moveTabBySourceId(this.draggedSource!.id!, targetTab);
      this.draggedSourceIndex = targetTab;
    } else if (
      /* Case: the mouse cursor moves into the right half of any target tab */
      mouseCursorX - tabDOMRect.left >=
      tabDOMRect.width / 2
    ) {
      // The current tab goes to the right of the target tab
      const targetTab =
        hoveredTabIndex < this.draggedSourceIndex! ? hoveredTabIndex + 1 : hoveredTabIndex;
      moveTabBySourceId(this.draggedSource!.id!, targetTab);
      this.draggedSourceIndex = targetTab;
    }
  };

  renderTabs() {
    const { openQuickOpen, tabSources, toolboxLayout } = this.props;

    return (
      <>
        <div className="source-tabs tab" ref={this.sourceTabsRef}>
          {toolboxLayout == "ide" && <CommandPaletteButton />}
          {tabSources.map((source, index) => {
            return (
              <Tab
                onDragStart={_ => this.onTabDragStart(source, index)}
                onDragOver={e => {
                  this.onTabDragOver(e, source, index);
                  e.preventDefault();
                }}
                onDragEnd={this.onTabDragEnd}
                key={index}
                source={source}
                setTabRef={this._setTabRef}
              />
            );
          })}
        </div>
        {tabSources.length > 1 && (
          <button
            className="source-drop-down-button"
            onClick={() => openQuickOpen("", false, true)}
            title="Show opened files"
          >
            ⋯
          </button>
        )}
      </>
    );
  }

  render() {
    const { toolboxLayout, tabSources } = this.props;
    const isSingleColumnLayout = ["left", "bottom"].includes(toolboxLayout);

    if (isSingleColumnLayout && !tabSources.length) {
      return null;
    }

    return <div className="source-header">{this.renderTabs()}</div>;
  }
}
export default connector(Tabs);
