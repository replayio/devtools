export type PrefsType = "Bool" | "Char" | "String" | "Int" | "Float" | "Json";

export type PrefsBlueprint<K extends string> = Record<K, [PrefsType, string]>;

declare type Prefs<K extends string> = Record<K, boolean | number | string | object>;

export const PrefsHelper: new <K extends string>(
  prefsRoot?: string,
  prefsBlueprint?: PrefsBlueprint<K>
) => Prefs<K> & {
  toJSON(): Record<K, boolean | number | string | object>;
};
