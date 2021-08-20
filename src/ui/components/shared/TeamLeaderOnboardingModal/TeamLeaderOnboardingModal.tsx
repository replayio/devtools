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
import { validateEmail } from "ui/utils/helpers";
import BlankScreen from "../BlankScreen";
import { DisabledLgButton, PrimaryLgButton, SecondaryLgButton } from "../Button";
import { TextInput } from "../Forms";
import Modal from "../NewModal";
import InvitationLink from "../NewWorkspaceModal/InvitationLink";
import { WorkspaceMembers } from "../WorkspaceSettingsModal/WorkspaceSettingsModal";
import { trackEvent } from "ui/utils/telemetry";
const Circles = require("../Circles").default;

const DOWNLOAD_PAGE_INDEX = 4;

export const ReplayLogo = () => <img className="w-24 h-24" src="/images/logo.svg" />;

function DownloadButtonContent({ text, imgUrl }: { text: string; imgUrl: string }) {
  return (
    <div
      className="flex flex-row items-center w-full justify-between"
      style={{ minWidth: "120px" }}
    >
      <span>{text}</span>
      <img className="w-8 h-8" src={imgUrl} />
    </div>
  );
}

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
        "max-w-max items-center px-4 py-2 border border-transparent font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent text-white bg-primaryAccent hover:bg-primaryAccentHover"
      )}
    >
      {children}
    </button>
  );
}

export function ModalHeader({ children }: { children: string }) {
  return <div className="text-7xl font-semibold">{children}</div>;
}

function NextButton({
  current,
  text,
  setCurrent,
  onNext,
  allowNext,
}: {
  current: number;
  text?: string;
  setCurrent: Dispatch<SetStateAction<number>>;
  hideModal: typeof actions.hideModal;
  onNext: () => void;
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
    <PrimaryLgButton color="blue" onClick={onClick}>
      {buttonText}
    </PrimaryLgButton>
  );
}

type SlideBodyProps = PropsFromRedux & {
  onNext: () => void;
  setNewWorkspace: Dispatch<SetStateAction<Workspace | null>>;
  setCurrent: Dispatch<SetStateAction<number>>;
  onSkipToDownload: (location?: string) => void;
  onSkipToLibrary: () => void;
  onFinished: () => void;
  newWorkspace: Workspace | null;
  current: number;
};

function IntroPage({ onSkipToDownload, onNext }: SlideBodyProps) {
  return (
    <>
      <ReplayLogo />
      <ModalHeader>Set up your team</ModalHeader>
      <div className="text-center">
        Replay teams are the easiest way to collaborate on bug reports, pull requests, and technical
        questions
      </div>
      <div className="space-x-4 pt-16">
        <PrimaryLgButton color="blue" onClick={onNext}>
          Create a team
        </PrimaryLgButton>
        <SecondaryLgButton color="blue" onClick={() => onSkipToDownload("intro-page")}>
          Skip for now
        </SecondaryLgButton>
      </div>
    </>
  );
}

function TeamNamePage({
  hideModal,
  setNewWorkspace,
  setCurrent,
  current,
  onSkipToDownload,
}: SlideBodyProps) {
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
  const handleSave = () => {
    createNewWorkspace({ variables: { name: inputValue, userId } });
    trackEvent("created-team");
  };

  return (
    <>
      <ReplayLogo /> <ModalHeader>Your team name</ModalHeader>
      <div className="text-center">
        We recommend keeping it simple and using your company or project name
      </div>
      <div className="py-4 flex flex-col w-full">
        <TextInput
          placeholder="Team name"
          value={inputValue}
          onChange={onChange}
          textSize={"xl"}
          center={true}
        />
      </div>
      <div className="space-x-4 pt-16">
        <NextButton onNext={handleSave} {...{ current, setCurrent, hideModal, allowNext }} />
        <SecondaryLgButton color="blue" onClick={() => onSkipToDownload("team-name-page")}>
          Skip for now
        </SecondaryLgButton>
      </div>
    </>
  );
}

function TeamMemberInvitationPage({
  newWorkspace,
  setWorkspaceId,
  onSkipToDownload,
}: SlideBodyProps) {
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
    trackEvent("invited-team-member");
  };

  return (
    <>
      <ReplayLogo /> <ModalHeader>Invite your team members</ModalHeader>
      <div className="text-center">
        Replay is for your whole team. Invite anyone who you would like to be able to record and
        discuss replays with
      </div>
      <div className="text-2xl w-full space-y-4">
        <form className="flex flex-col w-full space-y-4 text-2xl" onSubmit={handleAddMember}>
          <div className="text-sm uppercase font-bold">{`Invite via email`}</div>
          <div className="flex-grow flex flex-row space-x-4">
            <TextInput
              placeholder="Email address"
              value={inputValue}
              onChange={onChange}
              textSize={"lg"}
            />
            <ModalButton onClick={handleAddMember} disabled={isLoading}>
              {isLoading ? "Loading" : "Invite"}
            </ModalButton>
          </div>
          {errorMessage ? <div>{errorMessage}</div> : null}
        </form>
        {!loading && sortedMembers ? (
          <div className="overflow-auto w-full text-2xl " style={{ height: "180px" }}>
            <WorkspaceMembers members={sortedMembers} isAdmin />
          </div>
        ) : null}
        <InvitationLink workspaceId={newWorkspace!.id} showDomainCheck={false} isLarge={true} />
      </div>
      <div className="space-x-4 pt-16">
        <PrimaryLgButton color="blue" onClick={() => onSkipToDownload()}>
          Next
        </PrimaryLgButton>
      </div>
    </>
  );
}

function DownloadPage({ onFinished, onNext, onSkipToLibrary }: SlideBodyProps) {
  const startDownload = (url: string) => {
    window.open(url, "_blank");
    onNext();
  };
  const handleMac = () => {
    trackEvent("downloaded-mac");
    startDownload("https://replay.io/downloads/replay.dmg");
  };
  const handleLinux = () => {
    trackEvent("downloaded-linux");
    startDownload("https://replay.io/downloads/linux-replay.tar.bz2");
  };
  const handleWindows = () => {
    trackEvent("downloaded-windows");
  };

  return (
    <>
      <ReplayLogo /> <ModalHeader>Download Replay</ModalHeader>
      <div className="text-center">
        Record your first replay with the Replay browser, or go directly to your team’s library
      </div>
      <div className="py-4 flex flex-row w-full space-x-4 justify-center">
        <PrimaryLgButton color="blue" onClick={handleMac}>
          <DownloadButtonContent text="Mac" imgUrl="/images/icon-apple.svg" />
        </PrimaryLgButton>
        <PrimaryLgButton color="blue" onClick={handleLinux}>
          <DownloadButtonContent text="Linux" imgUrl="/images/icon-linux.svg" />
        </PrimaryLgButton>
        <div title="Coming soon" onClick={handleWindows}>
          <DisabledLgButton>
            <DownloadButtonContent text="Windows" imgUrl="/images/icon-windows.svg" />
          </DisabledLgButton>
        </div>
      </div>
      <div className="space-x-4 pt-16">
        <SecondaryLgButton color="blue" onClick={onSkipToLibrary}>
          Skip for now
        </SecondaryLgButton>
      </div>
    </>
  );
}

function DownloadingPage({ onFinished }: SlideBodyProps) {
  return (
    <>
      <ReplayLogo />
      <ModalHeader>Downloading Replay ...</ModalHeader>
      <div className="text-center">
        {`Once the download is finished, install and open the Replay browser. We'll see you there!`}
      </div>
      <div className="space-x-4 pt-16">
        <PrimaryLgButton color="blue" onClick={onFinished}>
          Take me to my library
        </PrimaryLgButton>
      </div>
    </>
  );
}

function OnboardingModal(props: PropsFromRedux) {
  const [current, setCurrent] = useState<number>(1);
  const [randomNumber, setRandomNumber] = useState<number>(Math.random());
  const [newWorkspace, setNewWorkspace] = useState<Workspace | null>(null);

  useEffect(() => {
    trackEvent("started-onboarding");
  }, []);

  const onNext = () => {
    setCurrent(current + 1);
    setRandomNumber(Math.random());
  };
  const onSkipToDownload = (location?: string) => {
    setCurrent(DOWNLOAD_PAGE_INDEX);
    if (location) {
      trackEvent("skipped-create-team", { skippedFrom: location });
    }
    setRandomNumber(Math.random());
  };
  const onSkipToLibrary = () => {
    window.history.pushState({}, document.title, window.location.pathname);
    trackEvent("skipped-replay-download");
    props.hideModal();
  };
  const onFinished = () => {
    window.history.pushState({}, document.title, window.location.pathname);
    trackEvent("finished-onboarding");
    props.hideModal();
  };

  const newProps = {
    ...props,
    onNext,
    onSkipToDownload,
    onSkipToLibrary,
    onFinished,
    setNewWorkspace,
    setCurrent,
    newWorkspace,
    current,
  };
  let slide;

  if (current === 1) {
    slide = <IntroPage {...newProps} />;
  } else if (current === 2) {
    slide = <TeamNamePage {...newProps} />;
  } else if (current === 3) {
    slide = <TeamMemberInvitationPage {...newProps} />;
  } else if (current === DOWNLOAD_PAGE_INDEX) {
    slide = <DownloadPage {...newProps} />;
  } else {
    slide = <DownloadingPage {...newProps} />;
  }

  return (
    <>
      <BlankScreen className="fixed" background="white" />
      <Circles randomNumber={randomNumber} />
      <Modal options={{ maskTransparency: "transparent" }} blurMask={false}>
        <div
          className="p-12 text-4xl space-y-16 relative flex flex-col items-center"
          style={{ width: "800px" }}
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
