import React, { FC } from "react";
import { useSelector } from "react-redux";
import LoadingProgressBar from "ui/components/shared/LoadingProgressBar";
import { UIState } from "ui/state";

const ConsoleLoadingBar: FC = () => {
  const messagesLoading = useSelector((state: UIState) => state.messages.messagesLoaded);

  if (!messagesLoading) {
    return null;
  }

  return <LoadingProgressBar />;
};

export default ConsoleLoadingBar;
