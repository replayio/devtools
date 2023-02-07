import { useContext } from "react";

import type { PauseFrame } from "devtools/client/debugger/src/reducers/pause";
import ContextMenuDivider from "replay-next/components/context-menu/ContextMenuDivider";
import ContextMenuItem from "replay-next/components/context-menu/ContextMenuItem";
import useContextMenu from "replay-next/components/context-menu/useContextMenu";
import Icon from "replay-next/components/Icon";
import { copyToClipboard } from "replay-next/components/sources/utils/clipboard";
import { getFrameStepForFrameLocation } from "replay-next/src/suspense/FrameStepsCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { setFocusRegionBeginTime, setFocusRegionEndTime } from "ui/actions/timeline";
import { seek } from "ui/actions/timeline";
import FigmaIcon from "ui/components/shared/Icon";
import { useAppDispatch } from "ui/setup/hooks";

interface StackFrameContextMenuOptions {
  frame?: PauseFrame;
  frameworkGroupingOn: boolean;
  toggleFrameworkGrouping: () => void;
  copyStackTrace: () => void;
}

export function useStackFrameContextMenu({
  frame,
  frameworkGroupingOn,
  toggleFrameworkGrouping,
  copyStackTrace,
}: StackFrameContextMenuOptions) {
  const dispatch = useAppDispatch();
  const replayClient = useContext(ReplayClientContext);

  let frameDependentContextMenus: React.ReactNode = null;

  if (frame) {
    const getMatchingFramestep = () =>
      getFrameStepForFrameLocation(replayClient, frame.pauseId, frame.protocolId, frame.location);

    const jumpToFrame = async () => {
      const matchingFrameStep = await getMatchingFramestep();

      if (matchingFrameStep) {
        dispatch(seek(matchingFrameStep.point, matchingFrameStep.time, true));
      }
    };

    const setFocusStart = async () => {
      const matchingFrameStep = await getMatchingFramestep();

      if (matchingFrameStep) {
        dispatch(setFocusRegionBeginTime(matchingFrameStep.time, true));
      }
    };

    const setFocusEnd = async () => {
      const matchingFrameStep = await getMatchingFramestep();

      if (matchingFrameStep) {
        dispatch(setFocusRegionEndTime(matchingFrameStep.time, true));
      }
    };

    const copySourceUri = () => {
      const { source } = frame;
      if (source?.url) {
        copyToClipboard(source.url);
      }
    };

    frameDependentContextMenus = (
      <>
        <ContextMenuItem dataTestId="CallStackContextMenu-CopySourceUri" onClick={copySourceUri}>
          <>
            <FigmaIcon filename="copy" />
            Copy source URI
          </>
        </ContextMenuItem>
        <ContextMenuItem dataTestId="CallStackContextMenu-CopyStackTrace" onClick={setFocusStart}>
          <>
            <Icon type="set-focus-start" />
            Set focus start at frame
          </>
        </ContextMenuItem>
        <ContextMenuItem dataTestId="CallStackContextMenu-CopyStackTrace" onClick={setFocusEnd}>
          <>
            <Icon type="set-focus-end" />
            Set focus end at frame
          </>
        </ContextMenuItem>
        <ContextMenuItem dataTestId="CallStackContextMenu-CopyStackTrace" onClick={jumpToFrame}>
          <>
            <Icon type="view-function-source" />
            Jump to frame
          </>
        </ContextMenuItem>
        <ContextMenuDivider />
      </>
    );
  }

  return useContextMenu(
    <>
      {frameDependentContextMenus}
      <ContextMenuItem
        dataTestId="CallStackContextMenu-ToggleFrameworkGrouping"
        onClick={toggleFrameworkGrouping}
      >
        <>
          <div className="h-6 w-6" />
          {frameworkGroupingOn ? "Disable" : "Enable"} framework grouping
        </>
      </ContextMenuItem>
      <ContextMenuItem dataTestId="CallStackContextMenu-CopyStackTrace" onClick={copyStackTrace}>
        <>
          <FigmaIcon filename="copy" className="bg-bodyColor" />
          Copy stack trace
        </>
      </ContextMenuItem>
    </>
  );
}
