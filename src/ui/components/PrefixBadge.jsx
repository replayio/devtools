import { connect } from "devtools/client/debugger/src/utils/connect";
import { useState, useRef } from "react";
import { actions } from "ui/actions";
import AppContainerPortal from "ui/components/shared/AppContainerPortal";
import { useFeature } from "ui/hooks/settings";
import useModalDismissSignal from "ui/hooks/useModalDismissSignal";
import { selectors } from "ui/reducers";
import styles from "./PrefixBadge.module.css";

function CircleBadge({ color, onSelect }) {
  return (
    <div
      onClick={() => onSelect(color)}
      className={`h-5 w-5 cursor-pointer rounded-full ${styles[color]}`}
    />
  );
}

function _PrefixBadge({ prefixBadge, style }) {
  if (!prefixBadge) {
    return null;
  }

  return <div className={`${styles[prefixBadge]} ${styles["consoleBadge"]}`} />;
}
export const PrefixBadge = connect(
  state => ({
    theme: selectors.getTheme(state),
  }),
  {}
)(_PrefixBadge);

function PrefixBadgePicker({ onSelect, pickerNode, theme, onDismiss }) {
  const { top, left } = pickerNode ? pickerNode.getBoundingClientRect() : {};
  const pickerRef = useRef();
  useModalDismissSignal(pickerRef, onDismiss);

  return (
    <AppContainerPortal>
      <div
        style={{
          background: theme == "dark" ? "#474c52" : "#fff",
          borderRadius: "12px",
          boxShadow: "0px 1px 2px 0px #00000040",
          padding: "3px 5px",
          left: `${left + 24}px`,
          top: `${top - 3}px`,
        }}
        className="absolute z-10 flex -translate-x-full transform space-x-1"
        ref={pickerRef}
      >
        <CircleBadge onSelect={onSelect} color="unicorn" />
        <CircleBadge onSelect={onSelect} color="orange" />
        <CircleBadge onSelect={onSelect} color="yellow" />
        <CircleBadge onSelect={onSelect} color="green" />
        <CircleBadge onSelect={onSelect} color="purple" />
        <CircleBadge onSelect={onSelect} color="empty" />
      </div>
    </AppContainerPortal>
  );
}

function PrefixBadgeButton({ breakpoint, theme, setBreakpointPrefixBadge }) {
  const [showPrefixBadge, setShowPrefixBadge] = useState(false);
  const pickerNode = useRef();
  const { value: enableUnicornConsole } = useFeature("unicornConsole");

  if (!enableUnicornConsole) {
    return null;
  }

  return (
    <button
      className={`${styles["pickerBadge"]} h-5 w-5 p-px ${
        PrefixBadge == "empty" ? `img picker-${theme}` : ""
      } 
    ${PrefixBadge == "unicorn" ? styles["pickerunicorn"] : styles[PrefixBadge]}`}
      ref={pickerNode}
      onClick={() => {
        setShowPrefixBadge(!showPrefixBadge);
      }}
    >
      {showPrefixBadge && (
        <PrefixBadgePicker
          pickerNode={pickerNode.current}
          theme={theme}
          onDismiss={() => setShowPrefixBadge(false)}
          onSelect={badge => {
            setShowPrefixBadge(false);
            setBreakpointPrefixBadge(breakpoint, badge);
          }}
        />
      )}
    </button>
  );
}
export default connect(
  state => ({
    theme: selectors.getTheme(state),
  }),
  {
    setBreakpointPrefixBadge: actions.setBreakpointPrefixBadge,
  }
)(PrefixBadgeButton);
