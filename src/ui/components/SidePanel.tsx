import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import Transcript from "ui/components/Transcript";
import Events from "ui/components/Events";
const PrimaryPanes = require("devtools/client/debugger/src/components/PrimaryPanes").default;
const SecondaryPanes = require("devtools/client/debugger/src/components/SecondaryPanes").default;

function SidePanel({ selectedPrimaryPanel }: PropsFromRedux) {
  let sidepanel;

  if (selectedPrimaryPanel === "explorer") {
    sidepanel = <PrimaryPanes />;
  } else if (selectedPrimaryPanel === "debug") {
    sidepanel = <SecondaryPanes />;
  } else if (selectedPrimaryPanel === "comments") {
    sidepanel = <Transcript />;
  } else if (selectedPrimaryPanel === "events") {
    sidepanel = <Events />;
  }

  return <div style={{ width: "400px" }}>{sidepanel}</div>;
}

const connector = connect((state: UIState) => ({
  selectedPrimaryPanel: selectors.getSelectedPrimaryPanel(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(SidePanel);
