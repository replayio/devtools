import React from "react";

import { LoadingScreenTemplate } from "ui/components/shared/LoadingScreen";
import { useGetUserInfo } from "ui/hooks/users";

export default function NewTab() {
  const { motd } = useGetUserInfo();

  // Function to detect if the user is on Windows
  const isWindows = () => {
    return window.navigator.platform.indexOf("Win") == -1;
  };

  return (
    <LoadingScreenTemplate>
      <div className="space-y-8 text-center">
        {motd ? <h2 className="text-2xl">{motd}</h2> : null}
        {isWindows() ? (
          <div className="rounded-lg p-4">
            <div className="mb-4 text-lg font-bold">Replay on Windows is in beta</div>
            <div className="text-sm">
              We are hoping to release a new Chrome-based browser in a couple of months which will
              be more reliable. Please{" "}
              <a href="https://www.replay.io/contact" className="underline">
                contact us
              </a>{" "}
              with any feedback.
            </div>
          </div>
        ) : (
          <div>
            Please navigate to the page you want to record, then press the blue record button.
          </div>
        )}
      </div>
    </LoadingScreenTemplate>
  );
}
