import { useContext } from "react";
import { ContextMenuDivider, ContextMenuItem, useContextMenu } from "use-context-menu";

import Icon from "replay-next/components/Icon";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { SessionContext } from "replay-next/src/contexts/SessionContext";

import { ReduxActionAnnotation } from "./annotations";
import styles from "./ReduxDevToolsListItem.module.css";

export default function useReduxDevtoolsContextMenu(
  annotation: ReduxActionAnnotation,
  scrollToPause: () => void
) {
  const { range, update } = useContext(FocusContext);
  const { duration, endpoint } = useContext(SessionContext);

  const setFocusEnd = () => {
    update(
      {
        begin: range?.begin ?? {
          point: "0",
          time: 0,
        },
        end: {
          point: annotation.point,
          time: annotation.time,
        },
      },
      {
        bias: "end",
        sync: true,
      }
    );
  };

  const setFocusStart = () => {
    update(
      {
        begin: {
          point: annotation.point,
          time: annotation.time,
        },
        end: range?.end ?? {
          point: endpoint,
          time: duration,
        },
      },
      {
        bias: "begin",
        sync: true,
      }
    );
  };

  return useContextMenu(
    <>
      <ContextMenuItem dataTestId="ConsoleContextMenu-SetFocusStartButton" onSelect={setFocusStart}>
        <>
          <Icon type="set-focus-start" />
          Set focus start
        </>
      </ContextMenuItem>
      <ContextMenuItem dataTestId="ConsoleContextMenu-SetFocusEndButton" onSelect={setFocusEnd}>
        <>
          <Icon type="set-focus-end" />
          Set focus end
        </>
      </ContextMenuItem>

      <ContextMenuDivider />
      <ContextMenuItem dataTestId="ConsoleContextMenu-ScrollToPauseButton" onSelect={scrollToPause}>
        <>
          <Icon className={styles.SmallerIcon} type="console" />
          Scroll to pause
        </>
      </ContextMenuItem>
    </>
  );
}
