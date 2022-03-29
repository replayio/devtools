import React from "react";
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
import { LoginLink } from "ui/components/shared/Login/Login";

function launchMigrationWizard(e: React.MouseEvent<HTMLAnchorElement>) {
  e.preventDefault();
  (document.querySelector("#migrationFrame") as HTMLIFrameElement).src = "replay:migrate";
  window.addEventListener("focus", function nav() {
    document.location.href = (e.target as HTMLAnchorElement).href;
    window.removeEventListener("focus", nav);
  });
}

export default function ImportSettings() {
  return (
    <OnboardingModalContainer>
      <OnboardingContentWrapper>
        <OnboardingContent>
          <OnboardingHeader>{`Got settings?`}</OnboardingHeader>
          <OnboardingBody>{`If you'd like, I can carry your settings over from your main browser so you can get started quickly.`}</OnboardingBody>
        </OnboardingContent>
        <OnboardingActions>
          <LoginLink>
            <a
              type="button"
              className={getButtonClasses("blue", "primary", "2xl")}
              onClick={launchMigrationWizard}
            >
              {`Sounds helpful, let's do it`}
            </a>
          </LoginLink>
          <LoginLink>
            <a type="button" className={getButtonClasses("gray", "primary", "2xl")}>
              Skip
            </a>
          </LoginLink>
        </OnboardingActions>
        <iframe id="migrationFrame" className="h-0 w-0" />
      </OnboardingContentWrapper>
    </OnboardingModalContainer>
  );
}
