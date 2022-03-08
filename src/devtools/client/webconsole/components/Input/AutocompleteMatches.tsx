import React, { useEffect, useRef } from "react";
import classNames from "classnames";

function Match({
  label,
  isSelected,
  onClick,
}: {
  label: string;
  isSelected: boolean;
  onClick: (match: string) => void;
}) {
  const buttonNode = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isSelected) {
      buttonNode.current?.scrollIntoView({ block: "nearest", inline: "end" });
    }
  }, [isSelected]);

  return (
    <button
      className={classNames(
        "cursor-default px-1 text-left",
        isSelected ? "bg-primaryAccent text-white" : "hover:bg-toolbarBackgroundAlt"
      )}
      ref={buttonNode}
      onClick={() => onClick(label)}
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
  onMatchClick: (match: string) => void;
}) {
  return (
    <div
      className="absolute left-7 z-10 -mb-1 flex flex-col overflow-y-auto overflow-x-hidden border border-splitter bg-menuBgcolor py-1 font-mono shadow-sm"
      style={{
        bottom: "var(--editor-footer-height)",
        fontSize: "var(--theme-code-font-size)",
        marginLeft: `${leftOffset}ch`,
        maxHeight: "160px",
        maxWidth: "200px",
        minWidth: "160px",
      }}
    >
      {matches.map((match, i) => (
        <Match label={match} isSelected={i === selectedIndex} key={i} onClick={onMatchClick} />
      ))}
    </div>
  );
}
