import Link from "next/link";
import React from "react";

import { getButtonClasses } from "ui/components/shared/Button";
import {
  OnboardingActions,
  OnboardingBody,
  OnboardingContent,
  OnboardingContentWrapper,
  OnboardingHeader,
  OnboardingModalContainer,
} from "ui/components/shared/Onboarding";

export default function WelcomeToReplay() {
  const classes = getButtonClasses("blue", "primary", "2xl");

  return (
    <OnboardingModalContainer>
      <OnboardingContent>
        <OnboardingHeader>{`Hello, I'm the Replay Browser`}</OnboardingHeader>
        <OnboardingBody>{`Replay lets you record bugs and replay them with time-travel enabled browser DevTools.`}</OnboardingBody>

        <Link href="/login?returnTo=/browser/choose-role" className={classes}>
          Get Started
        </Link>
      </OnboardingContent>
    </OnboardingModalContainer>
  );
}
