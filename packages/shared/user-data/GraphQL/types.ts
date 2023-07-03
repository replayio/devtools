import { config } from "shared/user-data/GraphQL/config";

type SerializablePrimitive = boolean | number | string | symbol | null | undefined;

interface SerializableArray
  extends Array<SerializablePrimitive | SerializableObject | SerializableArray> {}

interface SerializableObject
  extends Record<
    string | number | symbol,
    SerializablePrimitive | SerializableObject | SerializableArray
  > {}

export type Serializable = SerializableArray | SerializableObject | SerializablePrimitive;

export type PreferencesKey = keyof typeof config;

// This type represents information to be displayed in the User Preferences panel
// User selections are represented by the UserPreferences type below
export interface ConfigurablePreference {
  // Default value to be used if the user has not explicitly specified a preferred value
  // This value should not be persisted (so that it can be changed, without a migration, if needed)
  readonly defaultValue: Serializable;

  // Sentence form description of preference
  readonly description?: string;

  // Only display this preference to authenticated Replay users
  readonly internalOnly?: boolean;

  // Succinct preference name/label
  readonly label?: string;

  // Only present for preference that were tracked in the legacy preferences system
  readonly legacyKey: string | null;
}

export type ConfigurablePreferences = { [key: string]: ConfigurablePreference };

// Explicitly selected user preferences.
// This object will be persisted to localStorage (for all users)
// and will be persisted to GraphQL as well (for authenticated users)
export type UserPreferences = {
  [Key in PreferencesKey]?: (typeof config)[Key]["defaultValue"];
};
