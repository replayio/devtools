import ExternalLink from "replay-next/components/ExternalLink";
import { SettingsBodyHeader } from "ui/components/shared/SettingsModal/SettingsBody";

export function Support() {
  return (
    <div className="flex flex-col divide-y divide-border">
      <section className="pb-6 pr-2 sm:pr-8">
        <SettingsBodyHeader>Join us on Discord</SettingsBodyHeader>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Come chat with us on our{" "}
          <ExternalLink
            className="font-medium text-foreground underline-offset-4 hover:underline"
            href="https://discord.gg/n2dTK6kcRX"
          >
            Discord server
          </ExternalLink>
          .
        </p>
      </section>
      <section className="py-6 pr-2 sm:pr-8">
        <SettingsBodyHeader>Send us an email</SettingsBodyHeader>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          You can also send an email at{" "}
          <a
            className="font-medium text-foreground underline-offset-4 hover:underline"
            href="mailto:support@replay.io"
          >
            support@replay.io
          </a>
          . It goes straight to the people making the product, and we&apos;d love to hear your
          feedback!
        </p>
      </section>
    </div>
  );
}
