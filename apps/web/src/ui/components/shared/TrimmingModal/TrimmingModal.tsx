import React from "react";
import { connect, ConnectedProps } from "react-redux";
import * as selectors from "ui/reducers/app";
import { UIState } from "ui/state";
import { actions } from "ui/actions";
import MaterialIcon from "../MaterialIcon";

function TrimmingModal({ hideModal }: PropsFromRedux) {
  const timelineNode = document.querySelector(".timeline");
  const timelineHeight = timelineNode!.getBoundingClientRect().height;

  return (
    <div className="fixed w-full h-full grid justify-center items-center z-50 pointer-events-none">
      <div
        className={"bg-black w-full h-full absolute opacity-50 top-0 pointer-events-auto"}
        style={{ height: `calc(100% - ${timelineHeight}px)` }}
        onClick={hideModal}
      />
      <div
        className="sharing-modal space-y-0 relative flex flex-col bg-white rounded-lg text-sm overflow-hidden pointer-events-auto"
        style={{ width: "460px" }}
      >
        <div className="p-8 space-y-4">
          <div className="flex flex-row space-x-2 items-center">
            <div className="text-white rounded-full bg-primaryAccent w-6 h-6 p-1">
              <MaterialIcon>center_focus_strong</MaterialIcon>
            </div>
            <div className="text-lg">Replay trimming</div>
          </div>
          <div>{`Select which parts of the timeline you'd like to focus your debugging on.`}</div>
        </div>
      </div>
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
export default connector(TrimmingModal);
