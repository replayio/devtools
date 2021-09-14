import classNames from "classnames";
import React, { useEffect } from "react";
import { connect } from "react-redux";
import { actions } from "ui/actions";
import { getButtonClasses } from "./Button";
import Modal, { ModalCloseButton } from "./NewModal";

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
        <div className="text-center space-y-4 flex flex-col items-center">
          <div className="font-bold text-lg">Launching Replay ...</div>
          <div className="space-y-6">
            <p>
              Click <strong>Open Replay</strong> in the dialog shown by your browser
            </p>
            {children}
          </div>
          <div className="border-b border-gray-200 w-full" />
          <div className="flex flex-row text-xs text-gray-500">
            <p>
              {`Don't have Replay yet? Download it on `}
              <a
                href="https://static.replay.io/downloads/replay.dmg"
                className="underline"
                title="Download for Mac"
              >
                Mac
              </a>
              {`, `}
              <a
                href="https://static.replay.io/downloads/linux-replay.tar.bz2"
                className="underline"
                title="Download for Linux"
              >
                Linux
              </a>
              {`, and `}
              <span className="cursor-default" title="Coming soon">
                Windows (coming soon)
              </span>
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
    <Modal actions={<ModalCloseButton onClose={onClose} />} onMaskClick={onClose}>
      <LaunchBrowser path={path} />
    </Modal>
  );
}

const LaunchBrowserModal = connect(null, {
  onClose: actions.hideModal,
})(LaunchBrowserModalBase);

export default LaunchBrowserModal;
export { LaunchBrowser };
