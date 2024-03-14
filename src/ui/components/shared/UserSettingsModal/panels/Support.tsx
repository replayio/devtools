import ExternalLink from "replay-next/components/ExternalLink";
import { SettingsBodyHeader } from "ui/components/shared/SettingsModal/SettingsBody";

export function Support() {
  return (
    <ul>
      <li className="flex flex-row items-center">
        <label className="flex-grow space-y-1.5 pr-36">
          <SettingsBodyHeader>Join us on Discord</SettingsBodyHeader>
          <div className="description">
            Come chat with us on our{" "}
            <ExternalLink href="https://discord.gg/n2dTK6kcRX">Discord server.</ExternalLink>
          </div>
        </label>
      </li>
      <li className="flex flex-row items-center">
        <label className="flex-grow space-y-1.5 pr-36">
          <SettingsBodyHeader>Send us an email</SettingsBodyHeader>
          <div className="description">
            You can also send an email at <a href="mailto:support@replay.io">support@replay.io</a>.
            It goes straight to the people making the product, and we&apos;d love to hear your
            feedback!
          </div>
        </label>
      </li>
    </ul>
  );
}
