import classNames from "classnames";
import React, {
  MouseEventHandler,
  Children,
  Dispatch,
  ReactElement,
  useEffect,
  useReducer,
  useRef,
  FC,
} from "react";
import { HANDLE_HEIGHT, BORDER_HEIGHT, MIN_HEIGHT } from "./constants";

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

// When I wrote this code God and I knew what I was doing. Now only God knows.

export type SectionHeight = string | number;
export type CollapsedState = boolean[];
export type CreasesState = number[];
export interface AccordionItem {
  component: React.ReactNode;
  header: string;
  expanded: boolean;
  className?: string;
  initialHeight?: number;
  onToggle?: () => void;
  button?: React.ReactNode;
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
        "absolute w-full border-splitter hover:border-blue-400",
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
  _expanded = false,
  button,
  children,
  className,
  dispatch = () => ({}),
  expanded,
  header,
  height = 0,
  index,
  initialHeight,
  isBeingResized = false,
  isResizable = false,
  onResizeStart = () => ({}),
  onToggle = () => ({}),
}: {
  _expanded?: boolean;
  button?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  dispatch?: Dispatch<AccordionAction>;
  expanded?: boolean;
  header: string;
  height?: SectionHeight;
  index?: number;
  initialHeight?: number;
  isBeingResized?: boolean;
  isResizable?: boolean;
  onResizeStart?: (e: React.MouseEvent) => void;
  onToggle: () => void;
}) {
  // Whenever the real `expanded` state changes, make sure we update the Accordion's
  // internal `_expanded` state to reflect the change. There's probably a simpler way to
  // do this by intercepting the expanded state in the Accordion so we only have one
  // expanded prop (the one from the Accordion) being considered by the AccordionPane.
  // https://gist.github.com/jaril/dfad5343f141c175d767d21cd6fdaab2
  useEffect(() => dispatch(expanded ? expandSection(index!) : collapseSection(index!)), [expanded]);

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
        <div
          className="flex w-full cursor-pointer items-center justify-between space-x-2 p-2 px-2"
          style={{ fontSize: "15px" }}
          onClick={() => onToggle()}
        >
          <div className="flex select-none items-center space-x-2">
            <div className={classNames("img arrow", { expanded: _expanded })} />
            <span className="overflow-hidden overflow-ellipsis whitespace-pre">{header}</span>
          </div>
          {button ? button : null}
        </div>
        <div className="flex-grow overflow-auto">{_expanded && children}</div>
      </div>
    </div>
  );
}

export const Accordion: FC<{
  children: ReactElement<typeof AccordionPane>[];
}> = ({ children }) => {
  const initialState = Children.map(children, c => {
    if (!c?.hasOwnProperty("props")) {
      return {
        expanded: false,
        initialHeight: undefined,
      };
    }

    return {
      expanded: !!(c as ReactElement).props.expanded ?? false,
      initialHeight: (c as ReactElement).props.initialHeight,
    };
  });
  const [state, dispatch] = useReducer(reducer, getInitialState(initialState!));
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
  const onResize = (e: React.MouseEvent) => dispatch(resize(e.screenY));
  const onResizeEnd = (e: React.MouseEvent) => dispatch(endResizing());

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      const { height } = entries[0].target.getBoundingClientRect();
      dispatch(containerResize(height));
    });

    resizeObserver.observe(containerRef.current!);
  }, []);

  const newChildren = React.Children.map(
    children as ReactElement<typeof AccordionPane>[],
    (child, index) => {
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
    }
  );

  return (
    <div className="relative flex h-full flex-col overflow-auto" ref={containerRef}>
      {state.domHeight ? newChildren : null}
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
