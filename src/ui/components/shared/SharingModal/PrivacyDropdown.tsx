import { Dispatch, ReactNode, SetStateAction, useState } from "react";

import { Recording, Workspace } from "shared/graphql/types";
import { Dropdown, DropdownItem, DropdownItemContent } from "ui/components/Library/LibraryDropdown";
import hooks from "ui/hooks";
import { WorkspaceId } from "ui/state/app";
import { isPublicDisabled } from "ui/utils/org";
import { trackEvent } from "ui/utils/telemetry";

import MaterialIcon from "../MaterialIcon";
import PortalDropdown from "../PortalDropdown";

const WorkspacePrivacySummary = ({ workspace: { name } }: { workspace: Workspace }) => (
  <span>
    <span className="font-bold">{name}</span>
    {` can view`}
  </span>
);

export function getPrivacySummaryAndIcon(recording: Recording) {
  if (!recording.private) {
    return { icon: "globe", summary: "Anyone with the link can view" };
  }

  if (recording.workspace) {
    return {
      icon: "group",
      summary: <WorkspacePrivacySummary workspace={recording.workspace} />,
    };
  }

  // If the recording is private and in an individual's library.
  return { icon: "lock", summary: "Only people with access can view" };
}

function DropdownButton({ disabled, children }: { disabled?: boolean; children: ReactNode }) {
  return (
    <div className="flex flex-row items-center space-x-1">
      <span className="whitespace-pre">{children}</span>
      {!disabled ? (
        <div style={{ lineHeight: "0px" }}>
          <MaterialIcon>expand_more</MaterialIcon>
        </div>
      ) : null}
    </div>
  );
}

export default function PrivacyDropdown({ recording }: { recording: Recording }) {
  const workspaceId = recording.workspace?.id || null;
  const [expanded, setExpanded] = useState(false);
  const { summary } = getPrivacySummaryAndIcon(recording);

  const isPrivate = recording.private;
  const { workspaces } = hooks.useGetNonPendingWorkspaces();
  const isOwner = hooks.useIsOwner();

  const [updateWorkspaceFailed, setUpdateWorkspaceFailed] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const userBelongsToTeam = workspaceId && workspaces.find(w => w.id === workspaceId);

  const updateIsPrivate = hooks.useUpdateIsPrivate();
  const updateRecordingWorkspace = hooks.useUpdateRecordingWorkspace();

  const privacyOptions: ReactNode[] = [];

  const toggleIsPrivate = () => updateIsPrivate(recording.id, !isPrivate);
  const setPublic = () => {
    trackEvent("share_modal.set_public");
    if (isPrivate) {
      toggleIsPrivate();
    }
    setExpanded(false);
  };
  const handleMoveToTeam = async (targetWorkspaceId: WorkspaceId | null) => {
    if (targetWorkspaceId !== workspaceId) {
      trackEvent("share_modal.set_team");
      try {
        setIsPending(true);
        setUpdateWorkspaceFailed(false);
        setExpanded(false);

        await updateRecordingWorkspace(recording.id, targetWorkspaceId);
      } catch (error) {
        console.error(error);

        setUpdateWorkspaceFailed(true);
      } finally {
        setIsPending(false);
      }
    }

    setPrivate();
  };
  const setPrivate = () => {
    trackEvent("share_modal.set_private");
    if (!isPrivate) {
      toggleIsPrivate();
    }
    setExpanded(false);
  };

  if (!isPublicDisabled(workspaces, workspaceId)) {
    privacyOptions.push(
      <DropdownItem onClick={setPublic} key="option-public">
        <DropdownItemContent icon="globe" selected={!isPrivate}>
          <span className="text-xs">Anyone with the link</span>
        </DropdownItemContent>
      </DropdownItem>
    );
  }

  if (userBelongsToTeam || isOwner) {
    // This gives the user who owns the recording or is a member of the team
    // that owns the recording the option to move the recording to their
    // library, or any team they belong to.
    privacyOptions.push(
      <DropdownItem
        disabled={isPending}
        onClick={() => handleMoveToTeam(null)}
        key="option-private"
      >
        <DropdownItemContent icon="lock" selected={!!isPrivate && !workspaceId}>
          <span className="overflow-hidden overflow-ellipsis whitespace-pre text-xs">
            Only people with access
          </span>
        </DropdownItemContent>
      </DropdownItem>,
      <div key="option-team">
        {workspaces
          .filter(w => w.name && !!w.isTest == !!recording.isTest)
          .sort((a, b) => a.name!.localeCompare(b.name!))
          .map(({ id, name }) => (
            <DropdownItem disabled={isPending} onClick={() => handleMoveToTeam(id)} key={id}>
              <DropdownItemContent icon="group" selected={!!isPrivate && id === workspaceId}>
                <span className="overflow-hidden overflow-ellipsis whitespace-pre text-xs">
                  {name}
                </span>
              </DropdownItemContent>
            </DropdownItem>
          ))}
      </div>
    );
  }

  if (privacyOptions.length <= 1) {
    return (
      <div
        title={
          workspaceId
            ? "Only team members can can modify these settings"
            : "Only the owner can modify these settings"
        }
      >
        <DropdownButton disabled>{summary}</DropdownButton>
      </div>
    );
  }

  return (
    <>
      <div
        className={`rounded-md border border-inputBorder bg-themeTextFieldBgcolor p-2 ${
          isPending ? "pointer-default opacity-50" : "hover:bg-themeTextFieldBgcolorHover"
        }`}
      >
        <div style={{ display: "none" }}>
          <MaterialIcon>globe</MaterialIcon>
          <MaterialIcon>group</MaterialIcon>
          <MaterialIcon>lock</MaterialIcon>
          <MaterialIcon>expand_more</MaterialIcon>
        </div>
        <PortalDropdown
          buttonContent={<DropdownButton>{summary}</DropdownButton>}
          buttonStyle={"overflow-hidden"}
          disabled={isPending}
          setExpanded={setExpanded}
          expanded={expanded}
          distance={0}
          position="bottom-right"
        >
          <Dropdown menuItemsClassName="z-50 overflow-auto max-h-48">{privacyOptions}</Dropdown>
        </PortalDropdown>
      </div>
      {updateWorkspaceFailed && (
        <div className="mt-2 rounded bg-errorBgcolor px-2 py-1 text-errorColor">
          Something went wrong. Try again.
        </div>
      )}
    </>
  );
}
