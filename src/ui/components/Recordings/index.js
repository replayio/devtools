const React = require("react");
import { connect } from "react-redux";
import { selectors } from "../../reducers";
import { Recording } from "./Recording";

import "./Recordings.css";

const Recordings = props => (
  <div className="recordings">
    {props.recordings &&
      props.recordings.map((recording, i) => <Recording data={recording} key={i} />)}
  </div>
);

export default connect(
  state => ({
    recordings: selectors.getRecordings(state),
  }),
  {}
)(Recordings);
