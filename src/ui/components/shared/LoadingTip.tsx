import classNames from "classnames";
import React, { useEffect, useRef, useState } from "react";

const TIPS = [
  {
    title: "SAML / SSO Integration",
    description:
      "Replay supports single sign-on via Google SAML 2.0 by default. Reach out if you would like to provision your SSO.",
    icon: "zypsy-security-icon1.svg",
  },
  {
    title: "Encryption at Rest & In-Transit",
    description:
      "Replay uses TLS v1.2 in transit and AES 256 at rest so that your data is secure at all times.",
    icon: "zypsy-security-icon2.svg",
  },
  {
    title: "Intellectual property",
    description:
      "We respect the privacy of everyone who uses our software and do not sell customer data.",
    icon: "zypsy-security-icon1.svg",
  },
  {
    title: "Private by default",
    description: "We do not view or analyze your replays without your explicit permission.",
    icon: "zypsy-security-icon3.svg",
  },
  {
    title: "Values aligned",
    description:
      "We respect the privacy of everyone who uses our software and do not sell customer data.",
    icon: "zypsy-security-icon3.svg",
  },
];

export default function LoadingTip() {
  const [tipIndex, setTipIndex] = useState(0);
  const { title, description, icon } = TIPS[tipIndex];

  return (
    <div className="bottom-6 absolute left-1/2 transform -translate-x-1/2">
      <div className="flex flex-col space-y-4">
        <div className="p-4 bg-jellyfish shadow-lg rounded-lg space-x-4 flex items-center max-w-lg">
          <img className="h-16 w-16 p-2" src={`/images/${icon}`} />
          <div className="flex flex-col space-y-2">
            <div className="font-bold">{title}</div>
            <div className="text-sm">{description}</div>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex flex-row space-x-1">
            {TIPS.map((t, i) => (
              <button
                className={classNames("rounded-full h-2 w-2", {
                  "bg-gray-300": tipIndex !== i,
                  "bg-gray-500": tipIndex === i,
                })}
                key={i}
                onClick={() => setTipIndex(i)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
