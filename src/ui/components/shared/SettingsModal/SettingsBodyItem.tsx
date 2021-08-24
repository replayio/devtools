import React, { Dispatch, SetStateAction } from "react";
import { SettingItem } from "./types";
import { SelectMenu } from "ui/components/shared/Forms";
import { SettingsBodyHeader } from "./SettingsBody";

interface SettingsBodyItemProps<V> {
  item: SettingItem<V>;
  onChange?: (key: SettingItem<V>["key"], value: any) => void;
  values: V;
  setShowRefresh: Dispatch<SetStateAction<boolean>>;
}

type InputProps<V, Value = any> = {
  value: Value;
} & Pick<SettingsBodyItemProps<V>, "item" | "onChange" | "setShowRefresh">;

function Checkbox<K>({ item, value, onChange, setShowRefresh }: InputProps<K, boolean>) {
  const { key, needsRefresh } = item;

  const toggleSetting = () => {
    if (needsRefresh) {
      setShowRefresh(true);
    }

    if (onChange) {
      const newValue = !value;
      onChange(key, newValue);
    }
  };

  return <input type="checkbox" id={String(key)} checked={value} onChange={toggleSetting} />;
}

function Dropdown<K>({ value }: InputProps<K>) {
  const onChange = () => {};

  return (
    <div className="w-64">
      <SelectMenu selected={value} setSelected={onChange} options={[]} />
    </div>
  );
}

function Input<K>({ item, value, ...rest }: InputProps<K>) {
  if (item.type == "checkbox" && typeof value === "boolean") {
    return <Checkbox {...rest} item={item} value={value} />;
  }

  return <Dropdown {...rest} item={item} value={value} />;
}

export default function SettingsBodyItem<K>({
  item,
  values,
  setShowRefresh,
  onChange,
}: SettingsBodyItemProps<K>) {
  const { label, key, description } = item;

  return (
    <li className="flex flex-row items-center">
      <label className="space-y-2 pr-48 flex-grow cursor-pointer" htmlFor={String(key)}>
        <SettingsBodyHeader>{label}</SettingsBodyHeader>
        {description && <div>{description}</div>}
      </label>
      <Input item={item} value={values[key]} setShowRefresh={setShowRefresh} onChange={onChange} />
    </li>
  );
}
