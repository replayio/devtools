import NewConsole from "bvaughn-architecture-demo/components/console";
import { ConsoleSearchContext } from "bvaughn-architecture-demo/components/console/ConsoleSearchContext";
import { TerminalContext } from "bvaughn-architecture-demo/src/contexts/TerminalContext";
import React, { KeyboardEvent, useContext } from "react";
import { getPauseId, getSelectedFrameId } from "devtools/client/debugger/src/selectors";
import InspectorContextReduxAdapter from "devtools/client/debugger/src/components/shared/InspectorContextReduxAdapter";
import JSTerm from "devtools/client/webconsole/components/Input/JSTerm";
import { useGetRecordingId } from "ui/hooks/recordings";
import { useFeature } from "ui/hooks/settings";
import { getCurrentPoint } from "ui/reducers/app";
import { getCurrentTime } from "ui/reducers/timeline";

import { ConsoleNag } from "../shared/Nags/Nags";

import styles from "./NewConsole.module.css";
import TerminalContextAdapter from "./TerminalContextAdapter";
import TimelineContextAdapter from "./TimelineContextAdapter";
import useTerminalHistory from "./useTerminalHistory";
import { useAppSelector } from "ui/setup/hooks";

// Adapter that connects the legacy app Redux stores to the newer React Context providers.
export default function NewConsoleRoot() {
  const { value: consoleFilterDrawerDefaultsToOpen } = useFeature(
    "consoleFilterDrawerDefaultsToOpen"
  );

  return (
    <TimelineContextAdapter>
      <InspectorContextReduxAdapter>
        <TerminalContextAdapter>
          <NewConsole
            nagHeader={<ConsoleNag />}
            showFiltersByDefault={consoleFilterDrawerDefaultsToOpen}
            showSearchInputByDefault={false}
            terminalInput={<JSTermWrapper />}
          />
        </TerminalContextAdapter>
      </InspectorContextReduxAdapter>
    </TimelineContextAdapter>
  );
}

function JSTermWrapper() {
  const [_, searchActions] = useContext(ConsoleSearchContext);
  const { addMessage } = useContext(TerminalContext);

  const recordingId = useGetRecordingId();
  const [terminalExpressionHistory, setTerminalExpressionHistory] = useTerminalHistory(recordingId);

  // Note that the "frameId" the protocol expects is actually the "protocolId" and NOT the "frameId"
  const frame = useAppSelector(getSelectedFrameId);
  const frameId = frame?.frameId || null;

  const pauseId = useAppSelector(getPauseId);
  const point = useAppSelector(getCurrentPoint);
  const time = useAppSelector(getCurrentTime);

  const onKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case "Escape":
        searchActions.hide();

        event.preventDefault();
        event.stopPropagation();
        break;
      case "f":
      case "F":
        if (event.metaKey) {
          searchActions.show();

          event.preventDefault();
          event.stopPropagation();
        }
        break;
    }
  };

  const addTerminalExpression = (expression: string) => {
    if (pauseId == null || point == null) {
      return;
    }

    setTerminalExpressionHistory(expression);

    addMessage({
      expression,
      frameId: frameId || null,
      pauseId,
      point,
      time,
    });
  };

  return (
    <div className={styles.JSTermWrapper} data-test-id="JSTerm" onKeyDown={onKeyDown}>
      <JSTerm
        addTerminalExpression={addTerminalExpression}
        terminalExpressionHistory={terminalExpressionHistory}
      />
    </div>
  );
}
