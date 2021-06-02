import classNames from "classnames";
import React, { Dispatch, SetStateAction, useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import hooks from "ui/hooks";
import { Nag } from "ui/hooks/users";
import Modal from "../NewModal";

const slides = [
  {
    header: "Welcome to Replay! 👋",
    content: (
      <>
        <div className="text-xl pb-8">{`We're glad you're here! This is how to get started:`}</div>
        <li className="text-xl pb-2">{`In the Replay browser, open a website in a new tab`}</li>
        <li className="text-xl pb-2">{`Press the blue record button to record, press again to stop`}</li>
        <li className="text-xl pb-2">{`And with that, you'll have recorded your first replay :)`}</li>
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
    <div className="space-y-12">
      <h2 className="font-bold text-3xl text-gray-900">{headerText}</h2>
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
  const userInfo = hooks.useGetUserInfo();
  const updateUserNags = hooks.useUpdateUserNags();

  const onSkipOrDone = () => {
    hideModal();
    const newNags = [...userInfo.nags, Nag.FIRST_REPLAY];
    updateUserNags({
      variables: { newNags },
    });
  };

  return (
    <div className="text-lg items-right">
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
          className="float-right inline-flex items-center px-4 py-2 border border-transparent text-lg font-medium rounded-md shadow-sm text-white bg-primaryAccent hover:bg-primaryAccentHover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
        className="p-12 bg-white rounded-lg shadow-xl text-xl space-y-8 relative flex flex-col justify-between"
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
          className="h-2 bg-white absolute bottom-0 left-0 rounded-md"
          style={{ width: `${(current / slides.length) * 100}%` }}
        />
      </div>
    </Modal>
  );
}

const connector = connect(() => ({}), { hideModal: actions.hideModal });
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(OnboardingModal);
