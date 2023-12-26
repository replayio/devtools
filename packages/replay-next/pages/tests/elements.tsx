import { ObjectId, PauseId } from "@replayio/protocol";
import { KeyboardEvent, Suspense, useContext, useEffect, useRef, useState } from "react";

import { ImperativeHandle } from "replay-next/components/elements/ElementsList";
import ElementsPanel from "replay-next/components/elements/index";
import { elementCache } from "replay-next/components/elements/suspense/ElementCache";
import Loader from "replay-next/components/Loader";
import { FocusContextRoot } from "replay-next/src/contexts/FocusContext";
import { KeyboardModifiersContextRoot } from "replay-next/src/contexts/KeyboardModifiersContext";
import { PointsContextRoot } from "replay-next/src/contexts/points/PointsContext";
import { SelectedFrameContextRoot } from "replay-next/src/contexts/SelectedFrameContext";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { SourcesContextRoot } from "replay-next/src/contexts/SourcesContext";
import { TerminalContextRoot } from "replay-next/src/contexts/TerminalContext";
import { TimelineContext, TimelineContextRoot } from "replay-next/src/contexts/TimelineContext";
import { pauseIdCache } from "replay-next/src/suspense/PauseCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { NodePickerContextRoot } from "ui/components/NodePickerContext";

import createTest from "./utils/createTest";
import styles from "./styles.module.css";

const DEFAULT_RECORDING_ID = "4ccc9f9f-f0d3-4418-ac21-1b316e462a44";

function Elements() {
  const replayClient = useContext(ReplayClientContext);
  const { duration } = useContext(SessionContext);
  const { update } = useContext(TimelineContext);

  const [nodeId, setNodeId] = useState<ObjectId>("45" as ObjectId);
  const [pauseId, setPauseId] = useState<PauseId | null>(null);
  const [selectedObjectId, setSelectedObjectId] = useState<ObjectId | null>(null);

  const [list, setList] = useState<ImperativeHandle | null>(null);

  // Jump to the middle of the Replay; hopefully there will be some Elements there
  useEffect(() => {
    async function fetchData() {
      const timeStampedPoint = await replayClient.getPointNearTime(duration / 2);
      const pauseId = await pauseIdCache.readAsync(
        replayClient,
        timeStampedPoint.point,
        timeStampedPoint.time
      );
      setPauseId(pauseId);
    }

    fetchData();
  }, [duration, replayClient, update]);

  const onKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case "Enter":
        if (nodeId) {
          if (list) {
            list.selectNode(nodeId);
          }
        }
        break;
    }
  };

  if (!pauseId) {
    return null;
  }

  return (
    <div className={styles.Grid3Columns}>
      <div>
        <input
          onChange={event => setNodeId(event.target.value)}
          onKeyDown={onKeyDown}
          type="text"
          value={nodeId}
        />
      </div>
      <ElementsPanel
        listRefSetter={setList}
        onSelectionChange={setSelectedObjectId}
        pauseId={pauseId}
      />
      <div>
        {pauseId && selectedObjectId ? (
          <Suspense fallback={<Loader />}>
            <Details objectId={selectedObjectId} pauseId={pauseId} />
          </Suspense>
        ) : null}
      </div>
    </div>
  );
}

function Details({ objectId, pauseId }: { objectId: ObjectId; pauseId: PauseId }) {
  const replayClient = useContext(ReplayClientContext);

  const element = elementCache.read(replayClient, pauseId, objectId);

  return <div>Selected: {element.node.nodeName}</div>;
}

function Root() {
  return (
    <KeyboardModifiersContextRoot>
      <SourcesContextRoot>
        <PointsContextRoot>
          <TimelineContextRoot>
            <SelectedFrameContextRoot>
              <FocusContextRoot>
                <NodePickerContextRoot>
                  <TerminalContextRoot>
                    <Elements />
                  </TerminalContextRoot>
                </NodePickerContextRoot>
              </FocusContextRoot>
            </SelectedFrameContextRoot>
          </TimelineContextRoot>
        </PointsContextRoot>
      </SourcesContextRoot>
    </KeyboardModifiersContextRoot>
  );
}

export default createTest(Root, DEFAULT_RECORDING_ID);
