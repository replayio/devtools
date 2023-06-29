import classnames from "classnames";
import { useEffect } from "react";
import { ConnectedProps, connect } from "react-redux";

// Add the necessary imports for nag functionality
import { useNag } from "replay-next/src/hooks/useNag";
import { Nag } from "shared/graphql/types";
import { usePreference } from "shared/preferences/usePreference";
import { UIState } from "ui/state";

import actions from "../../actions";
import { getContext, getSelectedPrimaryPaneTab, getSourcesCollapsed } from "../../selectors";
import Outline from "../SourceOutline/SourceOutline";
import QuickOpenButton from "./QuickOpenButton";
import SourcesTree from "./SourcesTree";

import { Accordion, AccordionPane } from "@recordreplay/accordion";

function PrimaryPanes(props: PropsFromRedux) {
  const [outlineExpanded, setOutlineExpanded] = usePreference("outlineExpanded");
  const [sourcesCollapsed] = usePreference("sourcesCollapsed");
  const [enableLargeText] = usePreference("enableLargeText");

  // Add the useNag hook and useEffect block
  const [, dismissInspectElementNag] = useNag(Nag.INSPECT_ELEMENT);

  useEffect(() => {
    dismissInspectElementNag();
  }, [dismissInspectElementNag]);

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
        onToggle={() => setOutlineExpanded(!outlineExpanded)}
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
