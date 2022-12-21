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
import AutoSizer from "react-virtualized-auto-sizer";

import { PanelContext } from "./PanelContext";
import { Panel, PanelId, ResizeHandler } from "./types";
import styles from "./styles.module.css";

type Props = {
  children: ReactNode[];
  className?: string;
  direction: "horizontal" | "vertical";
};

export default function AutoSizedPanelGroup(props: Props) {
  return (
    <AutoSizer>
      {({ height, width }) => <PanelGroup {...props} height={height} width={width} />}
    </AutoSizer>
  );
}

// TODO Persist weights using localStorage
function PanelGroup({
  children,
  className = "",
  direction,
  height,
  width,
}: Props & {
  height: number;
  width: number;
}) {
  const [panels, setPanels] = useState<Panel[]>([]);
  const [resizeHandlers, setResizeHandlers] = useState<ResizeHandler[]>([]);
  const [weights, setWeights] = useState<Map<string, number>>(new Map());

  const weightsRef = useRef<Map<string, number>>(weights);

  useLayoutEffect(() => {
    // This assumes that all panels register at the same time (during initial mount)
    // Otherwise it will erase/reset panel weights
    let totalWeight = 0;
    panels.forEach(panel => {
      totalWeight += panel.defaultWeight;
    });
    const weights = new Map();
    panels.forEach(panel => {
      weights.set(panel.id, panel.defaultWeight / totalWeight);
    });
    setWeights(weights);
  }, [panels]);

  const getPanelStyle = useCallback(
    (id: PanelId) => {
      const weight = weights.get(id);
      if (weight == null) {
        return {};
      }

      let left = 0;
      let top = 0;
      const style: CSSProperties = {
        height,
        position: "absolute",
        width,
      };

      let didBreak = false;

      weights.forEach((weight, currentUid) => {
        if (didBreak) {
          return;
        }

        const size = direction === "horizontal" ? weight * width : weight * height;

        if (currentUid === id) {
          if (direction === "horizontal") {
            style.width = size;
          } else {
            style.height = size;
          }
          didBreak = true;
        } else {
          if (direction === "horizontal") {
            left += size;
          } else {
            top += size;
          }
        }
      });

      return {
        ...style,
        left,
        top,
      };
    },
    [direction, height, weights, width]
  );

  const registerPanel = useCallback((id: PanelId, panel: Panel) => {
    setPanels(prevPanels => {
      const newPanels = prevPanels.concat();
      const index = newPanels.findIndex(panel => panel.id === id);
      if (index >= 0) {
        newPanels.splice(index, 1);
      }
      newPanels.push(panel);
      return newPanels;
    });
  }, []);

  const unregisterPanel = useCallback((id: PanelId) => {
    setPanels(prevPanels => {
      const newPanels = prevPanels.concat();
      const index = newPanels.findIndex(panel => panel.id === id);
      if (index >= 0) {
        newPanels.splice(index, 1);
      }
      return newPanels;
    });
  }, []);

  const registerResizeHandle = useCallback((idBefore: PanelId, idAfter: PanelId) => {
    setResizeHandlers(prevResizeHandlers => {
      const newResizeHandlers = prevResizeHandlers.concat();
      const index = newResizeHandlers.findIndex(
        resizeHandler => resizeHandler.idBefore === idBefore && resizeHandler.idAfter === idAfter
      );
      if (index >= 0) {
        newResizeHandlers.splice(index, 1);
      }
      newResizeHandlers.push({
        idAfter,
        idBefore,
      });
      return newResizeHandlers;
    });

    return (event: DragEvent<HTMLDivElement>) => {
      console.log(`onDrag() ${idBefore}-${idAfter} ~ ${event.clientX}x${event.clientY}`);

      // TODO [panels]
      // Resize the current panel and resize panel(s) before to make space.

      // TODO [panels]
      // Account for min/max weight values.
    };
  }, []);

  const unregisterResizeHandle = useCallback((idBefore: PanelId, idAfter: PanelId) => {
    setResizeHandlers(prevResizeHandlers => {
      const newResizeHandlers = prevResizeHandlers.concat();
      const index = newResizeHandlers.findIndex(
        resizeHandler => resizeHandler.idBefore === idBefore && resizeHandler.idAfter === idAfter
      );
      if (index >= 0) {
        newResizeHandlers.splice(index, 1);
      }
      return newResizeHandlers;
    });
  }, []);

  const context = useMemo(
    () => ({
      direction,
      getPanelStyle,
      registerPanel,
      registerResizeHandle,
      unregisterPanel,
      unregisterResizeHandle,
    }),
    [
      direction,
      getPanelStyle,
      registerPanel,
      registerResizeHandle,
      unregisterPanel,
      unregisterResizeHandle,
    ]
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
