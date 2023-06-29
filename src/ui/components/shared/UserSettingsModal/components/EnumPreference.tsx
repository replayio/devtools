import assert from "assert";
import { useMemo } from "react";

import { ConfigurablePreference, PreferencesKey, Serializable } from "shared/preferences/types";
import { usePreference } from "shared/preferences/usePreference";
import { SelectMenu } from "ui/components/shared/Forms";
import { useGetUserInfo } from "ui/hooks/users";

export function EnumPreference({
  onChange,
  preference,
  preferencesKey,
  values,
}: {
  onChange?: (value: string) => void;
  preference: ConfigurablePreference;
  preferencesKey: PreferencesKey;
  values: Array<{
    label: string;
    value: Serializable;
  }>;
}) {
  const { defaultValue, internalOnly, label } = preference;
  assert(typeof defaultValue === "string");
  assert(label !== undefined);

  const userInfo = useGetUserInfo();

  const options = useMemo(
    () =>
      values.map(value => ({
        id: value.value as any,
        name: value.label,
      })),
    [values]
  );

  const [selected, setSelected] = usePreference(preferencesKey);

  if (internalOnly && !userInfo.internal) {
    return null;
  } else if (selected === undefined) {
    return null;
  }

  return (
    <div className="flex flex-row justify-between">
      <div>{label}</div>
      <div className="w-2/3">
        <SelectMenu
          options={options}
          selected={selected as string}
          setSelected={value => {
            setSelected(value as string);

            if (onChange) {
              onChange(value as string);
            }
          }}
        />
      </div>
    </div>
  );
}
