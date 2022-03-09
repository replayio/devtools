import { CSSProperties, FC, ReactNode, useEffect, useRef, useState } from "react";
import { debounce } from "devtools/shared/debounce";
import cx from "classnames";
import Draggable from "devtools/client/shared/components/splitter/Draggable";

const dispatchResize = debounce(() => window.dispatchEvent(new Event("resize")), 50, {});

type SplitterProps = {
  className?: string;
  initialSize?: string;
  startPanel?: ReactNode;
  minSize?: string;
  maxSize?: string;
  endPanel?: ReactNode;
  endPanelControl?: boolean;
  splitterSize?: number;
  vert?: boolean;
  style?: object;
  onControlledPanelResized?: Function;
  onMove?: Function;
  onResizeEnd?: (size: string) => void;
};
const SplitBox: FC<SplitterProps> = ({
  className,
  initialSize,
  startPanel,
  minSize,
  maxSize,
  endPanel,
  style,
  onControlledPanelResized,
  onMove,
  onResizeEnd,
  endPanelControl = false,
  splitterSize = 8,
  vert = true,
}) => {
  const [defaultCursor, setdefaultCursor] = useState<string>("auto");
  const [width, setwidth] = useState<string>(initialSize || "0");
  const [height, setheight] = useState<string>(initialSize || "0");

  const splitBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onControlledPanelResized?.(width, height);
  }, [width, height, onControlledPanelResized]);

  const getConstrainedSizeInPx = (requestedSize: number, splitBoxWidthOrHeight: number): number => {
    let _minSize: number = 0;
    if (minSize?.endsWith("%")) {
      _minSize = (parseFloat(minSize) / 100) * splitBoxWidthOrHeight;
    } else if (minSize?.endsWith("px")) {
      _minSize = parseFloat(minSize);
    }
    return Math.max(requestedSize, _minSize);
  };

  const onStartMoveHandler = () => {
    const doc = splitBoxRef.current!.ownerDocument;
    const defaultCursor = doc.documentElement.style.cursor;
    doc.documentElement.style.cursor = vert ? "ew-resize" : "ns-resize";

    splitBoxRef.current!.classList.add("dragging");

    setdefaultCursor(defaultCursor);
  };

  const onStopMoveHandler = () => {
    const doc = splitBoxRef.current!.ownerDocument;
    doc.documentElement.style.cursor = defaultCursor;

    splitBoxRef.current!.classList.remove("dragging");

    onResizeEnd?.(vert ? width : height);
  };

  const onMoveHandler = (x: number, y: number) => {
    const nodeBounds = splitBoxRef.current!.getBoundingClientRect();

    let size: number = 0;

    if (vert) {
      size = endPanelControl ? nodeBounds.left + nodeBounds.width - x : x - nodeBounds.left;
      setwidth(getConstrainedSizeInPx(size, nodeBounds.width) + "px");
    } else {
      size = endPanelControl ? nodeBounds.top + nodeBounds.height - y : y - nodeBounds.top;
      setheight(getConstrainedSizeInPx(size, nodeBounds.height) + "px");
    }

    // Fire resize events at the window occasionally so that any visible
    // CodeMirror instance can respond to the update.
    dispatchResize();

    onMove?.(size);
  };

  let leftPanelStyle: CSSProperties = {};
  let rightPanelStyle: CSSProperties = {};

  if (vert) {
    leftPanelStyle.maxWidth = endPanelControl ? undefined : maxSize;
    leftPanelStyle.minWidth = endPanelControl ? undefined : minSize;
    leftPanelStyle.width = endPanelControl ? undefined : width;
    rightPanelStyle.maxWidth = endPanelControl ? maxSize : undefined;
    rightPanelStyle.minWidth = endPanelControl ? minSize : undefined;
    rightPanelStyle.width = endPanelControl ? width : undefined;
  } else {
    leftPanelStyle.maxHeight = endPanelControl ? undefined : maxSize;
    leftPanelStyle.minHeight = endPanelControl ? undefined : minSize;
    leftPanelStyle.height = endPanelControl ? undefined : height;
    rightPanelStyle.maxHeight = endPanelControl ? maxSize : undefined;
    rightPanelStyle.minHeight = endPanelControl ? minSize : undefined;
    rightPanelStyle.height = endPanelControl ? height : undefined;
  }

  return (
    <div
      className={cx(
        "split-box",
        {
          vert: vert,
          horz: !vert,
        },
        className
      )}
      style={style}
      ref={splitBoxRef}
    >
      {startPanel && (
        <div className={endPanelControl ? "uncontrolled" : "controlled"} style={leftPanelStyle}>
          {startPanel}
        </div>
      )}
      {startPanel && endPanel && splitterSize > 0 && (
        <Draggable
          className="splitter"
          style={{
            [!vert ? "height" : "width"]: splitterSize,
          }}
          onStart={onStartMoveHandler}
          onStop={onStopMoveHandler}
          onMove={onMoveHandler}
        />
      )}
      {endPanel && (
        <div
          className={endPanelControl ? "controlled" : "uncontrolled overflow-hidden"}
          style={rightPanelStyle}
        >
          {endPanel}
        </div>
      )}
    </div>
  );
};

export default SplitBox;
