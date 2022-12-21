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
      return weight + panel.defaultWeight;
    }, 0);

    const sizes = panels.map(panel => panel.defaultWeight / totalWeight);

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
      const { height, width } = sizeRef.current;
      const state = stateRef.current;
      const { direction, panels, sizes } = state;

      // A resizing panel should only affect panels before it.
      //
      // In the case of a contracting panel:
      // It may only affect the panel immediately before it, provided that panel has adequate room to grow.
      // Otherwise it will affect prior panels as well.
      //
      // In the case of an expanding panel:
      // Only the panel immediately before it will be affected.

      const beforeIndex = panels.findIndex(panel => panel.id === idBefore);
      const afterIndex = panels.findIndex(panel => panel.id === idAfter);

      const prevOffset =
        getOffset(idAfter, state, height, width) / (direction === "horizontal" ? width : height);
      const nextOffset =
        direction === "horizontal" ? event.clientX / width : event.clientY / height;

      const delta = prevOffset - nextOffset;

      // TODO [panels]
      // Observe min/max weight values.

      // TODO [panels]
      // Resize the current panel and resize panel(s) before to make space.

      setState(prevState => {
        const sizes = prevState.sizes.concat();
        sizes[beforeIndex] -= delta;
        sizes[afterIndex] += delta;

        return {
          ...prevState,
          sizes,
        };
      });
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
  } else if (index === panels.length - 1) {
    // Ensure the last panel always fills the remaining space (no overflow or gap)
    const offset = getOffset(id, state, height, width);
    return totalSize - offset;
  } else {
    return Math.round(size * totalSize);
  }
}
