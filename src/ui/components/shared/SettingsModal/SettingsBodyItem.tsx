import React, { Dispatch, SetStateAction } from "react";
import { SettingItem } from "./types";
import hooks from "ui/hooks";
import { SelectMenu } from "ui/components/shared/Forms";
import "./SettingsBodyItem.css";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import { getUserSettings } from "ui/reducers/app";
import { UIState } from "ui/state";

interface SettingsBodyItemProps {
  item: SettingItem;
  setShowRefresh: Dispatch<SetStateAction<boolean>>;
}

function _Checkbox({
  item,
  value,
  setShowRefresh,
}: {
  item: SettingItem;
  setShowRefresh: Dispatch<SetStateAction<boolean>>;
}) {
  const updateUserSetting = hooks.useUpdateUserSetting(item.key, "Boolean");

  const { needsRefresh } = item;

  const toggleSetting = () => {
    if (needsRefresh) {
      setShowRefresh(true);
    }
    updateUserSetting({
      variables: {
        newValue: !value,
      },
    });
  };

  return <input type="checkbox" id={key} checked={value} onChange={toggleSetting} />;
}

function _Dropdown({
  item,
  setShowRefresh,
  userSettings,
}: {
  item: SettingItem;
  setShowRefresh: Dispatch<SetStateAction<boolean>>;
} & PropsFromRedux) {
  const { key, needsRefresh } = item;
  const value = userSettings[key] as string | null;
  const { workspaces, loading } = hooks.useGetNonPendingWorkspaces();
  const updateUserSetting = hooks.useUpdateUserSetting(key, "Boolean");

  const displayedWorkspaces: { id: string | null; name: string }[] = [
    { id: null, name: "My Library" },
  ];

  if (workspaces) {
    displayedWorkspaces.push(...workspaces);
    displayedWorkspaces.sort();
  }

  const onChange = (selectedValue: string | null) => {
    if (needsRefresh) {
      setShowRefresh(true);
    }

    updateUserSetting({
      variables: {
        workspaceId: selectedValue,
      },
    });
  };

  if (loading) {
    return null;
  }

  return (
    <div className="w-64">
      <SelectMenu selected={value} setSelected={onChange} options={displayedWorkspaces} />
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    userSettings: getUserSettings(state),
  }),
  {}
);
type PropsFromRedux = ConnectedProps<typeof connector>;
const Checkbox = connector(_Checkbox);
const Dropdown = connector(_Dropdown);

function Input({
  item,
  setShowRefresh,
}: {
  item: SettingItem;
  setShowRefresh: Dispatch<SetStateAction<boolean>>;
}) {
  if (item.type == "checkbox") {
    return <Checkbox {...{ item, setShowRefresh }} />;
  }

  return <Dropdown {...{ item, setShowRefresh }} />;
}

export default function SettingsBodyItem({ item, setShowRefresh }: SettingsBodyItemProps) {
  const { label, key, description } = item;

  return (
    <li>
      <label className="setting-item" htmlFor={key}>
        <div className="label">{label}</div>
        {description && <div className="description">{description}</div>}
      </label>
      <Input item={item} setShowRefresh={setShowRefresh} />
    </li>
  );
}
