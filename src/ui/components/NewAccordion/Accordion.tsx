import classNames from "classnames";
import React, {
  MouseEventHandler,
  Children,
  ReactElement,
  useEffect,
  useReducer,
  useRef,
  FC,
} from "react";
import { Dispatch } from "react";
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
  AccordionAction,
} from "./reducer";

export const MIN_HEIGHT = 150;
export const BORDER_HEIGHT = 1;
export const HANDLE_HEIGHT = 4;
export const HEADER_HEIGHT = 24 + BORDER_HEIGHT;

// When I wrote this code God and I knew what I was doing. Now only God knows.

export interface AccordionItem {
  component: React.ReactNode;
  header: string;
  expanded: boolean;
  className?: string;
  onToggle?: () => void;
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

export function AccordionPane({
  children,
  header,
  index,
  expanded,
  className,
  dispatch = () => ({}),
  isBeingResized = false,
  _expanded = false,
  isResizable = false,
  height = 0,
  onToggle = () => ({}),
  onResizeStart = () => ({}),
}: {
  children: React.ReactNode;
  header: string;
  dispatch?: Dispatch<AccordionAction>;
  expanded?: boolean;
  index?: number;
  className?: string;
  isBeingResized?: boolean;
  _expanded?: boolean;
  isResizable?: boolean;
  height?: SectionHeight;
  onToggle: () => void;
  onResizeStart?: (e: React.MouseEvent) => void;
}) {
  // Whenever the real `expanded` state changes, make sure we update the Accordion's
  // internal `_expanded` state to reflect the change.
  useEffect(() => {
    dispatch(expanded ? expandSection(index!) : collapseSection(index!));
  }, [expanded]);

  return (
    <div
      className={classNames("group relative h-full w-full", { className })}
      style={{
        height,
        minHeight: _expanded ? MIN_HEIGHT : "auto",
      }}
    >
      {isResizable && <ResizeHandle onResizeStart={onResizeStart} isResizing={isBeingResized} />}
      <div className="flex h-full w-full flex-col overflow-hidden">
        <div className={classNames("border-b", index! > 0 ? "border-black" : "border-gray-200")} />
        <button
          className="flex w-full space-x-2 bg-gray-200 px-2 font-bold"
          onClick={() => onToggle()}
        >
          <div className="font-mono">{_expanded ? `v` : `>`}</div>
          <div>{header}</div>
        </button>
        <div className="flex-grow overflow-auto">{_expanded && children}</div>
      </div>
    </div>
  );
}

// Accordion component -> throw error
// AccordionImpl -> AccordionProps & ... {privateOne: null}
// clone (React.createElement(AccordionImpl, accordionImplProps))
// A
// Alternative: __

// Approach 2: React context
// One layer deep context, pane to reset it to null

export const Accordion: FC<{
  children: ReactElement<typeof AccordionPane>[];
}> = ({ children }) => {
  const initialExpandedState = Children.map(children, c => c.props.expanded);
  const [state, dispatch] = useReducer(reducer, getInitialState(initialExpandedState));
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

  const newChildren = React.Children.map(children, (child, index) => {
    const childProps = {
      index,
      dispatch,
      _expanded: !getIsCollapsed(state, index),
      toggleCollapsed: () => toggleCollapsed(index),
      height: getHeight(state, index),
      isResizable: getIsIndexResizable(state, index),
      onResizeStart: (e: React.MouseEvent) => onResizeStart(e, index),
      isBeingResized: isResizing && resizingParams?.initialIndex === index,
    };

    return React.cloneElement(child, childProps);
  });

  return (
    <div className="relative flex h-full flex-col overflow-auto" ref={containerRef}>
      {newChildren}
      {isResizing ? <ResizeMask onMouseUp={onResizeEnd} onMouseMove={onResize} /> : null}
    </div>
  );
};

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
