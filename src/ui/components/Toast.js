import React, { useEffect, useState, useRef } from "react";
import { connect } from "react-redux";
import { selectors } from "../reducers";
import "./Toast.css";

function Toast({ analysisPoints }) {
  const [shouldShowToast, setShowToast] = useState(null);

  useEffect(() => {
    if (analysisPoints) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }
  }, [analysisPoints]);

  if (!analysisPoints || !shouldShowToast) return null;

  const { length } = analysisPoints;
  const hits = length == 1 ? "hit" : "hits";
  return <div className="toast">{`${length} ${hits}`}</div>;
}

export default connect(state => ({
  analysisPoints: selectors.getAnalysisPointsForLocation(
    state,
    selectors.getPendingNotification(state)
  ),
}))(Toast);
