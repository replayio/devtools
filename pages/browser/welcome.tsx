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
      <OnboardingContentWrapper>
        <OnboardingContent>
          <OnboardingHeader>{`Welcome to Replay`}</OnboardingHeader>
          <OnboardingBody>{`Replay lets you record bugs and replay them with time-travel enabled browser DevTools.`}</OnboardingBody>
        </OnboardingContent>
        <OnboardingActions>
          <Link href="/login?returnTo=/browser/choose-role" className={classes}>
            Get Started
          </Link>
        </OnboardingActions>
      </OnboardingContentWrapper>
    </OnboardingModalContainer>
  );
}
