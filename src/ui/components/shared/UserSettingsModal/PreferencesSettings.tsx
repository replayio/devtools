import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import hooks from "ui/hooks";
import Checkbox from "../Forms/Checkbox";
import { EmailSubscription } from "ui/hooks/users";
import { CheckboxRow } from "./CheckboxRow";
import { trackEvent } from "ui/utils/telemetry";
import { toggleTheme } from "ui/actions/app";
import { getTheme } from "ui/reducers/app";

const EMAIL_NOTIFICATIONS = {
  [EmailSubscription.COLLABORATOR_REQUEST]: "When somebody invites you to collaborate on a replay",
  [EmailSubscription.REPLAY_COMMENT]: "When somebody comments on your replay",
  [EmailSubscription.NEW_TEAM_INVITE]: "When you're invited to a new team",
};

function Notification({
  content,
  emailType,
  unsubscribedEmailTypes,
}: {
  content: string;
  emailType: EmailSubscription;
  unsubscribedEmailTypes: EmailSubscription[];
}) {
  const subscribeToEmailType = hooks.useSubscribeToEmailType();
  const unsubscribeToEmailType = hooks.useUnsubscribeToEmailType();
  const checked = !unsubscribedEmailTypes.includes(emailType);

  const handleChange = () => {
    if (checked) {
      unsubscribeToEmailType(emailType);
    } else {
      subscribeToEmailType(emailType);
    }
  };

  return <CheckboxRow id={emailType} checked={checked} onChange={handleChange} label={content} />;
}

function NotificationPreferences({
  unsubscribedEmailTypes,
}: {
  unsubscribedEmailTypes: EmailSubscription[];
}) {
  return (
    <div className="space-y-4">
      <div className="text-lg">Notifications</div>
      <div>Choose which email updates you would like to receive:</div>
      <div className="flex flex-col space-y-2 p-1">
        {Object.entries(EMAIL_NOTIFICATIONS).map(([emailType, content]: string[], i) => (
          <Notification
            {...{ content, unsubscribedEmailTypes }}
            emailType={emailType as EmailSubscription}
            key={i}
          />
        ))}
      </div>
    </div>
  );
}

function PrivacyPreferences() {
  const [disableLogRocket, setDisableLogRocket] = useState<boolean>();
  const { userSettings, loading } = hooks.useGetUserSettings();
  const updateLogRocket = hooks.useUpdateUserSetting("disableLogRocket");

  const toggle = (newValue: boolean) => {
    setDisableLogRocket(newValue);
    updateLogRocket({
      variables: {
        newValue,
      },
    });
  };

  useEffect(() => {
    setDisableLogRocket(userSettings.disableLogRocket);
  }, [loading]);

  if (loading) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="text-lg">Privacy</div>
      <div className="flex flex-col space-y-2 p-1">
        <label
          className="flex cursor-pointer items-center space-x-2"
          data-private
          htmlFor="disableLogRocket"
        >
          <Checkbox
            id="disableLogRocket"
            checked={disableLogRocket}
            disabled={loading}
            onChange={ev => toggle(ev.currentTarget.checked)}
          />
          <div>Disable LogRocket session replay</div>
        </label>
      </div>
    </div>
  );
}

function UiPreferences() {
  const theme = useSelector(getTheme);
  const dispatch = useDispatch();

  const handleDarkModeToggle = () => {
    trackEvent("feature.dark_mode", { enabled: theme !== "dark" });
    dispatch(toggleTheme());
  };

  return (
    <div className="space-y-4">
      <div className="text-lg">Appearance</div>
      <div className="flex flex-col space-y-2 p-1">
        <label
          className="flex cursor-pointer items-center space-x-2"
          data-private
          htmlFor="enableDarkMode"
        >
          <Checkbox
            id="enableDarkMode"
            checked={theme === "dark"}
            onChange={handleDarkModeToggle}
          />
          <div>Enable Dark Mode</div>
        </label>
      </div>
    </div>
  );
}

export default function PreferencesSettings() {
  const { loading, unsubscribedEmailTypes } = hooks.useGetUserInfo();

  if (loading) {
    return null;
  }

  return (
    <div className="space-y-6 overflow-auto">
      <UiPreferences />
      <PrivacyPreferences />
      {unsubscribedEmailTypes ? <NotificationPreferences {...{ unsubscribedEmailTypes }} /> : null}
    </div>
  );
}
