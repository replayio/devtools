import ExternalLink from "replay-next/components/ExternalLink";
import { SettingsBodyHeader } from "ui/components/shared/SettingsModal/SettingsBody";

export function Legal() {
  return (
    <div className="flex flex-col divide-y divide-border pr-2 sm:pr-8">
      <section className="pb-6">
        <SettingsBodyHeader>
          <ExternalLink
            className="text-foreground underline-offset-4 hover:underline"
            href="https://www.replay.io/terms-of-use"
          >
            Terms of Use
          </ExternalLink>
        </SettingsBodyHeader>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {`The Terms of Use help define Replay's relationship with you as you interact with our services.`}
        </p>
      </section>
      <section className="py-6">
        <SettingsBodyHeader>
          <ExternalLink
            className="text-foreground underline-offset-4 hover:underline"
            href="https://www.replay.io/privacy-policy"
          >
            Privacy Policy
          </ExternalLink>
        </SettingsBodyHeader>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {`Our Privacy Policy outlines how you can update, manage, and delete your information.`}
        </p>
      </section>
    </div>
  );
}
