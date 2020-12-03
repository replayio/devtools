import React from "react";
import { connect } from "react-redux";
import classnames from "classnames";
import "./ViewToggle.css";
import { clearSelectedLocation } from "../../../devtools/client/debugger/src/actions/sources";
import { getContext } from "../../../devtools/client/debugger/src/reducers/pause";
import { setViewMode } from "../../actions/app";
import { getViewMode } from "../../reducers/app";

function ViewToggle({ viewMode, setViewMode, clearSelectedLocation, cx }) {
  const handleClick = () => {
    const newMode = viewMode == "dev" ? "non-dev" : "dev";
    setViewMode(newMode);
  };

  return (
    <button className="view-toggle">
      <div
        className={classnames("view-toggle-item view-toggle-non-dev", {
          active: viewMode === "non-dev",
        })}
        onClick={handleClick}
      >
        PLAY
      </div>
      <div
        className={classnames("view-toggle-item view-toggle-dev", {
          active: viewMode === "dev",
        })}
        onClick={handleClick}
      >
        DEBUG
      </div>
    </button>
  );
}

export default connect(
  state => ({
    cx: getContext(state),
    viewMode: getViewMode(state),
  }),
  {
    clearSelectedLocation,
    setViewMode,
  }
)(ViewToggle);
