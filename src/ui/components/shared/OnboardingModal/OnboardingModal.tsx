import React, { Dispatch, SetStateAction, useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import hooks from "ui/hooks";
import { Nag } from "ui/hooks/users";

import Modal from "../NewModal";

const slides = [
  {
    header: "Welcome to Replay! 👋",
    content: (
      <>
        <div className="pb-6 text-lg">{`We're glad you're here! This is how to get started:`}</div>
        <li className="pb-1.5 text-lg">{`In the Replay browser, open a website in a new tab`}</li>
        <li className="pb-1.5 text-lg">{`Press the blue record button to record, press again to stop`}</li>
        <li className="pb-1.5 text-lg">{`And with that, you'll have recorded your first replay :)`}</li>
      </>
    ),
  },
];

function SlideContent({
  headerText,
  children,
}: {
  headerText: string;
  children: React.ReactElement | React.ReactElement[];
}) {
  return (
    <div className="space-y-9">
      <h2 className="text-2xl font-bold ">{headerText}</h2>
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
  const dismissNag = hooks.useDismissNag();

  const onSkipOrDone = () => {
    hideModal();
    dismissNag(Nag.FIRST_REPLAY_2);
  };

  return (
    <div className="items-right text-base">
      {/* <div className="flex flex-row items-center space-x-2">
        <input
          type="checkbox"
          id="keep-showing"
          checked={checked}
          onChange={() => setChecked(!checked)}
        />
        <label htmlFor="keep-showing" className="select-none text-gray-500">
          Show this on startup
        </label>
      </div> */}
      <div>
        <button
          onClick={onSkipOrDone}
          type="button"
          className="float-right inline-flex items-center rounded-md border border-transparent bg-primaryAccent px-3 py-1.5 text-base font-medium text-white shadow-sm hover:bg-primaryAccentHover focus:outline-none focus:ring-2 focus:ring-primaryAccent focus:ring-offset-2"
        >
          {current == total ? "Got it!" : "Skip"}
        </button>
      </div>
    </div>
  );
}

function OnboardingModal({ hideModal }: PropsFromRedux) {
  const [current, setCurrent] = useState<number>(1);

  const { header, content } = slides[current - 1];

  return (
    <Modal options={{ maskTransparency: "translucent" }}>
      <div
        className="relative flex flex-col justify-between space-y-6 rounded-lg bg-white p-9 text-lg shadow-xl"
        style={{ width: "520px" }}
      >
        <SlideContent headerText={header}>{content}</SlideContent>
        <Navigation
          current={current}
          total={slides.length}
          setCurrent={setCurrent}
          hideModal={hideModal}
        />
        <div
          className="absolute bottom-0 left-0 h-1.5 rounded-md bg-white"
          style={{ width: `${(current / slides.length) * 100}%` }}
        />
      </div>
    </Modal>
  );
}

const connector = connect(() => ({}), { hideModal: actions.hideModal });
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(OnboardingModal);
