import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import Modal from "ui/components/shared/NewModal";
import ReplayLink from "./ReplayLink";
import hooks from "ui/hooks";
import { useGetUserSettings } from "ui/hooks/settings";
import * as selectors from "ui/reducers/app";
import { UIState } from "ui/state";
import { UserSettings, Workspace } from "ui/types";
import { PrimaryButton } from "../Button";
import { actions } from "ui/actions";
import { SharedWith } from "./SharedWith";
import { CollaboratorDbData } from "./CollaboratorsList";

function SharingModalWrapper(props: PropsFromRedux) {
  const { userSettings, loading: loading1 } = useGetUserSettings();
  const { workspaces, loading: loading2 } = hooks.useGetNonPendingWorkspaces();
  const { collaborators, loading: loading3 } = hooks.useGetOwnersAndCollaborators(
    props.modalOptions!.recordingId
  );

  if (loading1 || loading2 || loading3) {
    // Todo: Use an actual loader here
    return null;
  }

  return (
    <SharingModal {...{ ...props, userSettings, workspaces }} collaborators={collaborators!} />
  );
}

type SharingModalProps = PropsFromRedux & {
  userSettings: UserSettings;
  workspaces: Workspace[];
  collaborators: CollaboratorDbData[];
};

function SharingModal({
  modalOptions,
  userSettings,
  workspaces,
  collaborators,
  hideModal,
}: SharingModalProps) {
  const { recordingId } = modalOptions!;
  const { isPrivate } = hooks.useGetIsPrivate(recordingId!);
  const toggleIsPrivate = hooks.useToggleIsPrivate(recordingId!, isPrivate);

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
        className="sharing-modal p-12 space-y-8 relative flex flex-col bg-white rounded-lg text-sm"
        style={{ width: "600px" }}
      >
        <h1 className="text-2xl">Sharing</h1>
        <section className="space-y-8">
          <SharedWith
            defaultWorkspaceId={userSettings?.defaultWorkspaceId || null}
            {...{ workspaces, recordingId, collaborators }}
          />
          <div className="space-y-4">
            <h2 className="text-xl">Get Link</h2>
            <ReplayLink recordingId={recordingId} />
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
