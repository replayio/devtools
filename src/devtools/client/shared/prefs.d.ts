export type PrefsType = "Bool" | "Char" | "String" | "Int" | "Float" | "Json";

export type PrefsBlueprint = Record<string, [PrefsType, string]>;

/** Convert from the string names to the appropriate TS type */
export type PrefsTypeToTSType<T extends PrefsType> = T extends "Bool"
  ? boolean
  : T extends "Char" | "String"
  ? string
  : T extends "Int" | "Float"
  ? number
  : T extends "Json"
  ? Record<string, unknown>
  : 42;

type t1 = PrefsTypeToTSType<"Char">;

export declare type Prefs<BP extends PrefsBlueprint<K>> = {
  [key in keyof BP]: PrefsTypeToTSType<BP[key][0]>;
};

export const PrefsHelper: new <BP extends PrefsBlueprint>(
  prefsRoot?: string,
  prefsBlueprint?: BP
) => Prefs<BP> & {
  toJSON(): Prefs<BP>;
};
