import { CSSProperties, FC, ReactNode, useEffect, useRef, useState } from "react";
import { debounce } from "devtools/shared/debounce";
import cx from "classnames";
import Draggable from "devtools/client/shared/components/splitter/Draggable";

const dispatchResize = debounce(() => window.dispatchEvent(new Event("resize")), 50, {});

type CSSSize = `${number}px` | `${number}` | `${number}%`;

type SplitterProps = {
  className?: string;
  initialSize: CSSSize;
  startPanel?: ReactNode;
  minSize?: CSSSize;
  maxSize?: CSSSize;
  endPanel?: ReactNode;
  endPanelControl?: boolean;
  splitterSize?: number;
  vert?: boolean;
  style?: object;
  onControlledPanelResized?: Function;
  onMove?: Function;
  onResizeEnd?: (size: CSSSize) => void;
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
  const [defaultCursor, setDefaultCursor] = useState<string>("auto");
  const [size, setSize] = useState<CSSSize>(initialSize || "0");

  const splitBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onControlledPanelResized?.(size);
  }, [size, onControlledPanelResized]);

  useEffect(() => {
    const nodeBounds = splitBoxRef.current!.getBoundingClientRect();
    const splitBoxWidthOrHeight = vert ? nodeBounds.width : nodeBounds.height;

    const sizePx = (() => {
      if (size.endsWith("%")) {
        return parseFloat(size) * 0.01 * splitBoxWidthOrHeight;
      }
      return parseFloat(size);
    })();

    setSize(`${getConstrainedSizeInPx(sizePx, splitBoxWidthOrHeight)}px`);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    setDefaultCursor(defaultCursor);
  };

  const onStopMoveHandler = () => {
    const doc = splitBoxRef.current!.ownerDocument;
    doc.documentElement.style.cursor = defaultCursor;

    splitBoxRef.current!.classList.remove("dragging");

    onResizeEnd?.(size);
  };

  const onMoveHandler = (x: number, y: number) => {
    const nodeBounds = splitBoxRef.current!.getBoundingClientRect();

    let size: number = 0;

    if (vert) {
      size = endPanelControl ? nodeBounds.left + nodeBounds.width - x : x - nodeBounds.left;
      setSize(`${getConstrainedSizeInPx(size, nodeBounds.width)}px`);
    } else {
      size = endPanelControl ? nodeBounds.top + nodeBounds.height - y : y - nodeBounds.top;
      setSize(`${getConstrainedSizeInPx(size, nodeBounds.height)}px`);
    }

    // Fire resize events at the window occasionally so that any visible
    // CodeMirror instance can respond to the update.
    dispatchResize();

    onMove?.(size);
  };

  const leftPanelStyle: CSSProperties = {};
  const rightPanelStyle: CSSProperties = {};

  if (vert) {
    leftPanelStyle.maxWidth = endPanelControl ? undefined : maxSize;
    leftPanelStyle.minWidth = endPanelControl ? undefined : minSize;
    leftPanelStyle.width = endPanelControl ? undefined : size;

    rightPanelStyle.maxWidth = endPanelControl ? maxSize : undefined;
    rightPanelStyle.minWidth = endPanelControl ? minSize : undefined;
    rightPanelStyle.width = endPanelControl ? size : undefined;
  } else {
    leftPanelStyle.maxHeight = endPanelControl ? undefined : maxSize;
    leftPanelStyle.minHeight = endPanelControl ? undefined : minSize;
    leftPanelStyle.height = endPanelControl ? undefined : size;

    rightPanelStyle.maxHeight = endPanelControl ? maxSize : undefined;
    rightPanelStyle.minHeight = endPanelControl ? minSize : undefined;
    rightPanelStyle.height = endPanelControl ? size : undefined;
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
