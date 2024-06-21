import { ENUMS, config } from "shared/user-data/GraphQL/config";
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
    <div className="space-y-6 overflow-auto">
      <div className="mr-4 space-y-4">
        <div className="text-lg">Appearance</div>
        <EnumPreference
          preference={config.global_theme}
          preferencesKey="global_theme"
          values={ENUMS.theme}
        />
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

      {unsubscribedEmailTypes ? (
        <div className="space-y-4">
          <div className="text-lg">Notifications</div>
          <div>Choose which email updates you would like to receive:</div>
          <div className="flex flex-col space-y-2 p-1">
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
      className="grid cursor-pointer items-center transition-opacity"
      style={{ gridTemplateColumns: "auto minmax(0, 1fr)", gap: "0 0.5rem" }}
      htmlFor={emailType}
    >
      <Checkbox id={emailType} checked={checked} onChange={onChange} />
      <div>{label}</div>
    </label>
  );
}
