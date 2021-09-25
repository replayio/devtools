import React from "react";
import { connect, ConnectedProps } from "react-redux";
import Modal from "ui/components/shared/NewModal";
import ReplayLink from "./ReplayLink";
import hooks from "ui/hooks";
import * as selectors from "ui/reducers/app";
import { UIState } from "ui/state";
import { Recording, Workspace } from "ui/types";
import { PrimaryButton } from "../Button";
import { actions } from "ui/actions";
import { SharedWith } from "./SharedWith";
import { CollaboratorDbData } from "./CollaboratorsList";

function SharingModalWrapper(props: PropsFromRedux) {
  const { recordingId } = props.modalOptions!;
  const { recording, loading: loading1 } = hooks.useGetRecording(recordingId);
  const { workspaces, loading: loading2 } = hooks.useGetNonPendingWorkspaces();
  const { collaborators, loading: loading3 } = hooks.useGetOwnersAndCollaborators(recordingId);

  if (loading1 || loading2 || loading3 || !recording) {
    // Todo: Use an actual loader here
    return null;
  }

  return (
    <SharingModal
      {...{ ...props, workspaces }}
      recording={recording}
      collaborators={collaborators!}
    />
  );
}

type SharingModalProps = PropsFromRedux & {
  recording: Recording;
  workspaces: Workspace[];
  collaborators: CollaboratorDbData[];
};

function SharingModal({ recording, workspaces, collaborators, hideModal }: SharingModalProps) {
  const isPrivate = recording.private;
  const toggleIsPrivate = hooks.useToggleIsPrivate(recording.id, isPrivate);

  const setPublic = () => {
    if (isPrivate) {
      toggleIsPrivate();
    }
  };
  const setPrivate = () => {
    if (!isPrivate) {
      toggleIsPrivate();
    }
  };

  return (
    <Modal options={{ maskTransparency: "translucent" }} onMaskClick={hideModal}>
      <div
        className="sharing-modal p-8 space-y-0 relative flex flex-col bg-white rounded-lg text-sm"
        style={{ width: "600px" }}
      >
        <section className="space-y-4">
          <SharedWith {...{ workspaces, recording, collaborators }} />
          <div className="space-y-2">
            <h2 className="text-xl">Link</h2>
            <ReplayLink recordingId={recording.id} />
            <div className="flex flex-row items-center">
              {isPrivate ? (
                <div className="w-full justify-between flex flex-row items-center">
                  <div>
                    <strong>Restricted</strong> Only people added can open this link
                  </div>
                  <PrimaryButton color="blue" onClick={setPublic}>
                    Change to anyone
                  </PrimaryButton>
                </div>
              ) : (
                <div className="w-full flex flex-row justify-between items-center">
                  <div>
                    <strong>Anyone</strong> on the internet with this link can view
                  </div>
                  <PrimaryButton color="blue" onClick={setPrivate}>
                    Change to restricted
                  </PrimaryButton>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </Modal>
  );
}

const connector = connect(
  (state: UIState) => ({
    modalOptions: selectors.getModalOptions(state),
  }),
  {
    hideModal: actions.hideModal,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(SharingModalWrapper);
