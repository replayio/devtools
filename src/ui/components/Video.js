import React from "react";
import { connect } from "react-redux";
import { actions } from "ui/actions";

function Video({ togglePlayback }) {
  return (
    <div id="viewer" onClick={togglePlayback}>
      <canvas id="graphics"></canvas>
      <div id="highlighter-root"></div>
    </div>
  );
}

export default connect(null, {
  togglePlayback: actions.togglePlayback,
})(Video);
