# Messages Reducer Notes

## Actions Handled

["MESSAGES_LOADED", "PAUSED", "MESSAGES_ADD", "MESSAGE_OPEN", "MESSAGE_CLOSE", "MESSAGES_CLEAR_EVALUATIONS", "MESSAGES_CLEAR_EVALUATION", "MESSAGES_CLEAR_LOGPOINT", "MESSAGE_UPDATE_PAYLOAD", "FILTER_STATE_UPDATED", "CONSOLE_OVERFLOW"]

## State

```ts
{
  commandHistory: unknown[];
  messagesById: Map<MessageId, Message>;
  visibleMessages: MessageId[];
  filteredMessagesCount: Record<MessageFilter,  number>;
  messagesUiById: unknown[];
  messagesPayloadById: Record<unknown,  unknown>;
  logpointMessages: Map<unknown,  unknown>;
  removedLogpointIds: Set<MessageId>;
  pausedExecutionPoint: unknown | null;
  pausedExecutionPointTime: number;
  hasExecutionPoints: boolean;
  lastMessageId: MessageId;
  overflow: boolean;
  messagesLoaded: boolean;
}
```

## Cases

Note: always starts by destructuring:

```js
const { messagesById, messagesPayloadById, messagesUiById, visibleMessages } = state;
const { filtersState } = action;
```

### `"MESSAGES_LOADED"`

Just `return { ...state, messagesLoaded: true };`

Dispatched by: `actions/messages.js` line 45, after `ThreadFront.findConsoleMessages()` resolves

### `"PAUSED"`

Returns existing `state` if already paused at the exact same time, otherwise updates `pausedExecutionPoint, pausedExecutionPointTime`.

### `"MESSAGES_ADD"`

Starts by making a clone of the existing state (including new `Map/Set` instances), then loops over all incoming messages. For each message, it adds it to the state with `addMessage()`, and if it's a command message also updates `state.commandHistory`.

Dispatched by:

- `actions/messages.js`, line 183, which throttles incoming messages to batch them in 50ms chunks
- `actions/input.ts`, lines 53, 74, 104, and 213, for various expression evaluations

### `"MESSAGE_OPEN"`

Updates `messagesUiById` to add `action.id` (ie, a list of open message IDs).

Also checks to see if the current message is a "group start" message. If so, it finds all child messages of the group, and inserts them into `state.visibleMessages` right after the index of the current message ID.

Dispatched by: `components/Output/Message.js` line 149, when a message is toggled open

### `"MESSAGE_CLOSE"`

Removes `action.id` from `messagesUiById`. If this was a group message parent, it also updates `visibleMessages` to remove all members of that group.

Dispatched by: `components/output/Message.js` line 147, when a message is toggled closed

### `"MESSAGES_CLEAR_EVALUATIONS"`

Finds all `"COMMAND"` or `"RESULT"` messages and removes them.

Dispatched by: `components/FilterBar/ClearButton.tsx` (note: separate trash can icon appears next to the filter bar - _not_ the same as the "clear filter text" `x` button)

### `"MESSAGE_CLEAR_EVALUATION"`

Takes the numeric message ID in the action, adds 1 to get the matching result message ID (assuming numerical increments), and removes both messages from state.

**Does not appear to be dispatched anywhere**

### `"MESSAGES_CLEAR_LOGPOINT"`

Loops over all messages, finds messages that have a matching `logpointId`, and removes them.

Dispatched by: `actions/messages.js` line 39, in `LogpointHandlers.clearLogpoint`

### `"MESSAGE_UPDATE_PAYLOAD"`

Updates `messagesPayloadById` with some arbitrary data based on message ID.

**Does not appear to be dispatched anywhere**

### `"FILTER_STATE_UPDATED"`

Forces a run of `setVisibleMessages()` based on `filterState`. Temporary workaround after I rewrote the `filters` reducer and this stopped updating.

Dispatched by: `actions/filters.ts`, in the thunks

### `"CONSOLE_OVERFLOW"`

Just `return { ...state, overflow: true };`

Dispatched by: `protocol/logpoint.ts` line 548, if there was a "too many points" error, and same with `actions/messages.js` line 44

## Other Functions

### `addMessage(newMessage, state, filtersState)`

- Skips out if it's a "null message", or the message belongs to a logpoint that has been removed
- Stores current message's ID as `state.lastMessageId`
- Calls `ensureExecutionPoints(state, message)`
- Sets `state.hasExecutionPoints = true` if message has an execution point
- Checks if there's already a dupe message based on logpoint + execution point. If so, it adds the earlier message's ID to a "removed" list, and later removes that
- Freezes the message object and adds to `messagesById` (`Map`)
- calls `getMessageVisibility` to determine if it's visible
- If it's visible:, adds to `state.visibleMessages` and sorts if so
- If not visible and matches a default filter, increments a "global filtered message" counter
- If it has a level and isn't a logpoint, increments a "filtered messages count by level" counter
- Removes that earlier message from state if necessary

### `setVisibleMessages({messagesState, filtersState, forceTimestampSort})`

- Loops over existing messages, and for each message:
  - Determines if it's visible
  - Same logic as `addMessage`: adds to `messagesToShow`, or increments global/cause message counters
- Overwrites `visibleMessages, filteredMessageCount`
- Calls `maybeSortVisibleMessages()`

### `removeMessagesFromState(state, removedMessagesIds)`

- Removes any matching IDs from `state.visibleMessages`
- Updates `state.messagesById`, `state.messagesUiById`, and `state.messagePayloadById`

### `getMessageVisibility(message, {messagesState, filtersState})`

Runs several visibility checks:

- Visible if it's unfilterable ("command", "result", "navigation")
- Not visible if it can't pass the level filters
  - `passLevelFilters()`
- Not visible if it can't pass the `node_modules` filter
  - `passNodeModuleFilters()`
- Not visible if it can't pass the text or category filters
  - `passSearchFilters()`
- Otherwise visible

Other utils:

- `isTextInFrame`
- `isTextInParameters`
- `isTextInParameter`
  - Note: `ValueFront` method usage
- `isTextInNetEvent`
  - Note: not sure if we do net events now?
- `isTextInStackTrace`
- `isTextInMessageText`
- `isTextInNotes`
- `isTextInPrefix`

### `getPausePoint(newMessage, state)`

If it's a "result" message with a param, returns that param's execution point, otherwise existing state execution point

### `ensureExecutionPoint(state, newMessage)`

Fills in `newMessage.lastExecutionPoint` , to help with grouping messages by pause point

### `getLastMessageWithPoint(state, point)`

Filters visible message IDs to find ones that match execution/progress, and gets the last actual message in this section (I think)

### `maybeSortVisibleMessages(state, timeStampSort)`

If `state.hasExecutionPoints)`, runs a complex sort based on multiple factors of the messages.

Otherwise if `timestampSort`, sort the messages based on their timestamps.

## State Field Usages

### Selectors

#### Basic selectors

```js
export const getAllMessagesPayloadById = state => state.messages.messagesPayloadById;
export const getAllMessagesUiById = state => state.messages.messagesUiById;
export const getAllRepeatById = state => state.messages.repeatById;
export const getCommandHistory = state => state.messages.commandHistory;
export const getFilteredMessagesCount = state => state.messages.filteredMessagesCount;
export const getMessagesLoaded = state => state.messages.messagesLoaded;

export function getAllMessagesById(state) {
  return state.messages.messagesById;
}

export function getMessage(state, id) {
  return getAllMessagesById(state).get(id);
}

export function getConsoleOverflow(state) {
  return state.messages.overflow;
}
```

#### Complex selectors

- `getVisibleMessages`:
  - inputs: `getAllMessagesById`, `state.messages.visibleMessages`
  - calculates: messages that are in the focused region
- `getMessages`:
  - inputs: `getAllMessagesById`, `getVisibleMessages`
  - calculates: maps `visibleMessages` (IDs) to an array of messages
- `getMessagesForTimeline`:
  - inputs: `getMessages`
  - calculates: filters to just `"console-api"` or error messages
- `getClosestMessage`:
  - inputs: `getVisibleMessages`, `getAllMessagesById`
  - calculates: last message within a particular execution point (?)

#### Selector Usages

- `getAllMessagesByPayloadId`:
  - `ConsoleOutput.js`
- `getAllMessagesUiById`:
  - `ConsoleOutput.js`
- `getAllRepeatById`: **dead**
- `getCommandHistory`:
  - `components/Input/useEvaluationHistory.tsx`
- `getFilteredMessagesCount`:
  - `FilterSettings.js`
- `getMessagesLoaded`:
  - `ConsoleLoadingBar.tsx`
- `getAllMessagesById`:
  - `components/FilterBar/ClearButton.tsx`
  - `ConsoleOutput.js`
- `getVisibleMessage`:
  - `ConsoleOutput.js`
- `getMessages`:
  - same selectors file only
- `getMessagesForTimeline`:
  - `components/Timeline/index.tsx`
- `getClosestMessage`:
  - `ConsoleOutput.js`
- `getMessage`: **dead**`
- `getConsoleOverflow`: **dead**

#### Other Messages State Usage

- `components/App.tsx`: `state.messages.overflow`
- `ui/setup/prefs.ts`: `state.messages.commandHistory`

#### `Map/Set` Usages

- `messagesById`
  - `ConsoleOutput.js` - `props.messages`
    - 74, 79: `messages.size`
    - 110-111, 136, 142: `messages.get()`

## Messages UI Behavior

- Evaluations always appear to sort to the top regardless of what other messages are showing
