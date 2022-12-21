import { ReactNode, useContext, useLayoutEffect } from "react";

import { PanelContext } from "./PanelContext";
import { PanelId } from "./types";
import styles from "./styles.module.css";

export default function Panel({
  children,
  className = "",
  defaultWeight = 1,
  id,
  maxWeight = 0.9,
  minWeight = 0.1,
}: {
  children: ReactNode;
  className?: string;
  defaultWeight?: number;
  id: PanelId;
  maxWeight?: number;
  minWeight?: number;
}) {
  const context = useContext(PanelContext);
  if (context === null) {
    throw Error(`Panel components must be rendered within a PanelGroup container`);
  }

  const { getPanelStyle, registerPanel } = context;

  useLayoutEffect(() => {
    const panel = {
      defaultWeight,
      id,
      maxWeight,
      minWeight,
    };

    registerPanel(id, panel);
  }, [defaultWeight, maxWeight, minWeight, registerPanel, id]);

  const style = getPanelStyle(id);

  return (
    <div className={[className, styles.Panel].join(" ")} style={style}>
      {children}
    </div>
  );
}
