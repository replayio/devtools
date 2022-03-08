import React, { FC, useEffect, useRef, useState } from "react";
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
    title: "Intellectual property",
    description:
      "Replay is architected with your privacy in mind. We try our hardest not to collect sensitive information that we don't need, and will never sell your information.",
    icon: CloudIcon,
  },
  {
    title: "Private by default",
    description: "Replay will never view or analyze your replays without your explicit permission.",
    icon: ShieldIcon,
  },
] as const;

export const LoadingTip: FC = () => {
  const [tipIdx, setTipIdx] = useState(0);
  const { title, description, icon: Icon } = TIPS[tipIdx];
  const timerRef = useRef<NodeJS.Timeout>();

  const resetAutoNext = () => timerRef.current !== undefined && clearTimeout(timerRef.current);

  useEffect(() => {
    resetAutoNext();
  }, []);

  useEffect(() => {
    resetAutoNext();
    timerRef.current = setTimeout(() => {
      setTipIdx((tipIdx + TIPS.length + 1) % TIPS.length);
    }, 5000);
  }, [tipIdx]);

  return (
    <div className="h-32 w-96 space-y-8">
      <div className="flex max-w-lg items-center space-x-4 rounded-lg bg-white/75 px-8 py-4 align-middle text-gray-800">
        <div className="h-16 w-16">
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
