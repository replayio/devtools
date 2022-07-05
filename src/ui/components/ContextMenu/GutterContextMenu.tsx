import React from "react";
import { useAppDispatch } from "ui/setup/hooks";
import { createFloatingCodeComment } from "ui/actions/comments";
import { ContextMenu as ContextMenuType } from "ui/actions/contextMenus";
import { useGetRecordingId } from "ui/hooks/recordings";
import { trackEvent } from "ui/utils/telemetry";

import { Dropdown, DropdownItem } from "../Library/LibraryDropdown";

import { ContextMenu } from "./index";
import useAuth0 from "ui/utils/useAuth0";

export default function GutterContextMenu({
  close,
  contextMenu,
}: {
  close: () => void;
  contextMenu: ContextMenuType;
}) {
  const recordingId = useGetRecordingId();
  const { isAuthenticated } = useAuth0();
  const dispatch = useAppDispatch();

  const addComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackEvent("gutter.add_comment");
    dispatch(
      createFloatingCodeComment(recordingId, {
        location: contextMenu.contextMenuItem.location,
      })
    );
    close();
  };

  // Un-authenticated users can't comment on Replays.
  if (!isAuthenticated) {
    return null;
  }

  return (
    <ContextMenu close={close} x={contextMenu.x} y={contextMenu.y}>
      <Dropdown>
        <DropdownItem onClick={addComment}>Add comment</DropdownItem>
      </Dropdown>
    </ContextMenu>
  );
}
