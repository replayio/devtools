import React, { useState, useEffect, useRef } from "react";
import { connect } from "react-redux";
import classnames from "classnames";
import "./ViewToggle.css";
import { setViewMode } from "../../actions/app";
import { getViewMode } from "../../reducers/app";
import { getUserId } from "ui/utils/useToken";
import hooks from "ui/hooks";
import { selectors } from "ui/reducers";
import { isTest } from "ui/utils/test";

function Handle({ text, mode, localViewMode, handleToggle, motion }) {
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

function ViewToggle({ viewMode, recordingId, setViewMode }) {
  const { recording } = hooks.useGetRecording(recordingId);
  const userId = getUserId();
  const isAuthor = userId == recording.user_id;
  const [framerMotion, setFramerMotion] = useState(null);
  const [localViewMode, setLocalViewMode] = useState(viewMode);
  const toggleTimeoutKey = useRef(null);

  useEffect(() => {
    import("framer-motion").then(framerMotion => setFramerMotion(framerMotion));
  }, []);

  // Don't show anything while waiting for framer-motion to be imported.
  if (!framerMotion) {
    return null;
  }

  const { motion, AnimateSharedLayout } = framerMotion;

  const handleToggle = mode => {
    setLocalViewMode(mode);

    // Delay updating the viewMode in redux so that the toggle can fully animate
    // before re-rendering all of devtools in the new viewMode.
    clearTimeout(toggleTimeoutKey.current);
    toggleTimeoutKey.current = setTimeout(() => {
      setViewMode(mode);
    }, 300);
  };

  if (isAuthor && !recording.is_initialized && !isTest()) {
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

export default connect(
  state => ({
    viewMode: getViewMode(state),
    recordingId: selectors.getRecordingId(state),
  }),
  {
    setViewMode,
  }
)(ViewToggle);
