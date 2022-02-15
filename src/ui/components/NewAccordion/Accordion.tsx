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
  getPosition,
  getResizingParams,
  reducer,
  resize,
  startResizing,
} from "./reducer";
import { BORDER_HEIGHT, HANDLE_HEIGHT } from "./utils";

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
  isResizing,
  position,
  toggleCollapsed,
  onResizeStart,
}: {
  children: React.ReactNode;
  index: number;
  isBeingResized: boolean;
  isCollapsed: boolean;
  isResizable: boolean;
  isResizing: boolean;
  position: SectionPosition;
  toggleCollapsed: (index: number) => void;
  onResizeStart: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      className="absolute h-full w-full"
      style={{ ...position, transition: isResizing ? "" : "all 0.1s ease-in-out" }}
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

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      const { height } = entries[0].target.getBoundingClientRect();
      dispatch(containerResize(height));
    });

    resizeObserver.observe(containerRef.current!);
  }, []);

  console.log({ state, items });

  return (
    <div className="relative flex h-full flex-col overflow-auto" ref={containerRef}>
      {items.map((item: any, index: number) => (
        <Section
          key={index}
          index={index}
          isCollapsed={getIsCollapsed(state, index)}
          toggleCollapsed={toggleCollapsed}
          position={getPosition(state, index)}
          isResizable={getIsIndexResizable(state, index)}
          onResizeStart={e => onResizeStart(e, index)}
          isResizing={isResizing}
          isBeingResized={isResizing && resizingParams?.initialIndex === index}
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
      className="fixed top-0 left-0 h-full w-full"
      // className="fixed top-0 left-0 h-full w-full bg-black opacity-50" // display the mask area for debugging
      style={{ cursor: "ns-resize" }}
    />
  );
}
