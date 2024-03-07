import React, { ChangeEvent, useMemo, useState } from "react";

import { Button } from "replay-next/components/Button";
import { WorkspaceUser } from "shared/graphql/types";
import * as actions from "ui/actions/app";
import { useRedirectToTeam } from "ui/components/Library/Team/utils";
import { useGetTeamIdFromRoute } from "ui/components/Library/Team/utils";
import { getBackendErrorMessage } from "ui/graphql/utils";
import hooks from "ui/hooks";
import { getModalOptions } from "ui/reducers/app";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { validateEmail } from "ui/utils/helpers";
import { trackEvent } from "ui/utils/telemetry";

import Base64Image from "../Base64Image";
import { useConfirm } from "../Confirm";
import { TextInput } from "../Forms";
import InvitationLink from "../NewWorkspaceModal/InvitationLink";
import SettingsModal from "../SettingsModal";
import { Settings } from "../SettingsModal/types";
import GeneralSettings from "./GeneralSettings";
import OrganizationSettings from "./OrganizationSettings";
import WorkspaceAPIKeys from "./WorkspaceAPIKeys";
import WorkspaceMember, { NonRegisteredWorkspaceMember } from "./WorkspaceMember";
import WorkspaceSubscription from "./WorkspaceSubscription";

const USER_ALREADY_INVITED_MESSAGE = "User has already been invited";

export function WorkspaceMembers({
  members,
  isAdmin,
}: {
  members: WorkspaceUser[];
  isAdmin: boolean;
}) {
  const sortedMembers = useMemo(() => {
    return members
      .slice()
      .sort((a: WorkspaceUser, b: WorkspaceUser) => Number(b.pending) - Number(a.pending));
  }, [members]);

  const adminCount = members.filter(a => a.roles?.includes("admin") && !a.pending).length;

  return (
    <ul className="flex flex-col space-y-2.5">
      {sortedMembers.map(member =>
        member.email ? (
          <NonRegisteredWorkspaceMember
            member={member}
            key={`non-registered-${member.email}`}
            isAdmin={isAdmin}
          />
        ) : (
          <WorkspaceMember
            member={member}
            key={`registered-${member.userId}`}
            isAdmin={isAdmin}
            canLeave={member.roles?.includes("admin") ? adminCount > 1 : members.length > 1}
          />
        )
      )}
    </ul>
  );
}

function WorkspaceForm() {
  const workspaceId = useGetTeamIdFromRoute();
  const [inputValue, setInputValue] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inviteNewWorkspaceMember = hooks.useInviteNewWorkspaceMember(
    () => {
      setInputValue("");
      setIsLoading(false);
    },
    err => {
      setInputValue("");
      setIsLoading(false);

      if (getBackendErrorMessage(err) === USER_ALREADY_INVITED_MESSAGE) {
        setErrorMessage(`${inputValue} is already a member of this team.`);
      } else {
        trackEvent("error.add_member_error");
        setErrorMessage(
          "We're unable to add a member to your team at this time. We're looking into this and will be in touch soon."
        );
      }
    }
  );

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };
  const handleAddMember = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();

    if (!validateEmail(inputValue)) {
      setErrorMessage("Invalid email address");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    await inviteNewWorkspaceMember({
      variables: { workspaceId: workspaceId!, email: inputValue },
    });
  };

  const canSubmit = inputValue.length > 0;

  return (
    <form className="flex flex-col" onSubmit={handleAddMember}>
      <div className="flex flex-grow flex-row space-x-3 p-0.5">
        <TextInput
          placeholder="Email address"
          value={inputValue}
          onChange={onChange}
          className="border-inputBorder"
        />
        <Button disabled={isLoading || !canSubmit}>{isLoading ? "Loading..." : "Invite"}</Button>
      </div>
      {errorMessage ? <div className="py-3 text-xs text-red-500">{errorMessage}</div> : null}
    </form>
  );
}

export type SettingsTabTitle =
  | "Profile"
  | "Organization"
  | "Team Members"
  | "Billing"
  | "API Keys"
  | "Delete Team";

const settings: Settings<
  SettingsTabTitle,
  {
    settings?: any;
    isAdmin: boolean;
    workspaceId: string;
  }
> = [
  {
    component: GeneralSettings,
    icon: "settings",
    title: "Profile",
  },
  {
    component: OrganizationSettings,
    icon: "business",
    title: "Organization",
  },
  {
    title: "Team Members",
    icon: "group",
    component: function TeamMembers({ isAdmin, workspaceId }) {
      const { members } = hooks.useGetWorkspaceMembers(workspaceId);

      return (
        <div className="flex flex-grow flex-col space-y-3">
          <div>{`Manage members here so that everyone who belongs to this team can see each other's replays.`}</div>
          <WorkspaceForm />
          <div className="text-xs font-semibold uppercase">{`Members`}</div>
          <div className="flex-grow overflow-y-auto">
            <div className="workspace-members-container flex flex-col space-y-1.5">
              <div className="flex h-0 flex-col space-y-1.5">
                {members ? <WorkspaceMembers members={members} isAdmin={isAdmin} /> : null}
              </div>
            </div>
          </div>
          <InvitationLink workspaceId={workspaceId} showDomainCheck={isAdmin} overlay />
        </div>
      );
    },
  },
  {
    title: "Billing",
    icon: "payment",
    component: WorkspaceSubscription,
    noTitle: true,
  },
  {
    title: "API Keys",
    icon: "vpn_key",
    component: WorkspaceAPIKeys,
  },
  {
    title: "Delete Team",
    icon: "cancel",
    component: function DeleteTeam({ workspaceId }) {
      const dispatch = useAppDispatch();
      const redirectToTeam = useRedirectToTeam(true);
      const updateDefaultWorkspace = hooks.useUpdateDefaultWorkspace();
      const deleteWorkspace = hooks.useDeleteWorkspace();
      const { confirmDestructive } = useConfirm();

      const handleDeleteTeam = () => {
        confirmDestructive({
          message: `Unexpected bad things will happen if you don't read this!`,
          description: `This action cannot be undone. This will permanently delete this repository and delete all of the replays, api-keys, sourcemaps and remove all team member associations`,
          acceptLabel: "Delete team",
        }).then(confirmed => {
          if (confirmed) {
            deleteWorkspace({
              variables: { workspaceId: workspaceId, shouldDeleteRecordings: true },
            });
            dispatch(actions.hideModal());
            updateDefaultWorkspace({ variables: { workspaceId: null } });
            redirectToTeam("me");
          }
        });
      };

      return (
        <div className="flex flex-col space-y-3">
          <div className="text-xs font-semibold uppercase ">{`Danger Zone`}</div>
          <div className="flex flex-row justify-between rounded-lg border border-red-300 p-1.5">
            <div className="flex flex-col">
              <div className="font-semibold">Delete this team</div>
              <div className="">{`This cannot be reversed.`}</div>
            </div>
            <Button color="secondary" onClick={handleDeleteTeam}>
              Delete this team
            </Button>
          </div>
        </div>
      );
    },
  },
];

const tabNameForView = {
  billing: "Billing",
  members: "Team Members",
  api: "API Keys",
} as const;

export default function WorkspaceSettingsModal() {
  const selectedTab = useAppSelector(state => {
    const opts = getModalOptions(state);
    const view = opts && "view" in opts ? opts.view : null;
    return view && tabNameForView[view as keyof typeof tabNameForView];
  });
  const workspaceId = useGetTeamIdFromRoute();
  const { members } = hooks.useGetWorkspaceMembers(workspaceId);
  const { workspace } = hooks.useGetWorkspace(workspaceId);
  const { userId: localUserId } = hooks.useGetUserId();

  if (!(workspaceId && workspace)) {
    return null;
  }

  const tab =
    selectedTab || workspace.subscription?.status === "canceled" ? "Billing" : "Team Members";
  const roles = members?.find(m => m.userId === localUserId)?.roles;
  const isAdmin = roles?.includes("admin") || false;
  const isDebugger = roles?.includes("debugger") || false;
  const hiddenTabs: SettingsTabTitle[] = [];

  if (!isAdmin) {
    hiddenTabs.push("Delete Team");
    hiddenTabs.push("Billing");
  }

  if (!isDebugger && !isAdmin) {
    hiddenTabs.push("API Keys");
  }

  return (
    <SettingsModal
      hiddenTabs={hiddenTabs}
      tab={tab}
      panelProps={{ isAdmin, workspaceId }}
      settings={settings}
      size="lg"
      title={
        workspace.logo ? (
          <Base64Image src={workspace.logo} format={workspace.logoFormat} className="max-h-12" />
        ) : (
          workspace.name || "Team Settings"
        )
      }
    />
  );
}
