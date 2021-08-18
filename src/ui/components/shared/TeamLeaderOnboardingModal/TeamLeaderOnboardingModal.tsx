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
import { Nag } from "ui/hooks/users";
import { Workspace, WorkspaceUser } from "ui/types";
import { validateEmail } from "ui/utils/helpers";
import BlankScreen from "../BlankScreen";
import { Button, DisabledButton } from "../Button";
import { TextInput } from "../Forms";
import Modal from "../NewModal";
import InvitationLink from "../NewWorkspaceModal/InvitationLink";
import { WorkspaceMembers } from "../WorkspaceSettingsModal/WorkspaceSettingsModal";
import ReactTooltip from "react-tooltip";

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
        "max-w-max items-center px-4 py-2 border border-transparent text-lg font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent text-white bg-primaryAccent hover:bg-primaryAccentHover"
      )}
    >
      {children}
    </button>
  );
}

function NextButton({
  current,
  total,
  text,
  setCurrent,
  onNext,
  allowNext,
}: {
  current: number;
  total: number;
  text?: string;
  setCurrent: Dispatch<SetStateAction<number>>;
  hideModal: typeof actions.hideModal;
  onNext?: () => void;
  allowNext: boolean;
}) {
  const [nextClicked, setNextClicked] = useState<boolean>(false);

  const onClick = () => {
    if (onNext) {
      onNext();
    }
    setNextClicked(true);
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
  const buttonText = inferLoading ? "Loading" : text || "Next";

  return (
    <Button size="2xl" style="primary" color="blue" onClick={onClick}>
      {buttonText}
    </Button>
  );
}

type SlideBodyProps = PropsFromRedux & {
  onNext: () => void;
  setNewWorkspace: Dispatch<SetStateAction<Workspace | null>>;
  setCurrent: Dispatch<SetStateAction<number>>;
  newWorkspace: Workspace | null;
  total: number;
  current: number;
};

function IntroPage({ hideModal, onNext }: SlideBodyProps) {
  return (
    <>
      <div className="space-y-4 place-content-center">
        <img className="w-16 h-16 mx-auto" src="/images/logo.svg" />
      </div>
      <div className="text-3xl font-semibold">Set up your team</div>
      <div className="text-center">
        Replay teams are the easiest way to collaborate on bug reports, pull requests, and technical
        questions.
      </div>
      <div className="space-x-4">
        <Button size="2xl" style="primary" color="blue" onClick={onNext}>
          Create a team
        </Button>
        <Button size="2xl" style="secondary" color="blue" onClick={hideModal}>
          Skip for now
        </Button>
      </div>
    </>
  );
}

function TeamNamePage({ hideModal, setNewWorkspace, setCurrent, total, current }: SlideBodyProps) {
  const [inputValue, setInputValue] = useState<string>("");
  const [allowNext, setAllowNext] = useState<boolean>(false);
  const { id: userId } = hooks.useGetUserInfo();

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
    setInputValue(e.target.value);
  };
  const onSkip = () => {
    // Strip any query parameters so they don't bump into this onboarding flow again.
    window.history.pushState({}, document.title, window.location.pathname);
    hideModal();
  };
  const handleSave = () => createNewWorkspace({ variables: { name: inputValue, userId } });

  return (
    <>
      <div className="space-y-4 place-content-center">
        <img className="w-16 h-16 mx-auto" src="/images/logo.svg" />
      </div>
      <div className="text-3xl font-semibold">Your team name</div>
      <div className="text-center">
        We recommend keeping it simple and using your company or project name.
      </div>
      <div className="py-4 flex flex-col w-full">
        <TextInput placeholder="Team name" value={inputValue} onChange={onChange} />
      </div>
      <div className="space-x-4">
        <NextButton onNext={handleSave} {...{ current, total, setCurrent, hideModal, allowNext }} />
        <Button size="2xl" style="secondary" color="blue" onClick={onSkip}>
          Skip for now
        </Button>
      </div>
    </>
  );
}

function TeamMemberInvitationPage({ newWorkspace, setWorkspaceId, onNext }: SlideBodyProps) {
  const [inputValue, setInputValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { members, loading } = hooks.useGetWorkspaceMembers(newWorkspace!.id);
  const inviteNewWorkspaceMember = hooks.useInviteNewWorkspaceMember(() => {
    setInputValue("");
    setIsLoading(false);
  });

  useEffect(() => {
    setWorkspaceId(newWorkspace!.id);
  });

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

  return (
    <>
      <div className="space-y-4 place-content-center">
        <img className="w-16 h-16 mx-auto" src="/images/logo.svg" />
      </div>
      <div className="text-3xl font-semibold">Invite your team members</div>
      <div className="text-center">
        Replay is for your whole team. Invite anyone who you would like to be able to record and
        discuss replays with.
      </div>
      <form className="flex flex-col w-full" onSubmit={handleAddMember}>
        <div className="text-sm uppercase font-semibold">{`Invite via email`}</div>
        <div className="flex-grow flex flex-row space-x-4">
          <TextInput placeholder="Email address" value={inputValue} onChange={onChange} />
          <ModalButton onClick={handleAddMember} disabled={isLoading}>
            {isLoading ? "Loading" : "Invite"}
          </ModalButton>
        </div>
        {errorMessage ? <div>{errorMessage}</div> : null}
      </form>
      {!loading && sortedMembers ? (
        <div className="overflow-auto w-full">
          <WorkspaceMembers members={sortedMembers} />
        </div>
      ) : null}
      <InvitationLink workspaceId={newWorkspace!.id} showDomainCheck={false} />
      <div className="space-x-4">
        <Button size="2xl" style="primary" color="blue" onClick={onNext}>
          Next
        </Button>
        <Button size="2xl" style="secondary" color="blue" onClick={onNext}>
          Skip for now
        </Button>
      </div>
    </>
  );
}

type DownloadPageProps = PropsFromRedux & {
  setCurrent: Dispatch<SetStateAction<number>>;
  setNewWorkspace: Dispatch<SetStateAction<Workspace | null>>;
  newWorkspace: Workspace;
  onNext: () => void;
  total: number;
  current: number;
};

function DownloadPage({ hideModal, onNext }: SlideBodyProps) {
  const startDownload = (url: string) => {
    window.open(url, "_blank");
    onNext();
  };
  const handleMac = () => {
    startDownload("https://replay.io/downloads/replay.dmg");
  };
  const handleLinux = () => {
    window.open("https://replay.io/downloads/linux-replay.tar.bz2");
    onNext();
  };

  return (
    <>
      <div className="space-y-4 place-content-center">
        <img className="w-16 h-16 mx-auto" src="/images/logo.svg" />
      </div>
      <div className="text-3xl font-semibold">Download Replay</div>
      <div className="text-center">
        Record your first replay with the Replay browser or go directly to your team’s library.
      </div>
      <div className="py-4 flex flex-row w-full space-x-4 justify-center">
        <Button size="2xl" style="primary" color="blue" onClick={handleMac}>
          Mac
        </Button>
        <Button size="2xl" style="primary" color="blue" onClick={handleLinux}>
          Linux
        </Button>
        <div title="Coming soon">
          <DisabledButton>Windows</DisabledButton>
        </div>
      </div>
      <div className="space-x-4">
        <Button size="2xl" style="secondary" color="blue" onClick={hideModal}>
          Skip for now
        </Button>
      </div>
      <ReactTooltip delayHide={200} delayShow={200} place={"top"} />
    </>
  );
}

function DownloadingPage({ hideModal }: SlideBodyProps) {
  return (
    <>
      <div className="space-y-4 place-content-center">
        <img className="w-16 h-16 mx-auto" src="/images/logo.svg" />
      </div>
      <div className="text-3xl font-semibold">Now downloading Replay</div>
      <div className="text-center">
        {`Once the download is finished, install and open the Replay browser. We'll see you there!`}
      </div>
      <div className="space-x-4">
        <Button size="2xl" style="secondary" color="blue" onClick={hideModal}>
          Take me to my library
        </Button>
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
    onNext: () => setCurrent(current + 1),
    setNewWorkspace,
    setCurrent,
    newWorkspace,
    current,
    total: 4,
  };

  if (current === 1) {
    slide = <IntroPage {...newProps} />;
  } else if (current === 2) {
    slide = <TeamNamePage {...newProps} />;
  } else if (current === 3) {
    slide = <TeamMemberInvitationPage {...newProps} />;
  } else if (current === 4) {
    slide = <DownloadPage {...newProps} />;
  } else {
    slide = <DownloadingPage {...newProps} />;
  }

  return (
    <>
      <BlankScreen className="fixed" background="white" />
      <Modal options={{ maskTransparency: "transparent" }}>
        <div
          className="p-12 bg-white text-xl space-y-8 relative flex flex-col items-center"
          style={{ width: "520px" }}
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
