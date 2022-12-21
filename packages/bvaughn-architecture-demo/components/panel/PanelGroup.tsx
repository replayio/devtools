import {
  CSSProperties,
  Children,
  DragEvent,
  DragEventHandler,
  ReactElement,
  ReactNode,
  cloneElement,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AutoSizer from "react-virtualized-auto-sizer";

import { PanelContext } from "./PanelContext";
import { Panel } from "./types";
import styles from "./styles.module.css";

type Props = {
  children: ReactNode[];
  className?: string;
  direction: "horizontal" | "vertical";
  handleSize?: number;
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
  handleSize = 5,
  height,
  width,
}: Props & {
  height: number;
  width: number;
}) {
  const [panels, setPanels] = useState<Panel[]>([]);
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
    (id: string) => {
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

  const registerPanel = useCallback((id: string, panel: Panel) => {
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

  const unregisterPanel = useCallback((id: string) => {
    setPanels(prevPanels => {
      const newPanels = prevPanels.concat();
      const index = newPanels.findIndex(panel => panel.id === id);
      if (index >= 0) {
        newPanels.splice(index, 1);
      }
      return newPanels;
    });
  }, []);

  const context = useMemo(
    () => ({
      direction,
      getPanelStyle,
      registerPanel,
      unregisterPanel,
    }),
    [direction, getPanelStyle, registerPanel, unregisterPanel]
  );

  const classNames = [
    className,
    direction === "horizontal" ? styles.HorizontalPanelGroup : styles.VerticalPanelGroup,
  ];

  // TODO [panels]
  // Maybe auto-inserting these resizers isn't the right way to do this.
  // Maybe those should be user-provided, e.g.
  // <PanelResizeHandle className="..." panelBefore="..." panelAfter="..." />
  //
  // This would also allow for more complex interactions, e.g.
  // <PanelMoveHandle panel="..." />
  const renderedChildren = useMemo(() => {
    const childrenArray = Children.toArray(children);
    return childrenArray.map((child, index) => {
      const element = child as unknown as ReactElement;

      let onDrag: DragEventHandler<HTMLDivElement> | null = null;
      if (index > 0) {
        onDrag = (event: DragEvent<HTMLDivElement>) => {
          console.log("onDrag()", element.props.id, event.clientX, "x", event.clientY);

          // TODO Resize the current panel
          // TODO Resize panel(s) before to make space
        };
      }

      return cloneElement(element, { key: element.props.key || index, onDrag });
    });
  }, [children]);

  return (
    <PanelContext.Provider value={context}>
      <div className={classNames.join(" ")}>{renderedChildren}</div>
    </PanelContext.Provider>
  );
}
