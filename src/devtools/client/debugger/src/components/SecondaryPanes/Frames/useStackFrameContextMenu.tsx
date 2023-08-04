import { useContext } from "react";
import { ContextMenuDivider, ContextMenuItem, useContextMenu } from "use-context-menu";

import type { PauseFrame } from "devtools/client/debugger/src/reducers/pause";
import Icon from "replay-next/components/Icon";
import { copyToClipboard } from "replay-next/components/sources/utils/clipboard";
import { getFrameStepForFrameLocation } from "replay-next/src/suspense/FrameStepsCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import {
  seek,
  setFocusWindowBeginTime_TODO_FE_1779,
  setFocusWindowEndTime_TODO_FE_1779,
} from "ui/actions/timeline";
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
        dispatch(
          seek({
            executionPoint: matchingFrameStep.point,
            openSource: true,
            time: matchingFrameStep.time,
          })
        );
      }
    };

    const setFocusStart = async () => {
      const matchingFrameStep = await getMatchingFramestep();

      if (matchingFrameStep) {
        dispatch(setFocusWindowBeginTime_TODO_FE_1779(matchingFrameStep.time, true));
      }
    };

    const setFocusEnd = async () => {
      const matchingFrameStep = await getMatchingFramestep();

      if (matchingFrameStep) {
        dispatch(setFocusWindowEndTime_TODO_FE_1779(matchingFrameStep.time, true));
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
        <ContextMenuItem dataTestId="CallStackContextMenu-CopySourceUri" onSelect={copySourceUri}>
          <>
            <Icon type="copy" />
            Copy source URI
          </>
        </ContextMenuItem>
        <ContextMenuItem dataTestId="CallStackContextMenu-CopyStackTrace" onSelect={setFocusStart}>
          <>
            <Icon type="set-focus-start" />
            Set focus start at frame
          </>
        </ContextMenuItem>
        <ContextMenuItem dataTestId="CallStackContextMenu-CopyStackTrace" onSelect={setFocusEnd}>
          <>
            <Icon type="set-focus-end" />
            Set focus end at frame
          </>
        </ContextMenuItem>
        <ContextMenuItem dataTestId="CallStackContextMenu-CopyStackTrace" onSelect={jumpToFrame}>
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
        onSelect={toggleFrameworkGrouping}
      >
        <>
          <div className="h-6 w-6" />
          {frameworkGroupingOn ? "Disable" : "Enable"} framework grouping
        </>
      </ContextMenuItem>
      <ContextMenuItem dataTestId="CallStackContextMenu-CopyStackTrace" onSelect={copyStackTrace}>
        <>
          <Icon type="copy" />
          Copy stack trace
        </>
      </ContextMenuItem>
    </>
  );
}
