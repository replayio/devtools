import React, { Dispatch, SetStateAction, useState } from "react";
import { ConnectedProps, connect } from "react-redux";

import * as actions from "ui/actions/app";
import hooks from "ui/hooks";
import { Nag } from "ui/hooks/users";

import Modal from "../NewModal";
import styles from "./OnboardingModal.module.css";

const slides = [
  {
    header: "Welcome to Replay! 👋",
    content: (
      <>
        <div
          className={styles.content}
        >{`This is your library, where replays live. Click one to play it!`}</div>
      </>
    ),
  },
];

function SlideContent({
  headerText,
  children,
}: {
  headerText: string;
  children: React.ReactElement | React.ReactElement[];
}) {
  return (
    <div className={styles.content}>
      <h2 className={styles.header}>{headerText}</h2>
      <div className={styles.children}>{children}</div>
    </div>
  );
}

function Navigation({
  current,
  total,
  setCurrent,
  hideModal,
}: {
  current: number;
  total: number;
  setCurrent: Dispatch<SetStateAction<number>>;
  hideModal: typeof actions.hideModal;
}) {
  const dismissNag = hooks.useDismissNag();

  const onSkipOrDone = () => {
    hideModal();
    dismissNag(Nag.FIRST_REPLAY_2);
  };

  return (
    <div className={styles.navigation}>
      <div>
        <button
          onClick={onSkipOrDone}
          type="button"
          className={current == total ? styles.doneButton : styles.skipButton}
        >
          {current == total ? "Got it!" : "Skip"}
        </button>
      </div>
    </div>
  );
}

function OnboardingModal({ hideModal }: PropsFromRedux) {
  const [current, setCurrent] = useState<number>(1);

  const { header, content } = slides[current - 1];

  return (
    <Modal options={{ maskTransparency: "translucent" }}>
      <div className={styles.modalContent} style={{ width: "520px" }}>
        <SlideContent headerText={header}>{content}</SlideContent>
        <Navigation
          current={current}
          total={slides.length}
          setCurrent={setCurrent}
          hideModal={hideModal}
        />
        <div
          className={styles.absoluteBottom}
          style={{ width: `${(current / slides.length) * 100}%` }}
        />
      </div>
    </Modal>
  );
}

const connector = connect(null, { hideModal: actions.hideModal });
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(OnboardingModal);
