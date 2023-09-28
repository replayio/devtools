import { captureException } from "@sentry/react";
import equal from "deep-equal";

import { mutate, query } from "shared/graphql/apolloClient";
import { GetUserPreferences } from "shared/graphql/generated/GetUserPreferences";
import {
  UpdateUserPreferences,
  UpdateUserPreferencesVariables,
} from "shared/graphql/generated/UpdateUserPreferences";
import { config } from "shared/user-data/GraphQL/config";
import { LOCAL_STORAGE_KEY } from "shared/user-data/GraphQL/constants";
import { GET_USER_PREFERENCES, UPDATE_USER_PREFERENCES } from "shared/user-data/GraphQL/queries";
import { PreferencesKey, UserPreferences } from "shared/user-data/GraphQL/types";

// See README.md in shared/user-data for when to use this API
export interface GraphQLService {
  initialize(authenticated: boolean): Promise<void>;
  get<Key extends PreferencesKey>(key: Key): (typeof config)[Key]["defaultValue"];
  set<Key extends PreferencesKey>(
    key: Key,
    value: (typeof config)[Key]["defaultValue"]
  ): Promise<void>;
  subscribe<Key extends PreferencesKey>(
    key: Key,
    callback: (value: (typeof config)[Key]["defaultValue"]) => void
  ): () => void;
}

// Models user preferences values
// Preferences are synchronously loaded from localStorage for all users
// For authenticated users, preferences are asynchronously fetched from GraphQL and merged with the local ones
//
// To get the current value of a preference, use get("preference-name")
// To watch for changes in a given preference, use subscribe("preference-name", callbackFunction)
// To update a preference, use set("preference-name", value)
//
// Rather than a Suspense cache, an event emitter was used to model preferences
// because better interops with imperative code (like Redux action)
class UserData implements GraphQLService {
  private authenticated: boolean = false;
  private cachedJSONData: UserPreferences;
  private cachedUserPreferences: UserPreferences;
  private initialized: boolean = false;
  private subscriberMap: Map<string, Set<Function>>;
  private urlOverrides: { [key in PreferencesKey]?: true } = {};

  constructor() {
    this.cachedJSONData = {};
    this.cachedUserPreferences = {};
    this.subscriberMap = new Map();

    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw !== null) {
        this.cachedUserPreferences = JSON.parse(raw) as any;
      }
    } catch (error) {}

    try {
      // Support URL overrides for boolean features
      const query = new URLSearchParams(window.location.search);
      const overrideString = query.get("features");
      if (overrideString) {
        const tokens = overrideString.split(",");
        tokens.forEach(token => {
          const key = token as PreferencesKey;
          const configurablePreference = config[key];
          if (typeof configurablePreference.defaultValue === "boolean") {
            this.urlOverrides[key as PreferencesKey] = true;
          }
        });
      }
    } catch (error) {}
  }

  async initialize(authenticated: boolean) {
    this.authenticated = authenticated;

    if (authenticated) {
      const { data } = await query<GetUserPreferences>({
        query: GET_USER_PREFERENCES,
      });

      const remotePreferences = data.viewer?.preferences as UserPreferences | undefined;
      if (remotePreferences) {
        const localPreferences = this.cachedUserPreferences;

        if (!equal(localPreferences, remotePreferences)) {
          const mergedPreferences = {
            ...localPreferences,
            ...remotePreferences,
          };

          this.cachedUserPreferences = mergedPreferences;

          // Also update the copy in localStorage for next time
          this.saveLocal(mergedPreferences);

          // Notify listeners of changed values
          this.subscriberMap.forEach((...args) => {
            const key = args[1] as PreferencesKey;

            if (!equal(localPreferences[key], mergedPreferences[key])) {
              const value = this.get(key as PreferencesKey);

              this.notifySubscribers(key, value);
            }
          });
        }
      }
    }

    this.initialized = true;
  }

  get<Key extends PreferencesKey>(key: Key): (typeof config)[Key]["defaultValue"] {
    const { defaultValue, legacyKey } = config[key];

    // Support URL overrides for boolean features
    const overrideValue = this.urlOverrides[key];
    if (overrideValue !== undefined) {
      return overrideValue;
    }

    // Favor explicit values from the modern preferences system
    const value = this.cachedUserPreferences[key];
    if (value !== undefined) {
      return value;
    }

    // Fall back to explicit values from the legacy preferences system
    if (legacyKey !== null) {
      // Because we use JSON.parse() when reading from localStorage,
      // we may end up creating new Objects or Arrays,
      // so it's important to also cache those values in memory.
      //
      // It's also nice to avoid overhead of reading localStorage and parsing unnecessarily.
      const cachedValue = this.cachedJSONData[key];
      if (cachedValue !== undefined) {
        return cachedValue;
      }

      // Legacy Mozilla preferences all started with "devtools."
      if (legacyKey.startsWith("devtools.")) {
        try {
          // The legacy Mozilla preferences system stored values in localStorage with a custom prefix
          // We shouldn't use the Services.prefs API directly though,
          // because it relies on the prefs() function for configuration (and we'll be removing that)
          const legacyValue = localStorage.getItem(`Services.prefs:${legacyKey}`);
          if (legacyValue !== null) {
            // The legacy system stored values in an object, which it encoded to a string
            const { hasUserValue, userValue } = JSON.parse(legacyValue) as any;
            if (hasUserValue) {
              this.cachedJSONData[key] = userValue;

              return userValue;
            }
          }
        } catch (error) {
          // Ignore errors
        }
      } else {
        try {
          // Other types of user data were managed via useLocalStorage()
          const legacyValue = localStorage.getItem(legacyKey);
          if (legacyValue !== null) {
            // That hook stored values in localStorage as JSON string
            const parsedValue = JSON.parse(legacyValue) as any;

            this.cachedJSONData[key] = parsedValue;

            return parsedValue;
          }
        } catch (error) {
          // Ignore errors
        }
      }
    }

    // Fall back to the default value
    return defaultValue;
  }

  async set<Key extends PreferencesKey>(
    key: Key,
    value: (typeof config)[Key]["defaultValue"]
  ): Promise<void> {
    if (!this.initialized) {
      console.warn("UserPreferences should not be updated before initialization");
    }

    if (equal(value, this.get(key))) {
      return;
    }

    this.cachedUserPreferences = {
      ...this.cachedUserPreferences,
      [key]: value,
    };

    // Preferences cache always initializes itself from localStorage,
    // so always saved an updated copy of preferences there
    this.saveLocal(this.cachedUserPreferences);

    this.notifySubscribers(key, value);

    // Authenticated users also save preferences to GraphQL so they roam between environments and devices
    if (this.authenticated) {
      await this.saveRemote({
        // The backend only requires the changed preferences to be sent
        [key]: value,
      });
    }
  }

  async toggle<Key extends PreferencesKey>(key: Key) {
    const value = this.get(key);
    return this.set(key, !value);
  }

  subscribe<Key extends PreferencesKey>(
    key: Key,
    callback: (value: (typeof config)[Key]["defaultValue"]) => void
  ): () => void {
    let set = this.subscriberMap.get(key);
    if (set) {
      set.add(callback);
    } else {
      set = new Set([callback]);
      this.subscriberMap.set(key, set);
    }

    return () => {
      set!.delete(callback);

      if (set!.size === 0) {
        this.subscriberMap.delete(key);
      }
    };
  }

  private notifySubscribers<Key extends PreferencesKey>(
    key: Key,
    value: (typeof config)[Key]["defaultValue"]
  ) {
    const set = this.subscriberMap.get(key);
    if (set) {
      set.forEach(callback => {
        callback(value);
      });
    }
  }

  private saveLocal(userPreferences: UserPreferences) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userPreferences));
  }

  private async saveRemote(userPreferences: UserPreferences) {
    try {
      await mutate<UpdateUserPreferences, UpdateUserPreferencesVariables>({
        mutation: UPDATE_USER_PREFERENCES,
        variables: {
          preferences: userPreferences,
        },
      });
    } catch (error) {
      captureException(new Error().stack, { extra: { error, preferences: userPreferences } });
    }
  }
}

export const userData = new UserData();
