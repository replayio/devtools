import React from "react";
import { LaunchBrowser } from "ui/components/shared/LaunchBrowserModal";
import { BlankViewportWrapper } from "ui/components/shared/Viewport";

const BrowserLaunch = () => {
  const library = "replay:library";

  return (
    <BlankViewportWrapper>
      <LaunchBrowser path={library}>
        <p className="text-center">
          <a
            className="inline-flex items-center bg-primaryAccent text-white h-12 px-4"
            href={library}
          >
            Open Replay
          </a>
        </p>
      </LaunchBrowser>
    </BlankViewportWrapper>
  );
};

export default BrowserLaunch;
