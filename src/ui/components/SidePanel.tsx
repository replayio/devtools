import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import Transcript from "ui/components/Transcript";
import Events from "ui/components/Events";
const PrimaryPanes = require("devtools/client/debugger/src/components/PrimaryPanes").default;
const SecondaryPanes = require("devtools/client/debugger/src/components/SecondaryPanes").default;

function SidePanel({ selectedPrimaryPanel }: PropsFromRedux) {
  switch (selectedPrimaryPanel) {
    case "explorer": {
      return <PrimaryPanes />;
    }
    case "debug": {
      return <SecondaryPanes />;
    }
    case "comments": {
      return <Transcript />;
    }
    case "events": {
      return <Events />;
    }
    default: {
      return null;
    }
  }
}

const connector = connect((state: UIState) => ({
  selectedPrimaryPanel: selectors.getSelectedPrimaryPanel(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(SidePanel);
