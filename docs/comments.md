### Displaying comments

All comments are loaded inside `Transcript` via GraphQL hook as flat array, and then made into a hierarchical structure representing parent-reply relation. We then use `CommentItem` to recursively render this hierarchy of comments.

### New comment

Depending on what UI action triggers the start of comment creation process, some of the actions within `src/ui/actions/comments.ts` gets triggered. Each one sets a new pending comment's contextual data (for frame comments it's position on the video, for network request comments it's the network request itself,...), and adds it to the `pendingCommentsData` (`src/ui/state/comments.ts`).

### Editing/updating comments

Every comment, as it's rendered via `CommentItem`, is resposible for being able to handle its editing mode. A simple toggle controls whether the comment is purely presentation or in an edit mode (editable). A special trigger calls to GraphQL to update the data.

### Deleteing commentts

Every comment, as it's rendered via `CommentItem`, is resposible for being able to trigger its own deletion.