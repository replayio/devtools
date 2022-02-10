import React, { FC } from "react";
import { LaunchBrowser } from "ui/components/shared/LaunchBrowserModal";
import { BubbleViewportWrapper } from "ui/components/shared/Viewport";

const BrowserLaunch: FC = () => {
  const library = "replay:library";

  return (
    <BubbleViewportWrapper>
      <LaunchBrowser path={library}>
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

export default BrowserLaunch;
