const React = require("react");
import { connect } from "react-redux";
import { selectors } from "../../reducers";
import { Recording } from "./Recording";
import { useAuth0 } from "@auth0/auth0-react";

import "./Recordings.css";

const Recordings = props => {
  const { loginWithRedirect, isAuthenticated } = useAuth0();
  if (!isAuthenticated) {
    return (
      <div className="welcome-screen">
        <div className="welcome-panel">
          <img className="logo" src="images/logo.svg" />
          <img className="atwork" src="images/computer-work.svg" />
          <button onClick={() => loginWithRedirect()}>Log In</button>
        </div>
      </div>
    );
  }
  return (
    <div className="recordings">
      {props.recordings &&
        props.recordings.map((recording, i) => <Recording data={recording} key={i} />)}
    </div>
  );
};

export default connect(
  state => ({
    recordings: selectors.getRecordings(state),
  }),
  {}
)(Recordings);
