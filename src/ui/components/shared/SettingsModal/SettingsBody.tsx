import React, { Dispatch, SetStateAction, useState } from "react";
import { SettingItem, Setting, UserSettings } from "./types";
import useToken from "ui/utils/useToken";
import hooks from "ui/hooks";
import ReplayInvitations from "./ReplayInvitations";
import "./SettingsBody.css";

interface SettingsBodyItemProps {
  item: SettingItem;
  userSettings: UserSettings;
  setShowRefresh: Dispatch<SetStateAction<boolean>>;
}

interface SettingsBodyProps {
  selectedSetting: Setting;
  userSettings: UserSettings;
}

function RefreshPrompt() {
  return (
    <div className="refresh-prompt">
      <span>You need to refresh this page for the changes to take effect.</span>
      <button onClick={() => location.reload()}>Refresh</button>
    </div>
  );
}

function SettingsBodyItem({ item, userSettings, setShowRefresh }: SettingsBodyItemProps) {
  const { claims } = useToken();
  const userId = claims?.hasura.userId;

  const { label, key, description, needsRefresh } = item;
  const value = userSettings[key];

  const updateUserSetting = hooks.useUpdateUserSetting(key);
  const toggleSetting = () => {
    if (needsRefresh) {
      setShowRefresh(true);
    }

    updateUserSetting({
      variables: {
        newValue: !value,
        userId,
      },
    });
  };

  return (
    <li>
      <label className="setting-item" htmlFor={key}>
        <div className="label">{label}</div>
        {description && <div className="description">{description}</div>}
      </label>
      <input type="checkbox" id={key} checked={value} onChange={toggleSetting} />
    </li>
  );
}

function Support() {
  return (
    <li>
      <label className="setting-item">
        <div className="label">Join us on Discord</div>
        <div className="description">
          Come chat with us on our{" "}
          <a href="https://discord.gg/n2dTK6kcRX" target="_blank" rel="noreferrer">
            Discord server
          </a>
          . We’d love to hear your feedback!
        </div>
      </label>
    </li>
  );
}

export default function SettingsBody({ selectedSetting, userSettings }: SettingsBodyProps) {
  const { title, items } = selectedSetting;
  const [showRefresh, setShowRefresh] = useState(false);

  if (title == "Support") {
    return (
      <main>
        <h1>{title}</h1>
        <Support />
      </main>
    );
  } else if (title == "Invitations") {
    return (
      <main>
        <h1>{title}</h1>
        <ReplayInvitations />
      </main>
    );
  }

  return (
    <main>
      <h1>{title}</h1>
      <ul>
        {items.map((item, index) => (
          <SettingsBodyItem
            {...{ item, userSettings }}
            key={index}
            setShowRefresh={setShowRefresh}
          />
        ))}
      </ul>
      {showRefresh ? <RefreshPrompt /> : null}
    </main>
  );
}
