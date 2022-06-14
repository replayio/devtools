import React, { FC } from "react";
import { useAppSelector } from "ui/setup/hooks";
import LoadingProgressBar from "ui/components/shared/LoadingProgressBar";
import { UIState } from "ui/state";

import { getMessagesLoaded } from "../../selectors/messages";

const ConsoleLoadingBar: FC = () => {
  const messagesLoaded = useAppSelector((state: UIState) => getMessagesLoaded(state));

  if (messagesLoaded) {
    return null;
  }

  return (
    <div style={{ position: "sticky", top: 0 }}>
      <LoadingProgressBar />
    </div>
  );
};

export default ConsoleLoadingBar;
