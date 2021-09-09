import React, { ChangeEvent, Dispatch, SetStateAction, useEffect, useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import hooks from "ui/hooks";
import { Workspace, WorkspaceUser } from "ui/types";
import { isValidTeamName, validateEmail } from "ui/utils/helpers";
import { PrimaryLgButton, SecondaryLgButton } from "../Button";
import { TextInput } from "../Forms";
import {
  OnboardingActions,
  OnboardingBody,
  OnboardingButton,
  OnboardingContent,
  OnboardingHeader,
  NextButton,
  OnboardingModalContainer,
} from "../Onboarding/index";
import InvitationLink from "../NewWorkspaceModal/InvitationLink";
import { WorkspaceMembers } from "../WorkspaceSettingsModal/WorkspaceSettingsModal";
import { trackEvent } from "ui/utils/telemetry";
import { removeUrlParameters } from "ui/utils/environment";
import { DownloadPage } from "../Onboarding/DownloadPage";
import { DownloadingPage } from "../Onboarding/DownloadingPage";

const DOWNLOAD_PAGE_INDEX = 4;

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
      <OnboardingHeader>Set up your team</OnboardingHeader>
      <OnboardingBody>
        Replay teams are the easiest way to collaborate on bug reports, pull requests, and technical
        questions
      </OnboardingBody>
      <OnboardingActions>
        <PrimaryLgButton color="blue" onClick={onNext}>
          Create a team
        </PrimaryLgButton>
        <SecondaryLgButton color="blue" onClick={() => onSkipToDownload("intro-page")}>
          Skip for now
        </SecondaryLgButton>
      </OnboardingActions>
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
  const [inputError, setInputError] = useState<string | null>(null);
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
    trackEvent("created-team");
  };

  return (
    <>
      <OnboardingHeader>Your team name</OnboardingHeader>
      <OnboardingBody>
        We recommend keeping it simple and using your company or project name
      </OnboardingBody>
      <div className="py-3 flex flex-col w-full">
        <TextInput
          placeholder="Team name"
          value={inputValue}
          onChange={onChange}
          textSize={"xl"}
          center={true}
        />
        {inputError ? <div className="text-red-500">{inputError}</div> : null}
      </div>
      <OnboardingActions>
        <NextButton onNext={handleSave} {...{ current, setCurrent, hideModal, allowNext }} />
        <SecondaryLgButton color="blue" onClick={() => onSkipToDownload("team-name-page")}>
          Skip for now
        </SecondaryLgButton>
      </OnboardingActions>
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
      <OnboardingHeader>Invite your team members</OnboardingHeader>
      <OnboardingBody>
        Replay is for your whole team. Invite anyone who you would like to be able to record and
        discuss replays with
      </OnboardingBody>
      <div className="text-xl w-full space-y-3">
        <form className="flex flex-col w-full space-y-3 text-xl" onSubmit={handleAddMember}>
          <div className="text-sm uppercase font-bold">{`Invite via email`}</div>
          <div className="flex-grow flex flex-row space-x-3">
            <TextInput
              placeholder="Email address"
              value={inputValue}
              onChange={onChange}
              textSize={"lg"}
            />
            <OnboardingButton onClick={handleAddMember} disabled={isLoading}>
              {isLoading ? "Loading" : "Invite"}
            </OnboardingButton>
          </div>
          {errorMessage ? <div>{errorMessage}</div> : null}
        </form>
        {!loading && sortedMembers ? (
          <div className="overflow-auto w-full text-xl " style={{ maxHeight: "180px" }}>
            <WorkspaceMembers members={sortedMembers} isAdmin />
          </div>
        ) : null}
        <InvitationLink workspaceId={newWorkspace!.id} showDomainCheck={false} isLarge={true} />
      </div>
      <OnboardingActions>
        <PrimaryLgButton color="blue" onClick={() => onSkipToDownload()}>
          Next
        </PrimaryLgButton>
      </OnboardingActions>
    </>
  );
}

// This modal is used whenever a user is invited to Replay via the Replay invitations
// tab in the settings panel. This should guide them through 1) creating a team, and/or
// 2) downloading the Replay browser.
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
    removeUrlParameters();
    trackEvent("skipped-replay-download");
    props.hideModal();
  };
  const onFinished = () => {
    removeUrlParameters();
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
    slide = <DownloadPage {...{ onNext, onSkipToLibrary }} />;
  } else {
    slide = <DownloadingPage {...{ onFinished }} />;
  }

  return (
    <OnboardingModalContainer {...{ randomNumber }}>
      <OnboardingContent>{slide}</OnboardingContent>
    </OnboardingModalContainer>
  );
}

const connector = connect(() => ({}), {
  hideModal: actions.hideModal,
  setWorkspaceId: actions.setWorkspaceId,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(OnboardingModal);
