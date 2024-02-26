import { useRouter } from "next/router";

import { Button } from "replay-next/components/Button";
import { Role } from "shared/user-data/GraphQL/config";
import { userData } from "shared/user-data/GraphQL/UserData";
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
          <Button onClick={() => setRole("developer")} size="large">
            Developer
          </Button>
          <Button onClick={() => setRole("other")} size="large">
            Not a Developer
          </Button>
        </OnboardingActions>
        <iframe id="migrationFrame" className="h-0 w-0" />
      </OnboardingContentWrapper>
    </OnboardingModalContainer>
  );
}
