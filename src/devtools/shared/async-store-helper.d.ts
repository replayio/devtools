export type PrefsType = "Bool" | "Char" | "String" | "Int" | "Float" | "Json";

declare type Prefs<K extends string> = Record<K, boolean | number | string | object>;

export type PrefsBlueprint<K extends string> = Record<K, [PrefsType, string]>;

export function asyncStoreHelper<K extends string>(
  prefsRoot?: string,
  prefsBlueprint?: PrefsBlueprint<K>
): Prefs<K> & {
  toJSON(): Record<K, boolean | number | string | object>;
};
