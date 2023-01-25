import { TimeStampedPoint } from "@replayio/protocol";
import { useContext } from "react";

import ContextMenuDivider from "replay-next/components/context-menu/ContextMenuDivider";
import ContextMenuItem from "replay-next/components/context-menu/ContextMenuItem";
import useContextMenu from "replay-next/components/context-menu/useContextMenu";
import Icon from "replay-next/components/Icon";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { SessionContext } from "replay-next/src/contexts/SessionContext";

import styles from "./ContextMenu.module.css";

export default function useLogPointPanelContextMenu({
  currentHitPoint,
  hasConditional,
  lineNumber,
  shouldLog,
  toggleConditional,
  toggleShouldLog,
}: {
  currentHitPoint: TimeStampedPoint | null;
  hasConditional: boolean;
  lineNumber: number;
  shouldLog: boolean;
  toggleConditional: () => void;
  toggleShouldLog: () => void;
}) {
  const { rangeForDisplay, update } = useContext(FocusContext);
  const { duration } = useContext(SessionContext);

  const setFocusBegin = () => {
    if (currentHitPoint == null) {
      return;
    }

    const begin = currentHitPoint.time;
    const end = rangeForDisplay !== null ? rangeForDisplay.end.time : duration;

    update([begin, end], true);
  };

  const setFocusEnd = () => {
    if (currentHitPoint == null) {
      return;
    }

    const end = currentHitPoint.time;
    const begin = rangeForDisplay !== null ? rangeForDisplay.begin.time : 0;

    update([begin, end], true);
  };

  return useContextMenu(
    <>
      <ContextMenuItem
        dataTestName="ContextMenuItem-ToggleConditional"
        dataTestState={hasConditional ? "true" : "false"}
        onClick={toggleConditional}
      >
        <>
          <Icon className={styles.SmallerIcon} type="conditional" />
          {hasConditional ? "Remove conditional" : "Add conditional"}
        </>
      </ContextMenuItem>
      <ContextMenuItem
        dataTestName="ContextMenuItem-ToggleEnabled"
        dataTestState={shouldLog ? "true" : "false"}
        onClick={toggleShouldLog}
      >
        <>
          <Icon className={styles.SmallerIcon} type={shouldLog ? "toggle-off" : "toggle-on"} />
          {shouldLog ? "Disable logging" : "Enable logging"}
        </>
      </ContextMenuItem>
      <ContextMenuDivider />
      <ContextMenuItem disabled={currentHitPoint == null} onClick={setFocusBegin}>
        <>
          <Icon type="set-focus-start" />
          Set focus start
        </>
      </ContextMenuItem>
      <ContextMenuItem disabled={currentHitPoint == null} onClick={setFocusEnd}>
        <>
          <Icon type="set-focus-end" />
          Set focus end
        </>
      </ContextMenuItem>
    </>,
    {
      dataTestId: `LogPointContextMenu-Line-${lineNumber}`,
      dataTestName: "LogPointContextMenu",
    }
  );
}
