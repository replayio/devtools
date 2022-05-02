import classnames from "classnames";
import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useFeature } from "ui/hooks/settings";

export const PREFIX_COLORS = {
  blue: "#01ACFD",
  empty: "#F7F7F7",
  empty: "#F7F7F7",
  pink: "#FF87DD",
  yellow: "#FFE870",
};

export function isColorPrefix(prefixBadge) {
  return Object.keys(PREFIX_COLORS).includes(prefixBadge);
}

function CircleBadge({ color, onSelect }) {
  return (
    <div
      onClick={() => onSelect(color)}
      style={{
        backgroundColor: PREFIX_COLORS[color],
        borderRadius: "10px",
        cursor: "pointer",
        height: "20px",
        marginRight: "5px",
        width: "20px",
      }}
    />
  );
}

function EmojiBadge({ emoji, onSelect }) {
  return (
    <div
      onClick={() => onSelect(emoji)}
      className={`img ${emoji}`}
      style={{
        backgroundColor: "#F7F7F7",
        borderRadius: "10px",
        cursor: "pointer",
        height: "20px",
        marginRight: "5px",
        width: "20px",
      }}
    />
  );
}

function PrefixBadgePicker({ onSelect, pickerNode }) {
  const { top, left } = pickerNode ? pickerNode.getBoundingClientRect() : {};

  return createPortal(
    <div
      style={{
        background: "white",
        borderRadius: "12px",
        boxShadow: "0px 1px 2px 0px #00000040",
        display: "flex",
        padding: "3px 5px",
        position: "absolute",
        right: `${left + 28}px`,
        top: `${top - 3}px`,
        zIndex: 100,
      }}
    >
      <EmojiBadge onSelect={onSelect} emoji="rocket" />
      <EmojiBadge onSelect={onSelect} emoji="unicorn" />
      <EmojiBadge onSelect={onSelect} emoji="target" />
      <CircleBadge onSelect={onSelect} color="pink" />
      <CircleBadge onSelect={onSelect} color="yellow" />
      <CircleBadge onSelect={onSelect} color="blue" />
      <CircleBadge onSelect={onSelect} color="empty" />
    </div>,
    document.body
  );
}

export function PrefixBadgeButton({ breakpoint, setBreakpointPrefixBadge }) {
  const [showPrefixBadge, setShowPrefixBadge] = useState(false);
  const pickerNode = useRef();
  const { value: enableUnicornConsole } = useFeature("unicornConsole");

  const prefixBadge = breakpoint.options.prefixBadge;
  const isEmoji = ["unicorn", "rocket", "target"].includes(prefixBadge);
  const isColor = ["blue", "pink", "yellow"].includes(prefixBadge);

  if (!enableUnicornConsole) {
    return null;
  }

  return (
    <button
      className={classnames("h-5 w-5 rounded-full p-px pt-0.5", {
        img: isEmoji,
        rocket: prefixBadge === "rocket",
        target: prefixBadge === "target",
        unicorn: prefixBadge === "unicorn",
      })}
      ref={pickerNode}
      style={{
        backgroundColor: isColor ? PREFIX_COLORS[prefixBadge] : "white",
        border: "2px solid #c5c5c5",
        borderRadius: "100%",
        height: "1.25rem",
        marginRight: "5px",
        position: "relative",
        width: "21px",
      }}
      onClick={() => {
        setShowPrefixBadge(!showPrefixBadge);
      }}
    >
      {showPrefixBadge && (
        <PrefixBadgePicker
          pickerNode={pickerNode.current}
          onSelect={badge => {
            setShowPrefixBadge(false);
            setBreakpointPrefixBadge(breakpoint, badge);
          }}
        />
      )}
    </button>
  );
}
