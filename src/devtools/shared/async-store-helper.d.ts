import { Prefs, PrefsBlueprint } from "devtools/client/shared/prefs";

export function asyncStoreHelper<BP extends PrefsBlueprint>(
  prefsRoot?: string,
  prefsBlueprint?: BP
): Prefs<BP> & {
  toJSON(): Prefs<BP>;
};
