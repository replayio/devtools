import classNames from "classnames";
import React, { Dispatch, SetStateAction, useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import Modal from "../NewModal";

const slides = [
  {
    header: "Welcome to your Library 👋",
    content: (
      <div className="text-xl">{`There's nothing here yet, so let's record your first replay.`}</div>
    ),
  },
  {
    header: "Open the Replay browser",
    content: (
      <>
        <div className="text-xl space-y-4">
          <div>
            {`First, download and install the browser by following the instructions `}
            <a
              href="https://replay.io/welcome"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline"
            >
              here
            </a>
            .
          </div>
          <div>
            {`Once it's installed, go ahead and open that browser and sign in. We'll wait for you there!`}
          </div>
        </div>
      </>
    ),
  },
  {
    header: "The record button",
    content: (
      <>
        <div className="text-xl space-y-4">
          <div>{`The Replay browser should look familiar with one exception: the big blue Record button on the top right.`}</div>
          <div>{`Found it? Good. It's your new best friend from here on out.`}</div>
        </div>
      </>
    ),
  },
  {
    header: "Starting your first recording",
    content: (
      <>
        <div className="text-xl space-y-4">
          <div>{`To record a website, you first have to open a new separate tab and go to that URL.`}</div>
          <div>{`Once the website is open, click the record button to refresh and start recording.`}</div>
        </div>
      </>
    ),
  },
  {
    header: "Saving your first recording",
    content: (
      <>
        <div className="text-xl space-y-4">
          <div>{`Once you're finished recording, simply hit the stop button.`}</div>
          <div>{`Doing so will go ahead and save your recording and give you a shareable link. That's it!`}</div>
        </div>
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
  return (
    <div className="flex flex-row justify-between text-lg items-center">
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
      <div className="space-x-4 ">
        <button
          type="button"
          disabled={current === 1}
          onClick={() => setCurrent(current - 1)}
          className={classNames(
            "inline-flex items-center px-4 py-2 border border-transparent text-lg font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
            {
              "text-blue-700 bg-blue-100 hover:bg-blue-200": current > 1,
              "text-gray-500 bg-gray-100": current == 1,
            }
          )}
        >
          Previous
        </button>
        <button
          onClick={() => setCurrent(current + 1)}
          disabled={current == total}
          type="button"
          className={classNames(
            "inline-flex items-center px-4 py-2 border border-transparent text-lg font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
            {
              "text-white bg-blue-600 hover:bg-blue-700": current < total,
              "text-gray-500 bg-gray-100": current == total,
            }
          )}
        >
          Next
        </button>
      </div>
      <div>
        <button
          onClick={() => hideModal()}
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent text-lg font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {current == total ? "Done" : "Skip"}
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
        className="p-12 bg-white rounded-lg shadow-xl text-xl space-y-20 relative flex flex-col justify-between"
        style={{ width: "520px", height: "360px" }}
      >
        <SlideContent headerText={header}>{content}</SlideContent>
        <Navigation
          current={current}
          total={slides.length}
          setCurrent={setCurrent}
          hideModal={hideModal}
        />
        <div
          className="h-2 bg-blue-500 absolute bottom-0 left-0"
          style={{ width: `${(current / slides.length) * 100}%` }}
        />
      </div>
    </Modal>
  );
}

const connector = connect(() => ({}), { hideModal: actions.hideModal });
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(OnboardingModal);
