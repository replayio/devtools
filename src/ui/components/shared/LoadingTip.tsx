import { useState } from "@storybook/addons";
import React, { useEffect, useRef } from "react";
import zypsyIcon1 from "../../../image/zypsy/zypsy-security-icon1.svg";
import zypsyIcon2 from "../../../image/zypsy/zypsy-security-icon2.svg";
import zypsyIcon3 from "../../../image/zypsy/zypsy-security-icon3.svg";

const TIPS = [
  {
    title: "SAML 2.0 / SSO Authentication",
    description:
      "Replay supports single sign-on via Google SAML 2.0 by default. Reach out if you would like to provision your SSO.",
    icon: zypsyIcon1,
  },
  {
    title: "Encryption at Rest & In-Transit",
    description:
      "Replay protects your data in transit with TLS v1.2 and strong ciphersuites. Replay protects your data at rest by encrypting it with AES-256 GCM.",
    icon: zypsyIcon2,
  },
  {
    title: "Intellectual property",
    description:
      "Replay is architected with your privacy in mind. We try our hardest not to collect sensitive information that we don't need, and will never sell your information.",
    icon: zypsyIcon1,
  },
  {
    title: "Private by default",
    description: "Replay will never view or analyze your replays without your explicit permission.",
    icon: zypsyIcon3,
  },
] as const;

export default function LoadingTip() {
  const [tipIdx, setTipIdx] = useState(0);
  const { title, description, icon } = TIPS[tipIdx];
  const timerRef = useRef<any>();

  const resetAutoNext = () => clearTimeout(timerRef.current);

  useEffect(() => resetAutoNext, []);
  useEffect(() => {
    resetAutoNext();
    timerRef.current = setTimeout(() => {
      const nextTipIdx = (tipIdx + TIPS.length + 1) % TIPS.length;
      setTipIdx(nextTipIdx);
    }, 5000);
  }, [tipIdx]);

  return (
    <div className="h-32 w-96 space-y-8">
      <div className="flex max-w-lg items-center space-x-4 rounded-lg bg-white/75 px-8 py-4 align-middle text-gray-800">
        <div className="h-16 p-2">{icon}</div>
        <div className="flex flex-col space-y-2">
          <div className="text-sm font-bold">{title}</div>
          <div className="text-xs">{description}</div>
        </div>
      </div>
    </div>
  );
}
