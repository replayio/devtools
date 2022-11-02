import React, { useState } from "react";

import { Dropdown, DropdownItem } from "ui/components/Library/LibraryDropdown";
import { useAppDispatch } from "ui/setup/hooks";
import { trackEvent } from "ui/utils/telemetry";

import { useConfirm } from "../shared/Confirm";
import MaterialIcon from "../shared/MaterialIcon";
import PortalDropdown from "../shared/PortalDropdown";
import styles from "./RemarkDropDown.module.css";

export default function RemarkDropDown({
  deleteRemark,
  isPublished,
  publishRemark,
  startEditing,
  type,
}: {
  deleteRemark: () => Promise<void>;
  isPublished: boolean;
  publishRemark: () => void;
  startEditing: () => void;
  type: "comment" | "reply";
}) {
  const { confirmDestructive } = useConfirm();

  const dispatch = useAppDispatch();

  const [isExpanded, setIsExpanded] = useState(false);

  // This should be replaced with useTransition() once we're using Suspense for comment data.
  const [isPending, setIsPending] = useState(false);

  const deleteLabel = type === "comment" ? "Delete comment and replies" : "Delete comment";

  const confirmDelete = (event: React.MouseEvent) => {
    event.stopPropagation();

    setIsExpanded(false);

    const deleteDescription =
      type === "comment"
        ? "Deleting this comment will permanently remove it and its replies"
        : "Deleting this comment will permanently remove it";

    confirmDestructive({
      acceptLabel: "Delete comment",
      description: `${deleteDescription}. Are you sure you want to proceed?`,
      message: deleteLabel,
    }).then(async confirmed => {
      if (!confirmed) {
        return;
      }

      trackEvent("comments.delete");

      setIsPending(true);

      await deleteRemark();

      setIsPending(false);
    });
  };

  return (
    <PortalDropdown
      buttonContent={
        <MaterialIcon className={styles.Icon} disabled={isPending} outlined>
          more_vert
        </MaterialIcon>
      }
      buttonStyle=""
      distance={0}
      expanded={isExpanded}
      position="bottom-right"
      setExpanded={setIsExpanded}
    >
      <Dropdown>
        <DropdownItem onClick={startEditing}>Edit comment</DropdownItem>
        <DropdownItem onClick={confirmDelete}>{deleteLabel}</DropdownItem>
        {!isPublished && <DropdownItem onClick={publishRemark}>Publish comment</DropdownItem>}
      </Dropdown>
    </PortalDropdown>
  );
}
