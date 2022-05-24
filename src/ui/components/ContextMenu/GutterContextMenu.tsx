import { getExecutionPoint } from "devtools/client/debugger/src/reducers/pause";
import { assert } from "protocol/utils";
import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import { ContextMenu as ContextMenuType } from "ui/actions/contextMenus";
import { useGetRecordingId } from "ui/hooks/recordings";
import { useGetUserId } from "ui/hooks/users";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import { trackEvent } from "ui/utils/telemetry";
import useAuth0 from "ui/utils/useAuth0";

import { ContextMenu, ContextMenuItem } from "../Library/ContextMenu";

export interface GutterContextMenuProps extends PropsFromRedux {
  close: () => void;
  contextMenu: ContextMenuType;
}

function GutterContextMenu({
  close,
  contextMenu,
  createFloatingCodeComment,
  currentTime,
  executionPoint,
}: GutterContextMenuProps) {
  const { user } = useAuth0();
  const { userId } = useGetUserId();
  const recordingId = useGetRecordingId();

  const addComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackEvent("gutter.add_comment");
    assert(executionPoint, "no executionPoint");
    createFloatingCodeComment(currentTime, executionPoint, { ...user, id: userId }, recordingId, {
      location: contextMenu.contextMenuItem.location,
    });
    close();
  };

  return (
    <ContextMenu close={close} x={contextMenu.x} y={contextMenu.y}>
      <ContextMenuItem onClick={addComment}>Add comment</ContextMenuItem>
    </ContextMenu>
  );
}

const connector = connect(
  (state: UIState) => ({
    currentTime: selectors.getCurrentTime(state),
    executionPoint: getExecutionPoint(state),
  }),
  {
    createFloatingCodeComment: actions.createFloatingCodeComment,
  }
);

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(GutterContextMenu);
