import React from "react";
import { DisabledLgButton, PrimaryLgButton, SecondaryLgButton } from "../Button";
import { OnboardingActions, OnboardingBody, OnboardingHeader } from "../Onboarding/index";
import { trackEvent } from "ui/utils/telemetry";

function DownloadButtonContent({ text, imgUrl }: { text: string; imgUrl: string }) {
  return (
    <div
      className="flex w-full flex-row items-center justify-between"
      style={{ minWidth: "120px" }}
    >
      <span>{text}</span>
      <img className="h-6 w-6" src={imgUrl} />
    </div>
  );
}

function DownloadButtons({ onNext }: { onNext: () => void }) {
  const startDownload = (url: string) => {
    window.open(url, "_blank");
    onNext();
  };
  const handleMac = () => {
    trackEvent("onboarding.download_replay", { OS: "mac" });
    startDownload("https://static.replay.io/downloads/replay.dmg");
  };
  const handleLinux = () => {
    trackEvent("onboarding.download_replay", { OS: "linux" });
    startDownload("https://static.replay.io/downloads/linux-replay.tar.bz2");
  };
  const handleWindows = () => {
    trackEvent("onboarding.download_replay", { OS: "windows" });
    startDownload("https://static.replay.io/downloads/windows-replay.zip");
  };

  return (
    <div className="flex w-full flex-row justify-center space-x-3 py-3">
      <PrimaryLgButton color="blue" onClick={handleMac}>
        <DownloadButtonContent text="Mac" imgUrl="/images/icon-apple.svg" />
      </PrimaryLgButton>
      <PrimaryLgButton color="blue" onClick={handleLinux}>
        <DownloadButtonContent text="Linux" imgUrl="/images/icon-linux.svg" />
      </PrimaryLgButton>
      <PrimaryLgButton color="blue" onClick={handleWindows}>
        <DownloadButtonContent text="Windows" imgUrl="/images/icon-windows.svg" />
      </PrimaryLgButton>
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
        Record your first replay with the Replay browser, or go directly to your library
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
