import React, { useState } from "react";
import hooks from "ui/hooks";
import { prefs } from "ui/utils/prefs";
import Checkbox from "../Forms/Checkbox";
import { EmailSubscription } from "ui/hooks/users";
import Radio from "../Forms/Radio";

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

  return (
    <label className="flex items-center space-x-2 cursor-pointer" data-private htmlFor={emailType}>
      <Checkbox id={emailType} checked={checked} onChange={handleChange} />
      <div>{content}</div>
    </label>
  );
}

function MarketingPreferences({
  unsubscribedEmailTypes,
}: {
  unsubscribedEmailTypes: EmailSubscription[];
}) {
  const subscribeToEmailType = hooks.useSubscribeToEmailType();
  const unsubscribeToEmailType = hooks.useUnsubscribeToEmailType();
  const isEnabled = !unsubscribedEmailTypes.includes(EmailSubscription.MARKETING);

  const onEnable = () => subscribeToEmailType(EmailSubscription.MARKETING);
  const onDisable = () => unsubscribeToEmailType(EmailSubscription.MARKETING);

  return (
    <div className="space-y-4">
      <div className="text-lg">Email Preferences</div>
      <div className="flex flex-col space-y-2 p-1">
        <label className="flex space-x-2 cursor-pointer" htmlFor="enable_marketing" data-private>
          <Radio
            id="enable_marketing"
            name="marketing_email"
            checked={isEnabled}
            onChange={onEnable}
          />
          <div>
            <div className="cursor-pointer">
              {"Receive all emails, except those I unsubscribe from"}
            </div>
            <div className="text-xs text-gray-500">
              {`We’ll occasionally contact you with the latest news and happenings`}
            </div>
          </div>
        </label>
        <label className="flex space-x-2 cursor-pointer" htmlFor="disable_marketing" data-private>
          <Radio
            id="disable_marketing"
            name="marketing_emails"
            checked={!isEnabled}
            onChange={onDisable}
          />
          <div>
            <div className="cursor-pointer">
              <div>{"Only receive account related emails, and those I subscribe to"}</div>
            </div>
            <div className="text-xs text-gray-500">
              {`We’ll only send you administrative emails, and any emails you’re subscribed to`}
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}

function NotificationPreferences({
  unsubscribedEmailTypes,
}: {
  unsubscribedEmailTypes: EmailSubscription[];
}) {
  return (
    <div className="space-y-4">
      <div className="text-lg">Notification Preferences</div>
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
  const toggleDisableLogRocket = () => {
    prefs.disableLogRocket = !prefs.disableLogRocket;
    setDisableLogRocket(prefs.disableLogRocket);
  };
  const [disableLogRocket, setDisableLogRocket] = useState(prefs.disableLogRocket);

  return (
    <div className="space-y-4">
      <div className="text-lg">Privacy Preferences</div>
      <div className="flex flex-col space-y-2 p-1">
        <label
          className="flex items-center space-x-2 cursor-pointer"
          data-private
          htmlFor="disableLogRocket"
        >
          <Checkbox
            id="disableLogRocket"
            checked={!!disableLogRocket}
            onChange={toggleDisableLogRocket}
          />
          <div>Disable LogRocket Session Replay</div>
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
      <PrivacyPreferences />
      <MarketingPreferences {...{ unsubscribedEmailTypes }} />
      <NotificationPreferences {...{ unsubscribedEmailTypes }} />
    </div>
  );
}
