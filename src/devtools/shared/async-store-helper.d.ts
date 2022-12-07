import { PrefsType, PrefsTypeToTSType } from "devtools/client/shared/prefs";

export type AsyncPrefsBlueprint = Record<string, [PrefsType, string, any]>;

export declare type AsyncPrefs<BP extends AsyncPrefsBlueprint<K>> = {
  [key in keyof BP]: PrefsTypeToTSType<BP[key][0], BP[key][2]>;
};

export function asyncStoreHelper<BP extends AsyncPrefsBlueprint>(
  prefsRoot?: string,
  prefsBlueprint?: BP
): AsyncPrefs<BP> & {
  toJSON(): AsyncPrefs<BP>;
};
