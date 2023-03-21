import React, { FC } from "react";

import { getLoadingPageTipSeed } from "ui/actions/app";
import { useAppSelector } from "ui/setup/hooks";

import LightbulbIcon from "../../../image/zypsy/lightbulb-icon.svg";
import CloudIcon from "../../../image/zypsy/zypsy-security-icon1.svg";
import KeyIcon from "../../../image/zypsy/zypsy-security-icon2.svg";
import ShieldIcon from "../../../image/zypsy/zypsy-security-icon3.svg";

const TIPS = [
  {
    title: "SAML 2.0 / SSO Authentication",
    description:
      "Replay supports single sign-on via Google SAML 2.0 by default. Reach out if you would like to provision your SSO.",
    icon: CloudIcon,
  },
  {
    title: "Encryption at Rest & In-Transit",
    description:
      "Replay protects your data in transit with TLS v1.2 and strong ciphersuites. Replay protects your data at rest by encrypting it with AES-256 GCM.",
    icon: KeyIcon,
  },
  {
    title: "Private by default",
    description: "Replay will never view or analyze your replays without your explicit permission.",
    icon: ShieldIcon,
  },
  {
    title: "Focus Mode",
    description: "Shift-F focuses your debugging session to a precise location.",
    icon: LightbulbIcon,
  },
  {
    title: "Command palette",
    description: "Command-K launches a command palette to help you find things faster.",
    icon: LightbulbIcon,
  },
  {
    title: "Print statements",
    description: "Replay's print statements are magic! Add one by hovering on a line of code.",
    icon: LightbulbIcon,
  },
] as const;

export const LoadingTips: FC = () => {
  const seed = useAppSelector(getLoadingPageTipSeed);
  const currentTipIdx = Math.floor(seed * TIPS.length);
  const { title, description, icon: Icon } = TIPS[currentTipIdx];
  return (
    <div className="h-16 w-96 space-y-2">
      <div className="flex max-w-lg items-center space-x-4 rounded-lg bg-loadingBoxes px-8 py-4 align-middle text-bodyColor shadow-sm">
        <div className="h-16 w-16">
          <Icon />
        </div>
        <div className="flex flex-col space-y-2">
          <div className="text-xs font-bold">{title}</div>
          <div className="text-xs">{description}</div>
        </div>
      </div>
    </div>
  );
};
