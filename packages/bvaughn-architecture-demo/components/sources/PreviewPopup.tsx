import { FocusContext } from "@bvaughn/src/contexts/FocusContext";
import { runAnalysis } from "@bvaughn/src/suspense/AnalysisCache";
import { SourceLocation } from "@replayio/protocol";
import { RefObject, Suspense, useContext } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import SourcePreviewInspector from "../inspector/SourcePreviewInspector";

import Popup from "../Popup";

import styles from "./PreviewPopup.module.css";

type Props = {
  containerRef: RefObject<HTMLElement>;
  expression: string;
  // location: SourceLocation;
  target: HTMLElement;
};

function SuspendingPreviewPopup({ containerRef, expression, target }: Props) {
  const client = useContext(ReplayClientContext);
  const { range } = useContext(FocusContext);

  // HACK Setup a Suspense cache and Client API for this
  // const { returned } = await ThreadFront.evaluateNew({
  //   asyncIndex: selectedFrame.asyncIndex,
  //   frameId: selectedFrame.protocolId,
  //   text: expression,
  // });

  return (
    <Popup containerRef={containerRef} target={target} showTail={true}>
      <div className={styles.PreviewPopup}>{expression}</div>
    </Popup>
  );
}

export default function PreviewPopup(props: Props) {
  return (
    <Suspense fallback={null}>
      <SuspendingPreviewPopup {...props} />
    </Suspense>
  );
}
