import React, { useEffect, useRef } from "react";
import classNames from "classnames";

function Match({
  label,
  selectedIndex,
  index,
}: {
  label: string;
  selectedIndex: number;
  index: number;
}) {
  const buttonNode = useRef<HTMLButtonElement | null>(null);
  const selected = selectedIndex === index;

  useEffect(() => {
    if (selected && buttonNode.current) {
      buttonNode.current.scrollIntoView({ block: "nearest" });
    }
  }, [selected]);

  return (
    <button
      className={classNames(
        "text-left px-1 cursor-default",
        selected ? "bg-blue-700 text-white" : "hover:bg-blue-100"
      )}
      ref={buttonNode}
    >
      {label}
    </button>
  );
}

export default function Autocomplete({
  matches,
  selectedIndex,
}: {
  matches: string[];
  selectedIndex: number;
}) {
  if (!matches.length) {
    return null;
  }

  return (
    <div
      className="flex flex-col border py-1 absolute left-7 bottom-8 font-mono overflow-auto"
      style={{ minWidth: "240px", maxHeight: "160px", fontSize: "11px" }}
    >
      {matches.map((match, i) => (
        <Match label={match} selectedIndex={selectedIndex} index={i} key={i} />
      ))}
    </div>
  );
}

// V1
// it should handle chained objects
// it should handle computed property syntax
// it should know what block it's in and suggest stuff for that block based on cursor position
// it should replace the correct expression with the selected autocompleted expression
// pressing escape/left/right should close autocomplete

// V2
// Todo: the dropdown should have a variable X position based on the cursor position
