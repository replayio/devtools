import classNames from "classnames";
import React, { MouseEventHandler, useReducer } from "react";
import {
  collapseSection,
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
      className="absolute w-full h-full"
      style={{ ...position, transition: isResizing ? "" : "all 0.1s ease-in-out" }}
    >
      {isResizable && <ResizeHandle onResizeStart={onResizeStart} isResizing={isBeingResized} />}
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
      className="h-full w-full fixed top-0 left-0 bg-black opacity-50"
      style={{ cursor: "ns-resize" }}
    />
  );
}
