import React from "react";
import { SettingItem, Setting, UserSettings } from "./types";
import "./SettingsBody.css";

interface SettingsBodyItemProps {
  item: SettingItem;
  userSettings: UserSettings;
}

interface SettingsBodyProps {
  selectedSetting: Setting;
  userSettings: UserSettings;
}

function SettingsBodyItem({ item, userSettings }: SettingsBodyItemProps) {
  const { label, key, description } = item;

  return (
    <li>
      <label className="setting-item" htmlFor={key}>
        <div className="label">{label}</div>
        {description && <div className="description">{description}</div>}
      </label>
      <input type="checkbox" id={key} checked={userSettings[key]} />
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
          <a href="https://discord.gg/Th7AwJsz" target="_blank" rel="noreferrer">
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

  if (title == "Support") {
    return (
      <main>
        <h1>{title}</h1>
        <Support />
      </main>
    );
  }

  return (
    <main>
      <h1>{title}</h1>
      <ul>
        {items.map((item, index) => (
          <SettingsBodyItem {...{ item, userSettings }} key={index} />
        ))}
      </ul>
    </main>
  );
}
