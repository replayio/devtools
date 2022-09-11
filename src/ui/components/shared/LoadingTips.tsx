import React, { FC, useEffect, useRef, useState } from "react";
import CloudIcon from "../../../image/zypsy/zypsy-security-icon1.svg";
import KeyIcon from "../../../image/zypsy/zypsy-security-icon2.svg";
import ShieldIcon from "../../../image/zypsy/zypsy-security-icon3.svg";
import LightbulbIcon from "../../../image/zypsy/lightbulb-icon.svg";

const TIP_DURATION = 12000;

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
    description:
      "Try typing shift-f to focus your debugging session to a precise location.",
    icon: LightbulbIcon,
  },
  {
    title: "Command palette",
    description:
      "Command-k launches Replay's command palette which helps find things faster.",
    icon: LightbulbIcon,
  },
  {
    title: "Print statements",
    description:
      "Print statements might be Replay's best feature! Try clicking on a line of code in the editor.",
    icon: LightbulbIcon,
  },
] as const;

export const LoadingTips: FC = () => {
  const rand = Math.floor(Math.random() * (TIPS.length));
  const [currentTipIdx, setCurrentTipIdx] = useState(rand);
  const { title, description, icon: Icon } = TIPS[currentTipIdx];
  const timerRef = useRef<NodeJS.Timeout>();

  const resetAutoNext = () => timerRef.current !== undefined && clearTimeout(timerRef.current);

  useEffect(() => {
    resetAutoNext();
  }, []);

  useEffect(() => {
    resetAutoNext();
    timerRef.current = setTimeout(() => {
      setCurrentTipIdx((currentTipIdx + TIPS.length + 1) % TIPS.length);
    }, TIP_DURATION);
  }, [currentTipIdx]);

  return (
    <div className="h-32 space-y-8 w-96">
      <div className="flex items-center max-w-lg px-8 py-4 space-x-4 align-middle rounded-lg shadow-sm bg-loadingBoxes text-bodyColor">
        <div className="w-16 h-16">
          <Icon />
        </div>
        <div className="flex flex-col space-y-2">
          <div className="text-sm font-bold">{title}</div>
          <div className="text-xs">{description}</div>
        </div>
      </div>
    </div>
  );
};
