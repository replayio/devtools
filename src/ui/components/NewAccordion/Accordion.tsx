import classNames from "classnames";
import React, { MouseEvent, MouseEventHandler, useState } from "react";

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

const getLastExpandedIndex = (collapsed: CollapsedState) => collapsed.lastIndexOf(false);
const getFirstExpandedIndex = (collapsed: CollapsedState) => collapsed.indexOf(false);
const getSpaceBefore = (index: number, creases: CreasesState) => {
  return creases.slice(0, index).reduce((a, b) => a + b, 0) || 0;
};
const getSpaceAfter = (index: number, creases: CreasesState) => {
  return creases.slice(index + 1).reduce((a, b) => a + b, 0);
};

const getPosition = (creases: CreasesState, index: number) => {
  const top = getSpaceBefore(index, creases);
  const height = creases[index];

  return { top, height };
};

const getIsResizable = (index: number, collapsed: CollapsedState) => {
  const isLastExpandedIndex = getLastExpandedIndex(collapsed);
  const isExpanded = !collapsed[index];
  const isLastIndex = index === collapsed.length - 1;

  return isExpanded && index !== isLastExpandedIndex && !isLastIndex;
};

// This allows the selected (expanded) session to gobble up as much vertical space as
// it's allowed to. Right now this works under the assumption that when you expand a
// section, it should take up as much height as possible, and all other currently
// expanded sections will be resized and shrink to the minimum height.
// TODO: If a user resizes a section, we should shrink not to that minimum height, but to
// the most recent resized height instead.
const embiggenSection = (index: number, creases: CreasesState, collapsed: CollapsedState) => {
  let newCreases = [...creases];

  // Adjust the sections AFTER this index.
  newCreases = newCreases.map((c, i) => {
    if (i <= index) return c;
    const isCollapsed = collapsed[i];
    return isCollapsed ? HEADER_HEIGHT : MIN_HEIGHT;
  });

  // Adjust the sections BEFORE this index.
  newCreases = newCreases.map((c, i) => {
    if (i >= index) return c;
    const isCollapsed = collapsed[i];
    return isCollapsed ? HEADER_HEIGHT : MIN_HEIGHT;
  });

  // Now that sections before and after are properly positioned,
  // distribute the remaining space to the selected section.
  newCreases[index] =
    ACCORDION_HEIGHT - getSpaceBefore(index, newCreases) - getSpaceAfter(index, newCreases);

  return newCreases;
};

function maybeRedistributeSpace(
  index: number,
  collapsed: CollapsedState,
  newCreases: CreasesState
) {
  let adjustedCreases = [...newCreases];
  const lastExpandedIndex = getLastExpandedIndex(collapsed);
  const firstExpandedIndex = getFirstExpandedIndex(collapsed);

  // Collapsing a section frees up vertical space in the accordion. This puts in
  // some logic to figure out which section should be free to take the new space.
  // The specific heuristics are lifted from VSCode's accordion.
  if (lastExpandedIndex !== index) {
    // If there's one (or many) expanded sections after the just-collapsed section,
    // this attempts to preserve the height of expanded sections closest to the
    // just-collapsed section by only embiggening the very last expanded section.
    adjustedCreases = embiggenSection(lastExpandedIndex, newCreases, collapsed);
  } else if (firstExpandedIndex !== index) {
    // If there's one (or many) expanded sections before the just-collapsed section,
    // this attempts to preserve the height of expanded sections closest to the
    // just-collapsed section by only embiggening the very first expanded section.
    adjustedCreases = embiggenSection(firstExpandedIndex, newCreases, collapsed);
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
  collapsed,
  index,
  isResizing,
  position,
  toggleCollapsed,
  onResizeStart,
}: {
  children: React.ReactNode;
  collapsed: CollapsedState;
  index: number;
  isResizing: boolean;
  position: SectionPosition;
  toggleCollapsed: (index: number) => void;
  onResizeStart: (e: React.MouseEvent) => void;
}) {
  const isCollapsed = collapsed[index];
  const isResizable = getIsResizable(index, collapsed);

  return (
    <div
      className="overflow-hidden flex flex-col absolute w-full transition"
      style={{ ...position, transition: isResizing ? "" : "all 0.15s ease-in-out" }}
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
      {isResizable && <ResizeHandle onResizeStart={onResizeStart} isResizing={isResizing} />}
    </div>
  );
}

export default function Accordion({ items }: any) {
  // This is fine for prototyping but there's a cleaner way to do this.
  const [collapsed, setCollapsed] = useState<CollapsedState>(new Array(items.length).fill(true));
  const [creases, setCreases] = useState<CreasesState>(new Array(items.length).fill(HEADER_HEIGHT));

  const [resizingParams, setResizingParams] = useState<{
    index: number;
    initialY: number;
    originalHeight: number;
  } | null>(null);

  const expandSection = (index: number, newCollapsed: CollapsedState) => {
    let newCreases = embiggenSection(index, creases, newCollapsed);
    setCreases(newCreases);
  };
  const collapseSection = (index: number, newCollapsed: CollapsedState) => {
    let newCreases = [...creases];
    newCreases[index] = HEADER_HEIGHT;
    newCreases = maybeRedistributeSpace(index, newCollapsed, newCreases);

    setCreases(newCreases);
  };
  const toggleCollapsed = (index: number) => {
    const isCollapsed = collapsed[index];

    const newCollapsed = [...collapsed];
    newCollapsed[index] = !isCollapsed;
    setCollapsed(newCollapsed);

    if (isCollapsed) {
      expandSection(index, newCollapsed);
    } else {
      collapseSection(index, newCollapsed);
    }
  };

  const onResizeStart = (e: React.MouseEvent, index: number) => {
    // Need this otherwise scroll behavior happens in containers with overflow.
    e.preventDefault();

    setResizingParams({
      index,
      initialY: e.screenY,
      originalHeight: creases[index],
    });
  };
  const onResize = (e: React.MouseEvent) => {
    if (!resizingParams) return;
    const { index, initialY, originalHeight } = resizingParams;

    const newCreases = [...creases];
    const delta = e.screenY - initialY;
    newCreases[index] = originalHeight + delta;

    setCreases(newCreases);
  };
  const onResizeEnd = (e: React.MouseEvent) => {
    if (!resizingParams) return;

    setResizingParams(null);
  };

  const isResizing = !!resizingParams;

  return (
    <div className={classNames("h-full overflow-auto flex flex-col relative")}>
      {items.map((item: any, index: number) => (
        <Section
          key={item}
          index={index}
          collapsed={collapsed}
          toggleCollapsed={toggleCollapsed}
          position={getPosition(creases, index)}
          onResizeStart={e => onResizeStart(e, index)}
          isResizing={isResizing}
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
