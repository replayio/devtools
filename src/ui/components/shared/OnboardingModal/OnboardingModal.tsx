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
        <div className="text-lg pb-6">{`We're glad you're here! This is how to get started:`}</div>
        <li className="text-lg pb-1.5">{`In the Replay browser, open a website in a new tab`}</li>
        <li className="text-lg pb-1.5">{`Press the blue record button to record, press again to stop`}</li>
        <li className="text-lg pb-1.5">{`And with that, you'll have recorded your first replay :)`}</li>
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
      <h2 className="font-bold text-2xl ">{headerText}</h2>
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
    <div className="text-base items-right">
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
          className="float-right inline-flex items-center px-3 py-1.5 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primaryAccent hover:bg-primaryAccentHover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent"
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
        className="p-9 bg-white rounded-lg shadow-xl text-lg space-y-6 relative flex flex-col justify-between"
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
          className="h-1.5 bg-white absolute bottom-0 left-0 rounded-md"
          style={{ width: `${(current / slides.length) * 100}%` }}
        />
      </div>
    </Modal>
  );
}

const connector = connect(() => ({}), { hideModal: actions.hideModal });
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(OnboardingModal);
