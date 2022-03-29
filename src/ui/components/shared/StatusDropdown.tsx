import React, { ReactNode, useState } from "react";
import PortalDropdown from "./PortalDropdown";
import { Dropdown, DropdownItem, DropdownItemContent } from "ui/components/Library/LibraryDropdown";
import MaterialIcon from "./MaterialIcon";
import Confetti from "./Confetti";
import {
  useGetRecording,
  useGetRecordingId,
  useUpdateRecordingResolution,
} from "ui/hooks/recordings";

function DropdownButton({ disabled, children }: { disabled?: boolean; children: ReactNode }) {
  return (
    <div className="flex flex-row space-x-1">
      <span className="whitespace-pre text-xs">{children}</span>
      {!disabled ? (
        <div style={{ lineHeight: "0px" }}>
          <MaterialIcon>expand_more</MaterialIcon>
        </div>
      ) : null}
    </div>
  );
}

export default function StatusDropdown() {
  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId!);
  const [expanded, setExpanded] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const setIsResolved = useUpdateRecordingResolution(recordingId!);

  if (!recording) {
    return null;
  }

  const isResolved = recording.resolution?.resolvedAt;

  return (
    <div className="rounded-md px-2 py-1">
      {showConfetti ? <Confetti /> : null}
      <PortalDropdown
        buttonContent={<DropdownButton>{isResolved ? "Resolved" : "Active"}</DropdownButton>}
        buttonStyle={"overflow-hidden"}
        setExpanded={setExpanded}
        expanded={expanded}
        distance={0}
        position="bottom-right"
      >
        <Dropdown menuItemsClassName="z-50 overflow-auto max-h-48" widthClass="w-56">
          <DropdownItem
            onClick={e => {
              e.stopPropagation();
              setExpanded(false);
              setIsResolved(false);
            }}
          >
            <DropdownItemContent icon="active" selected={false}>
              <span className="overflow-hidden overflow-ellipsis whitespace-pre text-xs">
                Active
              </span>
            </DropdownItemContent>
          </DropdownItem>
          <DropdownItem
            onClick={e => {
              e.stopPropagation();
              setShowConfetti(true);
              setExpanded(false);
              setIsResolved(true);
              setTimeout(() => setShowConfetti(false), 6000);
            }}
          >
            <DropdownItemContent icon="resolved" selected={false}>
              <span className="overflow-hidden overflow-ellipsis whitespace-pre text-xs">
                Resolved
              </span>
            </DropdownItemContent>
          </DropdownItem>
        </Dropdown>
      </PortalDropdown>
    </div>
  );
}
