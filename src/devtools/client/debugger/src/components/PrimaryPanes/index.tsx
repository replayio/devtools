/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import React from "react";

import actions from "../../actions";
import {
  getActiveSearch,
  getSelectedPrimaryPaneTab,
  getContext,
  getSourcesCollapsed,
} from "../../selectors";

import Outline from "../SourceOutline/SourceOutline";
import SourcesTree from "./SourcesTree";
import { connect, ConnectedProps } from "react-redux";
import { UIState } from "ui/state";
import QuickOpenButton from "./QuickOpenButton";
import { Accordion, AccordionPane } from "@recordreplay/accordion";
import { useDebuggerPrefs } from "../../utils/prefs";

function PrimaryPanes(props: PropsFromRedux) {
  const { value: outlineExpanded, update: updateOutlineExpanded } =
    useDebuggerPrefs("outline-expanded");
  const { value: sourcesCollapsed } = useDebuggerPrefs("sources-collapsed");

  return (
    <Accordion>
      <AccordionPane
        header="Sources"
        className="sources-pane"
        expanded={!sourcesCollapsed}
        onToggle={() => props.toggleSourcesCollapse()}
        initialHeight={400}
        button={<QuickOpenButton />}
      >
        <SourcesTree />
      </AccordionPane>
      <AccordionPane
        header="Outline"
        className="outlines-pane"
        expanded={!!outlineExpanded}
        onToggle={() => updateOutlineExpanded(!outlineExpanded)}
      >
        <Outline />
      </AccordionPane>
    </Accordion>
  );
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
