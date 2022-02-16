import classNames from "classnames";
import React, { MouseEventHandler, useEffect, useReducer, useRef } from "react";
import {
  collapseSection,
  containerResize,
  endResizing,
  expandSection,
  getInitialState,
  getIsCollapsed,
  getIsIndexResizable,
  getIsResizing,
  getHeight,
  getResizingParams,
  reducer,
  resize,
  startResizing,
} from "./reducer";

export const MIN_HEIGHT = 150;
export const BORDER_HEIGHT = 1;
export const HANDLE_HEIGHT = 4;
export const HEADER_HEIGHT = 24 + BORDER_HEIGHT;

// When I wrote this code God and I knew what I was doing. Now only God knows.

export interface AccordionItem {
  className?: string;
  component: React.ReactNode;
  header: string;
  onToggle?: (open: boolean) => void;
  collapsed?: boolean;
  button?: React.ReactNode;
}
export type SectionHeight = string | number;
export type CollapsedState = boolean[];
export type CreasesState = number[];

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
        "absolute w-full border-transparent hover:border-blue-400",
        isResizing ? "border-blue-400" : ""
      )}
      style={{
        cursor: "ns-resize",
        borderBottomWidth: `${HANDLE_HEIGHT}px`,
        top: `${BORDER_HEIGHT - HANDLE_HEIGHT}px`,
      }}
      onMouseDown={onResizeStart}
    />
  );
}

function Section({
  children,
  index,
  isCollapsed,
  isBeingResized,
  isResizable,
  height,
  toggleCollapsed,
  onResizeStart,
}: {
  children: React.ReactNode;
  index: number;
  isBeingResized: boolean;
  isCollapsed: boolean;
  isResizable: boolean;
  height: SectionHeight;
  toggleCollapsed: (index: number) => void;
  onResizeStart: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      className="relative h-full w-full"
      style={{
        height,
        minHeight: isCollapsed ? "auto" : MIN_HEIGHT,
      }}
    >
      {isResizable && <ResizeHandle onResizeStart={onResizeStart} isResizing={isBeingResized} />}
      <div className="flex h-full w-full flex-col overflow-hidden">
        <div className={classNames("border-b", index > 0 ? "border-black" : "border-gray-200")} />
        <button
          className="flex w-full space-x-2 bg-gray-200 px-2 font-bold"
          onClick={() => toggleCollapsed(index)}
        >
          <div className="font-mono">{isCollapsed ? `>` : `v`}</div>
          <div>{`Section ${index + 1} `}</div>
        </button>
        <div className="flex-grow overflow-auto">{!isCollapsed && children}</div>
      </div>
    </div>
  );
}

export default function Accordion({ items }: any) {
  const [state, dispatch] = useReducer(reducer, getInitialState(items.length));
  const isResizing = getIsResizing(state);
  const resizingParams = getResizingParams(state);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const toggleCollapsed = (index: number) => {
    const isCollapsed = getIsCollapsed(state, index);

    if (isCollapsed) {
      dispatch(expandSection(index));
    } else {
      dispatch(collapseSection(index));
    }
  };
  const onResizeStart = (e: React.MouseEvent, index: number) => {
    // This is here because otherwise, the mouse click that initiates onResizeStart
    // will trigger some scroll behavior happens in containers with overflow
    e.preventDefault();

    dispatch(startResizing(index, e.screenY));
  };
  const onResize = (e: React.MouseEvent) => {
    dispatch(resize(e.screenY));
  };
  const onResizeEnd = (e: React.MouseEvent) => {
    dispatch(endResizing());
  };

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      const { height } = entries[0].target.getBoundingClientRect();
      dispatch(containerResize(height));
    });

    resizeObserver.observe(containerRef.current!);
  }, []);

  return (
    <div className="relative flex h-full flex-col overflow-auto" ref={containerRef}>
      {items.map((item: any, index: number) => (
        <Section
          key={index}
          index={index}
          isCollapsed={getIsCollapsed(state, index)}
          toggleCollapsed={toggleCollapsed}
          height={getHeight(state, index)}
          isResizable={getIsIndexResizable(state, index)}
          onResizeStart={e => onResizeStart(e, index)}
          isBeingResized={isResizing && resizingParams?.initialIndex === index}
        >
          {item.component}
        </Section>
      ))}
      {isResizing ? <ResizeMask onMouseUp={onResizeEnd} onMouseMove={onResize} /> : null}
    </div>
  );
}

// We render this full screen mask while an Accordion pane is being resized so that we can
// track the user's mouse position across the entire screen. Otherwise, the Accordion is
// non-reactive to any mouse events outside its bounds.

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
      className="fixed top-0 left-0 h-full w-full"
      style={{ cursor: "ns-resize" }}
    />
  );
}
