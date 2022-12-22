import Panel from "bvaughn-architecture-demo/components/panel/Panel";
import PanelGroup from "bvaughn-architecture-demo/components/panel/PanelGroup";
import PanelResizeHandle from "bvaughn-architecture-demo/components/panel/PanelResizeHandle";

import styles from "./panels.module.css";

export default function SourceAndConsole() {
  return (
    <div className={styles.FullHeightAndWidth}>
      <PanelGroup direction="horizontal">
        <Panel className={styles.Panel} defaultSize={0.2} id="left">
          <div className={styles.HorizontalFiller}>left [1]</div>
        </Panel>
        <Panel className={styles.Panel} defaultSize={0.4} id="middle">
          <PanelResizeHandle
            className={styles.HorizontalResizeHandle}
            panelBefore="left"
            panelAfter="middle"
          />
          <div className={styles.HorizontalFiller}>middle [3]</div>
          <PanelResizeHandle
            className={styles.HorizontalResizeHandle}
            panelBefore="middle"
            panelAfter="stacked"
          />
        </Panel>
        <Panel className={styles.Panel} defaultSize={0.3} id="stacked">
          <div className={styles.Grower}>
            <PanelGroup direction="vertical">
              <Panel className={styles.Panel} defaultSize={0.4} id="top">
                <div className={styles.VerticalFillerTop}>top [2, 1]</div>
              </Panel>
              <Panel className={styles.Panel} defaultSize={0.6} id="bottom">
                <PanelResizeHandle panelBefore="top" panelAfter="bottom">
                  <div className={styles.VerticalResizeBar} />
                </PanelResizeHandle>
                <div className={styles.VerticalFillerBottom}>
                  <PanelGroup direction="horizontal">
                    <Panel className={styles.Panel} defaultSize={0.5} id="bottom-left">
                      <div className={styles.HorizontalFillerLeft}>bottom-left [2, 2, 1]</div>
                    </Panel>
                    <Panel className={styles.Panel} defaultSize={0.5} id="bottom-right">
                      <PanelResizeHandle panelBefore="bottom-left" panelAfter="bottom-right">
                        <div className={styles.HorizontalResizeBar} />
                      </PanelResizeHandle>
                      <div className={styles.HorizontalFillerRight}>bottom-right [2, 2, 1]</div>
                    </Panel>
                  </PanelGroup>
                </div>
              </Panel>
            </PanelGroup>
          </div>
        </Panel>
        <Panel className={styles.Panel} defaultSize={0.2} id="right">
          <PanelResizeHandle
            className={styles.HorizontalResizeHandle}
            panelBefore="stacked"
            panelAfter="right"
          />
          <div className={styles.HorizontalFiller}>right [1]</div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
