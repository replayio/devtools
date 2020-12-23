import React from "react";
import { connect } from "react-redux";
import classnames from "classnames";
import "./ViewToggle.css";
import { clearSelectedLocation } from "../../../devtools/client/debugger/src/actions/sources";
import { getContext } from "../../../devtools/client/debugger/src/reducers/pause";
import { setViewMode } from "../../actions/app";
import { getViewMode } from "../../reducers/app";

function ViewToggle({ viewMode, setViewMode, clearSelectedLocation, cx }) {
  return (
    <button className="view-toggle">
      <div
        onClick={() => setViewMode("non-dev")}
        className={classnames("view-toggle-item view-toggle-non-dev", {
          active: viewMode === "non-dev",
        })}
      >
        VIEWER
      </div>
      <div
        onClick={() => setViewMode("dev")}
        className={classnames("view-toggle-item view-toggle-dev", {
          active: viewMode === "dev",
        })}
      >
        DEVTOOLS
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
