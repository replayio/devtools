import Panel from "bvaughn-architecture-demo/components/panel/Panel";
import PanelGroup from "bvaughn-architecture-demo/components/panel/PanelGroup";
import PanelResizeHandle from "bvaughn-architecture-demo/components/panel/PanelResizeHandle";

import styles from "./panels.module.css";

export default function SourceAndConsole() {
  return (
    <div className={styles.FullHeightAndWidth}>
      <PanelGroup direction="horizontal">
        <Panel className={styles.Panel} defaultWeight={1} id="left">
          <div className={styles.HorizontalFiller}>left [1]</div>
        </Panel>
        <Panel className={styles.Panel} defaultWeight={3} id="middle">
          <PanelResizeHandle
            className={styles.HorizontalResizeHandle}
            panelBefore="left"
            panelAfter="middle"
          />
          <div className={styles.HorizontalFiller}>middle [3]</div>
          <PanelResizeHandle
            className={styles.HorizontalResizeHandle}
            panelBefore="middle"
            panelAfter="three"
          />
        </Panel>
        <Panel className={styles.Panel} defaultWeight={2} id="three">
          <div className={styles.Grower}>
            <PanelGroup direction="vertical">
              <Panel className={styles.Panel} defaultWeight={1} id="top">
                <div className={styles.VerticalFillerTop}>top [2, 1]</div>
              </Panel>
              <Panel className={styles.Panel} defaultWeight={2} id="bottom">
                <PanelResizeHandle panelBefore="top" panelAfter="bottom">
                  <div className={styles.VerticalResizeBar} />
                </PanelResizeHandle>
                <div className={styles.VerticalFillerBottom}>bottom [2, 2]</div>
              </Panel>
            </PanelGroup>
          </div>
        </Panel>
        <Panel className={styles.Panel} defaultWeight={1} id="four">
          <PanelResizeHandle
            className={styles.HorizontalResizeHandle}
            panelBefore="three"
            panelAfter="four"
          />
          <div className={styles.HorizontalFiller}>four [1]</div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
