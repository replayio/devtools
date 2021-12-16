import classNames from "classnames";
import { isNextUrl } from "devtools/client/debugger/src/components/Editor/SourcemapToggle";
import { getSelectedSourceWithContent } from "devtools/client/debugger/src/selectors";
import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import { UIState } from "ui/state";
import { PrimaryButton } from "../Button";
import { Dialog, DialogActions, DialogDescription, DialogLogo, DialogTitle } from "../Dialog";
import Modal from "../NewModal";

function SourcemapSetupModal({ hideModal, selectedSource }: PropsFromRedux) {
  const { url } = selectedSource;
  const isNext = isNextUrl(url);

  const msg = isNext
    ? "We noticed that you're using NextJS which makes adding sourcemaps super easy."
    : "We noticed that you have sourcemaps, but they are not publicly available. Would you like to upload them to Replay?";

  const onClick = () => {
    const docsLink = isNext
      ? "https://docs.replay.io/docs/1923e679c1e4411db1bda29536eb1e31#6e444abdd19642af9ddc34766ff84bf2"
      : "https://docs.replay.io/docs/1923e679c1e4411db1bda29536eb1e31#912af13ef09a41f4ae774a90796ebbc1";

    window.open(docsLink);
  };

  return (
    <Modal options={{ maskTransparency: "translucent" }} onMaskClick={hideModal}>
      <Dialog
        className={classNames("flex flex-col items-center")}
        style={{ animation: "dropdownFadeIn ease 200ms", width: 400 }}
      >
        <DialogLogo />
        <DialogTitle>Replay is better with sourcemaps</DialogTitle>
        <DialogDescription>{msg}</DialogDescription>
        <DialogActions>
          <div className="w-full flex flex-col items-center">
            <PrimaryButton color="blue" onClick={onClick}>{`Show me how`}</PrimaryButton>
          </div>
        </DialogActions>
      </Dialog>
    </Modal>
  );
}

const connector = connect(
  (state: UIState) => ({
    selectedSource: getSelectedSourceWithContent(state),
  }),
  { hideModal: actions.hideModal }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(SourcemapSetupModal);
