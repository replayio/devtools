import React, { useState, useEffect, useRef } from "react";
import { connect, ConnectedProps } from "react-redux";
import classnames from "classnames";

import { setViewMode } from "../../actions/app";
import { actions } from "ui/actions";
import { getSelectedPrimaryPanel, getViewMode } from "../../reducers/app";
import hooks from "ui/hooks";
import { isTest } from "ui/utils/environment";
import { UIState } from "ui/state";
import { ViewMode } from "ui/state/app";

const TOGGLE_DELAY = 300;

interface HandleProps {
  text: string;
  mode: ViewMode;
  localViewMode: ViewMode;
  handleToggle(mode: ViewMode): void;
  motion: typeof import("framer-motion")["motion"];
}

function Handle({ text, mode, localViewMode, handleToggle, motion }: HandleProps) {
  const isActive = mode == localViewMode;

  const onClick = () => {
    if (!isActive) {
      handleToggle(mode);
    }
  };

  return (
    <div className="option" onClick={onClick}>
      <div className={classnames("text", isActive && "active")}>{text}</div>

      {isActive && (
        <motion.div
          className="handle"
          layoutId="handle"
          transition={{
            type: "spring",
            stiffness: 600,
            damping: 50,
          }}
        />
      )}
    </div>
  );
}

function ViewToggle({
  viewMode,
  setViewMode,
  setSelectedPrimaryPanel,
  selectedPrimaryPanel,
}: PropsFromRedux) {
  const recordingId = hooks.useGetRecordingId();
  const { recording, loading } = hooks.useGetRecording(recordingId);
  const { userId } = hooks.useGetUserId();
  const isAuthor = userId && userId == recording?.userId;
  const [framerMotion, setFramerMotion] = useState<typeof import("framer-motion") | null>(null);
  const [localViewMode, setLocalViewMode] = useState(viewMode);
  const toggleTimeoutKey = useRef<NodeJS.Timeout | null>(null);
  const preloadPromise = useRef<Promise<typeof import("../Views/DevView")> | null>(null);

  useEffect(() => {
    import("framer-motion").then(framerMotion => setFramerMotion(framerMotion));
    preloadPromise.current = import("../Views/DevView");
  }, []);
  useEffect(() => {
    // It's possible for the view to be toggled by something else apart from this component.
    // When that happens, we need to update the localViewMode so that it displays
    // the right state.
    if (viewMode !== localViewMode) {
      setLocalViewMode(viewMode);
    }
  }, [viewMode]);

  // Don't show anything while waiting for framer-motion to be imported.
  if (!framerMotion) {
    return null;
  }

  const { motion, AnimateSharedLayout } = framerMotion;

  const handleToggle = async (mode: ViewMode) => {
    setLocalViewMode(mode);

    // Delay updating the viewMode in redux so that the toggle can fully animate
    // before re-rendering all of devtools in the new viewMode.
    clearTimeout(toggleTimeoutKey.current!);
    const delayPromise = new Promise<void>(resolve => {
      toggleTimeoutKey.current = setTimeout(() => resolve(), TOGGLE_DELAY);
    });
    await Promise.all([preloadPromise, delayPromise]);

    // We switch to viewing comments only if the current view is something that
    // wouldn't be visible in Viewer Mode normally (like debug or explorer)
    if (
      mode === "non-dev" &&
      selectedPrimaryPanel !== "comments" &&
      selectedPrimaryPanel !== "events"
    ) {
      setSelectedPrimaryPanel("comments");
    }
    setViewMode(mode);
  };

  const shouldHide = isAuthor && !recording?.isInitialized && !isTest();

  if (loading || shouldHide) {
    return null;
  }

  return (
    <AnimateSharedLayout type="crossfade">
      <button className="view-toggle" type="button">
        <div className="inner">
          <Handle
            text="Viewer"
            mode="non-dev"
            localViewMode={localViewMode}
            handleToggle={handleToggle}
            motion={motion}
          />
          <Handle
            text="DevTools"
            mode="dev"
            localViewMode={localViewMode}
            handleToggle={handleToggle}
            motion={motion}
          />
        </div>
      </button>
    </AnimateSharedLayout>
  );
}

const connector = connect(
  (state: UIState) => ({
    viewMode: getViewMode(state),
    selectedPrimaryPanel: getSelectedPrimaryPanel(state),
  }),
  {
    setViewMode,
    setSelectedPrimaryPanel: actions.setSelectedPrimaryPanel,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(ViewToggle);
