import React, { useState } from "react";
import useAuth0 from "ui/utils/useAuth0";
import Modal from "ui/components/shared/NewModal";
import { connect, ConnectedProps } from "react-redux";
import * as selectors from "ui/reducers/app";
import { UIState } from "ui/state";
import BlankScreen from "./BlankScreen";
import classNames from "classnames";
import { ExpectedError, UnexpectedError } from "ui/state/app";

export function PopupBlockedError() {
  const error = { message: "OAuth consent popup blocked" };

  return (
    <ExpectedErrorScreen
      error={{
        message: "Please turn off your ad blocker",
        content:
          "In order to proceed, we need to get you to confirm your credentials. This happens in a separate pop-up window that's currently being blocked by your browser. Please disable your ad-blocker refresh this page.",
        action: "refresh",
      }}
    />
  );
}

function RefreshButton() {
  const [clicked, setClicked] = useState(false);
  const onClick = () => {
    setClicked(true);
    location.reload();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={clicked}
      className={classNames(
        "inline-flex items-center px-4 py-2 border border-transparent text-lg font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
        "text-white bg-primaryAccent hover:bg-primaryAccentHover"
      )}
    >
      {clicked ? `Refreshing...` : `Refresh`}
    </button>
  );
}

function SignInButton() {
  const { loginWithRedirect } = useAuth0();

  const onClick = () => {
    loginWithRedirect({ appState: { returnTo: window.location.href } });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        "inline-flex items-center px-4 py-2 border border-transparent text-lg font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
        "text-white bg-primaryAccent hover:bg-primaryAccentHover"
      )}
    >
      Sign In
    </button>
  );
}

function ActionButton({ action }: { action: string }) {
  let button;

  if (action == "refresh") {
    button = <RefreshButton />;
  } else if (action == "sign-in") {
    button = <SignInButton />;
  }

  return <div>{button}</div>;
}

function Error({ error }: { error: ExpectedError | UnexpectedError }) {
  const { action, message, content } = error;

  return (
    <section className="max-w-2xl w-full m-auto bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="p-16 h-84 space-y-12 items-center flex flex-col">
        <div className="space-y-4 place-content-center">
          <img className="w-16 h-16 mx-auto" src="images/logo.svg" />
        </div>
        <div className="text-center space-y-4">
          <div className="font-bold text-2xl">{message}</div>
          <div className="text-xl text-gray-500">{content}</div>
        </div>
        {action ? <ActionButton action={action} /> : null}
      </div>
    </section>
  );
}

function ExpectedErrorScreen({ error }: { error: ExpectedError }) {
  return (
    <BlankScreen className="absolute z-10">
      <Modal>
        <Error error={error} />
      </Modal>
    </BlankScreen>
  );
}

function UnexpectedErrorScreen({ error }: { error: UnexpectedError }) {
  return (
    <Modal options={{ maskTransparency: "translucent" }}>
      <Error error={error} />
    </Modal>
  );
}

function _AppErrors({ expectedError, unexpectedError }: PropsFromRedux) {
  return (
    <>
      {expectedError ? <ExpectedErrorScreen error={expectedError} /> : null}
      {unexpectedError ? <UnexpectedErrorScreen error={unexpectedError} /> : null}
    </>
  );
}

const connector = connect((state: UIState) => ({
  expectedError: selectors.getExpectedError(state),
  unexpectedError: selectors.getUnexpectedError(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(_AppErrors);
export { ExpectedErrorScreen, UnexpectedErrorScreen };
