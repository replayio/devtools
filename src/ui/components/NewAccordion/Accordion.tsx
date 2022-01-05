import classNames from "classnames";
import React, { MouseEventHandler, useState, useReducer } from "react";
import {
  AccordionState,
  collapseSection,
  expandSection,
  getInitialState,
  getIsCollapsed,
  getPosition,
  getSectionDisplayedHeight,
  reducer,
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
// 24px is arbitrary based on how the header was styled. The 1px is the bottom border
// that functions as the resize handle.
const HEADER_HEIGHT = 24 + 1;

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

const getIsResizable = (index: number, collapsed: CollapsedState) => {
  const isLastExpandedIndex = getLastExpandedIndex(collapsed);
  const isExpanded = !collapsed[index];
  const isLastIndex = index === collapsed.length - 1;

  return isExpanded && index !== isLastExpandedIndex && !isLastIndex;
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
        "absolute bottom-px w-full border-b-4 border-gray-300 hover:border-blue-400 transition",
        isResizing ? "border-blue-400" : ""
      )}
      style={{ cursor: "ns-resize" }}
      onMouseDown={onResizeStart}
    />
  );
}

function Section({
  children,
  isCollapsed,
  index,
  // isResizing,
  position,
  toggleCollapsed,
}: // onResizeStart,
{
  children: React.ReactNode;
  isCollapsed: boolean;
  index: number;
  // isResizing: boolean;
  position: SectionPosition;
  toggleCollapsed: (index: number) => void;
  // onResizeStart: (e: React.MouseEvent) => void;
}) {
  // const isResizable = getIsResizable(index, collapsed);

  return (
    <div
      className="overflow-hidden flex flex-col absolute w-full transition"
      // style={{ ...position, transition: isResizing ? "" : "all 0.15s ease-in-out" }}
      style={{ ...position }}
    >
      <button
        className="font-bold flex space-x-2 bg-gray-200 w-full px-2"
        onClick={() => toggleCollapsed(index)}
      >
        <div className="font-mono">{isCollapsed ? `>` : `v`}</div>
        <div>{`Section ${index + 1} `}</div>
      </button>
      <div className="overflow-auto flex-grow">{!isCollapsed && children}</div>
      <div className="border-b border-black" />
      {/* {isResizable && <ResizeHandle onResizeStart={onResizeStart} isResizing={isResizing} />} */}
    </div>
  );
}

export default function Accordion({ items }: any) {
  // This is fine for prototyping but there's a cleaner way to do this.
  const [collapsed, setCollapsed] = useState<CollapsedState>(new Array(items.length).fill(true));
  const [creases, setCreases] = useState<CreasesState>(new Array(items.length).fill(HEADER_HEIGHT));
  const [state, dispatch] = useReducer(reducer, getInitialState(items.length));

  const [resizingParams, setResizingParams] = useState<{
    index: number;
    initialY: number;
    originalHeight: number;
    originalCreases: CreasesState;
  } | null>(null);

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

    setResizingParams({
      index,
      initialY: e.screenY,
      originalHeight: creases[index],
      originalCreases: creases,
    });
  };
  const onResize = (e: React.MouseEvent) => {
    if (!resizingParams) return;

    const { index, initialY, originalHeight, originalCreases } = resizingParams;

    const newCreases = [...creases];
    const originalDelta = e.screenY - initialY;
    let remainingDelta = originalDelta;

    // if delta is positive, we're squeezing the proceeding sections.
    // need to make sure we're allowed to in the first place, and as we
    // make the selected section smaller, that we embiggen the preceding
    // sections accordingly.
    if (remainingDelta > 0) {
      let nextIndex = getLastExpandedIndex(collapsed);

      // Walk back from the last expanded index until you reach the current index.
      while (nextIndex && nextIndex > index) {
        const originalCrease = originalCreases[nextIndex];
        const receivableDelta = Math.min(originalCrease - MIN_HEIGHT, remainingDelta);

        if (receivableDelta) {
          newCreases[nextIndex] = originalCreases[nextIndex] - receivableDelta;
          remainingDelta -= receivableDelta;
        }

        nextIndex = getLastExpandedIndex(collapsed, nextIndex);
      }

      newCreases[index] = originalHeight + originalDelta - remainingDelta;
    } else if (remainingDelta < 0) {
      // if delta is negative, we're squeezing the preceding sections.
      // need to make sure we're allowed to in the first place. The selected
      // section will get larger, and we need to embiggen the proceeding sections
      // accordingly.
      let nextIndex = getFirstExpandedIndex(collapsed);

      // Walk forward from the first expanded index until you reach the current index.
      while (nextIndex >= 0 && nextIndex <= index) {
        const originalCrease = originalCreases[nextIndex];
        const receivableDelta = Math.max(MIN_HEIGHT - originalCrease, remainingDelta);

        if (receivableDelta) {
          newCreases[nextIndex] = originalCreases[nextIndex] + receivableDelta;
          remainingDelta -= receivableDelta;
        }

        nextIndex = getFirstExpandedIndex(collapsed, nextIndex + 1);
      }

      const lastExpandedIndex = getLastExpandedIndex(collapsed);
      // Because there's extra space after the current index, we need to
      // redistribute it to the last expanded index.
      if (lastExpandedIndex && lastExpandedIndex !== index) {
        newCreases[lastExpandedIndex] =
          originalCreases[lastExpandedIndex] - (originalDelta - remainingDelta);
      }
    }

    setCreases(newCreases);
  };
  const onResizeEnd = (e: React.MouseEvent) => {
    if (!resizingParams) return;

    setResizingParams(null);
  };

  const isResizing = !!resizingParams;

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
          // onResizeStart={e => onResizeStart(e, index)}
          // isResizing={isResizing}
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
      className="h-full w-full fixed top-0 left-0"
      style={{ cursor: "ns-resize" }}
    />
  );
}
