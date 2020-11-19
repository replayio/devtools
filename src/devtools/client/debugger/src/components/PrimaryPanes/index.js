/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import React, { Component } from "react";
import classnames from "classnames";
import { Tab, Tabs, TabList, TabPanels } from "react-aria-components/src/tabs";

import actions from "../../actions";
import {
  getActiveSearch,
  getSelectedPrimaryPaneTab,
  getContext,
  getExtensionNameBySourceUrl,
} from "../../selectors";
import { isExtensionDirectoryPath } from "../../utils/source";
import { features, prefs } from "../../utils/prefs";
import { connect } from "../../utils/connect";
import { formatKeyShortcut } from "../../utils/text";

import Outline from "./Outline";
import SourcesTree from "./SourcesTree";
import AccessibleImage from "../shared/AccessibleImage";

import "./Sources.css";

class PrimaryPanes extends Component {
  state = {
    alphabetizeOutline: prefs.alphabetizeOutline,
  };

  showPane = selectedPane => {
    this.props.setPrimaryPaneTab(selectedPane);
  };

  onAlphabetizeClick = () => {
    const alphabetizeOutline = !prefs.alphabetizeOutline;
    prefs.alphabetizeOutline = alphabetizeOutline;
    this.setState({ alphabetizeOutline });
  };

  onActivateTab = index => {
    if (index === 0) {
      this.showPane("sources");
    } else {
      this.showPane("outline");
    }
  };

  renderOutlineTabs() {
    if (!features.outline) {
      return;
    }

    const sources = formatKeyShortcut("Sources");
    const outline = formatKeyShortcut("Outline");
    const isSources = this.props.selectedTab === "sources";
    const isOutline = this.props.selectedTab === "outline";

    return [
      <Tab className={classnames("tab sources-tab", { active: isSources })} key="sources-tab">
        {sources}
      </Tab>,
      <Tab className={classnames("tab outline-tab", { active: isOutline })} key="outline-tab">
        {outline}
      </Tab>,
    ];
  }

  renderSources() {
    return <SourcesTree />;
  }

  render() {
    const { selectedTab } = this.props;
    const activeIndex = selectedTab === "sources" ? 0 : 1;

    return (
      <Tabs activeIndex={activeIndex} className="sources-panel" onActivateTab={this.onActivateTab}>
        <TabList className="source-outline-tabs">{this.renderOutlineTabs()}</TabList>
        <TabPanels className={"source-outline-panel"} hasFocusableContent>
          <div className="threads-list">{this.renderSources()}</div>
          <Outline
            alphabetizeOutline={this.state.alphabetizeOutline}
            onAlphabetizeClick={this.onAlphabetizeClick}
          />
        </TabPanels>
      </Tabs>
    );
  }
}

const mapStateToProps = state => {
  return {
    cx: getContext(state),
    selectedTab: getSelectedPrimaryPaneTab(state),
    sourceSearchOn: getActiveSearch(state) === "source",
  };
};

const connector = connect(mapStateToProps, {
  setPrimaryPaneTab: actions.setPrimaryPaneTab,
  setActiveSearch: actions.setActiveSearch,
  closeActiveSearch: actions.closeActiveSearch,
});

export default connector(PrimaryPanes);
