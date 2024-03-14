import { ContentType, SourceId } from "@replayio/protocol";

import { MockReplayClientInterface, createMockReplayClient } from "replay-next/src/utils/testing";
import type { hookNameCache as HookNameCache } from "ui/components/SecondaryToolbox/react-devtools/suspense/hookNameCache";

// Source code, locations, and fallback names used below in this test have been copied from actual Replays.
// Source code snippets have been modified slightly (to reduce file size) but the key lines are unchanged.

describe("hookNameCache", () => {
  function mockSourceCache(sourceCode: string) {
    mockClient.streamSourceContents.mockImplementation(
      (
        sourceId: SourceId,
        onSourceContentsInfo: ({
          codeUnitCount,
          contentType,
          lineCount,
          sourceId,
        }: {
          codeUnitCount: number;
          contentType: ContentType;
          lineCount: number;
          sourceId: SourceId;
        }) => void,
        onSourceContentsChunk: ({ chunk, sourceId }: { chunk: string; sourceId: SourceId }) => void
      ) => {
        onSourceContentsInfo({
          codeUnitCount: 0,
          contentType: "text/javascript",
          lineCount: sourceCode.split("\n").length,
          sourceId,
        });
        onSourceContentsChunk({ chunk: sourceCode, sourceId });
        return Promise.resolve();
      }
    );
  }

  let hookNameCache: typeof HookNameCache;
  let mockClient: MockReplayClientInterface;

  beforeEach(() => {
    hookNameCache =
      require("ui/components/SecondaryToolbox/react-devtools/suspense/hookNameCache").hookNameCache;
    mockClient = createMockReplayClient();
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });

  it("should skip loading source contents for valid hook names", async () => {
    await expect(
      await hookNameCache.readAsync(
        mockClient,
        { sourceId: "fake", line: 0, column: 0 },
        "usePrevious"
      )
    ).toBe("Previous");

    await expect(
      await hookNameCache.readAsync(
        mockClient,
        { sourceId: "fake", line: 0, column: 0 },
        "useRouter"
      )
    ).toBe("Router");
  });

  it("should find hook names for direct function calls", async () => {
    mockSourceCache(`
    export function TeamButton() {
      const router = useRouter();
      const updateDefaultWorkspace = useUpdateDefaultWorkspace();

      return null;
    }`);

    await expect(
      await hookNameCache.readAsync(
        mockClient,
        { sourceId: "fake", line: 3, column: 17 },
        ".useRouter"
      )
    ).toBe("Router");

    await expect(
      await hookNameCache.readAsync(mockClient, { sourceId: "fake", line: 4, column: 33 }, "y")
    ).toBe("UpdateDefaultWorkspace");
  });

  it("should find hook names for * imported function calls", async () => {
    mockSourceCache(`
function Teams() {
  const { workspaces, loading } = hooks.useGetNonPendingWorkspaces();

  return null;
}`);

    await expect(
      await hookNameCache.readAsync(
        mockClient,
        { sourceId: "fake", line: 3, column: 34 },
        '".S [as useGetNonPendingWorkspaces]"'
      )
    ).toBe("GetNonPendingWorkspaces");
  });

  it("should recover from bad column indices when the hook name is still inferable", async () => {
    mockSourceCache(`
export function useMutation() {
  var client = useApolloClient(options === null || options === void 0 ? void 0 : options.client);
  //`);

    await expect(
      await hookNameCache.readAsync(mockClient, { sourceId: "fake", line: 3, column: 43 }, "s")
    ).toBe("ApolloClient");
  });

  it("should gracefully degrade unsupported formats (graphql template string)", async () => {
    mockSourceCache(`
export function useUpdateDefaultWorkspace() {
  const [updateUserSetting, { error }] = useMutation<
    UpdateUserDefaultWorkspaceVariables
  >(
    gql\`
      mutation UpdateUserDefaultWorkspace($workspaceId: ID) {}
    \`,
    {}
  );

  return null;
}`);

    // Hook location points to "gql" instead of `useMutation`
    // and the rest of the line doesn't contain a hook-like function call
    await expect(
      await hookNameCache.readAsync(mockClient, { sourceId: "fake", line: 6, column: 4 }, "c")
    ).toBe(undefined);
  });

  it("should gracefully degrade unsupported formats (inline anonymous function)", async () => {
    mockSourceCache(`
l = function() {
  let e = (0, r.useContext)(eA.i),
    { teamId: t } = (0, r.useContext)(N),
    s = (0, e3.Z)(),
    { value: n = ts } = (0, ez.sS)(e4, e, s?.token??null, t);
  return n
}(),`);

    await expect(
      await hookNameCache.readAsync(
        mockClient,
        { sourceId: "fake", line: 8, column: 2 },
        "Anonymous"
      )
    ).toBe(undefined);
  });
});
