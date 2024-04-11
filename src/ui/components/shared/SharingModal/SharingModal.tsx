import React, { useState } from "react";
import { ConnectedProps, connect } from "react-redux";

import { Button } from "replay-next/components/Button";
import { CollaboratorRequest, Recording } from "shared/graphql/types";
import { actions } from "ui/actions";
import { AvatarImage } from "ui/components/Avatar";
import Modal from "ui/components/shared/NewModal";
import hooks from "ui/hooks";
import { useHasNoRole } from "ui/hooks/recordings";
import { getModalOptions } from "ui/reducers/app";
import { UIState } from "ui/state";

import Collaborators from "./Collaborators";
import PrivacyDropdown from "./PrivacyDropdown";
import { CopyButton } from "./ReplayLink";

function SharingModalWrapper(props: PropsFromRedux) {
  const opts = props.modalOptions;
  const recordingId = opts && "recordingId" in opts ? opts.recordingId : "";
  const { recording, loading } = hooks.useGetRecording(recordingId);

  if (loading || !recording) {
    // Todo: Use an actual loader here
    return null;
  }

  return <SharingModal {...props} recording={recording} />;
}

type SharingModalProps = PropsFromRedux & {
  recording: Recording;
};

function CollaboratorRequests({ recording }: { recording: Recording }) {
  const acceptRecordingRequest = hooks.useAcceptRecordingRequest();
  const { collaboratorRequests } = recording;

  if (!collaboratorRequests?.length) {
    return null;
  }

  // Remove duplicates
  const displayedRequests = collaboratorRequests.reduce((acc: CollaboratorRequest[], request) => {
    const userMatch = acc.find(r => r.user.id === request.user.id);

    return userMatch ? acc : [...acc, request];
  }, []);

  return (
    <section className="space-y-1.5">
      <div className="font-bold">Requests to access this replay</div>
      <div className="space-y-1.5 overflow-auto" style={{ maxHeight: "160px" }}>
        {displayedRequests.map((c, i) => (
          <div
            className="hover:bg-theme-base-90 flex items-center justify-between space-x-2 rounded-lg p-2"
            key={i}
          >
            <div className="flex items-center space-x-2">
              <div className="w-8 flex-shrink-0 overflow-hidden rounded-full">
                <AvatarImage src={c.user.picture} />
              </div>
              <span className="overflow-hidden overflow-ellipsis whitespace-pre">
                {c.user.name}
              </span>
            </div>
            <Button onClick={() => acceptRecordingRequest(c.id)}>Add</Button>
          </div>
        ))}
      </div>
    </section>
  );
}

function CollaboratorsSection({ recording }: { recording: Recording }) {
  return (
    <section className="space-y-4 bg-modalBgcolor p-4">
      <div className="flex w-full flex-col justify-between space-y-3">
        <div className="w-full space-y-4">
          <div>
            <div className="mb-2 font-bold">Team</div>

            <div className="rounded-md border border-inputBorder bg-themeTextFieldBgcolor p-2 hover:bg-themeTextFieldBgcolorHover">
              <PrivacyDropdown recording={recording} />
            </div>

            <Collaborators recordingId={recording.id} />
          </div>
          <CollaboratorRequests recording={recording} />
        </div>
      </div>
    </section>
  );
}

function SharingSection({ recording }: { recording: Recording }) {
  return (
    <>
      <CollaboratorsSection recording={recording} />
      <section className="flex flex-col bg-menuHoverBgcolor px-4 py-3">
        <CopyButton recording={recording} />
      </section>
    </>
  );
}

function SharingModal({ recording, hideModal }: SharingModalProps) {
  const { hasNoRole, loading } = useHasNoRole();
  if (hasNoRole || loading) {
    return null;
  }

  return (
    <Modal options={{ maskTransparency: "translucent" }} onMaskClick={hideModal}>
      <div className="sharing-modal relative flex flex-row overflow-hidden rounded-lg border border-inputBorder text-sm shadow-xl">
        <div className="flex flex-col space-y-0" style={{ width: 390 }}>
          <SharingSection recording={recording} />
        </div>
      </div>
    </Modal>
  );
}

const connector = connect(
  (state: UIState) => ({
    modalOptions: getModalOptions(state),
  }),
  {
    hideModal: actions.hideModal,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(SharingModalWrapper);
