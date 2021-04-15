import React from "react";
import { connect, ConnectedProps } from "react-redux";
const Modal = require("ui/components/shared/Modal").default;
import ReplayLink from "./ReplayLink";
import hooks from "ui/hooks";

import "./SharingModal.css";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import { RecordingId } from "@recordreplay/protocol";
import PrivateSettings from "./PrivateSettings";

function SharingModal({ modalOptions }: PropsFromRedux) {
  const { recordingId } = modalOptions!;
  const { isPrivate, loading } = hooks.useGetIsPrivate(recordingId!);
  const updateIsPrivate = hooks.useUpdateIsPrivate(recordingId!, isPrivate);

  const setPublic = () => {
    if (isPrivate) {
      updateIsPrivate();
    }
  };
  const setPrivate = () => {
    if (!isPrivate) {
      updateIsPrivate();
    }
  };

  return (
    <div className="sharing-modal">
      <Modal>
        <section className="sharing-modal-content">
          <h1>Share</h1>
          <ReplayLink recordingId={recordingId} />
          <div className="privacy-choices">
            <div className={`privacy-choice ${!isPrivate ? "selected" : ""}`}>
              <input
                type="radio"
                id="public"
                name="privacy"
                checked={!isPrivate}
                onChange={setPublic}
              />
              <label htmlFor="public">
                <div className="title">Public</div>
                <div className="description">Available to anyone who has the link</div>
              </label>
            </div>
            <div className={`privacy-choice ${isPrivate ? "selected" : ""}`}>
              <input
                type="radio"
                id="private"
                name="privacy"
                checked={isPrivate}
                onChange={setPrivate}
              />
              <label htmlFor="private">
                <div className="title">Private</div>
                <div className="description">Available to people you choose</div>
              </label>
            </div>
          </div>
          {!isPrivate && (
            <div className="privacy-warning text-sm">
              <strong>Note:</strong> Replay records everything that happens in the browser,
              including passwords you’ve typed and everything visible on the screen.{" "}
              <a
                target="_blank"
                rel="noreferrer"
                href="https://www.notion.so/replayio/Security-2af70ebdfb1c47e5b9246f25ca377ef2"
                className="underline"
              >
                Learn more
              </a>
            </div>
          )}
        </section>
        {isPrivate ? <PrivateSettings recordingId={recordingId} /> : <section className="filler" />}
      </Modal>
    </div>
  );
}

const connector = connect((state: UIState) => ({
  modalOptions: selectors.getModalOptions(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(SharingModal);
