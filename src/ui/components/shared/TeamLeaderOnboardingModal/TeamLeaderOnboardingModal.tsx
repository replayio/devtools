import classNames from "classnames";
import React, { ChangeEvent, Dispatch, SetStateAction, useEffect, useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import hooks from "ui/hooks";
import { Nag } from "ui/hooks/users";
import { Workspace } from "ui/types";
import useToken from "ui/utils/useToken";
import BlankScreen from "../BlankScreen";
import { TextInput } from "../Forms";
import Modal from "../NewModal";
const { prefs } = require("ui/utils/prefs");

function SlideContent({
  headerText,
  children,
}: {
  headerText: string;
  children: React.ReactElement | React.ReactElement[];
}) {
  return (
    <div className="space-y-12 flex flex-col flex-grow">
      <h2 className="font-bold text-3xl text-gray-900">{headerText}</h2>
      <div className="text-gray-500 flex flex-col flex-grow space-y-4">{children}</div>
    </div>
  );
}

function NextButton({
  current,
  total,
  setCurrent,
  onNext,
  allowNext,
}: {
  current: number;
  total: number;
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
  const buttonText = inferLoading ? "Loading" : "Next";

  return (
    <button
      onClick={onClick}
      disabled={current == total}
      type="button"
      className={classNames(
        "items-center px-4 py-2 border border-transparent font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
        {
          "text-white bg-blue-600 hover:bg-blue-700": current < total,
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

function SlideBody1({ hideModal, setCurrent, total, current }: SlideBodyProps) {
  const userInfo = hooks.useGetUserInfo();
  const updateUserNags = hooks.useUpdateUserNags();

  useEffect(() => {
    // Skip showing the user the first replay nag, since they will be going straight to a team
    // once this flow is finished.
    const newNags = [...userInfo.nags, Nag.FIRST_REPLAY];
    updateUserNags({
      variables: { newNags },
    });
  }, []);

  const content = (
    <div className="text-xl">{`We're excited to have you! Next, we'll guide you through creating your own team and inviting your team members to Replay.`}</div>
  );

  return (
    <>
      <SlideContent headerText="Welcome to Replay">{content}</SlideContent>
      <div className="grid">
        <NextButton allowNext={true} {...{ current, total, setCurrent, hideModal }} />
      </div>
    </>
  );
}

function SlideBody2({ hideModal, setNewWorkspace, setCurrent, total, current }: SlideBodyProps) {
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
    window.history.pushState({}, document.title, window.location.pathname);
    hideModal();
  };
  const handleSave = () => createNewWorkspace({ variables: { name: inputValue, userId } });

  return (
    <>
      <SlideContent headerText="Your team name">
        <div className="text-xl">{`To start, what would you like your team's name to be?`}</div>
        {/* <form onSubmit={handleSave} className="flex flex-col space-y-4"> */}
        <div className="py-4 flex flex-col">
          <TextInput
            placeholder="Team name"
            value={inputValue}
            onChange={onChange}
            id="replay-title"
          />
        </div>
        {/* </form> */}
      </SlideContent>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onSkip}
          className="items-center px-4 py-2 border border-gray-200 text-lg font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        >
          Skip
        </button>
        <NextButton onNext={handleSave} {...{ current, total, setCurrent, hideModal, allowNext }} />
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
  const onClick = () => {
    prefs.defaultLibraryTeam = JSON.stringify(newWorkspace.id);
    window.history.pushState({}, document.title, window.location.pathname);

    setWorkspaceId(newWorkspace.id);
    hideModal();
  };

  return (
    <>
      <SlideContent headerText="Team setup complete">
        <div className="text-xl">{`Now every time you create a Replay, it's marked private and is saved in your team's library. That means only your team members can view it.`}</div>
        <div className="text-xl">
          {`To learn more about creating a Replay, `}
          <a
            className="underline"
            href="https://replay.io/welcome"
            target="_blank"
            rel="noreferrer"
          >
            click here
          </a>
          {`.`}
        </div>
        <div className="flex flex-col flex-grow justify-end">
          <button
            type="button"
            onClick={onClick}
            className={classNames(
              "max-w-max items-center px-4 py-2 border border-transparent text-lg font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-white bg-blue-600 hover:bg-blue-700"
            )}
          >
            {`Take me to my team`}
          </button>
        </div>
      </SlideContent>
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
    total: 3,
  };

  if (current === 1) {
    slide = <SlideBody1 {...newProps} />;
  } else if (current === 2) {
    slide = <SlideBody2 {...newProps} />;
  } else {
    slide = <SlideBody3 {...{ ...newProps, newWorkspace: newWorkspace! }} />;
  }

  return (
    <>
      <BlankScreen className="fixed" />
      <Modal options={{ maskTransparency: "translucent" }}>
        <div
          className="p-12 bg-white rounded-lg shadow-xl text-xl space-y-8 relative flex flex-col justify-between"
          style={{ width: "520px", height: "360px" }}
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
