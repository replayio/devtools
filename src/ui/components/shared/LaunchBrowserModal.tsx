import React, { useEffect } from "react";
import { connect } from "react-redux";
import { actions } from "ui/actions";
import { UIState } from "ui/state";
import Modal from "./NewModal";

function LaunchBrowser({
  path = "replay:library",
  children,
}: {
  path?: string;
  children?: React.ReactNode;
}) {
  useEffect(() => {
    document.location.href = path;
  }, [path]);

  return (
    <section className="max-w-2xl w-full m-auto bg-white shadow-lg rounded-lg overflow-hidden relative">
      <div className="p-16 h-84 space-y-12 items-center flex flex-col">
        <div className="space-y-4 place-content-center">
          <img className="w-16 h-16 mx-auto" src="/images/logo.svg" />
        </div>
        <div className="text-center space-y-4">
          <div className="font-bold text-2xl">Launching Replay ...</div>
          <div className="text-xl text-gray-500 space-y-8">
            <p>
              Click <strong>Open Replay</strong> in the dialog shown by your browser
            </p>
            {children}
            <p className="text-sm">
              Don&apos;t have Replay installed? <a href="https://replay.io/welcome">Download Now</a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function LaunchBrowserModalBase({
  path = "replay:library",
  onClose,
}: {
  path?: string;
  onClose?: () => void;
}) {
  return (
    <Modal
      actions={
        <>
          <button className="hover:underline" onClick={onClose}>
            Close
          </button>
        </>
      }
    >
      <LaunchBrowser path={path} />
    </Modal>
  );
}

const LaunchBrowserModal = connect(null, {
  onClose: actions.hideModal,
})(LaunchBrowserModalBase);

export default LaunchBrowserModal;
export { LaunchBrowser };
