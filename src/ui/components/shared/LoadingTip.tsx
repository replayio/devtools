import classNames from "classnames";
import React, { useEffect, useRef, useState } from "react";

const TIPS = [
  {
    title: "SAML 2.0 / SSO Authentication",
    description:
      "Replay supports single sign-on via Google SAML 2.0 by default. Reach out if you would like to provision your SSO.",
    icon: "zypsy-security-icon1.svg",
  },
  {
    title: "Encryption at Rest & In-Transit",
    description:
      "Replay protects your data in transit with TLS v1.2 and strong ciphersuites. Replay protects your data at rest by encrypting it with AES-256 GCM.",
    icon: "zypsy-security-icon2.svg",
  },
  {
    title: "Intellectual property",
    description:
      "Replay is architected with your privacy in mind. We try our hardest not to collect sensitive information that we don't need, and will never sell your information.",
    icon: "zypsy-security-icon1.svg",
  },
  {
    title: "Private by default",
    description: "Replay will never view or analyze your replays without your explicit permission.",
    icon: "zypsy-security-icon3.svg",
  },
];

export default function LoadingTip() {
  const [loadingPageTipIndex, setLoadingPageTipIndex] = useState(0);
  const { title, description, icon } = TIPS[loadingPageTipIndex];
  const key = useRef<any>();

  const resetAutoNext = () => clearTimeout(key.current);

  useEffect(() => resetAutoNext, []);
  useEffect(() => {
    resetAutoNext();
    key.current = setTimeout(() => {
      const nextIndex = loadingPageTipIndex === TIPS.length - 1 ? 0 : loadingPageTipIndex + 1;

      setLoadingPageTipIndex(nextIndex);
    }, 5000);
  }, [loadingPageTipIndex]);

  return (
    <div className="bg-jellyfish space-x-4 inline-block align-middle flex items-center max-w-lg">
      <img className="h-16 w-18 p-2" src={`/images/${icon}`} />
      <div className="flex flex-col space-y-2">
        <div className="font-bold text-sm">{title}</div>
        <div className="text-xs">{description}</div>
      </div>
    </div>
  );
}
