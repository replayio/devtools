import React from "react";
import { SettingItem } from "./types";
import { SelectMenu } from "ui/components/shared/Forms";
import { SettingsBodyHeader } from "./SettingsBody";
import Checkbox from "../Forms/Checkbox";

interface SettingsBodyItemProps<V> {
  item: SettingItem<V>;
  onChange?: (key: SettingItem<V>["key"], value: any) => void;
  values: V;
}

type InputProps<V, Value = any> = {
  value: Value;
} & Pick<SettingsBodyItemProps<V>, "item" | "onChange">;

function SettingCheckbox<K>({ item, value, onChange }: InputProps<K, boolean>) {
  const { key } = item;

  const toggleSetting = () => {
    if (onChange) {
      const newValue = !value;
      onChange(key, newValue);
    }
  };

  if (item.comingSoon) {
    return <span className="italic text-gray-500">Coming Soon...</span>;
  }

  return <Checkbox id={String(key)} checked={value} onChange={toggleSetting} />;
}

function Dropdown<K>({ value }: InputProps<K>) {
  const onChange = () => {};

  return (
    <div className="w-48">
      <SelectMenu selected={value} setSelected={onChange} options={[]} className="text-sm" />
    </div>
  );
}

function Input<K>({ item, value, ...rest }: InputProps<K>) {
  if (item.type == "checkbox" && typeof value === "boolean") {
    return <SettingCheckbox {...rest} item={item} value={value} />;
  }

  return <Dropdown {...rest} item={item} value={value} />;
}

export default function SettingsBodyItem<K>({ item, values, onChange }: SettingsBodyItemProps<K>) {
  const { label, key, description } = item;

  return (
    <li className="flex flex-row items-center">
      <label className="space-y-1.5 pr-36 flex-grow cursor-pointer" htmlFor={String(key)}>
        <SettingsBodyHeader>{label}</SettingsBodyHeader>
        {description && <div>{description}</div>}
      </label>
      <Input item={item} value={values[key]} onChange={onChange} />
    </li>
  );
}
