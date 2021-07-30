import classNames from "classnames";
import React, { Dispatch, SetStateAction, useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import hooks from "ui/hooks";
import { Nag } from "ui/hooks/users";
import BlankScreen from "../BlankScreen";
import { PrimaryButton } from "../Button";
import Modal from "../NewModal";
import { UrlCopy } from "../SharingModal/ReplayLink";

const FIRST_REPLAY_TARGET = "https://replay.io/demo";

const RecordIcon = () => (
  <span className="bg-primaryAccent text-white rounded-xl px-2 py-0.5 uppercase text-base">
    ⦿ REC
  </span>
);

function FirstReplayModal({ hideModal }: PropsFromRedux) {
  const userInfo = hooks.useGetUserInfo();
  const updateUserNags = hooks.useUpdateUserNags();

  const handleOpen = () => {
    const newNags = [...userInfo.nags, Nag.FIRST_REPLAY_2];
    updateUserNags({
      variables: { newNags },
    });
    hideModal();
    window.open(FIRST_REPLAY_TARGET);
  };

  return (
    <>
      <BlankScreen className="fixed" />
      <Modal options={{ maskTransparency: "transparent" }}>
        <div
          className="p-12 bg-white rounded-lg shadow-xl text-xl space-y-8 relative flex flex-col justify-between"
          style={{ width: "520px" }}
        >
          <div className="space-y-12">
            <h2 className="font-bold text-3xl ">Create your first Replay</h2>
            <div className="text-gray-500">
              {`We've put together a demo to show you how Replay works. Once it's opened in a new tab, press the record `}
              <RecordIcon />
              {` button to start recording.`}
            </div>
            <UrlCopy url={FIRST_REPLAY_TARGET} />
            <PrimaryButton color="blue" onClick={handleOpen}>
              {`Open this website in a new tab`}
            </PrimaryButton>
          </div>
        </div>
      </Modal>
    </>
  );
}

const connector = connect(() => ({}), { hideModal: actions.hideModal });
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(FirstReplayModal);
