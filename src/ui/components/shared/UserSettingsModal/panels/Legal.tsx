import ExternalLink from "replay-next/components/ExternalLink";
import { SettingsBodyHeader } from "ui/components/shared/SettingsModal/SettingsBody";

export function Legal() {
  return (
    <div className="space-y-12 pr-36">
      <div className="space-y-3">
        <div className="space-y-1.5">
          <SettingsBodyHeader>
            <ExternalLink className="underline" href="https://www.replay.io/terms-of-use">
              Terms of Use
            </ExternalLink>
          </SettingsBodyHeader>
          <div>{`The Terms of Use help define Replay's relationship with you as you interact with our services.`}</div>
        </div>
        <div className="space-y-1.5">
          <SettingsBodyHeader>
            <ExternalLink className="underline" href="https://www.replay.io/privacy-policy">
              Privacy Policy
            </ExternalLink>
          </SettingsBodyHeader>
          <div>{`Our Privacy Policy outlines how you can update, manage, and delete your information.`}</div>
        </div>
      </div>
    </div>
  );
}
