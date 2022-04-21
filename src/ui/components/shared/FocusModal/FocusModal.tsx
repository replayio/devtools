import React, { useState } from "react";
import { connect, ConnectedProps, useDispatch, useSelector } from "react-redux";
import * as selectors from "ui/reducers/app";
import { UIState } from "ui/state";
import { actions } from "ui/actions";
import MaterialIcon from "../MaterialIcon";
import {
  getFocusRegion,
  getCurrentTime,
  getIsAtFocusSoftLimit,
  getZoomRegion,
} from "ui/reducers/timeline";
import { DisabledButton, PrimaryButton } from "../Button";
import { getFormattedTime } from "ui/utils/timeline";

function FocusingModal({ hideModal }: PropsFromRedux) {
  const currentTime = useSelector(getCurrentTime);
  const modalOptions = useSelector(selectors.getModalOptions);
  const timelineNode = document.querySelector(".timeline");
  const timelineHeight = timelineNode!.getBoundingClientRect().height;
  const isAtFocusLimit = useSelector(getIsAtFocusSoftLimit);

  let msg;

  if (modalOptions?.instructions) {
    msg = modalOptions.instructions;
  } else if (isAtFocusLimit) {
    msg = (
      <p>{`Looks like you're making a precise selection at ${getFormattedTime(
        currentTime,
        true
      )}.`}</p>
    );
  } else {
    msg = (
      <p>
        Use the <strong>left and right handlebars</strong> in the timeline to focus your replay.
      </p>
    );
  }

  return (
    <div className="pointer-events-none fixed z-50 grid h-full w-full items-center justify-center">
      <div
        className={"pointer-events-auto absolute top-0 h-full w-full bg-black opacity-50"}
        style={{ height: `calc(100% - ${timelineHeight}px)` }}
        onClick={hideModal}
      />
      <div
        className="sharing-modal pointer-events-auto relative flex flex-col space-y-0 overflow-hidden rounded-lg text-sm"
        style={{ width: "460px" }}
      >
        <div className="space-y-4 p-8">
          <div className="flex flex-row items-center space-x-2">
            <div className="h-6 w-6 rounded-full bg-primaryAccent p-1 text-white">
              <MaterialIcon>center_focus_strong</MaterialIcon>
            </div>
            <div className="text-lg">Edit Focus Mode</div>
          </div>
          <div>{msg}</div>
          {isAtFocusLimit && <QuickActions />}
        </div>
      </div>
    </div>
  );
}

function QuickActions() {
  const focusRegion = useSelector(getFocusRegion);
  const zoomRegion = useSelector(getZoomRegion);
  const currentTime = useSelector(getCurrentTime);
  const dispatch = useDispatch();

  const snapStart = () => {
    dispatch(actions.setFocusRegion({ ...focusRegion!, startTime: Math.max(currentTime - 10, 0) }));
  };
  const snapEnd = () => {
    dispatch(
      actions.setFocusRegion({
        ...focusRegion!,
        endTime: Math.min(currentTime + 10, zoomRegion.endTime),
      })
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        {currentTime !== focusRegion!.startTime ? (
          <PrimaryButton color="blue" onClick={snapStart}>
            Start at this point
          </PrimaryButton>
        ) : (
          <DisabledButton>Start at this point</DisabledButton>
        )}
        {currentTime !== focusRegion!.endTime ? (
          <PrimaryButton color="blue" onClick={snapEnd}>
            End at this point
          </PrimaryButton>
        ) : (
          <DisabledButton>End at this point</DisabledButton>
        )}
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
export default connector(FocusingModal);
