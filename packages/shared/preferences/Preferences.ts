import EventEmitter from "events";
import { captureException } from "@sentry/react";
import equal from "deep-equal";

import { mutate, query } from "shared/graphql/apolloClient";
import { GetUserPreferences } from "shared/graphql/generated/GetUserPreferences";
import {
  UpdateUserPreferences,
  UpdateUserPreferencesVariables,
} from "shared/graphql/generated/UpdateUserPreferences";
import { config } from "shared/preferences/config";
import { LOCAL_STORAGE_KEY } from "shared/preferences/constants";
import { GET_USER_PREFERENCES, UPDATE_USER_PREFERENCES } from "shared/preferences/graphql";
import { PreferencesKey, UserPreferences } from "shared/preferences/types";

export interface Preferences {
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
class PreferencesImplementation implements Preferences {
  private authenticated: boolean = false;
  private cached: UserPreferences;
  private eventEmitter: EventEmitter;
  private initialized: boolean = false;
  private urlOverrides: { [key in PreferencesKey]?: true } = {};

  constructor() {
    this.cached = {};
    this.eventEmitter = new EventEmitter();

    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw !== null) {
        this.cached = JSON.parse(raw);
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
        const localPreferences = this.cached;

        if (!equal(localPreferences, remotePreferences)) {
          this.cached = remotePreferences;

          // Also update the copy in localStorage for next time
          this.saveLocal(remotePreferences);

          // Notify listeners of changed values
          this.eventEmitter.eventNames().forEach(eventName => {
            const key = eventName as PreferencesKey;
            if (!equal(localPreferences[key], remotePreferences[key])) {
              const value = this.get(key as PreferencesKey);
              this.eventEmitter.emit(key, value);
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
    const value = this.cached[key];
    if (value !== undefined) {
      return value;
    }

    // Fall back to explicit values from the legacy preferences system
    if (legacyKey !== null) {
      // Legacy Mozilla preferences all started with "devtools."
      if (legacyKey.startsWith("devtools.")) {
        try {
          // The legacy Mozilla preferences system stored values in localStorage with a custom prefix
          // We shouldn't use the Services.prefs API directly though,
          // because it relies on the prefs() function for configuration (and we'll be removing that)
          const legacyValue = localStorage.getItem(`Services.prefs:${legacyKey}`);
          if (legacyValue !== null) {
            // The legacy system stored values in an object, which it encoded to a string
            const { hasUserValue, userValue } = JSON.parse(legacyValue);
            if (hasUserValue) {
              return userValue;
            }
          }
        } catch (error) {
          // Ignore errors
        }
      } else {
        try {
          // Else legacy preferences were managed via useLocalStorage()
          const legacyValue = localStorage.getItem(legacyKey);
          if (legacyValue !== null) {
            // That hook stored values in localStorage as JSON string
            return JSON.parse(legacyValue);
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
      console.warn("UserPreferences updated initialization");
    }

    this.cached = {
      ...this.cached,
      [key]: value,
    };

    // Preferences cache always initializes itself from localStorage,
    // so always saved an updated copy of preferences there
    this.saveLocal(this.cached);

    this.eventEmitter.emit(key, value);

    // Authenticated users also save preferences to GraphQL so they roam between environments and devices
    if (this.authenticated) {
      await this.saveRemote({
        // The backend only requires the changed preferences to be sent
        [key]: value,
      });
    }
  }

  subscribe<Key extends PreferencesKey>(
    key: Key,
    callback: (value: (typeof config)[Key]["defaultValue"]) => void
  ): () => void {
    this.eventEmitter.on(key, callback);
    return () => {
      this.eventEmitter.off(key, callback);
    };
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

export const preferences = new PreferencesImplementation();
