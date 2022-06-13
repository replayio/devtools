import React from "react";
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
  const recordingId = useGetRecordingId();

  const addComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackEvent("gutter.add_comment");
    assert(executionPoint, "no executionPoint");
    createFloatingCodeComment(currentTime, executionPoint, recordingId, {
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
