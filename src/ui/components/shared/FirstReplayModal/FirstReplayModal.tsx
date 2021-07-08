import classNames from "classnames";
import React, { Dispatch, SetStateAction, useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import hooks from "ui/hooks";
import { Nag } from "ui/hooks/users";
import Modal from "../NewModal";
import { UrlCopy } from "../SharingModal/ReplayLink";

const FIRST_REPLAY_TARGET = "https://honeysuckle-enchanted-jet.glitch.me/";

const RecordIcon = () => (
  <span className="bg-primaryAccent text-white rounded-xl px-2 py-0.5 uppercase text-base">
    ⦿ REC
  </span>
);
const StopIcon = () => (
  <span className="bg-red-500 text-white rounded-xl px-2 py-0.5 uppercase text-base">■ STOP</span>
);

function getSlides() {
  return [
    {
      header: "Creating your First Replay",
      showInput: false,
      content: (
        <>
          <div className="text-xl pb-8">{`You're ready to create your first replay. This shouldn't take long!`}</div>
        </>
      ),
    },
    {
      header: "What to record",
      showInput: true,
      content: (
        <>
          <div className="text-xl pb-8">{`Before recording, we need something to record. It's likely a website with some buggy behavior.`}</div>
          <div className="text-xl pb-8">{`To keep things simple, we created a simple example where a form that has a bug when you hit Submit.`}</div>
          <UrlCopy url={FIRST_REPLAY_TARGET} />
        </>
      ),
    },
    {
      header: "How to start recording",
      showInput: false,
      content: (
        <>
          <div className="text-xl pb-8">
            {`Once the website is opened in a new tab, click `}
            <RecordIcon />
            {` to start recording. To stop recording, click `}
            <StopIcon />
            {`.`}
          </div>
          <div className="text-xl pb-8">{`In the future, you can simply open a new tab and open the website there to start recording.`}</div>
        </>
      ),
    },
    {
      header: "Quick recap",
      showInput: false,
      content: (
        <>
          <div className="text-xl pb-8">{`To record a replay:`}</div>
          <ol className="space-y-4 list-decimal pl-12">
            <li className="text-xl">{`Open the website in a new tab`}</li>
            <li className="text-xl">
              {`Click `}
              <RecordIcon />
            </li>
            <li className="text-xl">{`Interact with the website`}</li>
            <li className="text-xl">
              {`Click `}
              <StopIcon />
            </li>
          </ol>
        </>
      ),
    },
  ];
}

function SlideContent({
  headerText,
  children,
}: {
  headerText: string;
  children: React.ReactElement | React.ReactElement[];
}) {
  return (
    <div className="space-y-12">
      <h2 className="font-bold text-3xl ">{headerText}</h2>
      <div className="text-gray-500">{children}</div>
    </div>
  );
}

function Navigation({
  current,
  total,
  setCurrent,
  hideModal,
}: {
  current: number;
  total: number;
  setCurrent: Dispatch<SetStateAction<number>>;
  hideModal: typeof actions.hideModal;
}) {
  const [openedTab, setOpenedTab] = useState(false);
  const userInfo = hooks.useGetUserInfo();
  const updateUserNags = hooks.useUpdateUserNags();
  const showDone = current === total && openedTab;

  const onSkipOrDone = () => {
    hideModal();
  };
  const onOpen = () => {
    setOpenedTab(true);
    const newNags = [...userInfo.nags, Nag.FIRST_REPLAY_2];
    updateUserNags({
      variables: { newNags },
    });
    window.open(FIRST_REPLAY_TARGET);
  };
  const onNext = () => setCurrent(current + 1);
  const onPrevious = () => setCurrent(current - 1);

  const nextMessage =
    current === total ? `${openedTab ? "✅ " : ""} Open the example in a new tab` : "Next";

  return (
    <div className="text-lg justify-between flex">
      <div className="space-x-2">
        <button
          onClick={onPrevious}
          type="button"
          disabled={current === 1}
          className={classNames(
            "inline-flex items-center px-4 py-2 border border-transparent text-lg font-medium rounded-md text-white",
            current === 1 ? "bg-gray-300 cursor-auto" : "bg-blue-300 hover:bg-blue-400"
          )}
        >
          Previous
        </button>
        <button
          onClick={current == total ? onOpen : onNext}
          type="button"
          className={classNames(
            "inline-flex items-center px-4 py-2 border border-transparent text-lg font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent",
            openedTab
              ? "bg-blue-300 hover:bg-blue-400 "
              : "bg-primaryAccent hover:bg-primaryAccentHover"
          )}
        >
          {nextMessage}
        </button>
      </div>
      <button
        onClick={onSkipOrDone}
        type="button"
        className="inline-flex items-center px-4 py-2 border border-transparent text-lg font-medium rounded-md text-white bg-primaryAccent hover:bg-primaryAccentHover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent"
      >
        {showDone ? "Done" : "Skip"}
      </button>
    </div>
  );
}

function FirstReplayModal({ hideModal }: PropsFromRedux) {
  const [current, setCurrent] = useState<number>(1);
  const slides = getSlides();

  const { header, content } = slides[current - 1];

  return (
    <Modal options={{ maskTransparency: "translucent" }}>
      <div
        className="p-12 bg-white rounded-lg shadow-xl text-xl space-y-8 relative flex flex-col justify-between"
        style={{ width: "520px", height: "380px" }}
      >
        <SlideContent headerText={header}>{content}</SlideContent>
        <Navigation current={current} total={slides.length} {...{ setCurrent, hideModal }} />
        <div
          className="h-2 bg-white absolute bottom-0 left-0 rounded-md"
          style={{ width: `${(current / slides.length) * 100}%` }}
        />
      </div>
    </Modal>
  );
}

const connector = connect(() => ({}), { hideModal: actions.hideModal });
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(FirstReplayModal);
