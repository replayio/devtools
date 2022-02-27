/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import React, { PureComponent } from "react";
import ReactDOM from "react-dom";
import { connect } from "../../utils/connect";

import Tab from "./Tab";

import { getSelectedSource, getSourcesForTabs, getIsPaused, getContext } from "../../selectors";
import { isPretty } from "../../utils/source";
import actions from "../../actions";
import { trackEvent } from "ui/utils/telemetry";
import CommandPaletteButton from "./CommandPaletteButton";

class Tabs extends PureComponent {
  _draggedSource;
  _draggedSourceIndex;

  constructor(props) {
    super(props);
  }

  componentDidUpdate(prevProps) {
    const { selectedSource } = this.props;

    if (selectedSource && selectedSource != prevProps.selectedSource) {
      const sourceNodes = [...this.refs.sourceTabs.children];
      const selectedSourceNode = sourceNodes.find(node => node.classList.contains("active"));

      const isSelectedSourceNodeVisible = this.getIsSelectedSourceNodeVisible();

      if (selectedSourceNode && !isSelectedSourceNodeVisible) {
        selectedSourceNode.scrollIntoView({ block: "center" });
      }
    }
  }

  getIsSelectedSourceNodeVisible() {
    const containerNode = this.refs.sourceTabs.parentElement;
    const sourceNodes = [...this.refs.sourceTabs.children];
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

  set draggedSource(source) {
    this._draggedSource = source;
  }

  get draggedSourceIndex() {
    return this._draggedSourceIndex == null ? -1 : this._draggedSourceIndex;
  }

  set draggedSourceIndex(index) {
    this._draggedSourceIndex = index;
  }

  getIconClass(source) {
    if (isPretty(source)) {
      return "prettyPrint";
    }
    if (source.isBlackBoxed) {
      return "blackBox";
    }
    return "file";
  }

  onTabDragStart = (source, index) => {
    trackEvent("tabs.drag_start");
    this.draggedSource = source;
    this.draggedSourceIndex = index;
  };

  onTabDragEnd = () => {
    trackEvent("tabs.drag_stop");
    this.draggedSource = null;
    this.draggedSourceIndex = null;
  };

  onTabDragOver = (e, source, hoveredTabIndex) => {
    const { moveTabBySourceId } = this.props;
    if (hoveredTabIndex === this.draggedSourceIndex) {
      return;
    }

    const tabDOM = ReactDOM.findDOMNode(this.refs[`tab_${source.id}`].getWrappedInstance());

    /* $FlowIgnore: tabDOM.nodeType will always be of Node.ELEMENT_NODE since it comes from a ref;
      however; the return type of findDOMNode is null | Element | Text */
    const tabDOMRect = tabDOM.getBoundingClientRect();
    const { pageX: mouseCursorX } = e;
    if (
      /* Case: the mouse cursor moves into the left half of any target tab */
      mouseCursorX - tabDOMRect.left <
      tabDOMRect.width / 2
    ) {
      // The current tab goes to the left of the target tab
      const targetTab =
        hoveredTabIndex > this.draggedSourceIndex ? hoveredTabIndex - 1 : hoveredTabIndex;
      moveTabBySourceId(this.draggedSource.id, targetTab);
      this.draggedSourceIndex = targetTab;
    } else if (
      /* Case: the mouse cursor moves into the right half of any target tab */
      mouseCursorX - tabDOMRect.left >=
      tabDOMRect.width / 2
    ) {
      // The current tab goes to the right of the target tab
      const targetTab =
        hoveredTabIndex < this.draggedSourceIndex ? hoveredTabIndex + 1 : hoveredTabIndex;
      moveTabBySourceId(this.draggedSource.id, targetTab);
      this.draggedSourceIndex = targetTab;
    }
  };

  renderTabs() {
    const { tabSources } = this.props;

    return (
      <div className="source-tabs tab" ref="sourceTabs">
        <CommandPaletteButton />
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
              ref={`tab_${source.id}`}
            />
          );
        })}
      </div>
    );
  }

  render() {
    return <div className="source-header">{this.renderTabs()}</div>;
  }
}

const mapStateToProps = state => ({
  selectedSource: getSelectedSource(state),
  tabSources: getSourcesForTabs(state),
  isPaused: getIsPaused(state),
});

export default connect(mapStateToProps, {
  moveTabBySourceId: actions.moveTabBySourceId,
})(Tabs);
