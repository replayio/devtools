import classNames from "classnames";
import React, { MouseEventHandler, useState, useReducer } from "react";
import {
  AccordionState,
  collapseSection,
  endResizing,
  expandSection,
  getInitialState,
  getIsCollapsed,
  getIsIndexResizable,
  getIsResizing,
  getPosition,
  getResizingParams,
  getSectionDisplayedHeight,
  reducer,
  resize,
  startResizing,
} from "./reducer";

export interface AccordionItem {
  className?: string;
  component: React.ReactNode;
  header: string;
  onToggle?: (open: boolean) => void;
  collapsed?: boolean;
  button?: React.ReactNode;
}
export interface SectionPosition {
  top: number;
  height: number;
}
export type CollapsedState = boolean[];
export type CreasesState = number[];

const ACCORDION_HEIGHT = 600;
const MIN_HEIGHT = 150;
const HANDLE_WIDTH = 4;
const BORDER_WIDTH = 1;
// 24px is arbitrary based on how the header was styled. The 1px is the bottom border
// that functions as the resize handle.
const HEADER_HEIGHT = 24 + BORDER_WIDTH;

const getLastExpandedIndex = (collapsed: CollapsedState, endIndex?: number) => {
  const lastIndex = collapsed.slice(0, endIndex).lastIndexOf(false);

  if (lastIndex === -1) return null;

  return lastIndex;
};
const getFirstExpandedIndex = (collapsed: CollapsedState, startIndex: number = 0) => {
  const segment = collapsed.slice(startIndex);
  const index = segment.indexOf(false);

  return index > -1 ? startIndex + index : index;
};
const getClosestPrecedingExpandedIndex = (collapsed: CollapsedState, index: number) => {
  const closestIndex = collapsed.slice(0, index).lastIndexOf(false);

  if (closestIndex === -1) return null;

  return closestIndex;
};

const getSpaceAfter = (index: number, creases: CreasesState, collapsed: CollapsedState) => {
  return creases.reduce((a, b, i) => {
    if (i <= index) {
      return a;
    }

    const increment = collapsed[i] ? HEADER_HEIGHT : b;

    return a + increment;
  }, 0);
};

const ensmallenEverythingButIndex = (
  index: number,
  creases: CreasesState,
  collapsed: CollapsedState
) => {
  // This currently makes everything else min height
  const displayedCreases = creases.map((c, i) => {
    if (i === index) {
      return c;
    }

    if (collapsed[i]) {
      return HEADER_HEIGHT;
    }

    return Math.min(MIN_HEIGHT, c);
  });

  return displayedCreases;
};

// This allows the selected (expanded) session to gobble up as much vertical space as
// it's allowed to. Right now this works under the assumption that when you expand a
// section, it should take up as much height as possible, and all other currently
// expanded sections will be resized and shrink to the minimum height.
// TODO: If a user resizes a section, we should shrink not to that minimum height, but to
// the most recent resized height instead.
const embiggenSection = (index: number, creases: CreasesState, collapsed: CollapsedState) => {
  const displayedCreases = ensmallenEverythingButIndex(index, creases, collapsed);

  // Now that sections before and after are properly positioned,
  // distribute the remaining space to the selected section.
  displayedCreases[index] =
    ACCORDION_HEIGHT -
    getSpaceBefore(index, displayedCreases, collapsed) -
    getSpaceAfter(index, displayedCreases, collapsed);

  return displayedCreases;
};

function maybeRedistributeSpace(
  index: number,
  collapsed: CollapsedState,
  newCreases: CreasesState
) {
  let adjustedCreases = [...newCreases];
  const lastExpandedIndex = getLastExpandedIndex(collapsed);
  const firstExpandedIndex = getFirstExpandedIndex(collapsed);
  const closestPrecedingExpandedIndex = getClosestPrecedingExpandedIndex(collapsed, index);

  // Collapsing a section frees up vertical space in the accordion. This puts in
  // some logic to figure out which section should be free to take the new space.
  // The specific heuristics are lifted from VSCode's accordion.
  if (lastExpandedIndex && lastExpandedIndex !== index) {
    // If there's one (or many) expanded sections after the just-collapsed section,
    // this attempts to preserve the height of expanded sections closest to the
    // just-collapsed section by only embiggening the very last expanded section.
    adjustedCreases = embiggenSection(lastExpandedIndex, newCreases, collapsed);
  } else if (closestPrecedingExpandedIndex && closestPrecedingExpandedIndex !== index) {
    // If there's one (or many) expanded sections before the just-collapsed section,
    // this attempts to preserve the height of expanded sections closest to the
    // just-collapsed section by only embiggening the very first expanded section.
    adjustedCreases = embiggenSection(closestPrecedingExpandedIndex, newCreases, collapsed);
  }

  return adjustedCreases;
}

function ResizeHandle({
  onResizeStart,
  isResizing,
}: {
  onResizeStart: (e: React.MouseEvent) => void;
  isResizing: boolean;
}) {
  return (
    <div
      className={classNames(
        "absolute w-full border-transparent hover:border-blue-400 transition de",
        isResizing ? "border-blue-400" : ""
      )}
      style={{
        cursor: "ns-resize",
        borderBottomWidth: `${HANDLE_WIDTH}px`,
        top: `${BORDER_WIDTH - HANDLE_WIDTH}px`,
      }}
      onMouseDown={onResizeStart}
    />
  );
}

function Section({
  children,
  isCollapsed,
  index,
  isResizable,
  isResizing,
  position,
  toggleCollapsed,
  onResizeStart,
}: {
  children: React.ReactNode;
  isCollapsed: boolean;
  index: number;
  isResizable: boolean;
  isResizing: boolean;
  position: SectionPosition;
  toggleCollapsed: (index: number) => void;
  onResizeStart: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      className="absolute w-full h-full transition"
      style={{ ...position, transition: isResizing ? "" : "all 0.1s ease-in-out" }}
    >
      {isResizable && <ResizeHandle onResizeStart={onResizeStart} isResizing={isResizing} />}
      <div className="overflow-hidden flex flex-col w-full h-full">
        <div className={classNames("border-b", index > 0 ? "border-black" : "border-gray-200")} />
        <button
          className="font-bold flex space-x-2 bg-gray-200 w-full px-2"
          onClick={() => toggleCollapsed(index)}
        >
          <div className="font-mono">{isCollapsed ? `>` : `v`}</div>
          <div>{`Section ${index + 1} `}</div>
        </button>
        <div className="overflow-auto flex-grow">{!isCollapsed && children}</div>
      </div>
    </div>
  );
}

export default function Accordion({ items }: any) {
  // This is fine for prototyping but there's a cleaner way to do this.
  const [collapsed, setCollapsed] = useState<CollapsedState>(new Array(items.length).fill(true));
  const [creases, setCreases] = useState<CreasesState>(new Array(items.length).fill(HEADER_HEIGHT));
  const [state, dispatch] = useReducer(reducer, getInitialState(items.length));
  const isResizing = getIsResizing(state);
  const resizingParams = getResizingParams(state);

  const toggleCollapsed = (index: number) => {
    const isCollapsed = getIsCollapsed(state, index);

    if (isCollapsed) {
      dispatch(expandSection(index));
    } else {
      dispatch(collapseSection(index));
    }
  };

  const onResizeStart = (e: React.MouseEvent, index: number) => {
    // Need this otherwise scroll behavior happens in containers with overflow.
    e.preventDefault();
    dispatch(startResizing(index, e.screenY));
  };
  const onResize = (e: React.MouseEvent) => {
    dispatch(resize(e.screenY));
  };
  const onResizeEnd = (e: React.MouseEvent) => {
    dispatch(endResizing());
  };

  console.log(state, getPosition(state, 0), getPosition(state, 1));

  return (
    <div className={classNames("h-full overflow-auto flex flex-col relative")}>
      {items.map((item: any, index: number) => (
        <Section
          key={item}
          index={index}
          isCollapsed={getIsCollapsed(state, index)}
          toggleCollapsed={toggleCollapsed}
          position={getPosition(state, index)}
          isResizable={getIsIndexResizable(state, index)}
          onResizeStart={e => onResizeStart(e, index)}
          isResizing={isResizing && resizingParams?.index === index}
        >
          {item.component}
        </Section>
      ))}
      {isResizing ? <ResizeMask onMouseUp={onResizeEnd} onMouseMove={onResize} /> : null}
    </div>
  );
}

function ResizeMask({
  onMouseUp,
  onMouseMove,
}: {
  onMouseUp: MouseEventHandler;
  onMouseMove: MouseEventHandler;
}) {
  return (
    <div
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
      className="h-full w-full fixed top-0 left-0 bg-black opacity-50"
      style={{ cursor: "ns-resize" }}
    />
  );
}
