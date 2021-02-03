import React from "react";
import "./Uploading.css";

export function Uploading() {
  return (
    <div className="uploading">
      <div className="header">
        <img className="logo" src="images/logo.svg" />
      </div>
      <div className="uploading-container">
        <div className="progress-bar">
          <div className="tooltip">Uploading...</div>
          <div className="progress"></div>
        </div>
      </div>
    </div>
  );
}
