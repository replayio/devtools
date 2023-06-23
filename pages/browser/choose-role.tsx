import { useRouter } from "next/router";
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
import { useUpdateUserPreferences } from "ui/hooks/settings";
import { sendTelemetryEvent } from "ui/utils/telemetry";

export default function ImportSettings() {
  const router = useRouter();
  const { updateUserPreferences } = useUpdateUserPreferences();
  const setRole = (role: string) => {
    // TODO [ryanjduffy]: Should this route to the tutorial app?
    updateUserPreferences({ variables: { preferences: { role } } })
      .then(() => router.push("/"))
      .catch(e => {
        sendTelemetryEvent("DevtoolsGraphQLError", {
          source: "updateUserSetting",
          role,
          message: e,
        });

        router.push("/");
      });
  };

  return (
    <OnboardingModalContainer>
      <OnboardingContentWrapper>
        <OnboardingHeader>Can you tell us your role?</OnboardingHeader>
        <OnboardingBody>(So we can skip stuff you might find boring)</OnboardingBody>
        <OnboardingActions>
          <button
            className={getButtonClasses("blue", "primary", "2xl")}
            onClick={() => setRole("developer")}
          >
            Developer
          </button>
          <button
            className={getButtonClasses("blue", "primary", "2xl")}
            onClick={() => setRole("other")}
          >
            Not a Developer
          </button>
        </OnboardingActions>
        <iframe id="migrationFrame" className="h-0 w-0" />
      </OnboardingContentWrapper>
    </OnboardingModalContainer>
  );
}
