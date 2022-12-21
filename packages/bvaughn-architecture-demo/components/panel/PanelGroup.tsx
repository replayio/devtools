import {
  CSSProperties,
  DragEvent,
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
  positions: number[];
};

function PanelGroup({ children, className = "", direction, height, width }: Props) {
  const panelsRef = useRef<Panel[]>([]);

  // TODO [panels]
  // Serialize state to local storage between sessions.
  // State should include registered panel ids; if those change we should reset persisted state.
  const [state, setState] = useState<State>({
    direction,
    panels: [],
    positions: [],
  });

  // Share the latest (committed) state with callbacks to avoid unnecessarily re-creating them.
  const stateRef = useRef<State>(state);
  useLayoutEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Once all panels have registered themselves,
  // Compute the initial positions based on default weights.
  // This assumes that panels register during initial mount (no conditional rendering)!
  useLayoutEffect(() => {
    const panels = panelsRef.current;

    const totalWeight = panels.reduce((weight, panel) => {
      return weight + panel.defaultWeight;
    }, 0);

    const positions = panels.map(panel => panel.defaultWeight / totalWeight);

    setState(prevState => ({
      ...prevState,
      panels,
      positions,
    }));
  }, []);

  const getPanelStyle = useCallback(
    (id: PanelId) => {
      const index = state.panels.findIndex(panel => panel.id === id);
      const position = state.positions[index];
      if (position == null) {
        return {};
      }

      const isHorizontal = state.direction === "horizontal";

      let left = 0;
      let top = 0;
      const style: CSSProperties = {
        height,
        position: "absolute",
        width,
      };

      for (let index = 0; index < state.positions.length; index++) {
        const panel = state.panels[index];
        const position = state.positions[index];
        const size = isHorizontal ? position * width : position * height;

        if (panel.id === id) {
          if (isHorizontal) {
            style.width = size;
          } else {
            style.height = size;
          }

          break;
        } else {
          if (isHorizontal) {
            left += size;
          } else {
            top += size;
          }
        }
      }

      return {
        ...style,
        left,
        top,
      };
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
    return (event: DragEvent<HTMLDivElement>) => {
      console.log(`onDrag() ${idBefore}-${idAfter} ~ ${event.clientX}x${event.clientY}`);

      const { panels, positions } = stateRef.current;

      // A resizing panel should only affect panels before it.
      //
      // In the case of a contracting panel:
      // It may only affect the panel immediately before it, provided that panel has adequate room to grow.
      // Otherwise it will affect prior panels as well.
      //
      // In the case of an expanding panel:
      // Only the panel immediately before it will be affected.

      // TODO [panels]
      // Resize the current panel and resize panel(s) before to make space.

      // TODO [panels]
      // Observe min/max weight values.
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
