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

import Outline from "../Outline/Outline";
import SourcesTree from "./SourcesTree";
import { connect, ConnectedProps } from "react-redux";
import { UIState } from "ui/state";
import { prefs } from "devtools/client/debugger/src/utils/prefs";
import Accordion from "ui/components/Accordion";
import QuickOpenButton from "./QuickOpenButton";

class PrimaryPanes extends Component<PropsFromRedux> {
  renderOutline() {
    return {
      className: "outlines-pane border-t",
      component: <Outline />,
      header: "Outline",
      onToggle: (opened: boolean) => {
        prefs.outlineExpanded = opened;
      },
      collapsed: !prefs.outlineExpanded,
    };
  }

  renderSources() {
    return {
      className: "sources-pane",
      component: <SourcesTree />,
      header: "Sources",
      onToggle: () => {
        this.props.toggleSourcesCollapse();
      },
      collapsed: !!prefs.sourcesCollapsed,
      button: <QuickOpenButton />,
    };
  }

  getItems() {
    return [this.renderSources(), this.renderOutline()];
  }
  render() {
    return <Accordion items={this.getItems()} />;
  }
}

const mapStateToProps = (state: UIState) => {
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

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(PrimaryPanes);
