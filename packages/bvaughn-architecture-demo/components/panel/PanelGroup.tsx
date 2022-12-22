import {
  CSSProperties,
  ReactNode,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import withAutoSizer from "bvaughn-architecture-demo/src/utils/withAutoSizer";

import { PanelContext } from "./PanelContext";
import { Panel, PanelId } from "./types";
import styles from "./styles.module.css";

type Props = {
  children: ReactNode[];
  className?: string;
  direction: "horizontal" | "vertical";
  height: number;
  width: number;
};

type State = {
  direction: "horizontal" | "vertical";
  panels: Panel[];
  // 0-1 values representing the relative size of each panel.
  sizes: number[];
};

// TODO [panels]
// Within a drag, remember original positions to refine more easily on expand.
// Look at what the Chrome devtools Sources does

function PanelGroup({ children, className = "", direction, height, width }: Props) {
  const panelsRef = useRef<Panel[]>([]);

  // TODO [panels]
  // Serialize state to local storage between sessions.
  // State should include registered panel ids; if those change we should reset persisted state.
  const [state, setState] = useState<State>({
    direction,
    panels: [],
    sizes: [],
  });

  // Share the latest (committed) state with callbacks to avoid unnecessarily re-creating them.
  const stateRef = useRef<State>(state);
  useLayoutEffect(() => {
    stateRef.current = state;
  }, [state]);

  const sizeRef = useRef({ height, width });
  useLayoutEffect(() => {
    sizeRef.current.height = height;
    sizeRef.current.width = width;
  }, [height, width]);

  // Once all panels have registered themselves,
  // Compute the initial sizes based on default weights.
  // This assumes that panels register during initial mount (no conditional rendering)!
  useLayoutEffect(() => {
    const panels = panelsRef.current;

    const totalWeight = panels.reduce((weight, panel) => {
      return weight + panel.defaultSize;
    }, 0);

    const sizes = panels.map(panel => panel.defaultSize / totalWeight);

    setState(prevState => ({
      ...prevState,
      panels,
      sizes,
    }));
  }, []);

  const getPanelStyle = useCallback(
    (id: PanelId): CSSProperties => {
      const offset = getOffset(id, state, height, width);
      const size = getSize(id, state, height, width);

      if (state.direction === "horizontal") {
        return {
          height: "100%",
          position: "absolute",
          left: offset,
          top: 0,
          width: size,
        };
      } else {
        return {
          height: size,
          position: "absolute",
          left: 0,
          top: offset,
          width: "100%",
        };
      }
    },
    [height, state, width]
  );

  const registerPanel = useCallback((id: PanelId, panel: Panel) => {
    const panels = panelsRef.current;
    const index = panels.findIndex(panel => panel.id === id);
    if (index >= 0) {
      panels.splice(index, 1);
    }
    panels.push(panel);
  }, []);

  const registerResizeHandle = useCallback((idBefore: PanelId, idAfter: PanelId) => {
    return (event: MouseEvent) => {
      event.preventDefault();

      const { height, width } = sizeRef.current;

      const isHorizontal = stateRef.current.direction === "horizontal";
      const movement = isHorizontal ? event.movementX : event.movementY;
      const delta = isHorizontal ? movement / width : movement / height;

      const prevState = stateRef.current;
      const nextState = adjustByDelta(idBefore, idAfter, delta, prevState);
      if (prevState !== nextState) {
        setState(nextState);
      }
    };
  }, []);

  const context = useMemo(
    () => ({
      direction,
      getPanelStyle,
      registerPanel,
      registerResizeHandle,
    }),
    [direction, getPanelStyle, registerPanel, registerResizeHandle]
  );

  return (
    <PanelContext.Provider value={context}>
      <div
        className={[
          className,
          direction === "horizontal" ? styles.HorizontalPanelGroup : styles.VerticalPanelGroup,
        ].join(" ")}
      >
        {children}
      </div>
    </PanelContext.Provider>
  );
}

export default withAutoSizer<Props>(PanelGroup);

function adjustByDelta(
  idBefore: PanelId,
  idAfter: PanelId,
  delta: number,
  prevState: State
): State {
  if (delta === 0) {
    return prevState;
  }

  const { panels, sizes } = prevState;

  const nextSizes = sizes.concat();

  let didChange = false;

  // A resizing panel affects the panels before or after it.
  //
  // In the case of a contracting panel, it may affect one or more of the panels before it.
  // In the case of an expanding panel, it may affect one or more of the panels after it.
  if (delta < 0) {
    let deltaApplied = 0;

    // A negative delta means the panel after the resizer should "expand" by decreasing its offset.
    // Other panels may also need to shift (to "contract") to make room, depending on the min weights.
    const indexBefore = panels.findIndex(panel => panel.id === idBefore);
    for (let index = indexBefore; index >= 0; index--) {
      const panel = panels[index];
      const prevSize = sizes[index];

      const nextSize = nextSizes[index] + delta;
      const nextSizeSafe = Math.max(nextSize, panel.minSize);
      if (nextSizeSafe !== prevSize) {
        deltaApplied += prevSize - nextSizeSafe;

        didChange = true;
        nextSizes[index] = nextSizeSafe;
        delta -= nextSizeSafe - nextSize;
        delta -= prevSize - nextSizeSafe;
        if (delta <= 0) {
          break;
        }
      }
    }

    if (deltaApplied > 0) {
      const indexAfter = panels.findIndex(panel => panel.id === idAfter);
      const prevSizeAfter = sizes[indexAfter];
      const nextSizeAfter = prevSizeAfter + deltaApplied;
      nextSizes[indexAfter] = nextSizeAfter;
    }
  } else {
    // A positive delta means the panel before the resizer should "expand" and the panel after should "contract".
    // Subsequent panels should not be impacted.
    const indexBefore = panels.findIndex(panel => panel.id === idBefore);
    const prevSizeBefore = sizes[indexBefore];
    const nextSizeBefore = nextSizes[indexBefore] + delta;
    console.log(`before "${idBefore}"\t${prevSizeBefore}\t${nextSizeBefore}}`);

    if (prevSizeBefore !== nextSizeBefore) {
      const maxDelta = nextSizeBefore - prevSizeBefore;

      const indexAfter = panels.findIndex(panel => panel.id === idAfter);
      const panelAfter = panels[indexAfter];
      const prevSizeAfter = sizes[indexAfter];
      const nextSizeAfter = nextSizes[indexAfter] - maxDelta;
      const nextSizeAfterSafe = Math.max(nextSizeAfter, panelAfter.minSize);
      console.log(`after "${idAfter}"\t${prevSizeAfter}\t${nextSizeAfterSafe}}`);

      if (prevSizeAfter !== nextSizeAfterSafe) {
        didChange = true;
        nextSizes[indexBefore] = nextSizeBefore;
        nextSizes[indexAfter] = nextSizeAfterSafe;
      }
    }
  }

  // If we were unable to resize any of the panels panels, return the previous state.
  // This will essentially bailout and ignore the "mousemove" event.
  if (!didChange) {
    return prevState;
  }

  return {
    ...prevState,
    sizes: nextSizes,
  };
}

function getOffset(id: PanelId, state: State, height: number, width: number): number {
  let index = state.panels.findIndex(panel => panel.id === id);
  if (index < 0) {
    return 0;
  }

  let scaledOffset = 0;

  for (index = index - 1; index >= 0; index--) {
    const panel = state.panels[index];
    scaledOffset += getSize(panel.id, state, height, width);
  }

  return Math.round(scaledOffset);
}

function getSize(id: PanelId, state: State, height: number, width: number): number {
  const { direction, panels, sizes } = state;

  const index = panels.findIndex(panel => panel.id === id);
  const size = sizes[index];
  if (size == null) {
    return 0;
  }

  const totalSize = direction === "horizontal" ? width : height;

  if (panels.length === 1) {
    return totalSize;
    // } else if (index === panels.length - 1) {
    // Ensure the last panel always fills the remaining space (no overflow or gap)
    // const offset = getOffset(id, state, height, width);
    // return totalSize - offset;
  } else {
    return Math.round(size * totalSize);
  }
}
