import classNames from "classnames";
import React, {
  ChangeEvent,
  Dispatch,
  MouseEventHandler,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { ConnectedProps, connect } from "react-redux";

import { CreateNewWorkspace_createWorkspace_workspace } from "shared/graphql/generated/CreateNewWorkspace";
import { Workspace, WorkspaceUser } from "shared/graphql/types";
import { removeUrlParameters } from "shared/utils/environment";
import * as actions from "ui/actions/app";
import { useRedirectToTeam } from "ui/components/Library/Team/utils";
import hooks from "ui/hooks";
import { isValidTeamName, validateEmail } from "ui/utils/helpers";

import { useConfirm } from "../Confirm";
import { TextInput } from "../Forms";
import Modal from "../NewModal";
import { WorkspaceMembers } from "../WorkspaceSettingsModal/WorkspaceSettingsModal";
import InvitationLink from "./InvitationLink";

function ModalButton({
  children,
  onClick = () => {},
  disabled = false,
}: {
  children: React.ReactElement | string;
  onClick?: MouseEventHandler;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        "max-w-max items-center rounded-md border border-transparent bg-primaryAccent px-4 py-2 font-medium text-white shadow-sm hover:bg-primaryAccentHover focus:outline-none focus:ring-2 focus:ring-primaryAccent focus:ring-offset-2"
      }
    >
      {children}
    </button>
  );
}

function SlideContent({
  headerText,
  children,
}: {
  headerText: string;
  children: React.ReactElement | (React.ReactElement | null)[];
}) {
  return (
    <div className="flex flex-grow flex-col space-y-3 overflow-hidden">
      <h2 className="text-2xl ">{headerText}</h2>
      <div className="flex flex-grow flex-col space-y-3 overflow-hidden text-gray-500">
        {children}
      </div>
    </div>
  );
}

function DisabledNextButton() {
  return (
    <button
      disabled={true}
      type="button"
      className={classNames(
        "items-center rounded-md border border-transparent px-3 py-1.5 font-medium shadow-sm focus:outline-none",
        "bg-gray-300 text-gray-600"
      )}
    >
      Next
    </button>
  );
}

function NextButton({
  current,
  total,
  setCurrent,
  onNext,
  didUserConfirm,
  allowNext,
}: {
  current: number;
  total: number;
  setCurrent: Dispatch<SetStateAction<number>>;
  hideModal: typeof actions.hideModal;
  didUserConfirm: () => Promise<boolean>;
  onNext?: () => void;
  allowNext: boolean;
}) {
  const [nextClicked, setNextClicked] = useState<boolean>(false);

  const onClick = () => {
    didUserConfirm().then(confirmed => {
      if (!confirmed) {
        return;
      }

      if (onNext) {
        onNext();
      }

      setNextClicked(true);
    });
  };

  useEffect(() => {
    // Only navigate to the next slide the work that eventually turns
    // allowNext to true is finished. This allows us to do mutations
    // in between navigations.
    if (allowNext && nextClicked) {
      setCurrent(current => current + 1);
    }
  }, [allowNext, nextClicked, setCurrent]);

  const inferLoading = nextClicked && !allowNext;
  const buttonText = inferLoading ? "Loading" : "Next";

  return (
    <button
      onClick={onClick}
      disabled={current == total}
      type="button"
      className={classNames(
        "items-center rounded-md border border-transparent px-3 py-1.5 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primaryAccent focus:ring-offset-2",
        {
          "bg-primaryAccent text-white hover:bg-primaryAccentHover": current < total,
        }
      )}
    >
      {buttonText}
    </button>
  );
}

type SlideBodyProps = PropsFromRedux & {
  setCurrent: Dispatch<SetStateAction<number>>;
  setNewWorkspace: Dispatch<SetStateAction<Workspace | null>>;
  newWorkspace: Workspace | null;
  total: number;
  current: number;
};

function SlideBody1({ hideModal, setNewWorkspace, setCurrent, total, current }: SlideBodyProps) {
  const [inputValue, setInputValue] = useState<string>("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [allowNext, setAllowNext] = useState<boolean>(false);
  const textInputRef = useRef<HTMLInputElement>(null);

  const createNewWorkspace = hooks.useCreateNewWorkspace(onNewWorkspaceCompleted);
  const updateDefaultWorkspace = hooks.useUpdateDefaultWorkspace();

  function onNewWorkspaceCompleted(workspace: CreateNewWorkspace_createWorkspace_workspace) {
    setNewWorkspace(workspace);
    updateDefaultWorkspace({
      variables: {
        workspaceId: workspace.id,
      },
    });
    setAllowNext(true);
  }
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (isValidTeamName(e.target.value)) {
      setInputError(null);
    }

    setInputValue(e.target.value);
  };
  const handleSave = () => {
    if (!isValidTeamName(inputValue)) {
      setInputError("The team name cannot be blank");
      return;
    }

    createNewWorkspace({
      variables: {
        name: inputValue,
        planKey: "team-v1",
      },
    });
  };

  useEffect(() => {
    textInputRef.current?.focus();
  }, []);

  return (
    <>
      <SlideContent headerText="Team name">
        {/* <form onSubmit={handleSave} className="flex flex-col space-y-4"> */}
        <div className="flex flex-col py-3 px-0.5">
          <TextInput value={inputValue} onChange={onChange} ref={textInputRef} />
          {inputError ? <div className="text-red-500">{inputError}</div> : null}
        </div>
        {/* </form> */}
      </SlideContent>
      <div className="grid">
        {isValidTeamName(inputValue) ? (
          <NextButton
            onNext={handleSave}
            didUserConfirm={() => Promise.resolve(true)}
            {...{ current, total, setCurrent, hideModal, allowNext }}
          />
        ) : (
          <DisabledNextButton />
        )}
      </div>
    </>
  );
}

function SlideBody2({ hideModal, setCurrent, newWorkspace, total, current }: SlideBodyProps) {
  const { userId } = hooks.useGetUserId();
  const [inputValue, setInputValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { members, loading } = hooks.useGetWorkspaceMembers(newWorkspace!.id);
  const inviteNewWorkspaceMember = hooks.useInviteNewWorkspaceMember(() => {
    setInputValue("");
    setIsLoading(false);
  });
  const textInputRef = useRef<HTMLInputElement>(null);
  const { confirmDestructive } = useConfirm();

  const invitedMembers = members?.filter(m => m.userId !== userId) || [];
  const sortedMembers = invitedMembers.sort(
    (a: WorkspaceUser, b: WorkspaceUser) =>
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
  );

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };
  const handleAddMember = (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();

    if (!validateEmail(inputValue)) {
      setErrorMessage("Invalid email address");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    inviteNewWorkspaceMember({ variables: { workspaceId: newWorkspace!.id, email: inputValue } });
  };
  const didUserConfirm = () => {
    if (!inputValue) {
      return Promise.resolve(true);
    }

    return confirmDestructive({
      message: "Continue without sending invitations?",
      description:
        "You started to invite someone, but didn't press the invite button. Are you sure you want to proceed?",
      acceptLabel: "Continue anyways",
    });
  };

  useEffect(() => {
    textInputRef.current?.focus();
  }, []);

  return (
    <>
      <SlideContent headerText="Invite team members">
        <form className="flex flex-col" onSubmit={handleAddMember}>
          <div className="flex flex-grow flex-row space-x-3 px-0.5">
            <TextInput
              placeholder="Email address"
              value={inputValue}
              onChange={onChange}
              ref={textInputRef}
            />
            <ModalButton onClick={handleAddMember} disabled={isLoading}>
              {isLoading ? "Loading" : "Invite"}
            </ModalButton>
          </div>
          {errorMessage ? <div>{errorMessage}</div> : null}
        </form>
        <div className="flex-grow overflow-auto">
          {!loading && sortedMembers ? <WorkspaceMembers members={sortedMembers} isAdmin /> : null}
        </div>
        <InvitationLink workspaceId={newWorkspace!.id} />
      </SlideContent>
      <div className="grid">
        <NextButton
          allowNext={true}
          {...{ current, total, setCurrent, hideModal, didUserConfirm }}
        />
      </div>
    </>
  );
}

type SlideBody3Props = PropsFromRedux & {
  setCurrent: Dispatch<SetStateAction<number>>;
  setNewWorkspace: Dispatch<SetStateAction<Workspace | null>>;
  newWorkspace: Workspace;
  total: number;
  current: number;
};

function SlideBody3({ hideModal, newWorkspace }: SlideBody3Props) {
  const updateDefaultWorkspace = hooks.useUpdateDefaultWorkspace();
  const redirectToTeam = useRedirectToTeam(true);

  const onClick = () => {
    removeUrlParameters();
    updateDefaultWorkspace({ variables: { workspaceId: newWorkspace.id } });
    redirectToTeam(`${newWorkspace.id}`);
    hideModal();
  };

  return (
    <>
      <SlideContent headerText="Team setup complete">
        <div>{`Your new team is ready.`}</div>
      </SlideContent>
      <div className="grid">
        <button
          onClick={onClick}
          className={classNames(
            "items-center rounded-md border border-transparent px-3 py-1.5 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primaryAccent focus:ring-offset-2",
            "bg-primaryAccent text-white hover:bg-primaryAccentHover"
          )}
        >
          {`Take me to my team`}
        </button>
      </div>
    </>
  );
}

function OnboardingModal(props: PropsFromRedux) {
  const [current, setCurrent] = useState<number>(1);
  const [newWorkspace, setNewWorkspace] = useState<Workspace | null>(null);

  let slide;
  const newProps = {
    ...props,
    setCurrent,
    setNewWorkspace,
    newWorkspace,
    current,
    total: 4,
  };

  if (current === 1) {
    slide = <SlideBody1 {...newProps} />;
  } else if (current === 2) {
    slide = <SlideBody2 {...newProps} />;
  } else {
    slide = <SlideBody3 {...{ ...newProps, newWorkspace: newWorkspace! }} />;
  }

  const height = current == 2 ? "520px" : "360px";

  return (
    <>
      <Modal options={{ maskTransparency: "translucent" }} onMaskClick={props.hideModal}>
        <div
          className="text-modalColor relative flex flex-col justify-between space-y-2 rounded-lg bg-modalBgcolor p-4 text-sm shadow-xl backdrop-blur-sm"
          style={{ width: "480px" }}
        >
          {slide}
        </div>
      </Modal>
    </>
  );
}

const connector = connect(null, {
  hideModal: actions.hideModal,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(OnboardingModal);
