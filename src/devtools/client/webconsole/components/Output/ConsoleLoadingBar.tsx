import React, { FC } from "react";
import { useSelector } from "react-redux";
import LoadingProgressBar from "ui/components/shared/LoadingProgressBar";
import { UIState } from "ui/state";
import { getMessagesLoaded } from "../../selectors/messages";

const ConsoleLoadingBar: FC = () => {
  const messagesLoaded = useSelector((state: UIState) => getMessagesLoaded(state));

  if (messagesLoaded) {
    return null;
  }

  return <LoadingProgressBar />;
};

export default ConsoleLoadingBar;
