import classNames from "classnames";
import React, { useEffect } from "react";
import { connect } from "react-redux";
import { actions } from "ui/actions";
import { trackEvent } from "ui/utils/telemetry";

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
    <section className="relative m-auto w-full max-w-xl overflow-hidden rounded-lg bg-modalBgcolor text-sm text-bodyColor shadow-lg">
      <div className="flex flex-col items-center space-y-9 p-12">
        <div className="place-content-center space-y-3">
          <img className="mx-auto h-12 w-12" src="/images/logo.svg" />
        </div>
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="text-lg font-bold">Launching Replay ...</div>
          <div className="space-y-6">
            <p>
              Click <strong>Open Replay</strong> in the dialog shown by your browser
            </p>
            {children}
          </div>
          <div className="w-full border-b border-gray-200" />
          <div className="flex flex-row text-xs text-gray-500">
            <p>
              {`Don't have Replay yet? Download it on `}
              <a
                href="https://static.replay.io/downloads/replay.dmg"
                onClick={() => trackEvent("launch.download_replay", { OS: "mac" })}
                className="underline"
                title="Download for Mac"
              >
                Mac
              </a>
              {`, `}
              <a
                href="https://static.replay.io/downloads/linux-replay.tar.bz2"
                onClick={() => trackEvent("launch.download_replay", { OS: "linux" })}
                className="underline"
                title="Download for Linux"
              >
                Linux
              </a>
              {`, and `}
              <a
                href="https://static.replay.io/downloads/windows-replay.zip"
                onClick={() => trackEvent("launch.download_replay", { OS: "windows" })}
                className="underline"
                title="Download for Windows"
              >
                Windows
              </a>
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
