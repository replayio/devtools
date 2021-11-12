import React, { useState } from "react";
import { useAcceptTOS } from "ui/hooks/users";
import BlankScreen from "./shared/BlankScreen";
import { PrimaryButton } from "./shared/Button";
import Modal from "./shared/NewModal";
import ExternalLink from "./shared/ExternalLink";

export const LATEST_TOS_VERSION = 1;

export default function TOSScreen() {
  const acceptTOS = useAcceptTOS();

  const handleAccept = () => acceptTOS({ variables: { version: LATEST_TOS_VERSION } });

  return (
    <>
      <BlankScreen background="white" />
      <Modal options={{ maskTransparency: "transparent" }}>
        <div
          className="p-9 bg-white rounded-lg shadow-xl text-xl space-y-6 relative flex flex-col items-center"
          style={{ width: "520px" }}
        >
          <div className="space-y-4 place-content-center">
            <img className="w-12 h-12 mx-auto" src="/images/logo.svg" />
          </div>
          <div className="font-bold text-2xl">Terms of Use</div>
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
          <ul className="list-disc pl-6 space-y-1.5">
            <li>
              <span className="font-medium">What you can expect from us</span>, which describes how
              we provide and develop our services
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
      </Modal>
    </>
  );
}
