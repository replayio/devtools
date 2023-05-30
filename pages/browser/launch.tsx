import React from "react";

import { LaunchBrowser } from "ui/components/shared/LaunchBrowserModal";
import { DefaultViewportWrapper } from "ui/components/shared/Viewport";

const BrowserLaunch = () => {
  const library = "replay:library";

  return (
    <DefaultViewportWrapper>
      <LaunchBrowser path={library}>
        <p className="text-center">
          <a
            className="inline-flex h-12 items-center rounded-md bg-primaryAccent px-4 text-buttontextColor"
            href={library}
          >
            Open Replay
          </a>
        </p>
      </LaunchBrowser>
    </DefaultViewportWrapper>
  );
};

export default BrowserLaunch;
