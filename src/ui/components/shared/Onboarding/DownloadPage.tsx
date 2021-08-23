import React from "react";
import { DisabledLgButton, PrimaryLgButton, SecondaryLgButton } from "../Button";
import { OnboardingActions, OnboardingBody, OnboardingHeader } from "../Onboarding/index";
import { trackEvent } from "ui/utils/telemetry";

function DownloadButtonContent({ text, imgUrl }: { text: string; imgUrl: string }) {
  return (
    <div
      className="flex flex-row items-center w-full justify-between"
      style={{ minWidth: "120px" }}
    >
      <span>{text}</span>
      <img className="w-8 h-8" src={imgUrl} />
    </div>
  );
}

function DownloadButtons({ onNext }: { onNext: () => void }) {
  const startDownload = (url: string) => {
    window.open(url, "_blank");
    onNext();
  };
  const handleMac = () => {
    trackEvent("downloaded-mac");
    startDownload("https://replay.io/downloads/replay.dmg");
  };
  const handleLinux = () => {
    trackEvent("downloaded-linux");
    startDownload("https://replay.io/downloads/linux-replay.tar.bz2");
  };
  const handleWindows = () => {
    trackEvent("downloaded-windows");
  };

  return (
    <div className="py-4 flex flex-row w-full space-x-4 justify-center">
      <PrimaryLgButton color="blue" onClick={handleMac}>
        <DownloadButtonContent text="Mac" imgUrl="/images/icon-apple.svg" />
      </PrimaryLgButton>
      <PrimaryLgButton color="blue" onClick={handleLinux}>
        <DownloadButtonContent text="Linux" imgUrl="/images/icon-linux.svg" />
      </PrimaryLgButton>
      <div title="Coming soon" onClick={handleWindows}>
        <DisabledLgButton>
          <DownloadButtonContent text="Windows" imgUrl="/images/icon-windows.svg" />
        </DisabledLgButton>
      </div>
    </div>
  );
}

export function DownloadPage({
  onNext,
  onSkipToLibrary,
}: {
  onNext: () => void;
  onSkipToLibrary: () => void;
}) {
  return (
    <>
      <OnboardingHeader>Download Replay</OnboardingHeader>
      <OnboardingBody>
        Record your first replay with the Replay browser, or go directly to your team’s library
      </OnboardingBody>
      <DownloadButtons onNext={onNext} />
      <OnboardingActions>
        <SecondaryLgButton color="blue" onClick={onSkipToLibrary}>
          Skip for now
        </SecondaryLgButton>
      </OnboardingActions>
    </>
  );
}
