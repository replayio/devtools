import React, { ChangeEvent, Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import hooks from "ui/hooks";
import { Workspace, WorkspaceUser } from "ui/types";
import { isValidTeamName, validateEmail } from "ui/utils/helpers";
import { PrimaryLgButton } from "./Button";
import { TextInput } from "./Forms";
import {
  OnboardingActions,
  OnboardingBody,
  OnboardingButton,
  OnboardingContent,
  OnboardingContentWrapper,
  OnboardingHeader,
  NextButton,
  OnboardingModalContainer,
} from "./Onboarding/index";
import InvitationLink from "./NewWorkspaceModal/InvitationLink";
import { WorkspaceMembers } from "./WorkspaceSettingsModal/WorkspaceSettingsModal";
import { trackEvent } from "ui/utils/telemetry";
import { removeUrlParameters } from "ui/utils/environment";
import { DownloadPage } from "./Onboarding/DownloadPage";
import { DownloadingPage } from "./Onboarding/DownloadingPage";
import { useRouter } from "next/router";

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
  organization?: boolean;
};

function IntroPage({ onSkipToDownload, onNext, organization }: SlideBodyProps) {
  return (
    <>
      <OnboardingContent>
        <OnboardingHeader>{`Hello there!`}</OnboardingHeader>
        <OnboardingBody>
          {`Welcome to Replay, the new way to record, replay, and debug web applications`}
        </OnboardingBody>
      </OnboardingContent>
      <OnboardingActions>
        <PrimaryLgButton color="blue" onClick={onNext}>
          {organization ? "Create an organization" : "Create a team"}
        </PrimaryLgButton>
      </OnboardingActions>
    </>
  );
}

function TeamNamePage({
  hideModal,
  setNewWorkspace,
  setCurrent,
  current,
  organization,
}: SlideBodyProps) {
  const [inputValue, setInputValue] = useState<string>("");
  const [allowNext, setAllowNext] = useState<boolean>(false);
  const [inputError, setInputError] = useState<string | null>(null);
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
        planKey: organization ? "org-v1" : "team-v1",
      },
    });
    trackEvent("onboarding.created_team");
  };

  useEffect(() => {
    textInputRef.current?.focus();
  }, [textInputRef.current]);

  return (
    <>
      <OnboardingContent>
        <OnboardingHeader>What should we call you?</OnboardingHeader>
        <OnboardingBody>{`Keep it simple! Your company name is perfect`}</OnboardingBody>
      </OnboardingContent>
      <div className="flex w-full flex-col py-3">
        <TextInput
          value={inputValue}
          onChange={onChange}
          textSize="2xl"
          center={true}
          ref={textInputRef}
        />
        {inputError ? <div className="text-red-500">{inputError}</div> : null}
      </div>
      <OnboardingActions>
        <NextButton onNext={handleSave} {...{ current, setCurrent, hideModal, allowNext }} />
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
    trackEvent("onboarding.invited_team_member");
  };

  return (
    <>
      <OnboardingContent>
        <OnboardingHeader>Smells like team spirit</OnboardingHeader>
        <OnboardingBody>{`Replay is for your whole team. Invite anyone you’d like to record and discuss replays with`}</OnboardingBody>
      </OnboardingContent>
      <div className="w-9/12 space-y-3 text-xl">
        <form className="flex w-full flex-col space-y-3 text-xl" onSubmit={handleAddMember}>
          <div className="flex flex-grow flex-row space-x-3 text-black">
            <TextInput
              placeholder="Email address"
              value={inputValue}
              onChange={onChange}
              textSize="base"
            />
            <OnboardingButton onClick={handleAddMember} disabled={isLoading}>
              {isLoading ? "Loading" : "Invite"}
            </OnboardingButton>
          </div>
          {errorMessage ? <div>{errorMessage}</div> : null}
        </form>
        {!loading && sortedMembers ? (
          <div className="w-full overflow-auto text-xl " style={{ maxHeight: "180px" }}>
            <WorkspaceMembers members={sortedMembers} isAdmin />
          </div>
        ) : null}
        <div className="text-black">
          <InvitationLink
            workspaceId={newWorkspace!.id}
            showDomainCheck={false}
            isLarge={true}
            hideHeader
          />
        </div>
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
function TeamOnboarding(props: { organization?: boolean } & PropsFromRedux) {
  const router = useRouter();
  const [current, setCurrent] = useState<number>(1);
  const [randomNumber, setRandomNumber] = useState<number>(Math.random());
  const [newWorkspace, setNewWorkspace] = useState<Workspace | null>(null);

  useEffect(() => {
    trackEvent("onboarding.started_onboarding");
  }, []);

  const onNext = () => {
    setCurrent(current + 1);
    setRandomNumber(Math.random());
  };
  const onSkipToDownload = (location?: string) => {
    setCurrent(DOWNLOAD_PAGE_INDEX);
    if (location) {
      trackEvent("onboarding.skipped_create_team", { skippedFrom: location });
    }
    setRandomNumber(Math.random());
  };
  const onSkipToLibrary = () => {
    removeUrlParameters();
    trackEvent("onboarding.skipped_replay_download");
    router.push("/");
  };
  const onFinished = () => {
    removeUrlParameters();
    trackEvent("onboarding.finished_onboarding");
    router.push("/");
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

  console.log("hello", current);
  return (
    <OnboardingModalContainer {...{ randomNumber }} theme="light">
      <OnboardingContentWrapper>{slide}</OnboardingContentWrapper>
    </OnboardingModalContainer>
  );
}

const connector = connect(() => ({}), {
  hideModal: actions.hideModal,
  setWorkspaceId: actions.setWorkspaceId,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(TeamOnboarding);
