import React from "react";
import { useAcceptTOS } from "ui/hooks/users";
import { PrimaryButton } from "./shared/Button";
import ExternalLink from "./shared/ExternalLink";
import { BubbleViewportWrapper } from "./shared/Viewport";

export const LATEST_TOS_VERSION = 1;

export default function TOSScreen() {
  const acceptTOS = useAcceptTOS();

  const handleAccept = () => acceptTOS({ variables: { version: LATEST_TOS_VERSION } });

  return (
    <BubbleViewportWrapper>
      <div
        className="relative flex flex-col items-center space-y-6 rounded-lg bg-white p-9 text-base shadow-xl"
        style={{ width: "520px" }}
      >
        <div className="place-content-center space-y-4">
          <img className="mx-auto h-12 w-12" src="/images/logo.svg" />
        </div>
        <div className="text-2xl font-bold">Terms of Use</div>
        <div>
          Our{" "}
          <a
            href="https://replay.io/tos.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primaryAccent underline"
          >
            Terms of Use
          </a>{" "}
          help define Replay’s relationship with you as you interact with our services. This
          includes:
        </div>
        <ul className="list-disc space-y-1.5 pl-6">
          <li>
            <span className="font-medium">What you can expect from us</span>, which describes how we
            provide and develop our services
          </li>
          <li>
            <span className="font-medium">Content in Replay services</span>, such as intellectual
            property rights to the content you create and/or find in our services
          </li>
        </ul>
        <div>
          Besides these terms, we also publish a{" "}
          <ExternalLink
            href="https://replay.io/privacy.html"
            className="text-primaryAccent underline"
          >
            Privacy Policy
          </ExternalLink>{" "}
          which outline how we treat the personal information we collect as you use our services.
        </div>
        <PrimaryButton color="blue" onClick={handleAccept}>
          I’ve read and accept the terms of service
        </PrimaryButton>
      </div>
    </BubbleViewportWrapper>
  );
}
