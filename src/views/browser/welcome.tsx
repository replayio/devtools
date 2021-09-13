import React from "react";
import { Link } from "react-router-dom";
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
          <OnboardingHeader>{`Hello, I'm the Replay Browser`}</OnboardingHeader>
          <OnboardingBody>{`Nice to meet you! I'm going to save you and your team a whole lot of time.`}</OnboardingBody>
        </OnboardingContent>
        <OnboardingActions>
          <Link type="button" to="./import-settings" className={classes}>
            Get Started
          </Link>
        </OnboardingActions>
      </OnboardingContentWrapper>
    </OnboardingModalContainer>
  );
}
