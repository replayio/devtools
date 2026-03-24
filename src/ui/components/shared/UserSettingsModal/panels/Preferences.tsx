import { ENUMS, config } from "shared/user-data/GraphQL/config";
import { ThemeSwitch } from "ui/components/shared/ThemeSwitch";
import { BooleanPreference } from "ui/components/shared/UserSettingsModal/components/BooleanPreference";
import { EnumPreference } from "ui/components/shared/UserSettingsModal/components/EnumPreference";
import hooks from "ui/hooks";
import { EmailSubscription } from "ui/hooks/users";

import Checkbox from "../../Forms/Checkbox";

const EMAIL_NOTIFICATIONS = {
  [EmailSubscription.COLLABORATOR_REQUEST]: "When somebody invites you to collaborate on a replay",
  [EmailSubscription.REPLAY_COMMENT]: "When somebody comments on your replay",
  [EmailSubscription.NEW_TEAM_INVITE]: "When you're invited to a new team",
};

export function Preferences() {
  const { unsubscribedEmailTypes } = hooks.useGetUserInfo();
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-0 overflow-auto pr-1">
      <div className="pb-2">
        <ThemeSwitch />
      </div>

      <div className="space-y-4 py-6">
        <div className="text-sm font-medium text-foreground">Layout &amp; display</div>
        <div className="space-y-4">
          <EnumPreference
            preference={config.layout_defaultViewMode}
            preferencesKey="layout_defaultViewMode"
            values={ENUMS.defaultViewMode}
          />
          <BooleanPreference
            preference={config.global_enableLargeText}
            preferencesKey="global_enableLargeText"
          />
          <BooleanPreference
            preference={config.feature_showPassport}
            preferencesKey="feature_showPassport"
          />
          <BooleanPreference
            preference={config.console_showFiltersByDefault}
            preferencesKey="console_showFiltersByDefault"
          />
        </div>
      </div>

      {unsubscribedEmailTypes ? (
        <div className="space-y-4 border-t border-border pt-6">
          <div className="text-sm font-medium text-foreground">Notifications</div>
          <p className="text-sm text-muted-foreground">
            Choose which email updates you would like to receive:
          </p>
          <div className="flex flex-col gap-3">
            {Object.entries(EMAIL_NOTIFICATIONS).map(([emailType, content]: string[], i) => (
              <EmailNotification
                emailType={emailType as EmailSubscription}
                key={i}
                label={content}
                unsubscribedEmailTypes={unsubscribedEmailTypes}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EmailNotification({
  emailType,
  label,
  unsubscribedEmailTypes,
}: {
  emailType: EmailSubscription;
  label: string;
  unsubscribedEmailTypes: EmailSubscription[];
}) {
  const subscribeToEmailType = hooks.useSubscribeToEmailType();
  const unsubscribeToEmailType = hooks.useUnsubscribeToEmailType();
  const checked = !unsubscribedEmailTypes.includes(emailType);

  const onChange = () => {
    if (checked) {
      unsubscribeToEmailType(emailType);
    } else {
      subscribeToEmailType(emailType);
    }
  };

  return (
    <label
      className="grid cursor-pointer items-start gap-x-2 transition-opacity"
      style={{ gridTemplateColumns: "auto minmax(0, 1fr)" }}
      htmlFor={emailType}
    >
      <Checkbox id={emailType} checked={checked} onChange={onChange} />
      <div className="text-sm text-foreground">{label}</div>
    </label>
  );
}
