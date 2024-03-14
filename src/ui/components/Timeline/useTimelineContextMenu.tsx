import { UIEvent, useContext, useState } from "react";
import {
  ContextMenuDivider,
  ContextMenuItem,
  assertMouseEvent,
  useContextMenu,
} from "use-context-menu";

import Icon from "replay-next/components/Icon";
import { copyToClipboard } from "replay-next/components/sources/utils/clipboard";
import { createTypeDataForVisualComment } from "replay-next/components/sources/utils/comments";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { InspectorContext } from "replay-next/src/contexts/InspectorContext";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { createFrameComment } from "ui/actions/comments";
import { MAX_FOCUS_REGION_DURATION, requestFocusWindow, seek } from "ui/actions/timeline";
import { useAppDispatch } from "ui/setup/hooks";

import styles from "./ContextMenu.module.css";

export default function useTimelineContextMenu() {
  const { range: focusWindow } = useContext(FocusContext);
  const { showCommentsPanel } = useContext(InspectorContext);
  const replayClient = useContext(ReplayClientContext);
  const { accessToken, duration, recordingId } = useContext(SessionContext);

  const dispatch = useAppDispatch();

  const [relativePosition, setRelativePosition] = useState(0);

  const focusBeginTime = focusWindow?.begin.time;
  const focusEndTime = focusWindow?.end.time;
  const currentTime = relativePosition * duration;

  const onShow = (event: UIEvent) => {
    const timeline = event.currentTarget as HTMLDivElement;
    const rect = timeline.getBoundingClientRect();

    if (assertMouseEvent(event)) {
      setRelativePosition((event.pageX - rect.left) / rect.width);
    }
  };

  const addComment = async () => {
    const image = document.getElementById("graphics");
    const typeData = await createTypeDataForVisualComment(image, null, null);

    await dispatch(
      seek({
        openSource: false,
        time: currentTime,
      })
    );

    dispatch(createFrameComment(null, recordingId, typeData));

    if (showCommentsPanel) {
      showCommentsPanel();
    }
  };

  const setFocusBegin = async () => {
    let end = focusEndTime ?? duration;
    end = Math.min(end, currentTime + MAX_FOCUS_REGION_DURATION);

    await dispatch(requestFocusWindow({ begin: { time: currentTime }, end: { time: end } }));
  };

  const setFocusEnd = async () => {
    let begin = focusBeginTime ?? 0;
    begin = Math.max(begin, currentTime - MAX_FOCUS_REGION_DURATION);

    await dispatch(requestFocusWindow({ begin: { time: begin }, end: { time: currentTime } }));
  };

  const shareReplay = async () => {
    const { point, time } = await replayClient.getPointNearTime(currentTime);

    copyToClipboard(window.location.href);
  };

  return useContextMenu(
    <>
      {accessToken !== null && (
        <ContextMenuItem onSelect={addComment}>
          <>
            <Icon className={styles.SmallerIcon} type="comment" />
            Add a comment here
          </>
        </ContextMenuItem>
      )}
      <ContextMenuItem onSelect={shareReplay}>
        <>
          <Icon className={styles.SmallerIcon} type="copy" />
          Copy URL at this time
        </>
      </ContextMenuItem>
      <ContextMenuDivider />
      <ContextMenuItem
        dataTestId="ConsoleContextMenu-SetFocusStartButton"
        disabled={focusEndTime != null && currentTime >= focusEndTime}
        onSelect={setFocusBegin}
      >
        <>
          <Icon type="set-focus-start" />
          Set focus start
        </>
      </ContextMenuItem>
      <ContextMenuItem
        dataTestId="ConsoleContextMenu-SetFocusEndButton"
        disabled={focusBeginTime != null && currentTime <= focusBeginTime}
        onSelect={setFocusEnd}
      >
        <>
          <Icon type="set-focus-end" />
          Set focus end
        </>
      </ContextMenuItem>
    </>,
    { onShow, requireClickToShow: true }
  );
}
