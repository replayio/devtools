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
    <section className="max-w-xl w-full m-auto bg-white shadow-lg rounded-lg overflow-hidden relative text-sm">
      <div className="p-12 space-y-9 items-center flex flex-col">
        <div className="space-y-3 place-content-center">
          <img className="w-12 h-12 mx-auto" src="/images/logo.svg" />
        </div>
        <div className="text-center space-y-3">
          <div className="font-bold text-lg">Launching Replay ...</div>
          <div className="text-gray-500 space-y-6">
            <p>
              Click <strong>Open Replay</strong> in the dialog shown by your browser
            </p>
            {children}
            <p className="text-xs">
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
