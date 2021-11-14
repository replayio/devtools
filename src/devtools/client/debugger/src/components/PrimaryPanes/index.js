/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import React, { Component } from "react";

import actions from "../../actions";
import {
  getActiveSearch,
  getSelectedPrimaryPaneTab,
  getContext,
  getSourcesCollapsed,
} from "../../selectors";
import { connect } from "../../utils/connect";
import { prefs } from "../../utils/prefs";

import Outline from "./NewOutline";
import SourcesTree from "./SourcesTree";
import Accordion from "../shared/Accordion";

class PrimaryPanes extends Component {
  renderOutline() {
    return {
      header: "Outline",
      className: "outlines-pane border-t",
      component: <Outline />,
      opened: prefs.outlineExpanded,
      onToggle: opened => {
        prefs.outlineExpanded = opened;
      },
    };
  }

  renderSources() {
    return {
      header: "Sources",
      className: "sources-pane",
      component: <SourcesTree />,
      opened: !prefs.sourcesCollapsed,
      onToggle: opened => {
        this.props.toggleSourcesCollapse();
      },
    };
  }

  getItems() {
    return [this.renderSources(), this.renderOutline()];
  }
  render() {
    const { selectedTab } = this.props;
    const activeIndex = selectedTab === "sources" ? 0 : 1;

    return <Accordion items={this.getItems()} />;
  }
}

const mapStateToProps = state => {
  return {
    cx: getContext(state),
    selectedTab: getSelectedPrimaryPaneTab(state),
    sourceSearchOn: getActiveSearch(state) === "source",
    sourcesCollapsed: getSourcesCollapsed(state),
  };
};

const connector = connect(mapStateToProps, {
  setPrimaryPaneTab: actions.setPrimaryPaneTab,
  setActiveSearch: actions.setActiveSearch,
  closeActiveSearch: actions.closeActiveSearch,
  toggleSourcesCollapse: actions.toggleSourcesCollapse,
});

export default connector(PrimaryPanes);
