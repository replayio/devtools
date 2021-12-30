import React from "react";
import { LaunchBrowser } from "ui/components/shared/LaunchBrowserModal";
import { BubbleViewportWrapper } from "ui/components/shared/Viewport";

const BrowserAuth = () => {
  const library = "replay:library";

  return (
    <BubbleViewportWrapper>
      <LaunchBrowser path={library}>
        <p>You have successfully logged into the Replay Browser. You may close this window.</p>
        <p className="text-center">
          <a
            className="inline-flex items-center bg-primaryAccent text-white h-12 px-4 rounded-md"
            href={library}
          >
            Open Replay
          </a>
        </p>
      </LaunchBrowser>
    </BubbleViewportWrapper>
  );
};

export default BrowserAuth;
