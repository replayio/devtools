/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*- */
/* vim: set ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* globals localStorage, window, document, NodeFilter */

// Some constants from nsIPrefBranch.idl.
const PREF_INVALID = 0;
const PREF_STRING = 32;
const PREF_INT = 64;
const PREF_BOOL = 128;
const NS_PREFBRANCH_PREFCHANGE_TOPIC_ID = "nsPref:changed";

// We prefix all our local storage items with this.
const PREFIX = "Services.prefs:";

type PREF_VALUES = number | string | boolean;

type $FixTypeLater = any;

type ObserverFunction = (prefBranch: PrefBranch, topic: string, relativeName: string) => void;

type TempObserver =
  | {
      observe: ObserverFunction;
    }
  | ObserverFunction;

/**
 * Create a new preference branch.  This object conforms largely to
 * nsIPrefBranch and nsIPrefService, though it only implements the
 * subset needed by devtools.  A preference branch can hold child
 * preferences while also holding a preference value itself.
 *
 * @param {PrefBranch} parent the parent branch, or null for the root
 *        branch.
 * @param {String} name the base name of this branch
 * @param {String} fullName the fully-qualified name of this branch
 */
class PrefBranch {
  private _parent: PrefBranch | null;
  private _name: string;
  private _fullName: string;
  private _observers: Record<string, TempObserver[]> = {};
  private _children: Record<string, PrefBranch> = {};

  private _defaultValue: PREF_VALUES | null = null;
  private _hasUserValue = false;
  private _userValue: PREF_VALUES | null = null;
  private _type: number = PREF_INVALID;
  constructor(parent: PrefBranch | null, name: string, fullName: string) {
    this._parent = parent;
    this._name = name;
    this._fullName = fullName;
  }
  PREF_INVALID = PREF_INVALID;
  PREF_STRING = PREF_STRING;
  PREF_INT = PREF_INT;
  PREF_BOOL = PREF_BOOL;

  /** @see nsIPrefBranch.root.  */
  get root() {
    return this._fullName;
  }

  /** @see nsIPrefBranch.getPrefType.  */
  getPrefType = (prefName: string) => {
    return this._findPref(prefName)._type;
  };

  /** @see nsIPrefBranch.getBoolPref.  */
  getBoolPref = (prefName: string, defaultValue?: PREF_VALUES): boolean => {
    try {
      let thePref = this._findPref(prefName);
      if (thePref._type !== PREF_BOOL) {
        throw new Error(`${prefName} does not have bool type`);
      }
      return thePref._get() as boolean;
    } catch (e) {
      if (typeof defaultValue !== "undefined") {
        return defaultValue as boolean;
      }
      throw e;
    }
  };

  /** @see nsIPrefBranch.setBoolPref.  */
  setBoolPref = (prefName: string, value: boolean) => {
    if (typeof value !== "boolean") {
      throw new Error("non-bool passed to setBoolPref");
    }
    let thePref = this._findOrCreatePref(prefName, value, true, value);
    if (thePref._type !== PREF_BOOL) {
      throw new Error(`${prefName} does not have bool type`);
    }
    thePref._set(value);
  };

  /** @see nsIPrefBranch.getCharPref.  */
  getCharPref = (prefName: string, defaultValue?: PREF_VALUES): string => {
    try {
      let thePref = this._findPref(prefName);
      if (thePref._type !== PREF_STRING) {
        throw new Error(`${prefName} does not have string type`);
      }
      return thePref._get() as string;
    } catch (e) {
      if (typeof defaultValue !== "undefined") {
        return defaultValue as string;
      }
      throw e;
    }
  };

  /** @see nsIPrefBranch.getStringPref.  */
  getStringPref = (prefName: string, defaultValue?: string) => {
    return this.getCharPref(prefName, defaultValue);
  };

  /** @see nsIPrefBranch.setCharPref.  */
  setCharPref = (prefName: string, value: string) => {
    if (typeof value !== "string") {
      throw new Error("non-string passed to setCharPref");
    }
    let thePref = this._findOrCreatePref(prefName, value, true, value);
    if (thePref._type !== PREF_STRING) {
      throw new Error(`${prefName} does not have string type`);
    }
    thePref._set(value);
  };

  /** @see nsIPrefBranch.setStringPref.  */
  setStringPref = (prefName: string, value: string) => {
    return this.setCharPref(prefName, value);
  };

  /** @see nsIPrefBranch.getIntPref.  */
  getIntPref = (prefName: string, defaultValue?: number): number => {
    try {
      let thePref = this._findPref(prefName);
      if (thePref._type !== PREF_INT) {
        throw new Error(`${prefName} does not have int type`);
      }
      return thePref._get() as number;
    } catch (e) {
      if (typeof defaultValue !== "undefined") {
        return defaultValue;
      }
      throw e;
    }
  };

  /** @see nsIPrefBranch.setIntPref.  */
  setIntPref = (prefName: string, value: number) => {
    if (typeof value !== "number") {
      throw new Error("non-number passed to setIntPref");
    }
    let thePref = this._findOrCreatePref(prefName, value, true, value);
    if (thePref._type !== PREF_INT) {
      throw new Error(`${prefName} does not have int type`);
    }
    thePref._set(value);
  };

  /** @see nsIPrefBranch.clearUserPref */
  clearUserPref = (prefName: string) => {
    let thePref = this._findPref(prefName);
    thePref._clearUserValue();
  };

  /** @see nsIPrefBranch.prefHasUserValue */
  prefHasUserValue = (prefName: string) => {
    let thePref = this._findPref(prefName);
    return thePref._hasUserValue;
  };

  /** @see nsIPrefBranch.addObserver */
  addObserver = (domain: string, observer: $FixTypeLater, holdWeak: boolean) => {
    if (holdWeak) {
      throw new Error("shim prefs only supports strong observers");
    }

    if (!(domain in this._observers)) {
      this._observers[domain] = [];
    }
    this._observers[domain].push(observer);
  };

  /** @see nsIPrefBranch.removeObserver */
  removeObserver = (domain: string, observer: $FixTypeLater) => {
    if (!(domain in this._observers)) {
      return;
    }
    let index = this._observers[domain].indexOf(observer);
    if (index >= 0) {
      this._observers[domain].splice(index, 1);
    }
  };

  /** @see nsIPrefService.getBranch */
  getBranch = (prefRoot: string) => {
    if (!prefRoot) {
      return this;
    }
    if (prefRoot.endsWith(".")) {
      prefRoot = prefRoot.slice(0, -1);
    }
    // This is a bit weird since it could erroneously return a pref,
    // not a pref branch.
    return this._findPref(prefRoot);
  };

  /**
   * Return this preference's current value.
   *
   * @return {Any} The current value of this preference.  This may
   *         return a string, a number, or a boolean depending on the
   *         preference's type.
   */
  _get = () => {
    if (this._hasUserValue) {
      return this._userValue;
    }
    return this._defaultValue;
  };

  /**
   * Set the preference's value.  The new value is assumed to be a
   * user value.  After setting the value, this function emits a
   * change notification.
   *
   * @param {Any} value the new value
   */
  _set = (value: PREF_VALUES) => {
    if (!this._hasUserValue || value !== this._userValue) {
      this._userValue = value;
      this._hasUserValue = true;
      this._saveAndNotify();
    }
  };

  /**
   * Set the default value for this preference, and emit a
   * notification if this results in a visible change.
   *
   * @param {Any} value the new default value
   */
  _setDefault = (value: PREF_VALUES) => {
    if (this._defaultValue !== value) {
      this._defaultValue = value;
      if (!this._hasUserValue) {
        this._saveAndNotify();
      }
    }
  };

  /**
   * If this preference has a user value, clear it.  If a change was
   * made, emit a change notification.
   */
  _clearUserValue = () => {
    if (this._hasUserValue) {
      this._userValue = null;
      this._hasUserValue = false;
      this._saveAndNotify();
    }
  };

  /**
   * Helper function to write the preference's value to local storage
   * and then emit a change notification.
   */
  _saveAndNotify = () => {
    let store = {
      type: this._type,
      defaultValue: this._defaultValue,
      hasUserValue: this._hasUserValue,
      userValue: this._userValue,
    };

    localStorage.setItem(PREFIX + this._fullName, JSON.stringify(store));
    this._parent?._notify(this._name);
  };

  /**
   * Change this preference's value without writing it back to local
   * storage.  This is used to handle changes to local storage that
   * were made externally.
   *
   * @param {Number} type one of the PREF_* values
   * @param {Any} userValue the user value to use if the pref does not exist
   * @param {Any} defaultValue the default value to use if the pref
   *        does not exist
   * @param {Boolean} hasUserValue if a new pref is created, whether
   *        the default value is also a user value
   * @param {Object} store the new value of the preference.  It should
   *        be of the form {type, defaultValue, hasUserValue, userValue};
   *        where |type| is one of the PREF_* type constants; |defaultValue|
   *        and |userValue| are the default and user values, respectively;
   *        and |hasUserValue| is a boolean indicating whether the user value
   *        is valid
   */
  _storageUpdated = (
    type: number,
    userValue: PREF_VALUES,
    hasUserValue: boolean,
    defaultValue: PREF_VALUES
  ) => {
    this._type = type;
    this._defaultValue = defaultValue;
    this._hasUserValue = hasUserValue;
    this._userValue = userValue;
    // There's no need to write this back to local storage, since it
    // came from there; and this avoids infinite event loops.
    this._parent?._notify(this._name);
  };

  /**
   * Helper function to find either a Preference or PrefBranch object
   * given its name.  If the name is not found, throws an exception.
   *
   * @param {String} prefName the fully-qualified preference name
   * @return {Object} Either a Preference or PrefBranch object
   */
  _findPref = (prefName: string) => {
    let branchNames = prefName.split(".");
    let branch: PrefBranch = this;

    for (let branchName of branchNames) {
      branch = branch._children[branchName];
      if (!branch) {
        throw new Error(`could not find pref branch ${prefName}`);
      }
    }

    return branch;
  };

  /**
   * Helper function to notify any observers when a preference has
   * changed.  This will also notify the parent branch for further
   * reporting.
   *
   * @param {String} relativeName the name of the updated pref,
   *        relative to this branch
   */
  _notify = (relativeName: string) => {
    for (let domain in this._observers) {
      if (
        relativeName === domain ||
        domain === "" ||
        (domain.endsWith(".") && relativeName.startsWith(domain))
      ) {
        // Allow mutation while walking.
        let localList = this._observers[domain].slice();
        for (let observer of localList) {
          try {
            if ("observe" in observer) {
              observer.observe(this, NS_PREFBRANCH_PREFCHANGE_TOPIC_ID, relativeName);
            } else {
              // Function-style observer -- these aren't mentioned in
              // the IDL, but they're accepted and devtools uses them.
              observer(this, NS_PREFBRANCH_PREFCHANGE_TOPIC_ID, relativeName);
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
    }

    if (this._parent) {
      this._parent._notify(`${this._name}.${relativeName}`);
    }
  };

  /**
   * Helper function to create a branch given an array of branch names
   * representing the path of the new branch.
   *
   * @param {Array} branchList an array of strings, one per component
   *        of the branch to be created
   * @return {PrefBranch} the new branch
   */
  _createBranch = (branchList: string[]) => {
    let parent: PrefBranch = this;
    for (let branch of branchList) {
      if (!parent._children[branch]) {
        let isParentRoot = !parent._parent;
        let branchName = (isParentRoot ? "" : `${parent.root}.`) + branch;
        parent._children[branch] = new PrefBranch(parent, branch, branchName);
      }
      parent = parent._children[branch];
    }
    return parent;
  };

  /**
   * Create a new preference.  The new preference is assumed to be in
   * local storage already, and the new value is taken from there.
   *
   * @param {String} keyName the full-qualified name of the preference.
   *        This is also the name of the key in local storage.
   * @param {Any} userValue the user value to use if the pref does not exist
   * @param {Boolean} hasUserValue if a new pref is created, whether
   *        the default value is also a user value
   * @param {Any} defaultValue the default value to use if the pref
   *        does not exist
   * @param {Boolean} init if true, then this call is initialization
   *        from local storage and should override the default prefs
   */
  _findOrCreatePref = (
    keyName: string,
    userValue: PREF_VALUES,
    hasUserValue: boolean,
    defaultValue: PREF_VALUES,
    init = false
  ) => {
    let branch = this._createBranch(keyName.split("."));
    if (hasUserValue && typeof userValue !== typeof defaultValue) {
      throw new Error(`inconsistent values when creating ${keyName}`);
    }

    let type;
    switch (typeof defaultValue) {
      case "boolean":
        type = PREF_BOOL;
        break;
      case "number":
        type = PREF_INT;
        break;
      case "string":
        type = PREF_STRING;
        break;
      default:
        throw new Error(`unhandled argument type: ${typeof defaultValue}`);
    }

    if (init || branch._type === PREF_INVALID) {
      branch._storageUpdated(type, userValue, hasUserValue, defaultValue);
    } else if (branch._type !== type) {
      throw new Error(`attempt to change type of pref ${keyName}`);
    }

    return branch;
  };

  getKeyName = (keyName: string) => {
    if (keyName.startsWith(PREFIX)) {
      return keyName.slice(PREFIX.length);
    }

    return keyName;
  };

  /**
   * Helper function that is called when local storage changes.  This
   * updates the preferences and notifies pref observers as needed.
   *
   * @param {StorageEvent} event the event representing the local
   *        storage change
   */
  _onStorageChange = (event: StorageEvent) => {
    if (event.storageArea !== localStorage || !event.key) {
      return;
    }

    const key = this.getKeyName(event.key);

    if (!key.startsWith(PREFIX)) {
      return;
    }

    // Ignore delete events.  Not clear what's correct.
    if (key === null || event.newValue === null) {
      return;
    }

    let { type, userValue, hasUserValue, defaultValue } = JSON.parse(event.newValue);
    if (event.oldValue === null) {
      this._findOrCreatePref(key, userValue, hasUserValue, defaultValue);
    } else {
      let thePref = this._findPref(key);
      thePref._storageUpdated(type, userValue, hasUserValue, defaultValue);
    }
  };

  /**
   * Helper function to initialize the root PrefBranch.
   */
  _initializeRoot = () => {
    if (typeof window === "undefined") {
      return;
    }

    // Read the prefs from local storage and create the local
    // representations.
    for (let i = 0; i < localStorage.length; ++i) {
      let keyName = localStorage.key(i);
      if (keyName?.startsWith(PREFIX)) {
        let { userValue, hasUserValue, defaultValue } = JSON.parse(localStorage.getItem(keyName)!);
        this._findOrCreatePref(
          keyName.slice(PREFIX.length),
          userValue,
          hasUserValue,
          defaultValue,
          true
        );
      }
    }

    this._onStorageChange = this._onStorageChange.bind(this);
    window.addEventListener("storage", this._onStorageChange);
  };
}

interface ServicesObj {
  _prefs: PrefBranch | null;
  prefs: PrefBranch;
  appinfo: {
    OS: "Linux" | "WINNT" | "Darwin" | "Unknown";
    name: string;
    version: string;
    is64Bit: boolean;
  };
}

const Services: ServicesObj = {
  _prefs: null,

  /**
   * An implementation of nsIPrefService that is based on local
   * storage.  Only the subset of nsIPrefService that is actually used
   * by devtools is implemented here.  This is lazily instantiated so
   * that the tests have a chance to disable the loading of default
   * prefs.
   */
  get prefs() {
    if (!this._prefs) {
      this._prefs = new PrefBranch(null, "", "");
      this._prefs._initializeRoot();
    }
    return this._prefs;
  },

  /**
   * An implementation of Services.appinfo that holds just the
   * properties needed by devtools.
   */
  appinfo: {
    get OS() {
      if (typeof window !== "undefined") {
        const os = window.navigator.userAgent;
        if (os) {
          if (os.includes("Linux")) {
            return "Linux";
          } else if (os.includes("Windows")) {
            return "WINNT";
          } else if (os.includes("Mac")) {
            return "Darwin";
          }
        }
      }
      return "Unknown";
    },

    // It's fine for this to be an approximation.
    get name() {
      return window.navigator.userAgent;
    },

    // It's fine for this to be an approximation.
    get version() {
      return window.navigator.appVersion;
    },

    // This is only used by telemetry, which is disabled for the
    // content case.  So, being totally wrong is ok.
    get is64Bit() {
      return true;
    },
  },
};

/**
 * Create a new preference.  This is used during startup (see
 * devtools/client/preferences/devtools.js) to install the
 * default preferences.
 *
 * @param {String} name the name of the preference
 * @param {Any} value the default value of the preference
 */
export function pref(name: string, value: PREF_VALUES) {
  let thePref = Services.prefs._findOrCreatePref(name, value, true, value);
  thePref._setDefault(value);
}

export default Services;
