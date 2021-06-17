import classNames from "classnames";
import React, { ChangeEvent, MouseEventHandler, useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import Modal from "ui/components/shared/NewModal";
import hooks from "ui/hooks";
import * as selectors from "ui/reducers/app";
import { UIState } from "ui/state";
import { WorkspaceUser } from "ui/types";
import { validateEmail } from "ui/utils/helpers";
import { TextInput } from "../Forms";
import MaterialIcon from "../MaterialIcon";
import InvitationLink from "../NewWorkspaceModal/InvitationLink";
import WorkspaceMember, { NonRegisteredWorkspaceMember } from "./WorkspaceMember";

function ModalButton({
  children,
  onClick = () => {},
  className,
  disabled = false,
}: {
  children: React.ReactElement | string;
  className?: string;
  onClick?: MouseEventHandler;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={classNames(
        className,
        "max-w-max items-center px-4 py-2 border border-transparent text-lg font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-white bg-blue-600 hover:bg-blue-700"
      )}
    >
      {children}
    </button>
  );
}

export function WorkspaceMembers({ members }: { members: WorkspaceUser[] }) {
  return (
    <ul className="workspace-members">
      {members.map(member =>
        member.email ? (
          <NonRegisteredWorkspaceMember member={member} key={`non-registered-${member.email}`} />
        ) : (
          <WorkspaceMember member={member} key={`registered-${member.userId}`} />
        )
      )}
    </ul>
  );
}

function WorkspaceForm({ workspaceId }: PropsFromRedux) {
  const [inputValue, setInputValue] = useState("");
  const [invalidInput, setInvalidInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inviteNewWorkspaceMember = hooks.useInviteNewWorkspaceMember(() => {
    setInputValue("");
    setIsLoading(false);
  });

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };
  const handleAddMember = (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();

    if (!validateEmail(inputValue)) {
      setInvalidInput(true);
      return;
    }

    setInvalidInput(false);
    setIsLoading(true);
    inviteNewWorkspaceMember({ variables: { workspaceId, email: inputValue } });
  };

  return (
    <form className="flex flex-col" onSubmit={handleAddMember}>
      <div className="flex-grow flex flex-row space-x-4">
        <TextInput placeholder="Email address" value={inputValue} onChange={onChange} />
        <ModalButton onClick={handleAddMember} disabled={isLoading}>
          {isLoading ? "Loading" : "Invite"}
        </ModalButton>
      </div>
      {invalidInput ? <div className="text-red-500 text-sm">Invalid email address</div> : null}
    </form>
  );
}

function WorkspaceSettingsModal(props: PropsFromRedux) {
  const { members } = hooks.useGetWorkspaceMembers(props.workspaceId!);

  return (
    <Modal options={{ maskTransparency: "translucent" }} onMaskClick={props.hideModal}>
      <div
        className="p-12 bg-white rounded-lg shadow-xl text-xl relative flex flex-col justify-between"
        style={{ width: "520px", height: "520px" }}
      >
        <div className="space-y-12 flex flex-col flex-grow overflow-hidden">
          <h2 className="font-bold text-3xl text-gray-900">{`Team settings`}</h2>
          <div className="text-gray-500 flex flex-col flex-grow space-y-4 overflow-hidden">
            <div className="text-xl">{`Manage members here so that everyone who belongs to this team can see each other's replays.`}</div>
            <WorkspaceForm {...props} />
            <div className="text-gray-700 text-sm uppercase font-semibold">{`Members`}</div>
            <div className="overflow-auto flex-grow">
              <div className="workspace-members-container flex flex-col space-y-2">
                <div className="flex flex-col space-y-2">
                  {members ? <WorkspaceMembers members={members} /> : null}
                </div>
              </div>
            </div>
            <InvitationLink workspaceId={props.workspaceId!} />
          </div>
        </div>
        <button className="absolute top-4 right-4" onClick={props.hideModal}>
          <div>
            <MaterialIcon>close</MaterialIcon>
          </div>
        </button>
      </div>
    </Modal>
  );
}

const connector = connect((state: UIState) => ({ workspaceId: selectors.getWorkspaceId(state) }), {
  hideModal: actions.hideModal,
});
export type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(WorkspaceSettingsModal);
