import React, { useEffect, useRef } from "react";
import classNames from "classnames";

function Match({
  label,
  selectedIndex,
  index,
  onClick,
}: {
  label: string;
  selectedIndex: number;
  index: number;
  onClick: (index: number) => void;
}) {
  const buttonNode = useRef<HTMLButtonElement | null>(null);
  const selected = selectedIndex === index;

  useEffect(() => {
    if (selected && buttonNode.current) {
      buttonNode.current.scrollIntoView({ block: "nearest", inline: "end" });
    }
  }, [selected]);

  return (
    <button
      className={classNames(
        "text-left px-1 cursor-default",
        selected ? "bg-blue-700 text-white" : "hover:bg-blue-100"
      )}
      ref={buttonNode}
      onClick={() => onClick(index)}
    >
      {label}
    </button>
  );
}

export default function Autocomplete({
  leftOffset,
  matches,
  selectedIndex,
  onMatchClick,
}: {
  leftOffset: number;
  matches: string[];
  selectedIndex: number;
  onMatchClick: (index: number) => void;
}) {
  return (
    <div
      className="flex flex-col bg-white border py-1 absolute left-7 -mb-1 shadow-sm font-mono overflow-x-hidden overflow-y-auto"
      style={{
        maxWidth: "200px",
        minWidth: "160px",
        maxHeight: "160px",
        fontSize: "var(--theme-code-font-size)",
        bottom: "var(--editor-footer-height)",
        marginLeft: `${leftOffset}px`,
      }}
    >
      {matches.map((match, i) => (
        <Match
          label={match}
          selectedIndex={selectedIndex}
          index={i}
          key={i}
          onClick={onMatchClick}
        />
      ))}
    </div>
  );
}
