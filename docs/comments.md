### Displaying comments

Comments are displayed in these components:
- `Transcribe`: left side panel with nested comments
- `VideoComments`: overlay on `Video` that shows comment markers
- `TimelineComments`: overlay on `Timeline` that shows small comment markers

All comments are loaded inside `Transcript` via GraphQL hook as flat array, and then made into a hierarchical structure representing parent-reply relation. We then use `CommentItem` to recursively render this hierarchy of comments.

For `VideoComments` and `TimelineComments`, all top-level comments are loaded, and just used as is (i.e. no need to convert to any kind of hierarchical structure as we only show comments from the top level).

A bit of special handling is required for comments that have been submitted to backend, but still haven't returned back and filled GraphQL cache with real data. These comments have a special ID that signals that they are not fully yet "real" comments. For all abovementioned componenets, we render real and these unconfirmed comments in the same way.

### New comment

Depending on what UI action triggers the start of comment creation process, some of the actions within `src/ui/actions/comments.ts` gets triggered. Each one sets a new pending comment's contextual data (for frame comments it's position on the video, for network request comments it's the network request itself,...), and adds it to the `pendingCommentsData` (`src/ui/state/comments.ts`).

### Editing/updating comments

Every comment, as it's rendered via `CommentItem`, is resposible for being able to handle its editing mode. A simple toggle controls whether the comment is purely presentation or in an edit mode (editable). A special trigger calls to GraphQL to update the data.

### Deleteing commentts

Every comment, as it's rendered via `CommentItem`, is resposible for being able to trigger its own deletion.