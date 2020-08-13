import ReactDOM from "react-dom";
import React from "react";
import { connect } from "react-redux";

import { actions } from "../../actions";
import { selectors } from "../../reducers";
import { features } from "../../utils/prefs";

import "./Comments.css";

class Comments extends React.Component {
  render() {
    if (!features.comments) {
      return null;
    }
    return <div className="comments">Yo</div>;
  }
}

export default connect(
  state => ({
    comments: selectors.getComments(state),
    timelineDimensions: selectors.getTimelineDimensions(state),
  }),
  {}
)(Comments);
