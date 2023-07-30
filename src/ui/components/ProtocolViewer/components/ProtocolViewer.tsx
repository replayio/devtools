import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { ProtocolViewerContextRoot } from "ui/components/ProtocolViewer/components/ProtocolViewerContext";
import { ProtocolViewerList } from "ui/components/ProtocolViewer/components/ProtocolViewerList";
import { RequestDetails } from "ui/components/ProtocolViewer/components/RequestDetails";
import {
  ProtocolErrorMap,
  ProtocolRequestMap,
  ProtocolResponseMap,
} from "ui/reducers/protocolMessages";

import styles from "./ProtocolViewer.module.css";

export function ProtocolViewer({
  errorMap,
  requestMap,
  responseMap,
}: {
  errorMap: ProtocolErrorMap;
  requestMap: ProtocolRequestMap;
  responseMap: ProtocolResponseMap;
}) {
  return (
    <ProtocolViewerContextRoot
      errorMap={errorMap}
      requestMap={requestMap}
      responseMap={responseMap}
    >
      <PanelGroup autoSaveId="ProtocolViewer" className={styles.Container} direction="vertical">
        <Panel id="list" minSize={20}>
          <ProtocolViewerList />
        </Panel>
        <PanelResizeHandle className={styles.PanelResizeHandle} />
        <Panel id="details" minSize={20}>
          <RequestDetails />
        </Panel>
      </PanelGroup>
    </ProtocolViewerContextRoot>
  );
}
