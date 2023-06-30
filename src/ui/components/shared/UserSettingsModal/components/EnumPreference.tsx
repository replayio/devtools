import assert from "assert";
import { useMemo } from "react";

import { ConfigurablePreference, PreferencesKey } from "shared/user-data/GraphQL/types";
import { useGraphQLUserData } from "shared/user-data/GraphQL/useGraphQLUserData";
import { SelectMenu } from "ui/components/shared/Forms";
import { useGetUserInfo } from "ui/hooks/users";

export function EnumPreference<Value>({
  onChange,
  preference,
  preferencesKey,
  values,
}: {
  onChange?: (value: Value) => void;
  preference: ConfigurablePreference;
  preferencesKey: PreferencesKey;
  values: Array<{
    label: string;
    value: Value;
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

  const [selected, setSelected] = useGraphQLUserData(preferencesKey);

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
            setSelected(value as any);

            if (onChange) {
              onChange(value as Value);
            }
          }}
        />
      </div>
    </div>
  );
}
