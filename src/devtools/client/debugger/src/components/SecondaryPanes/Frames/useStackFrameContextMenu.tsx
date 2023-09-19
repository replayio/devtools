import { useContext } from "react";
import { ContextMenuDivider, ContextMenuItem, useContextMenu } from "use-context-menu";

import type { PauseFrame } from "devtools/client/debugger/src/reducers/pause";
import Icon from "replay-next/components/Icon";
import { copyToClipboard } from "replay-next/components/sources/utils/clipboard";
import { getPointAndTimeForPauseId } from "replay-next/src/suspense/PauseCache";
import { getPointDescriptionForFrame } from "replay-next/src/suspense/PointStackCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { requestFocusWindow, seek } from "ui/actions/timeline";
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
    const getFramePoint = async () => {
      const [point] = getPointAndTimeForPauseId(frame.pauseId);
      if (!point) {
        return null;
      }
      return await getPointDescriptionForFrame(replayClient, point, frame.index);
    };

    const jumpToFrame = async () => {
      const framePoint = await getFramePoint();

      if (framePoint) {
        dispatch(
          seek({
            executionPoint: framePoint.point,
            openSource: true,
            time: framePoint.time,
          })
        );
      }
    };

    const setFocusStart = async () => {
      const framePoint = await getFramePoint();

      if (framePoint) {
        dispatch(
          requestFocusWindow({
            begin: {
              point: framePoint.point,
              time: framePoint.time,
            },
          })
        );
      }
    };

    const setFocusEnd = async () => {
      const framePoint = await getFramePoint();

      if (framePoint) {
        dispatch(
          requestFocusWindow({
            end: {
              point: framePoint.point,
              time: framePoint.time,
            },
          })
        );
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
        <ContextMenuItem dataTestId="CallStackContextMenu-SetFocusStart" onSelect={setFocusStart}>
          <>
            <Icon type="set-focus-start" />
            Set focus start at frame
          </>
        </ContextMenuItem>
        <ContextMenuItem dataTestId="CallStackContextMenu-SetFocusEnd" onSelect={setFocusEnd}>
          <>
            <Icon type="set-focus-end" />
            Set focus end at frame
          </>
        </ContextMenuItem>
        <ContextMenuItem dataTestId="CallStackContextMenu-JumpToFrame" onSelect={jumpToFrame}>
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
