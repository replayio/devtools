import { connect } from "devtools/client/debugger/src/utils/connect";
import { useState, useRef, useSelector } from "react";
import { actions } from "ui/actions";
import AppContainerPortal from "ui/components/shared/AppContainerPortal";
import { useFeature } from "ui/hooks/settings";
import useModalDismissSignal from "ui/hooks/useModalDismissSignal";
import { selectors } from "ui/reducers";
import styles from "./PrefixBadge.module.css";

export const PREFIX_COLORS = ["purple", "empty", "green", "orange", "yellow"];

export function isColorPrefix(prefixBadge) {
  return PREFIX_COLORS.includes(prefixBadge);
}

function CircleBadge({ color, onSelect, theme }) {
  return (
    <div
      onClick={() => onSelect(color)}
      className={`h-5 w-5 cursor-pointer rounded-full ${styles[color]}`}
    />
  );
}

function EmojiBadge({ emoji, onSelect, theme }) {
  return (
    <div
      onClick={() => onSelect(emoji)}
      className={`img ${emoji}-${theme}`}
      style={{
        borderRadius: "10px",
        cursor: "pointer",
        height: "20px",
        width: "20px",
      }}
    />
  );
}

function _PrefixBadge({ prefixBadge, style, theme }) {
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
        <EmojiBadge onSelect={onSelect} theme={theme} emoji="unicorn" />
        <CircleBadge onSelect={onSelect} theme={theme} color="orange" />
        <CircleBadge onSelect={onSelect} theme={theme} color="yellow" />
        <CircleBadge onSelect={onSelect} theme={theme} color="green" />
        <CircleBadge onSelect={onSelect} theme={theme} color="purple" />
        <CircleBadge onSelect={onSelect} theme={theme} color={undefined} />
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

  const prefixBadge = breakpoint.options.prefixBadge;
  const isColor = isColorPrefix(prefixBadge);

  return (
    <button
      className={`h-5 w-5 p-px ${
        prefixBadge == "unicorn"
          ? `img unicorn-${theme}`
          : !prefixBadge
          ? `img picker-${theme}`
          : ""
      } ${styles[prefixBadge]}`}
      ref={pickerNode}
      style={{
        borderRadius: "100%",
        position: "relative",
        height: "20px",
        width: "20px",
      }}
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
