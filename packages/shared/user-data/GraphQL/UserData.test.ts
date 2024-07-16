import { ConsoleEventFilterPreferences, config } from "shared/user-data/GraphQL/config";
import { LOCAL_STORAGE_KEY } from "shared/user-data/GraphQL/constants";
import { PreferencesKey } from "shared/user-data/GraphQL/types";

describe("UserData", () => {
  let localStorageMock: {
    clear: jest.Mock;
    getItem: jest.Mock;
    length: number;
    key: jest.Mock;
    removeItem: jest.Mock;
    setItem: jest.Mock;
  };
  let mutateGraphQL: jest.Mock;
  let queryGraphQL: jest.Mock;

  beforeEach(() => {
    let data: Record<string, string> = {};

    localStorageMock = {
      clear: jest.fn(),
      getItem: jest.fn().mockImplementation((key: PreferencesKey) => {
        return data[key] ?? null;
      }),
      length: 0,
      key: jest.fn(),
      removeItem: jest.fn(),
      setItem: jest.fn().mockImplementation((key: PreferencesKey, value: string) => {
        data[key] = value;
      }),
    };

    Storage.prototype.getItem = localStorageMock.getItem;
    Storage.prototype.setItem = localStorageMock.setItem;

    mutateGraphQL = jest.fn();
    queryGraphQL = jest.fn().mockImplementation(() =>
      Promise.resolve({
        data: {
          viewer: {
            preferences: {},
          },
        },
      })
    );

    jest.mock("shared/graphql/apolloClient", () => ({
      mutate: mutateGraphQL,
      query: queryGraphQL,
    }));
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });

  it("should return default values for preferences not in localStorage or GraphQL", () => {
    const userData = require("./UserData").userData;

    expect(userData.get("feature_commentAttachments")).toBe(false);
    expect(userData.get("layout_logpointsPanelExpanded")).toBe(true);
  });

  it("should support URL overrides for boolean preferences", () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      switch (key) {
        case LOCAL_STORAGE_KEY:
          return JSON.stringify({
            layout_sidePanelCollapsed: false,
          });
        default:
          return null;
      }
    });

    window.location.search = "?features=feature_commentAttachments,layout_sidePanelCollapsed";

    const userData = require("./UserData").userData;

    // false in localStorage but true in URL
    expect(userData.get("layout_sidePanelCollapsed")).toBe(true);

    // null in localStorage, defaults to false, but true in URL
    expect(userData.get("feature_commentAttachments")).toBe(true);
  });

  it("should read/write values to localStorage", async () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      switch (key) {
        case LOCAL_STORAGE_KEY:
          return JSON.stringify({
            console_showFiltersByDefault: true,
          });
        default:
          return null;
      }
    });

    const userData = require("./UserData").userData;

    // Defaults to false, but set to true in localStorage
    expect(userData.get("console_showFiltersByDefault")).toBe(true);

    // Default to false, null in localStorage
    expect(userData.get("feature_showPassport")).toBe(false);

    await userData.initialize(false);

    // Unauthenticated user data should only be written to localStorage
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
    expect(mutateGraphQL).not.toHaveBeenCalled();
    userData.set("feature_showPassport", true);
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
    expect(mutateGraphQL).not.toHaveBeenCalled();
  });

  it("should warn if a preference is modified before initialization", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    const userData = require("./UserData").userData;
    userData.set("feature_protocolTimeline", true);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      "UserPreferences should not be updated before initialization"
    );
  });

  it("should read/write values to GraphQL for authenticated users", async () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      switch (key) {
        case LOCAL_STORAGE_KEY:
          return JSON.stringify({
            debugger_frameworkGroupingOn: false,
            console_showFiltersByDefault: true,
          });
        default:
          return null;
      }
    });

    queryGraphQL.mockImplementation(() =>
      Promise.resolve({
        data: {
          viewer: {
            preferences: {
              console_showFiltersByDefault: false,
              layout_logpointsPanelExpanded: false,
            },
          },
        },
      })
    );

    const userData = require("./UserData").userData;

    expect(userData.get("debugger_frameworkGroupingOn")).toBe(false);
    expect(userData.get("console_showFiltersByDefault")).toBe(true);
    expect(userData.get("layout_logpointsPanelExpanded")).toBe(true);

    await userData.initialize(true);

    // Remote preferences are synced to localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);

    // GraphQL should be called after initialization and preferences should be merged with localStorage
    expect(userData.get("debugger_frameworkGroupingOn")).toBe(false);
    expect(userData.get("console_showFiltersByDefault")).toBe(false);
    expect(userData.get("layout_logpointsPanelExpanded")).toBe(false);

    // Updated values should be written to both localStorage and GraphQL
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
    expect(mutateGraphQL).not.toHaveBeenCalled();
    userData.set("layout_logpointsPanelExpanded", true);
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(2);
    expect(mutateGraphQL).toHaveBeenCalledTimes(1);
  });

  describe("subscriptions", () => {
    it("should be triggered when a new value is set", () => {
      const userData = require("./UserData").userData;

      const subscription = jest.fn();
      userData.subscribe("layout_inspectorBoxModelOpen", subscription);

      expect(subscription).not.toHaveBeenCalled();

      userData.set("layout_inspectorBoxModelOpen", false);

      expect(subscription).toHaveBeenCalledTimes(1);
      expect(subscription).toHaveBeenCalledWith(false);
    });

    it("should be triggered when a new value is synced from GraphQL", async () => {
      queryGraphQL.mockImplementation(() =>
        Promise.resolve({
          data: {
            viewer: {
              preferences: {
                layout_defaultViewMode: "dev",
              },
            },
          },
        })
      );

      const userData = require("./UserData").userData;

      const subscription = jest.fn();
      userData.subscribe("layout_defaultViewMode", subscription);

      expect(subscription).not.toHaveBeenCalled();

      await userData.initialize(true);

      expect(subscription).toHaveBeenCalledTimes(1);
      expect(subscription).toHaveBeenCalledWith("dev");
    });

    it("should ignore no-op updates", () => {
      const userData = require("./UserData").userData;

      const subscription = jest.fn();
      userData.subscribe("layout_inspectorBoxModelOpen", subscription);

      expect(subscription).not.toHaveBeenCalled();

      userData.set("layout_inspectorBoxModelOpen", false);
      expect(subscription).toHaveBeenCalledTimes(1);
      expect(subscription).toHaveBeenCalledWith(false);

      userData.set("layout_inspectorBoxModelOpen", false);
      expect(subscription).toHaveBeenCalledTimes(1);

      userData.set("layout_inspectorBoxModelOpen", true);
      expect(subscription).toHaveBeenCalledTimes(2);
      expect(subscription).toHaveBeenCalledWith(true);
    });
  });

  describe("legacy preferences", () => {
    it("should be migrated from useLocalStorage hook", () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        switch (key) {
          case config.layout_sidePanelCollapsed.legacyKey:
            return JSON.stringify(true);
          default:
            return null;
        }
      });

      const userData = require("./UserData").userData;

      expect(userData.get("layout_sidePanelCollapsed")).toBe(true);
    });

    it("should migrated from Mozilla preferences service", () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        switch (key) {
          case `Services.prefs:${config.protocol_repaintEvaluations.legacyKey}`:
            return JSON.stringify({
              hasUserValue: true,
              userValue: true,
            });
          default:
            return null;
        }
      });

      const userData = require("./UserData").userData;

      expect(userData.get("protocol_repaintEvaluations")).toBe(true);
    });

    it("should memoize parsed legacy values", () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        switch (key) {
          case config.console_eventFilters.legacyKey:
            return JSON.stringify({
              keyboard: true,
              mouse: true,
              navigation: true,
            } as ConsoleEventFilterPreferences);
          default:
            return null;
        }
      });

      const userData = require("./UserData").userData;

      const value1 = userData.get("console_eventFilters");
      expect(value1).toEqual({
        keyboard: true,
        mouse: true,
        navigation: true,
      });

      const value2 = userData.get("console_eventFilters");
      expect(value1).toBe(value2);
    });
  });
});
