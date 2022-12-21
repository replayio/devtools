import { DragEventHandler, ReactNode, useContext, useLayoutEffect } from "react";

import { PanelContext } from "./PanelContext";
import styles from "./styles.module.css";

export default function Panel({
  children,
  className = "",
  defaultWeight = 1,
  enabled = true,
  id,
  maxWeight = 0.9,
  minWeight = 0.1,
  onDrag = null,
}: {
  children: ReactNode;
  className?: string;
  defaultWeight?: number;
  enabled?: boolean;
  id: string;
  maxWeight?: number;
  minWeight?: number;
  onDrag?: DragEventHandler<HTMLDivElement> | null;
}) {
  const context = useContext(PanelContext);
  if (context === null) {
    throw Error(`Panel components must be rendered within a PanelGroup container`);
  }

  const { getPanelStyle, registerPanel, unregisterPanel } = context;

  useLayoutEffect(() => {
    const panel = {
      defaultWeight,
      enabled,
      id,
      maxWeight,
      minWeight,
    };

    registerPanel(id, panel);

    return () => {
      unregisterPanel(id);
    };
  }, [defaultWeight, enabled, maxWeight, minWeight, registerPanel, id, unregisterPanel]);

  const style = getPanelStyle(id);

  return (
    <div className={[className, styles.Panel].join(" ")} style={style}>
      {onDrag !== null && (
        <div className={styles.Handle} draggable onDrag={onDrag}>
          <div className={styles.HandleLine}></div>
        </div>
      )}
      {children}
    </div>
  );
}
