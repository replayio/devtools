import React, { useState } from "react";
import useAuth0 from "ui/utils/useAuth0";
import Modal from "ui/components/shared/NewModal";
import { connect, ConnectedProps } from "react-redux";
import * as selectors from "ui/reducers/app";
import { UIState } from "ui/state";
import BlankScreen from "./BlankScreen";
import classNames from "classnames";
import { ExpectedError, UnexpectedError } from "ui/state/app";
import { isDevelopment } from "ui/utils/environment";

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
        "w-full inline-flex items-center justify-center px-16 py-2.5 border border-transparent font-medium rounded-md text-white bg-primaryAccent hover:bg-primaryAccentHover"
      )}
    >
      {clicked ? `Refreshing...` : `Refresh`}
    </button>
  );
}

function SignInButton() {
  const { loginWithRedirect } = useAuth0();

  const onClick = () => {
    loginWithRedirect({
      appState: { returnTo: window.location.pathname + window.location.search },
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        "w-full inline-flex items-center justify-center px-16 py-2.5 border border-transparent font-medium rounded-md text-white bg-primaryAccent hover:bg-primaryAccentHover"
      )}
    >
      Sign in to Replay
    </button>
  );
}

function LibraryButton() {
  const onClick = () => {
    window.location.href = window.location.origin;
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        "w-full inline-flex items-center justify-center px-16 py-2.5 border border-transparent font-medium rounded-md text-white bg-primaryAccent hover:bg-primaryAccentHover"
      )}
    >
      Back to Library
    </button>
  );
}

function ActionButton({ action }: { action: string }) {
  let button;

  if (action == "refresh") {
    button = <RefreshButton />;
  } else if (action == "sign-in") {
    button = <SignInButton />;
  } else if (action == "library") {
    button = <LibraryButton />;
  }

  return <div>{button}</div>;
}

interface ErrorProps {
  error: ExpectedError | UnexpectedError;
}

function DevelopmentError({ error }: ErrorProps) {
  const { message, content } = error;
  return (
    <section className="w-full m-auto bg-white shadow-lg rounded-lg overflow-hidden text-base">
      <div className="p-12 space-y-12 items-center flex flex-col">
        <div className="space-y-4 place-content-center">
          <img className="w-12 h-12 mx-auto" src="/images/logo.svg" />
        </div>
        <div className="text-center space-y-3">
          {message ? <div className="font-bold text-lg">{message}</div> : null}
          {content ? (
            <div className="text-gray-500 text-left">
              <pre>{content}</pre>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Error({ error }: ErrorProps) {
  const { action, message, content } = error;

  if (isDevelopment()) {
    return <DevelopmentError error={error} />;
  }

  return (
    <section className="max-w-lg w-full m-auto bg-white shadow-lg rounded-lg overflow-hidden text-base">
      <div className="p-12 space-y-12 items-center flex flex-col">
        <div className="space-y-4 place-content-center">
          <img className="w-12 h-12 mx-auto" src="/images/logo.svg" />
        </div>
        <div className="text-center space-y-3">
          {message ? <div className="font-bold text-lg">{message}</div> : null}
          {content ? <div className="text-gray-500">{content}</div> : null}
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
