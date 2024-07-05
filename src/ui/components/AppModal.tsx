import React, { ReactNode, Suspense, useEffect } from "react";

import { hideModal } from "ui/actions/app";
import { getLoadingFinished, getModal } from "ui/reducers/app";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { ModalType } from "ui/state/app";

import LoginModal from "./shared/LoginModal";
import LoomModal from "./shared/LoomModal";
import PassportDismissModal from "./shared/Modals/PassportDismissModal";
import RenameReplayModal from "./shared/Modals/RenameReplayModal";
import NewAttachment from "./shared/NewAttachment";

const LaunchBrowserModal = React.lazy(() => import("./shared/LaunchBrowserModal"));
const UserSettingsModal = React.lazy(() => import("./shared/UserSettingsModal"));
const SharingModal = React.lazy(() => import("./shared/SharingModal"));

export function AppModal() {
  const dispatch = useAppDispatch();
  const loadingFinished = useAppSelector(getLoadingFinished);
  const modalType = useAppSelector(getModal);

  // Dismiss modal if the "Escape" key is pressed.
  useEffect(() => {
    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dispatch(hideModal);
      }
    };
    document.addEventListener("keydown", onDocumentKeyDown);
    return () => {
      document.removeEventListener("keydown", onDocumentKeyDown);
    };
  }, [dispatch]);

  if (!loadingFinished) {
    return null;
  }

  let modal: ReactNode = null;
  switch (modalType) {
    case "sharing":
      modal = <SharingModal />;
      break;
    case "login":
      modal = <LoginModal />;
      break;
    case "settings":
      modal = <UserSettingsModal />;
      break;
    case "browser-launch":
      modal = <LaunchBrowserModal />;
      break;
    case "loom":
      modal = <LoomModal />;
      break;
    case "attachment":
      modal = <NewAttachment />;
      break;
    case "rename-replay":
      modal = <RenameReplayModal />;
      break;
    case "passport-dismiss":
      modal = <PassportDismissModal />;
      break;
  }

  return modal ? <Suspense>{modal}</Suspense> : null;
}
