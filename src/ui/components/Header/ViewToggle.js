import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import classnames from "classnames";
import "./ViewToggle.css";
import { setViewMode } from "../../actions/app";
import { getViewMode } from "../../reducers/app";

function Handle({ text, isOn, motion }) {
  return (
    <div className="option">
      <div className={classnames("text", isOn && "active")}>{text}</div>

      {isOn && (
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

function ViewToggle({ viewMode, setViewMode }) {
  const [framerMotion, setFramerMotion] = useState(null);

  useEffect(() => {
    import("framer-motion").then(framerMotion => setFramerMotion(framerMotion));
  }, []);

  // Don't show anything while waiting for framer-motion to be imported.
  if (!framerMotion) {
    return null;
  }

  const { motion, AnimateSharedLayout } = framerMotion;

  const onClick = () => setViewMode(viewMode === "dev" ? "non-dev" : "dev");

  return (
    <AnimateSharedLayout type="crossfade">
      <button className="view-toggle" type="button" onClick={onClick}>
        <div className="inner">
          <Handle text="Viewer" isOn={viewMode == "non-dev"} motion={motion} />
          <Handle text="DevTools" isOn={viewMode == "dev"} motion={motion} />
        </div>
      </button>
    </AnimateSharedLayout>
  );
}

export default connect(
  state => ({
    viewMode: getViewMode(state),
  }),
  {
    setViewMode,
  }
)(ViewToggle);
