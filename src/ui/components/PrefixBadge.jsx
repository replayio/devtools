import { connect } from "devtools/client/debugger/src/utils/connect";
import { useState, useRef } from "react";
import { actions } from "ui/actions";
import AppContainerPortal from "ui/components/shared/AppContainerPortal";
import { useFeature } from "ui/hooks/settings";
import useModalDismissSignal from "ui/hooks/useModalDismissSignal";
import { selectors } from "ui/reducers";

export const PREFIX_COLORS = {
  blue: "#01ACFD",
  empty: "#efefef",
  green: "#8AE28D",
  pink: "#FF87DD",
  yellow: "#FFE870",
};

export const DARK_PREFIX_COLORS = {
  blue: "#0097DE",
  empty: "#a8a8a8",
  green: "#30DA36",
  pink: "#FF48CC",
  yellow: "#FFE03C",
};

export function isColorPrefix(prefixBadge) {
  return Object.keys(PREFIX_COLORS).includes(prefixBadge);
}

function CircleBadge({ color, theme, onSelect }) {
  return (
    <div
      onClick={() => onSelect(color)}
      style={{
        backgroundColor: getBadgeColor(color, theme, true),
        borderRadius: "10px",
        cursor: "pointer",
        height: "20px",
        marginRight: "5px",
        width: "20px",
      }}
    />
  );
}

function EmojiBadge({ emoji, theme, onSelect }) {
  return (
    <div
      onClick={() => onSelect(emoji)}
      className={`img ${emoji}-${theme}`}
      style={{
        borderRadius: "10px",
        cursor: "pointer",
        height: "20px",
        marginRight: "5px",
        width: "20px",
      }}
    />
  );
}

export function getBadgeColor(prefixBadge, theme, showEmpty) {
  const colors = theme == "dark" ? DARK_PREFIX_COLORS : PREFIX_COLORS;
  if (!prefixBadge) {
    return showEmpty ? colors.empty : "none";
  }
  return colors[prefixBadge];
}

function _PrefixBadge({ prefixBadge, style, theme, showEmpty = false }) {
  if (!prefixBadge) {
    return null;
  }

  if (isColorPrefix(prefixBadge)) {
    return (
      <div
        style={{
          backgroundColor: getBadgeColor(prefixBadge, theme, showEmpty),
          borderRadius: "16px",
          height: "16px",
          width: "16px",
          ...style,
        }}
      />
    );
  }

  return (
    <div
      className={`img ${prefixBadge}-${theme}`}
      style={{
        ...style,
      }}
    />
  );
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
          left: `${left + 30}px`,
          top: `${top - 3}px`,
        }}
        className="transform -translate-x-full flex absolute z-10"
        ref={pickerRef}
      >
        <EmojiBadge onSelect={onSelect} theme={theme} emoji="unicorn" />
        <CircleBadge onSelect={onSelect} theme={theme} color="pink" />
        <CircleBadge onSelect={onSelect} theme={theme} color="green" />
        <CircleBadge onSelect={onSelect} theme={theme} color="yellow" />
        <CircleBadge onSelect={onSelect} theme={theme} color="blue" />
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
  const colors = theme == "dark" ? DARK_PREFIX_COLORS : PREFIX_COLORS;
  return (
    <button
      className={`h-5 w-5 rounded-full p-px ${
        prefixBadge == "unicorn" ? `img unicorn-${theme}` : ""
      }`}
      ref={pickerNode}
      style={{
        backgroundColor: isColor
          ? colors[prefixBadge]
          : !prefixBadge
          ? "var(--theme-text-field-bgcolor)"
          : "",
        borderRadius: "100%",
        position: "relative",
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
