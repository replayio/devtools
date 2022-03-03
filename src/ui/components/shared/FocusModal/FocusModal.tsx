import React, { useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";
import * as selectors from "ui/reducers/app";
import { UIState } from "ui/state";
import { actions } from "ui/actions";
import MaterialIcon from "../MaterialIcon";
import { shouldShowNag } from "ui/utils/user";
import hooks from "ui/hooks";
import { Nag } from "ui/hooks/users";

function FocusingModal({ hideModal }: PropsFromRedux) {
  const { nags } = hooks.useGetUserInfo();
  const dismissNag = hooks.useDismissNag();

  useEffect(() => {
    return () => {
      const showModal = shouldShowNag(nags, Nag.FOCUS_MODAL);
      if (showModal) {
        dismissNag(Nag.FOCUS_MODAL);
      }
    };
  }, [nags, dismissNag]);

  const timelineNode = document.querySelector(".timeline");
  const timelineHeight = timelineNode!.getBoundingClientRect().height;

  const showModal = shouldShowNag(nags, Nag.FOCUS_MODAL);

  return (
    <div className="pointer-events-none fixed z-50 grid h-full w-full items-center justify-center">
      <div
        className={"pointer-events-auto absolute top-0 h-full w-full bg-black opacity-10"}
        style={{ height: `calc(100% - ${timelineHeight}px)` }}
        onClick={hideModal}
      />
      {showModal && (
        <div
          className="sharing-modal pointer-events-auto relative flex flex-col space-y-0 overflow-hidden rounded-lg bg-white text-sm"
          style={{ width: "460px" }}
        >
          <div className="space-y-4 p-8">
            <div className="flex flex-row items-center space-x-2">
              <div className="h-6 w-6 rounded-full bg-primaryAccent p-1 text-white">
                <MaterialIcon>center_focus_strong</MaterialIcon>
              </div>
              <div className="text-lg">Focus mode</div>
            </div>
            <p>
              Use the <strong>left and right handlebars</strong> in the timeline to focus your
              replay.
            </p>
          </div>
        </div>
      )}
    </div>
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
export default connector(FocusingModal);
