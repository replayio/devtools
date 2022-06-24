import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import hooks from "ui/hooks";
import { useStringPref } from "ui/hooks/settings";
import { EmailSubscription } from "ui/hooks/users";
import { getThemePreference } from "ui/reducers/app";
import { updateTheme } from "ui/reducers/app";
import { AppTheme } from "ui/state/app";
import { useFeature } from "ui/hooks/settings";

import { SelectMenu } from "../Forms";
import Checkbox from "../Forms/Checkbox";

import { CheckboxRow } from "./CheckboxRow";
import { getHitCountsMode, HitCountMode } from "devtools/client/debugger/src/selectors";
import { setHitCountsMode } from "devtools/client/debugger/src/reducers/ui";

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
  }, [userSettings]);

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
  const dispatch = useAppDispatch();
  const theme = useAppSelector(getThemePreference);
  const hitCountsMode = useAppSelector(getHitCountsMode);
  const { value: defaultMode, update: updateDefaultMode } = useStringPref("defaultMode");
  const { value: enableHitCounts } = useFeature("hitCounts");

  const setSelected = (value: AppTheme) => {
    dispatch(updateTheme(value));
  };

  return (
    <div className="space-y-4">
      <div className="text-lg">Appearance</div>
      <div className="flex flex-col space-y-4 p-1">
        <div className="flex flex-row justify-between">
          <div>Theme</div>
          <div className="w-1/2">
            <SelectMenu
              options={[
                { name: "Dark", id: "dark" },
                { name: "Light", id: "light" },
                { name: "System", id: "system" },
              ]}
              selected={theme}
              setSelected={str => setSelected(str as AppTheme)}
            />
          </div>
        </div>
        <div className="flex flex-row justify-between">
          <div>Default Mode</div>
          <div className="w-1/2">
            <SelectMenu
              options={[
                { name: "Viewer", id: "non-dev" },
                { name: "DevTools", id: "dev" },
              ]}
              selected={defaultMode}
              setSelected={str => str && updateDefaultMode(str)}
            />
          </div>
        </div>
        {enableHitCounts && (
          <div className="flex flex-row justify-between">
            <div>Heat Maps</div>
            <div className="w-1/2">
              <SelectMenu
                options={[
                  { name: "Hide Counts", id: "hide-counts" },
                  { name: "Show Counts", id: "show-counts" },
                  { name: "Disabled", id: "disabled" },
                ]}
                selected={hitCountsMode}
                setSelected={mode => dispatch(setHitCountsMode(mode as HitCountMode))}
              />
            </div>
          </div>
        )}
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
