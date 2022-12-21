import Panel from "bvaughn-architecture-demo/components/panel/Panel";
import PanelGroup from "bvaughn-architecture-demo/components/panel/PanelGroup";
import PanelResizeHandle from "bvaughn-architecture-demo/components/panel/PanelResizeHandle";

import styles from "./styles.module.css";

export default function SourceAndConsole() {
  return (
    <div className={styles.FullHeightAndWidth}>
      <PanelGroup direction="horizontal">
        <Panel className={styles.Panel} defaultWeight={1} id="source-explorer">
          <div className={styles.Filler}>Explorer</div>
        </Panel>
        <Panel className={styles.Panel} defaultWeight={3} id="source">
          <PanelResizeHandle panelBefore="source-explorer" panelAfter="source" />
          <div className={styles.Filler}>Sources</div>
          <PanelResizeHandle panelBefore="source" panelAfter="toolbox" />
        </Panel>
        <Panel className={styles.Panel} defaultWeight={2} id="toolbox">
          <div className={styles.Grower}>
            <PanelGroup direction="vertical">
              <Panel className={styles.Panel} defaultWeight={1} id="canvas">
                <div className={styles.Filler}>Canvas</div>
              </Panel>
              <Panel className={styles.Panel} defaultWeight={2} id="console">
                <PanelResizeHandle panelBefore="canvas" panelAfter="console" />
                <div className={styles.Filler}>Console</div>
              </Panel>
            </PanelGroup>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
