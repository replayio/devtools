import React, { FC } from "react";
import Link from "next/link";
import { getButtonClasses } from "ui/components/shared/Button";
import {
  OnboardingActions,
  OnboardingBody,
  OnboardingContent,
  OnboardingContentWrapper,
  OnboardingHeader,
  OnboardingModalContainer,
} from "ui/components/shared/Onboarding";

const WelcomeToReplay: FC = () => {
  const classes = getButtonClasses("blue", "primary", "2xl");

  return (
    <OnboardingModalContainer>
      <OnboardingContentWrapper>
        <OnboardingContent>
          <OnboardingHeader>{`Hello, I'm the Replay Browser`}</OnboardingHeader>
          <OnboardingBody>{`Nice to meet you! I'm going to save you and your team a whole lot of time.`}</OnboardingBody>
        </OnboardingContent>
        <OnboardingActions>
          <Link href="./import-settings">
            <a type="button" className={classes}>
              Get Started
            </a>
          </Link>
        </OnboardingActions>
      </OnboardingContentWrapper>
    </OnboardingModalContainer>
  );
};

export default WelcomeToReplay;
