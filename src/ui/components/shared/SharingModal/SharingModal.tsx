import React from "react";
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

  const displayedRequests = collaboratorRequests.reduce((acc: CollaboratorRequest[], request) => {
    const userMatch = acc.find(r => r.user.id === request.user.id);
    return userMatch ? acc : [...acc, request];
  }, []);

  return (
    <section className="space-y-2">
      <h3 className="font-semibold text-foreground">Requests to access this replay</h3>
      <ul className="max-h-40 space-y-1.5 overflow-auto pr-0.5">
        {displayedRequests.map(request => (
          <li
            key={request.id}
            className="flex items-center justify-between gap-2 rounded-lg p-2 transition-colors hover:bg-accent"
          >
            <div className="flex min-w-0 items-center gap-2">
              <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full">
                <AvatarImage src={request.user.picture} />
              </div>
              <span className="truncate">{request.user.name}</span>
            </div>
            <Button onClick={() => acceptRecordingRequest(request.id)}>Add</Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SharingModal({ recording, hideModal }: SharingModalProps) {
  const { hasNoRole, loading } = useHasNoRole();
  if (hasNoRole || loading) {
    return null;
  }

  return (
    <Modal options={{ maskTransparency: "translucent" }} onMaskClick={hideModal}>
      <div className="sharing-modal flex w-[390px] flex-col overflow-hidden rounded-lg border border-border bg-card text-sm text-foreground shadow-xl">
        <div className="space-y-4 p-4">
          <section>
            <h3 className="mb-2 font-semibold text-foreground">Team</h3>
            <PrivacyDropdown recording={recording} />
            <Collaborators recordingId={recording.id} />
          </section>
          <CollaboratorRequests recording={recording} />
        </div>
        <footer className="border-t border-border px-4 py-3">
          <CopyButton recording={recording} />
        </footer>
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
