import React, { ChangeEvent, useEffect, useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import hooks from "ui/hooks";
import * as selectors from "ui/reducers/app";
import { UIState } from "ui/state";
import { WorkspaceUser } from "ui/types";
import { validateEmail } from "ui/utils/helpers";
import { TextInput } from "../Forms";
import InvitationLink from "../NewWorkspaceModal/InvitationLink";
import SettingsModal from "../SettingsModal";
import { Settings } from "../SettingsModal/types";
import WorkspaceAPIKeys from "./WorkspaceAPIKeys";
import WorkspaceSubscription from "./WorkspaceSubscription";
import WorkspaceMember, { NonRegisteredWorkspaceMember } from "./WorkspaceMember";
import { Button, DisabledButton, PrimaryButton } from "../Button";
import { useConfirm } from "../Confirm";
import GeneralSettings from "./GeneralSettings";
import OrganizationSettings from "./OrganizationSettings";
import Base64Image from "../Base64Image";

export function WorkspaceMembers({
  members,
  isAdmin,
}: {
  members: WorkspaceUser[];
  isAdmin: boolean;
}) {
  const sortedMembers = members.sort(
    (a: WorkspaceUser, b: WorkspaceUser) => Number(b.pending) - Number(a.pending)
  );

  const canLeave = members.length > 1;
  const canAdminLeave = canLeave && members.filter(a => a.roles?.includes("admin")).length > 1;

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
            canLeave={member.roles?.includes("admin") ? canAdminLeave : canLeave}
          />
        )
      )}
    </ul>
  );
}

type WorkspaceFormProps = Pick<PropsFromRedux, "workspaceId"> & {
  members?: WorkspaceUser[];
};

function WorkspaceForm({ workspaceId, members }: WorkspaceFormProps) {
  const [inputValue, setInputValue] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inviteNewWorkspaceMember = hooks.useInviteNewWorkspaceMember(() => {
    setInputValue("");
    setIsLoading(false);
  });

  const memberEmails = (members || []).filter(m => m.email).map(m => m.email!);
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };
  const handleAddMember = (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();

    if (!validateEmail(inputValue)) {
      setErrorMessage("Invalid email address");
      return;
    } else if (memberEmails.includes(inputValue)) {
      setErrorMessage("Address has already been invited");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    inviteNewWorkspaceMember({
      variables: { workspaceId, email: inputValue, roles: ["viewer", "debugger"] },
    });
  };

  return (
    <form className="flex flex-col" onSubmit={handleAddMember}>
      <div className="flex flex-grow flex-row space-x-3 p-0.5">
        <TextInput placeholder="Email address" value={inputValue} onChange={onChange} />
        {!isLoading ? (
          <PrimaryButton color="blue">Invite</PrimaryButton>
        ) : (
          <DisabledButton>Loading</DisabledButton>
        )}
      </div>
      {errorMessage ? <div className="text-xs text-red-500">{errorMessage}</div> : null}
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
    hideModal: PropsFromRedux["hideModal"];
    setWorkspaceId: PropsFromRedux["setWorkspaceId"];
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
    component: function TeamMembers({ isAdmin, workspaceId, settings, ...rest }) {
      const { members } = hooks.useGetWorkspaceMembers(workspaceId);

      return (
        <div className="flex flex-grow flex-col space-y-3 overflow-hidden">
          <div>{`Manage members here so that everyone who belongs to this team can see each other's replays.`}</div>
          <WorkspaceForm {...rest} workspaceId={workspaceId} members={members} />
          <div className="text-xs font-semibold uppercase">{`Members`}</div>
          <div className="flex-grow overflow-auto">
            <div className="workspace-members-container flex flex-col space-y-1.5">
              <div className="flex flex-col space-y-1.5">
                {members ? <WorkspaceMembers members={members} isAdmin={isAdmin} /> : null}
              </div>
            </div>
          </div>
          <InvitationLink workspaceId={workspaceId} showDomainCheck={isAdmin} />
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
    component: function DeleteTeam({ hideModal, setWorkspaceId, workspaceId }) {
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
            hideModal();
            setWorkspaceId(null);
            updateDefaultWorkspace({ variables: { workspaceId: null } });
          }
        });
      };

      return (
        <div className="flex flex-col space-y-3">
          <div className=" text-xs font-semibold uppercase">{`Danger Zone`}</div>
          <div className="flex flex-row justify-between rounded-lg border border-red-300 p-1.5">
            <div className="flex flex-col">
              <div className="font-semibold">Delete this team</div>
              <div className="">{`This cannot be reversed.`}</div>
            </div>
            <Button color="red" onClick={handleDeleteTeam} size="md" style="primary">
              Delete this team
            </Button>
          </div>
        </div>
      );
    },
  },
];

function WorkspaceSettingsModal({ workspaceId, view, ...rest }: PropsFromRedux) {
  const [selectedTab, setTab] = useState<string>();
  const { members } = hooks.useGetWorkspaceMembers(workspaceId!);
  const { workspace } = hooks.useGetWorkspace(workspaceId!);
  const { userId: localUserId } = hooks.useGetUserId();

  useEffect(() => {
    if (view) {
      const views: Record<string, string> = {
        billing: "Billing",
        members: "Team Members",
        api: "API Keys",
      };
      setTab(views[view]);
    }
  }, [view]);

  if (!(workspaceId && workspace)) return null;

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
      panelProps={{ isAdmin, workspaceId, ...rest }}
      settings={settings}
      size="lg"
      title={
        workspace.logo ? (
          <Base64Image src={workspace.logo} className="max-h-12" />
        ) : (
          workspace.name || "Team Settings"
        )
      }
    />
  );
}

const connector = connect(
  (state: UIState) => {
    const opts = selectors.getModalOptions(state);
    const view = opts && "view" in opts ? opts.view : null;
    return { workspaceId: selectors.getWorkspaceId(state), view };
  },
  {
    hideModal: actions.hideModal,
    setWorkspaceId: actions.setWorkspaceId,
  }
);
export type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(WorkspaceSettingsModal);
