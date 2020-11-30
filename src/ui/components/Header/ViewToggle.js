import React, { useEffect, useState } from "react";
import classnames from "classnames";
import "./ViewToggle.css";

export default function ViewToggle({ viewMode, toggleViewMode }) {
  return (
    <button className="view-toggle">
      <div
        className={classnames("view-toggle-item view-toggle-non-dev", {
          active: viewMode === "non-dev",
        })}
        onClick={toggleViewMode}
      >
        PLAY
      </div>
      <div
        className={classnames("view-toggle-item view-toggle-dev", {
          active: viewMode === "dev",
        })}
        onClick={toggleViewMode}
      >
        DEBUG
      </div>
    </button>
  );
}
