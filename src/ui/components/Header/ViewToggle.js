import React from "react";
import { connect } from "react-redux";
import "./ViewToggle.css";
import { motion, AnimateSharedLayout } from "framer-motion";
import { setViewMode } from "../../actions/app";
import { getViewMode } from "../../reducers/app";

function Handle({ text, isOn }) {
  return (
    <div className="option">
      <div className={`text ${isOn ? "active" : null}`}>{text}</div>

      {isOn && (
        <motion.div
          className="handle"
          layoutId="handle"
          animate={{ borderRadius: "8px" }}
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
  const onClick = () => {
    if (viewMode == "dev") {
      setViewMode("non-dev");
    } else {
      setViewMode("dev");
    }
  };

  return (
    <AnimateSharedLayout type="crossfade">
      <button className="view-toggle" type="button" onClick={onClick}>
        <div className="inner">
          <Handle text="Viewer" isOn={viewMode == "non-dev"} />
          <Handle text="DevTools" isOn={viewMode == "dev"} />
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
