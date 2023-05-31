import Link from "next/link";
import React from "react";

import { getButtonClasses } from "ui/components/shared/Button";
import {
  OnboardingBody,
  OnboardingContent,
  OnboardingHeader,
  OnboardingModalContainer,
} from "ui/components/shared/Onboarding";

import styles from "src/ui/components/shared/Onboarding/Onboarding.module.css";

export default function WelcomeToReplay() {
  const classes = getButtonClasses("blue", "primary", "2xl");

  return (
    <div className={styles.stars}>
      <OnboardingModalContainer>
        <OnboardingContent>
          <OnboardingHeader>{`Welcome to Replay`}</OnboardingHeader>
          <OnboardingBody>{` `}</OnboardingBody>

          <Link href="/login?returnTo=/browser/choose-role" className={classes}>
            Let's get started!
          </Link>
        </OnboardingContent>
      </OnboardingModalContainer>
      <div className={styles.bottom}>
        <div className={styles.grid}></div>
      </div>
    </div>
  );
}
