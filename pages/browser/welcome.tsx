import Link from "next/link";
import React from "react";

import { Button } from "replay-next/components/Button";
import {
  OnboardingBody,
  OnboardingContent,
  OnboardingHeader,
  OnboardingModalContainer,
} from "ui/components/shared/Onboarding";

import styles from "src/ui/components/shared/Onboarding/Onboarding.module.css";

export default function WelcomeToReplay() {
  const onClick = () => {
    window.location.replace("/login?returnTo=/browser/choose-role");
  };

  return (
    <div className={styles.stars}>
      <OnboardingModalContainer>
        <OnboardingContent>
          <OnboardingHeader>{`Welcome to Replay`}</OnboardingHeader>
          <OnboardingBody>{` `}</OnboardingBody>

          <Button onClick={onClick} size="large">
            Let's get started!
          </Button>
        </OnboardingContent>
      </OnboardingModalContainer>
      <div className={styles.bottom}>
        <div className={styles.grid}></div>
      </div>
    </div>
  );
}
