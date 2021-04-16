import React, { Dispatch, SetStateAction } from "react";
import { SettingItem, UserSettings } from "./types";
import { getUserId } from "ui/utils/useToken";
import hooks from "ui/hooks";
import "./SettingsBodyItem.css";

interface SettingsBodyItemProps {
  item: SettingItem;
  userSettings: UserSettings;
  setShowRefresh: Dispatch<SetStateAction<boolean>>;
}

function Checkbox({
  item,
  value,
  setShowRefresh,
}: {
  item: SettingItem;
  value: boolean;
  setShowRefresh: Dispatch<SetStateAction<boolean>>;
}) {
  const { key, needsRefresh } = item;
  const userId = getUserId();

  const updateUserSetting = hooks.useUpdateUserSetting(key, "Boolean");
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

  return <input type="checkbox" id={key} checked={value} onChange={toggleSetting} />;
}

function Dropdown({
  item,
  value,
  setShowRefresh,
}: {
  item: SettingItem;
  value: string;
  setShowRefresh: Dispatch<SetStateAction<boolean>>;
}) {
  const { key, needsRefresh } = item;
  const { workspaces, loading } = hooks.useGetNonPendingWorkspaces();
  const updateUserSetting = hooks.useUpdateUserSetting(key, "uuid");
  const userId = getUserId();

  const displayedWorkspaces = [{ id: "", name: "---" }];

  if (workspaces) {
    displayedWorkspaces.push(...workspaces);
  }

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (needsRefresh) {
      setShowRefresh(true);
    }

    const selectedValue = e.target.value == "" ? null : e.target.value;
    updateUserSetting({
      variables: {
        newValue: selectedValue,
        userId,
      },
    });
  };

  if (loading) {
    return null;
  }

  return (
    <select
      className="p-1 bg-gray-100 border border-gray-300 rounded"
      onChange={onChange}
      value={value == null ? "" : value}
    >
      {displayedWorkspaces.map(workspace => (
        <option value={workspace.id} key={workspace.id}>
          {workspace.name}
        </option>
      ))}
    </select>
  );
}

function Input({
  item,
  value,
  setShowRefresh,
}: {
  item: SettingItem;
  value: boolean | string;
  setShowRefresh: Dispatch<SetStateAction<boolean>>;
}) {
  if (item.type == "checkbox") {
    return <Checkbox {...{ item, value: value as boolean, setShowRefresh }} />;
  }

  return <Dropdown {...{ item, value: value as string, setShowRefresh }} />;
}

export default function SettingsBodyItem({
  item,
  userSettings,
  setShowRefresh,
}: SettingsBodyItemProps) {
  const { label, key, description } = item;

  return (
    <li>
      <label className="setting-item" htmlFor={key}>
        <div className="label">{label}</div>
        {description && <div className="description">{description}</div>}
      </label>
      <Input item={item} value={userSettings[key]} setShowRefresh={setShowRefresh} />
    </li>
  );
}
