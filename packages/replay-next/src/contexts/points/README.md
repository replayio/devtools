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

1. IndexedDB and GraphQL points are merged (de-duping on key)
1. Component state takes precedence within the Source Viewer (and log point panel)
   - The source viewer should always show pending text edits

In order to manage this complexity, the `PointsContext` exports separate sets of points for components that show edit controls (like the Source viewer) and components that may suspend based on points content (like the Console).
