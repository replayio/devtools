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
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import hooks from "ui/hooks";
import { Workspace, WorkspaceUser } from "ui/types";
import { removeUrlParameters } from "ui/utils/environment";
import { features } from "ui/utils/prefs";
import { isValidTeamName, validateEmail } from "ui/utils/helpers";
import { TextInput } from "../Forms";
import Modal from "../NewModal";
import { WorkspaceMembers } from "../WorkspaceSettingsModal/WorkspaceSettingsModal";
import InvitationLink from "./InvitationLink";
import { useConfirm } from "../Confirm";

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
        "max-w-max items-center px-4 py-2 border border-transparent font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent text-white bg-primaryAccent hover:bg-primaryAccentHover"
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
    <div className="space-y-3 flex flex-col flex-grow overflow-hidden">
      <h2 className="text-2xl ">{headerText}</h2>
      <div className="text-gray-500 flex flex-col flex-grow space-y-3 overflow-hidden">
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
        "items-center px-3 py-1.5 border border-transparent font-medium rounded-md shadow-sm focus:outline-none",
        "text-gray-600 bg-gray-300"
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
      setCurrent(current + 1);
    }
  }, [allowNext, nextClicked]);

  const inferLoading = nextClicked && !allowNext;
  const buttonText = inferLoading ? "Loading" : "Next";

  return (
    <button
      onClick={onClick}
      disabled={current == total}
      type="button"
      className={classNames(
        "items-center px-3 py-1.5 border border-transparent font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent",
        {
          "text-white bg-primaryAccent hover:bg-primaryAccentHover": current < total,
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

  function onNewWorkspaceCompleted(workspace: Workspace) {
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
  }, [textInputRef.current]);

  return (
    <>
      <SlideContent headerText="Team name">
        {/* <form onSubmit={handleSave} className="flex flex-col space-y-4"> */}
        <div className="py-3 flex flex-col px-0.5">
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

  // This is hacky. A member entry will only have an e-mail if it was pending. If
  // they had already accepted, we don't expose that member's e-mail. This is not
  // a concern for now, since this will only run right as the team is created. It's
  // unlikely that while this slide is up that a pending member would accept the invite
  // immediately.
  const pendingMembers = members?.filter(m => m.email) || [];
  const sortedMembers = pendingMembers.sort(
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
    } else if (pendingMembers.map(m => m.email).includes(inputValue)) {
      setErrorMessage("Address has already been invited");
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
  }, [textInputRef.current]);

  return (
    <>
      <SlideContent headerText="Invite team members">
        <form className="flex flex-col" onSubmit={handleAddMember}>
          <div className="flex-grow flex flex-row space-x-3 px-0.5">
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
        <div className="overflow-auto flex-grow">
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

function SlideBody3({ setWorkspaceId, hideModal, newWorkspace }: SlideBody3Props) {
  const updateDefaultWorkspace = hooks.useUpdateDefaultWorkspace();

  const onClick = () => {
    removeUrlParameters();

    setWorkspaceId(newWorkspace.id);
    updateDefaultWorkspace({ variables: { workspaceId: newWorkspace.id } });
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
            "items-center px-3 py-1.5 border border-transparent font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent",
            "text-white bg-primaryAccent hover:bg-primaryAccentHover"
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
          className="p-4 bg-white rounded-lg shadow-xl text-sm space-y-6 relative flex flex-col justify-between"
          style={{ width: "480px" }}
        >
          {slide}
        </div>
      </Modal>
    </>
  );
}

const connector = connect(() => ({}), {
  hideModal: actions.hideModal,
  setWorkspaceId: actions.setWorkspaceId,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(OnboardingModal);
