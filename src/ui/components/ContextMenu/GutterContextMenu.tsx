import React from "react";
import useAuth0 from "ui/utils/useAuth0";
import { ContextMenu as ContextMenuType } from "ui/actions/contextMenus";
import { ContextMenu } from "./index";
import { Dropdown, DropdownItem } from "../Library/LibraryDropdown";
import { UIState } from "ui/state";
import { actions } from "ui/actions";
import { assert } from "protocol/utils";
import { connect, ConnectedProps } from "react-redux";
import { getExecutionPoint } from "devtools/client/debugger/src/reducers/pause";
import { selectors } from "ui/reducers";
import { trackEvent } from "ui/utils/telemetry";
import { useGetRecordingId } from "ui/hooks/recordings";
import { useGetUserId } from "ui/hooks/users";

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
    assert(executionPoint);
    // @ts-ignore
    createFloatingCodeComment(currentTime, executionPoint, { ...user, id: userId }, recordingId, {
      location: contextMenu.contextMenuItem.location,
    });
    close();
  };

  return (
    <ContextMenu close={close} x={contextMenu.x} y={contextMenu.y}>
      <Dropdown>
        <DropdownItem onClick={addComment}>Add comment</DropdownItem>
      </Dropdown>
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
