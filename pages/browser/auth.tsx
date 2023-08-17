import { useRouter } from "next/router";
import React from "react";

import { LaunchBrowser } from "ui/components/shared/LaunchBrowserModal";
import Modal from "ui/components/shared/NewModal";
import { DefaultViewportWrapper } from "ui/components/shared/Viewport";

const BrowserAuth = () => {
  const router = useRouter();
  const source = Array.isArray(router.query.source)
    ? router.query.source[0]
    : router.query.source || "browser";
  const library = "replay:open";

  return (
    <DefaultViewportWrapper>
      {source === "browser" ? (
        <LaunchBrowser path={library}>
          <p>You have successfully logged into the Replay Browser. You may close this window.</p>
          <p className="text-center">
            <a
              className="inline-flex h-12 items-center rounded-md bg-primaryAccent px-4 text-buttontextColor"
              href={library}
            >
              Open Replay
            </a>
          </p>
        </LaunchBrowser>
      ) : (
        /* this is probably not the right component. used as a placeholder */
        <Modal>You have successfully logged in. You may close this window.</Modal>
      )}
    </DefaultViewportWrapper>
  );
};

export default BrowserAuth;
