import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import Transcript from "ui/components/Transcript";
import Events from "ui/components/Events";
import { Redacted } from "./Redacted";
const PrimaryPanes = require("devtools/client/debugger/src/components/PrimaryPanes").default;
const SecondaryPanes = require("devtools/client/debugger/src/components/SecondaryPanes").default;

const SIDEPANEL_WIDTH = 240;

type SidePanelProps = {
  resizable?: boolean;
} & PropsFromRedux;

function SidePanel({ selectedPrimaryPanel, resizable }: SidePanelProps) {
  let sidepanel;

  if (selectedPrimaryPanel === "explorer") {
    sidepanel = <PrimaryPanes />;
  } else if (selectedPrimaryPanel === "debug") {
    sidepanel = <SecondaryPanes />;
  } else if (selectedPrimaryPanel === "comments") {
    return <Transcript />;
  } else if (selectedPrimaryPanel === "events") {
    return <Events />;
  }

  return (
    <Redacted
      style={{
        width: resizable ? "100%" : `${SIDEPANEL_WIDTH}px`,
        height: "100%",
        borderRight: "1px solid var(--theme-splitter-color)",
      }}
    >
      {sidepanel}
    </Redacted>
  );
}

const connector = connect((state: UIState) => ({
  selectedPrimaryPanel: selectors.getSelectedPrimaryPanel(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(SidePanel);
