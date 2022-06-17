import React from "react";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import classnames from "classnames";
import { isTest } from "ui/utils/environment";
import hooks from "ui/hooks";
import { setViewMode } from "ui/actions/layout";
import { ViewMode } from "ui/state/layout";
import { getViewMode } from "ui/reducers/layout";

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

export default function ViewToggle() {
  const dispatch = useAppDispatch();
  const viewMode = useAppSelector(getViewMode);
  const recordingId = hooks.useGetRecordingId();
  const { recording, loading } = hooks.useGetRecording(recordingId);
  const { userId } = hooks.useGetUserId();
  const isAuthor = userId && userId == recording?.userId;

  const handleToggle = async (mode: ViewMode) => {
    dispatch(setViewMode(mode));
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
          left: `${(MODES.findIndex(({ mode }) => mode === viewMode) / MODES.length) * 100}%`,
        }}
      ></div>
      {MODES.map(({ mode, label }) => (
        <div key={mode} className="option" onClick={() => handleToggle(mode)}>
          <div className={classnames("text", { active: viewMode === mode })}>{label}</div>
        </div>
      ))}
    </div>
  );
}
