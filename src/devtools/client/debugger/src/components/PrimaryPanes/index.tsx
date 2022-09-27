/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import classnames from "classnames";
import React from "react";
import { useFeature } from "ui/hooks/settings";
import { UIState } from "ui/state";

import actions from "../../actions";
import { getSelectedPrimaryPaneTab, getContext, getSourcesCollapsed } from "../../selectors";

import Outline from "../SourceOutline/SourceOutline";
import SourcesTree from "./SourcesTree";
import { connect, ConnectedProps } from "react-redux";

import QuickOpenButton from "./QuickOpenButton";
import { Accordion, AccordionPane } from "@recordreplay/accordion";
import { useDebuggerPrefs } from "../../utils/prefs";

function PrimaryPanes(props: PropsFromRedux) {
  const { value: outlineExpanded, update: updateOutlineExpanded } =
    useDebuggerPrefs("outline-expanded");
  const { value: sourcesCollapsed } = useDebuggerPrefs("sources-collapsed");
  const { value: enableLargeText } = useFeature("enableLargeText");

  return (
    <Accordion>
      <AccordionPane
        header="Sources"
        // ExperimentFeature: LargeText Logic
        className={classnames("sources-pane", enableLargeText ? "text-base" : "text-xs")}
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
