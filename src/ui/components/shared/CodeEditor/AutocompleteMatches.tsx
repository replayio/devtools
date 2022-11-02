import classNames from "classnames";
import React, { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { FixedSizeList as List } from "react-window";

import AppContainerPortal from "../AppContainerPortal";

type ItemData = {
  matches: string[];
  onMatchClick: (match: string) => void;
  selectedIndex: number;
};

export type AutocompleteMatchesOptions = {
  minLeft: number;
  isArgument: boolean;
};

function Match({
  label,
  isSelected,
  onClick,
  style,
}: {
  label: string;
  isSelected: boolean;
  onClick: (match: string) => void;
  style: React.CSSProperties;
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
        "w-full cursor-default px-1 text-left",
        isSelected ? "bg-primaryAccent text-white" : "hover:bg-toolbarBackgroundAlt"
      )}
      style={{
        overflow: "hidden",
        textOverflow: "ellipsis",
        ...style,
      }}
      ref={buttonNode}
      onClick={() => onClick(label)}
    >
      {label}
    </button>
  );
}

export default function AutocompleteMatches({
  containerRect,
  leftOffset,
  matches,
  selectedIndex,
  onMatchClick,
  options,
}: {
  containerRect: DOMRect;
  leftOffset: number;
  matches: string[];
  selectedIndex: number;
  onMatchClick: (match: string) => void;
  options: AutocompleteMatchesOptions;
}) {
  const { top, left } = containerRect;

  const itemData: ItemData = useMemo(
    () => ({
      matches,
      onMatchClick,
      selectedIndex,
    }),
    [matches, onMatchClick, selectedIndex]
  );

  const listRef = useRef<List>(null);
  const lastSelectedIndexRef = useRef(selectedIndex);
  useLayoutEffect(() => {
    if (selectedIndex !== lastSelectedIndexRef.current) {
      lastSelectedIndexRef.current = selectedIndex;

      listRef.current!.scrollToItem(selectedIndex);
    }
  }, [selectedIndex]);

  return (
    <AppContainerPortal>
      <div className="absolute z-10 -translate-y-full transform" style={{ top, left }}>
        <div
          className="autocomplete-matches flex flex-col overflow-y-auto overflow-x-hidden border border-splitter bg-menuBgcolor py-1 font-mono text-menuColor shadow-sm"
          style={{
            fontSize: "var(--theme-code-font-size)",
            marginLeft: `max(${options.minLeft}px, ${leftOffset}ch)`,
          }}
        >
          <List
            height={160}
            itemCount={matches.length}
            itemData={itemData}
            itemSize={13}
            ref={listRef}
            width={200}
          >
            {MatchRow}
          </List>
        </div>
      </div>
    </AppContainerPortal>
  );
}

function MatchRow({
  data,
  index,
  style,
}: {
  data: ItemData;
  index: number;
  style: React.CSSProperties;
}) {
  const { matches, onMatchClick, selectedIndex } = data;
  const match = matches[index];

  return (
    <Match
      label={match}
      isSelected={index === selectedIndex}
      onClick={() => onMatchClick(match)}
      style={style}
    />
  );
}
