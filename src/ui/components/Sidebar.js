import React from "react";
import { connect } from "react-redux";
import { selectors } from "ui/reducers";

import Toolbar from "./Toolbar";
import PrimaryPanes from "devtools/client/debugger/src/components/PrimaryPanes";
import SecondaryPanes from "devtools/client/debugger/src/components/SecondaryPanes";

import "./Sidebar.css";

function Sidebar({ selectedPrimaryPanel }) {
  return (
    <div className="sidebar">
      <Toolbar />
      {selectedPrimaryPanel == "explorer" ? <PrimaryPanes /> : <SecondaryPanes />}
    </div>
  );
}

export default connect(state => ({
  selectedPrimaryPanel: selectors.getSelectedPrimaryPanel(state),
}))(Sidebar);
