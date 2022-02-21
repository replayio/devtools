import React, { useState, useEffect, useRef } from "react";
import { connect, ConnectedProps } from "react-redux";
import classnames from "classnames";
import hooks from "ui/hooks";
import { isTest } from "ui/utils/environment";
import { UIState } from "ui/state";
import { getViewMode } from "ui/reducers/layout";
import { setViewMode } from "ui/actions/layout";
import { ViewMode } from "ui/state/layout";

const TOGGLE_DELAY = 300;

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

function ViewToggle({ viewMode, setViewMode }: PropsFromRedux) {
  const recordingId = hooks.useGetRecordingId();
  const { recording, loading } = hooks.useGetRecording(recordingId);
  const { userId } = hooks.useGetUserId();
  const isAuthor = userId && userId == recording?.userId;
  const [localViewMode, setLocalViewMode] = useState(viewMode);
  const toggleTimeoutKey = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // It's possible for the view to be toggled by something else apart from this component.
    // When that happens, we need to update the localViewMode so that it displays
    // the right state.
    if (viewMode !== localViewMode) {
      setLocalViewMode(viewMode);
    }
  }, [viewMode]);

  const handleToggle = async (mode: ViewMode) => {
    setLocalViewMode(mode);

    // Delay updating the viewMode in redux so that the toggle can fully animate
    // before re-rendering all of devtools in the new viewMode.
    clearTimeout(toggleTimeoutKey.current!);
    const delayPromise = new Promise<void>(resolve => {
      toggleTimeoutKey.current = setTimeout(() => resolve(), TOGGLE_DELAY);
    });

    await delayPromise;

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
          left: `${(MODES.findIndex(({ mode }) => mode === localViewMode) / MODES.length) * 100}%`,
        }}
      ></div>
      {MODES.map(({ mode, label }) => (
        <div key={mode} className="option" onClick={() => handleToggle(mode)}>
          <div className={classnames("text", { active: localViewMode === mode })}>{label}</div>
        </div>
      ))}
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    viewMode: getViewMode(state),
  }),
  {
    setViewMode,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(ViewToggle);
