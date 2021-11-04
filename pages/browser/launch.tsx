import React, { useEffect } from "react";
import BlankScreen from "ui/components/shared/BlankScreen";
import { LaunchBrowser } from "ui/components/shared/LaunchBrowserModal";

const BrowserLaunch = () => {
  const library = "replay:library";

  return (
    <BlankScreen className="absolute z-10">
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
    </BlankScreen>
  );
};

export default BrowserLaunch;
