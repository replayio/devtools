import { MouseEvent, useContext, useState } from "react";

import ContextMenuDivider from "replay-next/components/context-menu/ContextMenuDivider";
import ContextMenuItem from "replay-next/components/context-menu/ContextMenuItem";
import useContextMenu from "replay-next/components/context-menu/useContextMenu";
import Icon from "replay-next/components/Icon";
import { copyToClipboard } from "replay-next/components/sources/utils/clipboard";
import { createTypeDataForVisualComment } from "replay-next/components/sources/utils/comments";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { InspectorContext } from "replay-next/src/contexts/InspectorContext";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { createFrameComment } from "ui/actions/comments";
import {
  MAX_FOCUS_REGION_DURATION,
  getUrlParams,
  seekToTime,
  syncFocusedRegion,
  updateDisplayedFocusRegion,
} from "ui/actions/timeline";
import { useAppDispatch } from "ui/setup/hooks";
import { getUrlString } from "ui/utils/environment";

import styles from "./ContextMenu.module.css";

export default function useTimelineContextMenu() {
  const { rangeForDisplay: focusRegion } = useContext(FocusContext);
  const { showCommentsPanel } = useContext(InspectorContext);
  const replayClient = useContext(ReplayClientContext);
  const { duration, recordingId } = useContext(SessionContext);

  const dispatch = useAppDispatch();

  const [relativePosition, setRelativePosition] = useState(0);

  const focusBeginTime = focusRegion?.begin.time;
  const focusEndTime = focusRegion?.end.time;
  const currentTime = relativePosition * duration;

  const onContextMenuEvent = (event: MouseEvent) => {
    const timeline = event.currentTarget as HTMLDivElement;
    const rect = timeline.getBoundingClientRect();

    setRelativePosition((event.pageX - rect.left) / rect.width);
  };

  const addComment = async () => {
    const canvas = document.querySelector("canvas#graphics");

    const typeData = await createTypeDataForVisualComment(canvas as HTMLCanvasElement, null, null);

    await dispatch(seekToTime(currentTime, false));

    dispatch(createFrameComment(null, recordingId, typeData));

    if (showCommentsPanel) {
      showCommentsPanel();
    }
  };

  const setFocusBegin = async () => {
    let end = focusEndTime ?? duration;
    end = Math.min(end, currentTime + MAX_FOCUS_REGION_DURATION);

    await dispatch(updateDisplayedFocusRegion({ begin: currentTime, end }));
    dispatch(syncFocusedRegion());
  };

  const setFocusEnd = async () => {
    let begin = focusBeginTime ?? 0;
    begin = Math.max(begin, currentTime - MAX_FOCUS_REGION_DURATION);

    await dispatch(updateDisplayedFocusRegion({ begin, end: currentTime }));
    dispatch(syncFocusedRegion());
  };

  const shareReplay = async () => {
    const { point, time } = await replayClient.getPointNearTime(currentTime);

    const params = getUrlParams({ focusRegion, point, time });
    const urlString = getUrlString(params);

    copyToClipboard(urlString);
  };

  return useContextMenu(
    <>
      <ContextMenuItem onClick={addComment}>
        <>
          <Icon className={styles.SmallerIcon} type="comment" />
          Add a comment here
        </>
      </ContextMenuItem>
      <ContextMenuItem onClick={shareReplay}>
        <>
          <Icon className={styles.SmallerIcon} type="copy" />
          Copy URL at this time
        </>
      </ContextMenuItem>
      <ContextMenuDivider />
      <ContextMenuItem
        dataTestId="ConsoleContextMenu-SetFocusStartButton"
        disabled={focusEndTime != null && currentTime >= focusEndTime}
        onClick={setFocusBegin}
      >
        <>
          <Icon type="set-focus-start" />
          Set focus start
        </>
      </ContextMenuItem>
      <ContextMenuItem
        dataTestId="ConsoleContextMenu-SetFocusEndButton"
        disabled={focusBeginTime != null && currentTime <= focusBeginTime}
        onClick={setFocusEnd}
      >
        <>
          <Icon type="set-focus-end" />
          Set focus end
        </>
      </ContextMenuItem>
    </>,
    { onContextMenuEvent }
  );
}
