import { ConnectedProps, connect } from "react-redux";

import { Button } from "replay-next/components/Button";
import * as actions from "ui/actions/app";
import { getSelectedSource } from "ui/reducers/sources";
import { UIState } from "ui/state";

import { Dialog, DialogActions, DialogDescription, DialogLogo, DialogTitle } from "../Dialog";
import Modal from "../NewModal";

const isNextUrl = (url: string | undefined) => url && url.includes("/_next/");

function SourcemapSetupModal({ hideModal, selectedSource }: PropsFromRedux) {
  const { url } = selectedSource;
  const isNext = isNextUrl(url);

  const msg = isNext
    ? "We noticed that you're using NextJS which makes adding sourcemaps super easy."
    : "We noticed that you have sourcemaps, but they are not publicly available. Would you like to upload them to Replay?";

  const onClick = () => {
    const docsLink = isNext
      ? "https://docs.replay.io/resources/next-js"
      : "https://docs.replay.io/getting-started/teams-admin/uploading-source-maps";

    window.open(docsLink);
  };

  return (
    <Modal options={{ maskTransparency: "translucent" }} onMaskClick={hideModal}>
      <Dialog showFooterLinks={false}>
        <DialogLogo />
        <DialogTitle>Replay is better with sourcemaps</DialogTitle>
        <DialogDescription>{msg}</DialogDescription>
        <DialogActions>
          <div className="flex w-full flex-col items-center">
            <Button onClick={onClick}>{`Show me how`}</Button>
          </div>
        </DialogActions>
      </Dialog>
    </Modal>
  );
}

const connector = connect(
  (state: UIState) => ({
    selectedSource: getSelectedSource(state)!,
  }),
  { hideModal: actions.hideModal }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(SourcemapSetupModal);
