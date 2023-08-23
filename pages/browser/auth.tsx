import { useRouter } from "next/router";
import React from "react";

import { LaunchBrowser } from "ui/components/shared/LaunchBrowserModal";
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
        <section className="relative m-auto w-full max-w-xl overflow-hidden rounded-lg bg-modalBgcolor text-sm text-bodyColor shadow-lg">
          <div className="flex flex-col items-center space-y-9 p-6">
            <div className="place-content-center space-y-3">
              <img className="mx-auto h-12 w-12" src="/images/logo.svg" />
            </div>
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="text-lg font-bold">Authentication Complete</div>
              <div className="space-y-6">
                <p>You have successfully logged in. You may close this window.</p>
              </div>
              <div className="w-full" />
            </div>
          </div>
        </section>
      )}
    </DefaultViewportWrapper>
  );
};

export default BrowserAuth;
