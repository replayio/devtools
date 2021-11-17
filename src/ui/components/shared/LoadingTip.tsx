import classNames from "classnames";
import React, { useEffect, useRef } from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";

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

function LoadingTip({ loadingPageTipIndex, setLoadingPageTipIndex }: PropsFromRedux) {
  const { title, description, icon } = TIPS[loadingPageTipIndex || 0];
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
    <div className="bottom-6 absolute left-1/2 transform -translate-x-1/2">
      <div className="flex flex-col space-y-4 invisible md:visible">
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
                className={classNames(
                  "rounded-full h-2 w-2",
                  loadingPageTipIndex === i ? "bg-gray-500" : "bg-gray-300"
                )}
                key={i}
                onClick={() => setLoadingPageTipIndex(i)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({ loadingPageTipIndex: selectors.getLoadingPageTipIndex(state) }),
  { setLoadingPageTipIndex: actions.setLoadingPageTipIndex }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(LoadingTip);
