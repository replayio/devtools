/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { Accordion, AccordionPane } from "@recordreplay/accordion";
import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { UIState } from "ui/state";

import actions from "../../actions";
import {
  getActiveSearch,
  getSelectedPrimaryPaneTab,
  getContext,
  getSourcesCollapsed,
} from "../../selectors";
import { useDebuggerPrefs } from "../../utils/prefs";
import Outline from "../SourceOutline/SourceOutline";

import QuickOpenButton from "./QuickOpenButton";
import SourcesTree from "./SourcesTree";

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
  closeActiveSearch: actions.closeActiveSearch,
  setActiveSearch: actions.setActiveSearch,
  setPrimaryPaneTab: actions.setPrimaryPaneTab,
  toggleSourcesCollapse: actions.toggleSourcesCollapse,
});

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(PrimaryPanes);
