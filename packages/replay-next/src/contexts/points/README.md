A "point" refers to two concepts: a "breakpoint" and a "log point" (sometimes called a "print statement"). Like comments, points are visible to all users who have access to a recording. For public recordings, this includes unauthenticated users as well. Also like comments, points are only editable (or deletable) by the user who creates them. Unlike comments, points can be enabled/disabled on a per-user basis (locally/not shared).

Replay currently only allows on Point per user + recording + source location. This requirement could change though, so Points have a unique "key" that is not related to those things.

Points data is split into two types of objects:

1. `Point`
   - Location (recording id, source/line/column)
   - Editable "content" (including content, conditional, badge)
   - Stored in React component state (for pending changes), IndexedDB, and GraphQL (for authenticated users)
   - Shared with all users who can view the recording
1. `PointBehavior`
   - Controls local behavior of a Point (should it break? should it log?)
   - Stored in IndexedDB between sessions
   - Not shared with other users

Because Points exist in multiple places, the following de-duping rules apply:

1. IndexedDB takes precedence over GraphQL.
1. Component state takes precedence over IndexedDB within the Source Viewer (and log point panel)
   - The source viewer should always show pending edit states.

In order to manage this complexity, points (and behaviors) are stored in three contexts:

1. `PointsContext`
   - Loads points from GraphQL during initialization
   - Loads points from IndexedDB during initialization
   - De-dupes and merges points into memoized array shared via context
   - Offers add/edit/delete points API for saving points and behaviors to IndexedDB and GraphQL
1. `SourceViewerPointsContext`
   - Uses React state to store pending changes to points
   - De-dupes and merges PointsContext points and React state points into memoized array shared via context
   - Provides edit/discard/save API for pending changes
1. `ConsolePanelContext`
   - Uses React deferred hook to update points (and behaviors) at transition priority for Suspense purposes
   - Shares deferred points via context for Console log point renderers
