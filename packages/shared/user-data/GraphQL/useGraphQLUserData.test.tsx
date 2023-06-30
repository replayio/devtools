import type { FunctionComponent } from "react";

import type { PreferencesKey } from "shared/user-data/GraphQL/types";

describe("useGraphQLUserData", () => {
  let mutateGraphQL: jest.Mock;
  let lastRenderedValue: any;
  let queryGraphQL: jest.Mock;
  let userData: typeof import("shared/user-data/GraphQL/UserData").userData;
  let useGraphQLUserData: typeof import("shared/user-data/GraphQL/useGraphQLUserData").useGraphQLUserData;
  let Component: FunctionComponent<{ preferencesKey: PreferencesKey }>;

  async function mount(key: PreferencesKey) {
    const { createRoot } = require("react-dom/client");

    const container = document.createElement("div");
    const root = createRoot(container);
    root.render(<Component preferencesKey={key} />);
  }

  beforeEach(() => {
    // @ts-ignore
    global.IS_REACT_ACT_ENVIRONMENT = true;

    lastRenderedValue = null;

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

    userData = require("shared/user-data/GraphQL/UserData").userData;
    useGraphQLUserData = require("shared/user-data/GraphQL/useGraphQLUserData").useGraphQLUserData;

    const { useEffect } = require("react");

    Component = ({ preferencesKey }: { preferencesKey: PreferencesKey }) => {
      const [value] = useGraphQLUserData(preferencesKey);

      useEffect(() => {
        lastRenderedValue = value;
      });

      return value as any;
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });

  it("should return the current user preference", async () => {
    const { act } = require("react-dom/test-utils");

    act(() => {
      mount("layout_defaultViewMode");
    });

    expect(lastRenderedValue).toBe("non-dev");

    await userData.initialize(false);

    act(() => {
      userData.set("layout_defaultViewMode", "dev");
    });

    expect(lastRenderedValue).toBe("dev");
  });

  it("should trigger a re-render when a preference changes", async () => {
    const { act } = require("react-dom/test-utils");

    act(() => {
      mount("inspector_inactiveCssEnabled");
    });

    expect(lastRenderedValue).toBe(false);

    queryGraphQL.mockImplementation(() =>
      Promise.resolve({
        data: {
          viewer: {
            preferences: {
              inspector_inactiveCssEnabled: true,
            },
          },
        },
      })
    );

    await act(async () => {
      await userData.initialize(true);
    });

    expect(lastRenderedValue).toBe(true);
  });
});
