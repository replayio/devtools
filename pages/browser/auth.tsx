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
            className="inline-flex h-12 items-center rounded-md bg-primaryAccent px-4 text-white"
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
