import { useRouter } from "next/router";

import { Role } from "shared/user-data/GraphQL/config";
import { userData } from "shared/user-data/GraphQL/UserData";
import { getButtonClasses } from "ui/components/shared/Button";
import {
  OnboardingActions,
  OnboardingBody,
  OnboardingContentWrapper,
  OnboardingHeader,
  OnboardingModalContainer,
} from "ui/components/shared/Onboarding";

export default function ImportSettings() {
  const router = useRouter();
  const setRole = async (role: Role) => {
    // TODO [ryanjduffy]: Should this route to the tutorial app?
    await userData.set("global_role", role);
    router.push("/");
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
