import ReactCanvasConfetti from "react-canvas-confetti";
import React, { Dispatch, ReactNode, SetStateAction, useState } from "react";
import PortalDropdown from "./PortalDropdown";
import { Dropdown, DropdownItem, DropdownItemContent } from "ui/components/Library/LibraryDropdown";
import { WorkspaceId } from "ui/state/app";
import { Recording, Workspace } from "ui/types";
import hooks from "ui/hooks";
import MaterialIcon from "./MaterialIcon";
import { trackEvent } from "ui/utils/telemetry";
import { isPublicDisabled } from "ui/utils/org";
import Confetti from "./Confetti";

function DropdownButton({ disabled, children }: { disabled?: boolean; children: ReactNode }) {
  return (
    <div className="flex flex-row space-x-1">
      <span className="text-xs whitespace-pre">{children}</span>
      {!disabled ? (
        <div style={{ lineHeight: "0px" }}>
          <MaterialIcon>expand_more</MaterialIcon>
        </div>
      ) : null}
    </div>
  );
}

export default function StatusDropdown({ recording }: { recording: Recording }) {
  const [expanded, setExpanded] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("Active"); // we should pull this from the backend

  return (
    <div className="rounded-md px-2 py-1 bg-gray-200">
      {showConfetti ? <Confetti /> : null}
      <PortalDropdown
        buttonContent={<DropdownButton>{currentStatus}</DropdownButton>}
        buttonStyle={"overflow-hidden"}
        setExpanded={setExpanded}
        expanded={expanded}
        distance={0}
        position="bottom-right"
      >
        <Dropdown menuItemsClassName="z-50 overflow-auto max-h-48" widthClass="w-56">
          <DropdownItem
            onClick={() => {
              setExpanded(false);
              setCurrentStatus("Active");
            }}
          >
            <DropdownItemContent icon="manage_search" selected={false}>
              <span className="overflow-hidden overflow-ellipsis whitespace-pre text-xs">
                Active
              </span>
            </DropdownItemContent>
          </DropdownItem>

          <DropdownItem
            onClick={() => {
              setShowConfetti(true);
              setExpanded(false);
              setCurrentStatus("Resolved");
              setTimeout(() => setShowConfetti(false), 6000);
            }}
          >
            <DropdownItemContent icon="thumb_up_alt" selected={false}>
              <span className="overflow-hidden overflow-ellipsis whitespace-pre text-xs">
                Resolved
              </span>
            </DropdownItemContent>
          </DropdownItem>
          <DropdownItem
            onClick={() => {
              setExpanded(false);
              setCurrentStatus("Couldn't resolve");
            }}
          >
            <DropdownItemContent icon="thumb_down_off_alt" selected={false}>
              <span className="overflow-hidden overflow-ellipsis whitespace-pre text-xs">
                Couldn't resolve
              </span>
            </DropdownItemContent>
          </DropdownItem>
        </Dropdown>
      </PortalDropdown>
    </div>
  );
}
