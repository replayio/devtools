import React, { useState, useEffect, useRef } from "react";
import { connect, ConnectedProps } from "react-redux";
import classnames from "classnames";
import hooks from "ui/hooks";
import { isTest } from "ui/utils/environment";
import { UIState } from "ui/state";
import { getViewMode, getToggleMode } from "ui/reducers/layout";
import { setViewMode } from "ui/actions/layout";
import { ViewMode } from "ui/state/layout";

const MODES = [
  {
    mode: "non-dev",
    label: "Viewer",
  },
  {
    mode: "dev",
    label: "DevTools",
  },
] as const;

function ViewToggle({ toggleMode, setViewMode }: PropsFromRedux) {
  const recordingId = hooks.useGetRecordingId();
  const { recording, loading } = hooks.useGetRecording(recordingId);
  const { userId } = hooks.useGetUserId();
  const isAuthor = userId && userId == recording?.userId;

  const handleToggle = async (mode: ViewMode) => {
    setViewMode(mode);
  };

  const shouldHide = isAuthor && !recording?.isInitialized && !isTest();

  if (loading || shouldHide) {
    return null;
  }

  return (
    <div className="view-toggle" role="button">
      <div
        className="handle"
        style={{
          left: `${(MODES.findIndex(({ mode }) => mode === toggleMode) / MODES.length) * 100}%`,
        }}
      ></div>
      {MODES.map(({ mode, label }) => (
        <div key={mode} className="option" onClick={() => handleToggle(mode)}>
          <div className={classnames("text", { active: toggleMode === mode })}>{label}</div>
        </div>
      ))}
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    toggleMode: getToggleMode(state),
  }),
  {
    setViewMode,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(ViewToggle);
