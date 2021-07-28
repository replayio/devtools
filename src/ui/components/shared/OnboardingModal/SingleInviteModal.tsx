import React, { useState } from "react";
import { useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import hooks from "ui/hooks";
import { PendingWorkspaceInvitation } from "ui/types";
import BlankScreen from "../BlankScreen";
import { DisabledButton, PrimaryButton, SecondaryButton } from "../Button";
import Modal, { ModalContent } from "../NewModal";
import Spinner from "../Spinner";

function ModalLoader() {
  return (
    <>
      <BlankScreen className="fixed" />
      <Modal options={{ maskTransparency: "translucent" }}>
        <div className="p-12 bg-white rounded-lg shadow-xl text-xl relative flex">
          <Spinner className="animate-spin h-6 w-6 text-gray-500" />
        </div>
      </Modal>
    </>
  );
}

function SingleInviteModalLoader(props: PropsFromRedux) {
  const [workspace, setWorkspace] = useState<null | PendingWorkspaceInvitation>(null);
  const { pendingWorkspaces, loading } = hooks.useGetPendingWorkspaces();

  useEffect(() => {
    if (!loading && pendingWorkspaces && !workspace) {
      setWorkspace(pendingWorkspaces[0]);
    }
  }, [pendingWorkspaces]);

  if (!workspace) {
    return <ModalLoader />;
  }

  return <AutoAccept {...{ ...props, workspace }} />;
}

function AutoAccept(props: SingleInviteModalProps) {
  const { setWorkspaceId, workspace } = props;
  const [accepted, setAccepted] = useState(false);

  const updateDefaultWorkspace = hooks.useUpdateDefaultWorkspace();
  const acceptPendingInvitation = hooks.useAcceptPendingInvitation(() => {
    updateDefaultWorkspace({ variables: { workspaceId: workspace.id } });
    setWorkspaceId(workspace.id);
    setAccepted(true);
  });

  useEffect(() => {
    acceptPendingInvitation({ variables: { workspaceId: workspace.id } });
  }, []);

  if (!accepted) {
    return <ModalLoader />;
  }

  return <SingleInviteModal {...props} />;
}

function InitialScreen({
  onSkip,
  onDownload,
  name,
  inviterEmail,
}: {
  onSkip: () => void;
  onDownload: () => void;
  name: string | null;
  inviterEmail: string | null;
}) {
  return (
    <ModalContent>
      <div className="space-y-12 flex flex-col">
        <h2 className="font-bold text-3xl ">{`Welcome to Replay`}</h2>
        <div className="text-gray-500">
          {`You've been added to the team `}
          <strong>{name}</strong>
          {` by `}
          <strong>{inviterEmail}</strong>
          {`. Would you like to go that team, or download Replay?`}
        </div>
        <div className="space-x-4">
          <SecondaryButton color="blue" onClick={onSkip}>
            {`Go to ${name}`}
          </SecondaryButton>
          <PrimaryButton color="blue" onClick={onDownload}>
            {`Download Replay`}
          </PrimaryButton>
        </div>
      </div>
    </ModalContent>
  );
}

function DownloadScreen({ onDownloading }: { onDownloading: () => void }) {
  const handleMac = () => {
    onDownloading();
    window.open("https://replay.io/downloads/replay.dmg", "_blank");
  };
  const handleLinux = () => {
    onDownloading();
    window.open("https://replay.io/downloads/linux-replay.tar.bz2", "_blank");
  };

  return (
    <ModalContent>
      <div className="space-y-12 flex flex-col">
        <h2 className="font-bold text-3xl ">{`Get the Replay browser`}</h2>
        <div className="text-gray-500">{`To start recording replays, you have to first download the Replay browser. Please select your operating system below.`}</div>
        <div className="space-x-4 flex flex-row">
          <PrimaryButton color="blue" onClick={handleMac}>
            Mac
          </PrimaryButton>
          <PrimaryButton color="blue" onClick={handleLinux}>
            Linux
          </PrimaryButton>
          <DisabledButton>Windows</DisabledButton>
        </div>
      </div>
    </ModalContent>
  );
}

function DownloadingScreen({ hideModal }: { hideModal: () => void }) {
  return (
    <ModalContent>
      <div className="space-y-12 flex flex-col">
        <h2 className="font-bold text-3xl ">{`Hang tight!`}</h2>
        <div className="text-gray-500">{`Replay is downloading now. Please check your download folder.`}</div>
        <div className="space-x-4 flex flex-row">
          <PrimaryButton color="blue" onClick={hideModal}>
            Got it
          </PrimaryButton>
        </div>
      </div>
    </ModalContent>
  );
}

type SingleInviteModalProps = PropsFromRedux & {
  workspace: PendingWorkspaceInvitation;
};

function SingleInviteModal({ hideModal, workspace }: SingleInviteModalProps) {
  const [showDownload, setShowDownload] = useState(false);
  const [showDownloading, setShowDownloading] = useState(false);
  const { name, inviterEmail } = workspace;

  const onSkip = () => hideModal();
  const onDownload = () => setShowDownload(true);
  const onDownloading = () => setShowDownloading(true);

  let content;

  if (showDownloading) {
    content = <DownloadingScreen {...{ hideModal }} />;
  } else if (showDownload) {
    content = <DownloadScreen {...{ onDownloading }} />;
  } else {
    content = <InitialScreen {...{ onSkip, onDownload, name, inviterEmail }} />;
  }

  return (
    <>
      <BlankScreen className="fixed" />
      <Modal onMaskClick={hideModal} options={{ maskTransparency: "transparent" }}>
        {content}
      </Modal>
    </>
  );
}

const connector = connect(() => ({}), {
  hideModal: actions.hideModal,
  setWorkspaceId: actions.setWorkspaceId,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(SingleInviteModalLoader);
