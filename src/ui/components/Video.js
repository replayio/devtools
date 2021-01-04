import React, { useEffect } from "react";
import { connect } from "react-redux";
import { actions } from "ui/actions";
import { installObserver } from "../../protocol/graphics";

function Video({ togglePlayback }) {
  useEffect(() => {
    installObserver();
  }, []);

  return (
    <div id="video" onClick={togglePlayback}>
      <canvas id="graphics"></canvas>
      <div id="highlighter-root"></div>
    </div>
  );
}

export default connect(null, {
  togglePlayback: actions.togglePlayback,
})(Video);
