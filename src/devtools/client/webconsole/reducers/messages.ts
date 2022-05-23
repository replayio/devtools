/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import type { AnyAction, PayloadAction, EntityState } from "@reduxjs/toolkit";
import { createSlice, createEntityAdapter } from "@reduxjs/toolkit";
import uniq from "lodash/uniq";

import constants from "devtools/client/webconsole/constants";
const { DEFAULT_FILTERS, FILTERS, MESSAGE_TYPE, MESSAGE_SOURCE } = constants;

import type { ValueFront } from "protocol/thread";

import { pointEquals } from "protocol/execution-point-utils";
// TODO Disabled this for now to avoid circular imports
// import { getGripPreviewItems } from "devtools/packages/devtools-reps";
import { getUnicodeUrlPath } from "devtools/client/shared/unicode-url";
import { getSourceNames } from "devtools/client/shared/source-utils";

import { log } from "protocol/socket";
import { assert, compareNumericStrings } from "protocol/utils";

type MessageId = string;
type Command = string;

export interface Frame {
  column: number;
  line: number;
  source: string;
  sourceId?: string;
  functionName?: string;
}

interface StackFrame {
  columnNumber: number;
  lineNumber: number;
  filename: string;
  functionName: string;
  source: string;
  sourceId: string;
}

interface MessageRequest {
  url: string;
  method: string;
}

interface Note {
  messageBody: string;
  frame: Frame;
}

// TODO Multiple type mismatches with related fields being a string or an object
type ExecutionPoint =
  | {
      checkpoint: number;
      progress: number;
    }
  | string;

export interface Message {
  allowRepeating: boolean;
  category: string | null;
  errorMessageName: string | null;
  exceptionDocURL: string | null;
  executionPoint: string | null;
  executionHasFrames: boolean;
  executionPointTime: number | null;
  evalId?: number;
  frame?: Frame;
  groupId: string | null;
  id: MessageId;
  indent: number;
  innerWindowID: string | null;
  level: string;
  logpointId?: string;
  messageText: string;
  notes: Note[] | null;
  parameters: ValueFront[];
  pauseId: string;
  prefix?: string;
  private?: unknown;
  repeatId: string | null;
  source: string;
  stacktrace: StackFrame[];
  timeStamp?: number;
  type: string;
  userProvidedStyles?: unknown;
  request?: MessageRequest;
  lastExecutionPoint: {
    point: ExecutionPoint;
    time: number;
    messageCount: number;
  };
}

interface LogpointMessageEntry {
  messageId: MessageId;
  key: string;
}

interface FilteredMessagesCount {
  debug: number;
  info: number;
  log: number;
  warn: number;
  error: number;
  global: number;
  nodemodules: number;
  text: number;
}

type FilterCountKeys = keyof FilteredMessagesCount;

// Matches the fields in `DEFAULT_FILTERS_VALUES`
export interface FiltersState {
  text: string;
  error: boolean;
  warn: boolean;
  log: boolean;
  info: boolean;
  debug: boolean;
  css: boolean;
  net: boolean;
  nodemodules: boolean;
}

export type FilterBooleanFields = Exclude<keyof FiltersState, "text">;

export interface MessageState {
  /** History of the user's entered commands */
  commandHistory: Command[];
  /** Lookup table of all the messages added to the console */
  messages: EntityState<Message>;
  /** Active filters for messages */
  filters: FiltersState;
  /** IDs for all visible messages, in order */
  visibleMessages: MessageId[];
  /** Counters for filtered-out messages, by cause */
  filteredMessagesCount: FilteredMessagesCount;
  /** List of message IDs that are opened */
  messagesUiById: MessageId[];
  /** Lookup table of which messages are "logpoint" messages */
  logpointMessages: EntityState<LogpointMessageEntry>;
  /** Set of logpoint IDs that have been removed */
  removedLogpointIds: MessageId[];
  /** Any execution point we are currently paused at, when replaying. */
  pausedExecutionPoint: string | null;
  pausedExecutionPointTime: number;
  /** Whether any messages with execution points have been seen. */
  hasExecutionPoints: boolean;
  lastMessageId: MessageId | null;
  /** Flag that indicates if not all console messages will be displayed. */
  overflow: boolean;
  messagesLoaded: boolean;
  exceptionLogpointError: string | null;
}

const MAX_HISTORY_LENGTH = 1000;

// Already defined in `constants.js`, and don't want to duplicate for now
export const defaultFiltersState = constants.DEFAULT_FILTERS_VALUES as FiltersState;

export const appendToHistory = (command: Command, history: Command[]): Command[] => {
  return uniq([command, ...history].slice(0, MAX_HISTORY_LENGTH));
};

export const messagesAdapter = createEntityAdapter<Message>();
const logpointMessagesAdapter = createEntityAdapter<LogpointMessageEntry>({
  selectId: entry => entry.key,
});

export const syncInitialMessageState = (overrides: Partial<MessageState> = {}): MessageState => {
  // Realistically, we only expect filters and commandHistory
  // See ui/setup/dynamic/devtools.ts
  const { filters = {}, ...otherOverrides } = overrides;

  return Object.freeze(
    Object.assign(
      {
        messages: messagesAdapter.getInitialState(),
        filters: { ...constants.DEFAULT_FILTERS_VALUES, ...filters },
        visibleMessages: [],
        filteredMessagesCount: getDefaultFiltersCounter(),
        messagesUiById: [],
        commandHistory: [],
        exceptionLogpointError: null,
        logpointMessages: logpointMessagesAdapter.getInitialState(),
        removedLogpointIds: [],
        pausedExecutionPoint: null,
        pausedExecutionPointTime: 0,
        hasExecutionPoints: false,
        lastMessageId: null,
        overflow: false,
        messagesLoaded: false,
      },
      otherOverrides
    )
  );
};

// Dispatched manually elsewhere in the codebase, so typed here for reference
interface PausedAction extends AnyAction {
  type: "PAUSED";
  executionPoint: string;
  time: number;
}

const messagesSlice = createSlice({
  name: "messages",
  initialState: syncInitialMessageState,
  reducers: {
    messagesLoaded(state) {
      state.messagesLoaded = true;
    },
    messagesAdded(state, action: PayloadAction<Message[]>) {
      const messages = action.payload;
      messages.forEach(message => {
        addMessage(message, state as MessageState);

        if (message.type === "command") {
          state.commandHistory = appendToHistory(message.messageText, state.commandHistory);
        }
      });
    },
    messageOpened(state, action: PayloadAction<MessageId>) {
      state.messagesUiById.push(action.payload);
    },
    messageClosed(state, action: PayloadAction<MessageId>) {
      state.messagesUiById = state.messagesUiById.filter(id => id !== action.payload);
    },
    messageEvaluationsCleared(state) {
      const removedIds: MessageId[] = [];
      for (let maybeMessage of Object.values(state.messages.entities)) {
        const message = maybeMessage!;
        if (message.type === MESSAGE_TYPE.COMMAND || message.type === MESSAGE_TYPE.RESULT) {
          removedIds.push(message.id);
        }
      }

      // If there have been no console evaluations, there's no need to change the state.
      if (removedIds.length === 0) {
        return;
      }

      return removeMessagesFromState(state as MessageState, removedIds);
    },
    logpointMessagesCleared(state, action: PayloadAction<string>) {
      const logpointId = action.payload;
      const removedIds = [];

      for (const [id, message] of Object.entries(state.messages.entities)) {
        if (message!.logpointId == logpointId) {
          removedIds.push(id);
        }
      }

      state.removedLogpointIds = Array.from(new Set([...state.removedLogpointIds, logpointId]));

      return removeMessagesFromState(state as MessageState, removedIds);
    },
    // This is only here to force recalculation after filters are updated
    // TODO Find a way to rework `visibleMessages` as derived data and remove this
    filterStateUpdated(state, action: PayloadAction<FiltersState>) {},
    consoleOverflowed(state) {
      state.overflow = true;
    },
    exceptionLogpointErrorCleared(state) {
      state.exceptionLogpointError = null;
    },
    exceptionLogpointErrorReceived(state, action: PayloadAction<string>) {
      state.exceptionLogpointError = action.payload;
    },
    filterToggled(state, action: PayloadAction<FilterBooleanFields>) {
      state.filters[action.payload] = !state.filters[action.payload];
      setVisibleMessages(
        // Doesn't like `WritableDraft<MessagesState>` due to `ValueFront`
        state as MessageState
      );
    },
    filterTextUpdated(state, action: PayloadAction<string>) {
      state.filters.text = action.payload;
      setVisibleMessages(
        // Doesn't like `WritableDraft<MessagesState>` due to `ValueFront`
        state as MessageState
      );
    },
    clearMessages(state) {
      removeMessagesFromState(state as MessageState, state.messages.ids as string[]);
      state.overflow = false;
      state.messagesLoaded = false;
    },
  },
  extraReducers: builder => {
    // Dispatched from `actions/paused.js`
    builder.addCase("PAUSED", (state, action: PausedAction) => {
      if (
        state.pausedExecutionPoint &&
        action.executionPoint &&
        pointEquals(state.pausedExecutionPoint, action.executionPoint) &&
        state.pausedExecutionPointTime == action.time
      ) {
        return;
      }

      state.pausedExecutionPoint = action.executionPoint;
      state.pausedExecutionPointTime = action.time;
    });
  },
});

export const {
  clearMessages,
  consoleOverflowed,
  filterStateUpdated,
  logpointMessagesCleared,
  messageClosed,
  messageEvaluationsCleared,
  messageOpened,
  messagesAdded,
  messagesLoaded,
  filterTextUpdated,
  filterToggled,
  exceptionLogpointErrorCleared,
  exceptionLogpointErrorReceived,
} = messagesSlice.actions;

export const messages = messagesSlice.reducer;

/**
 * Add a console message to the state
 * Be aware that this function MUTATES the `state` argument, which is okay
 * because it actually runs inside of `createSlice` and Immer.
 */
// eslint-disable-next-line complexity
function addMessage(newMessage: Message, state: MessageState): MessageState {
  if (newMessage.type === constants.MESSAGE_TYPE.NULL_MESSAGE) {
    // When the message has a NULL type, we don't add it.
    return state;
  }

  // After messages with a given logpoint ID have been removed, ignore all
  // future messages with that ID.
  if (newMessage.logpointId && state.removedLogpointIds.includes(newMessage.logpointId)) {
    return state;
  }

  // Store the id of the message as being the last one being added.
  state.lastMessageId = newMessage.id;

  ensureExecutionPoint(state, newMessage);

  if (newMessage.executionPoint) {
    state.hasExecutionPoints = true;
  }

  // When replaying, we might get two messages with the same execution point and
  // logpoint ID. In this case the first message is provisional and should be
  // removed.
  const removedIds = [];
  if (newMessage.logpointId || (newMessage.evalId && newMessage.type === MESSAGE_TYPE.RESULT)) {
    const key = `${newMessage.logpointId || newMessage.evalId}:${newMessage.executionPoint}`;
    const existingMessage = state.logpointMessages.entities[key];
    if (existingMessage) {
      log(`LogpointFinish ${newMessage.executionPoint}`);
      removedIds.push(existingMessage.messageId);
    } else {
      log(`LogpointStart ${newMessage.executionPoint}`);
    }
    logpointMessagesAdapter.upsertOne(state.logpointMessages, { key, messageId: newMessage.id });
  }

  // Immer will freeze anyway, but this might help skipping the `ValueFront` fields
  const addedMessage = Object.freeze(newMessage);
  messagesAdapter.upsertOne(state.messages, addedMessage);

  const { visible, cause } = getMessageVisibility(addedMessage, state.filters);

  if (visible) {
    state.visibleMessages.push(newMessage.id);
    maybeSortVisibleMessages(state);
  } else if (DEFAULT_FILTERS.includes(cause)) {
    state.filteredMessagesCount.global++;
  }
  // Don't count replay logpoints (including exceptions!).
  if (addedMessage.level && addedMessage.type !== "logPoint") {
    state.filteredMessagesCount[addedMessage.level as FilterCountKeys]++;
  }

  return removeMessagesFromState(state, removedIds);
}

interface MessagesFilters {
  messagesState: MessageState;
  filtersState: FiltersState;
}

// TODO Turn this into derived state instead, so that we don't have to
// keep passing `filtersState` into the messages reducer. Alternately:
// - We could run another reducer in sequence after the root reducer this
//   to calculate after all other state updates are done.
// - We could move the filters state _inside_ the messages slice so that
//   it's all available in one place.
/**
 * Updates the count of filtered-out messages by cause.
 * Be aware that this function MUTATES the `state` argument, which is okay
 * because it actually runs inside of `createSlice` and Immer.
 */
function setVisibleMessages(messagesState: MessageState, forceTimestampSort = false) {
  const messagesToShow: MessageId[] = [];
  const filtered = getDefaultFiltersCounter();

  for (const [id, maybeMessage] of Object.entries(messagesState.messages.entities)) {
    // Appease TS, which thinks it could be undefined
    const message = maybeMessage!;
    const { visible, cause } = getMessageVisibility(message, messagesState.filters);

    if (visible) {
      messagesToShow.push(id);
    } else if (DEFAULT_FILTERS.includes(cause)) {
      filtered.global = filtered.global + 1;
    }
    if (message.level && message.type !== "logPoint") {
      filtered[message.level as FilterCountKeys] = filtered[message.level as FilterCountKeys] + 1;
    }
  }

  messagesState.visibleMessages = messagesToShow;
  messagesState.filteredMessagesCount = filtered;

  maybeSortVisibleMessages(messagesState, forceTimestampSort);

  return messagesState;
}

/**
 * Clean the properties for a given state object and an array of removed messages ids.
 * Be aware that this function MUTATES the `state` argument, which is okay
 * because it actually runs inside of `createSlice` and Immer.
 */
function removeMessagesFromState(
  state: MessageState,
  removedMessagesIds: MessageId[]
): MessageState {
  if (!Array.isArray(removedMessagesIds) || removedMessagesIds.length === 0) {
    return state;
  }

  const visibleSet = new Set(state.visibleMessages);
  const removedSet = new Set(removedMessagesIds);
  removedSet.forEach(id => {
    visibleSet.delete(id);
  });

  if (state.visibleMessages.length > visibleSet.size) {
    state.visibleMessages = Array.from(visibleSet);
  }

  const isInRemovedId = (id: MessageId) => removedSet.has(id);

  messagesAdapter.removeMany(state.messages, removedMessagesIds);

  if (state.messagesUiById.find(isInRemovedId)) {
    state.messagesUiById = state.messagesUiById.filter(id => !isInRemovedId(id));
  }

  return state;
}

interface MessageVisibility {
  visible: boolean;
  /** if visible is false, what causes the message to be hidden. */
  cause?: string;
}
/**
 * Check if a message should be visible in the console output, and if not,
 * what causes it to be hidden
 */
// eslint-disable-next-line complexity
function getMessageVisibility(message: Message, filtersState: FiltersState): MessageVisibility {
  // Some messages can't be filtered out
  // So, always return visible: true for those.
  if (isUnfilterable(message)) {
    return {
      visible: true,
    };
  }

  // Let's check all level filters (error, warn, log, …) and return visible: false
  // and the message level as a cause if the function returns false.
  if (!passLevelFilters(message, filtersState)) {
    return {
      visible: false,
      cause: message.level,
    };
  }

  if (passNodeModuleFilters(message, filtersState)) {
    return {
      visible: false,
      cause: FILTERS.NODEMODULES,
    };
  }

  // This should always be the last check, or we might report that a message was hidden
  // because of text search, while it may be hidden because its category is disabled.
  if (!passSearchFilters(message, filtersState)) {
    return {
      visible: false,
      cause: FILTERS.TEXT,
    };
  }

  return {
    visible: true,
  };
}

function isUnfilterable(message: Message): boolean {
  return [MESSAGE_TYPE.COMMAND, MESSAGE_TYPE.RESULT, MESSAGE_TYPE.NAVIGATION_MARKER].includes(
    message.type
  );
}

/**
 * Returns true if the message is in node modules and should be hidden
 */
function passNodeModuleFilters(message: Message, filters: FiltersState): boolean {
  return (
    !!message.frame?.source?.includes("node_modules") &&
    filters[FILTERS.NODEMODULES as keyof FiltersState] == false
  );
}

/**
 * Returns true if the message shouldn't be hidden because of levels filter state
 */
function passLevelFilters(message: Message, filters: FiltersState) {
  // The message passes the filter if it is not a console call,
  // or if its level matches the state of the corresponding filter.
  return (
    (message.source !== MESSAGE_SOURCE.CONSOLE_API &&
      message.source !== MESSAGE_SOURCE.JAVASCRIPT) ||
    message.type !== MESSAGE_TYPE.LOG ||
    filters[message.level as keyof FiltersState] === true
  );
}

type StringMatcher = (str: string) => boolean;

/**
 * Returns true if the message shouldn't be hidden because of search filter state
 */
function passSearchFilters(message: Message, filters: FiltersState): boolean {
  const trimmed = (filters.text || "").trim().toLocaleLowerCase();

  // "-"-prefix switched to exclude mode
  const exclude = trimmed.startsWith("-");
  const term = exclude ? trimmed.slice(1) : trimmed;

  let regex: RegExp | undefined;
  if (term.startsWith("/") && term.endsWith("/") && term.length > 2) {
    try {
      regex = new RegExp(term.slice(1, -1), "im");
    } catch (e) {}
  }
  const matchStr: StringMatcher = regex
    ? str => regex!.test(str)
    : str => str.toLocaleLowerCase().includes(term);

  // If there is no search, the message passes the filter.
  if (!term) {
    return true;
  }

  const matched =
    // Look for a match in parameters.
    isTextInParameters(matchStr, message.parameters) ||
    // Look for a match in location.
    isTextInFrame(matchStr, message.frame) ||
    // Look for a match in net events.
    isTextInNetEvent(matchStr, message.request) ||
    // Look for a match in stack-trace.
    isTextInStackTrace(matchStr, message.stacktrace) ||
    // Look for a match in messageText.
    isTextInMessageText(matchStr, message.messageText) ||
    // Look for a match in notes.
    isTextInNotes(matchStr, message.notes) ||
    // Look for a match in prefix.
    isTextInPrefix(matchStr, message.prefix);

  return matched ? !exclude : exclude;
}

/**
 * Returns true if given text is included in provided stack frame.
 */
function isTextInFrame(matchStr: StringMatcher, frame?: Frame): boolean {
  if (!frame) {
    return false;
  }

  const { functionName, line, column, source } = frame;
  // @ts-ignore
  const { short } = getSourceNames(source);
  const unicodeShort = getUnicodeUrlPath(short);

  const str = `${functionName ? functionName + " " : ""}${unicodeShort}:${line}:${column}`;
  return matchStr(str);
}

/**
 * Returns true if given text is included in provided parameters.
 */
function isTextInParameters(matchStr: StringMatcher, parameters?: ValueFront[]): boolean {
  if (!parameters) {
    return false;
  }

  return parameters.some(parameter => isTextInParameter(matchStr, parameter));
}

/**
 * Returns true if given text is included in provided parameter.
 */
function isTextInParameter(
  matchStr: StringMatcher,
  parameter: ValueFront,
  visitedObjectIds = new Set()
): boolean {
  if (parameter.isPrimitive()) {
    return matchStr(String(parameter.primitive()));
  }

  if (!parameter.isObject()) {
    return false;
  }

  if (matchStr(parameter.className()!)) {
    return true;
  }

  const objectId = parameter.id();
  if (visitedObjectIds.has(objectId)) {
    return false;
  }
  visitedObjectIds = new Set(visitedObjectIds);
  visitedObjectIds.add(objectId);

  // TODO Disable this for now to avoid circular imports
  // const previewItems = getGripPreviewItems(parameter);
  // for (const item of previewItems) {
  //   if (isTextInParameter(matchStr, item, visitedObjectIds)) {
  //     return true;
  //   }
  // }

  return false;
}

/**
 * Returns true if given text is included in provided net event grip.
 */
function isTextInNetEvent(matchStr: StringMatcher, request?: MessageRequest): boolean {
  if (!request) {
    return false;
  }

  const method = request.method;
  const url = request.url;
  return matchStr(method) || matchStr(url);
}

/**
 * Returns true if given text is included in provided stack trace.
 */
function isTextInStackTrace(matchStr: StringMatcher, stacktrace?: StackFrame[]): boolean {
  if (!Array.isArray(stacktrace)) {
    return false;
  }

  // isTextInFrame expect the properties of the frame object to be in the same
  // order they are rendered in the Frame component.
  return stacktrace.some(frame =>
    isTextInFrame(matchStr, {
      functionName: frame.functionName || "<anonymous>",
      source: frame.filename,
      line: frame.lineNumber,
      column: frame.columnNumber,
    })
  );
}

/**
 * Returns true if given text is included in `messageText` field.
 */
function isTextInMessageText(matchStr: StringMatcher, messageText?: string): boolean {
  if (!messageText) {
    return false;
  }

  if (typeof messageText === "string") {
    return matchStr(messageText);
  }

  return true;
}

/**
 * Returns true if given text is included in notes.
 */
function isTextInNotes(matchStr: StringMatcher, notes: Note[] | null): boolean {
  if (!Array.isArray(notes)) {
    return false;
  }

  return notes.some(
    note =>
      // Look for a match in location.
      isTextInFrame(matchStr, note.frame) ||
      // Look for a match in messageBody.
      (note.messageBody && matchStr(note.messageBody))
  );
}

/**
 * Returns true if given text is included in prefix.
 */
function isTextInPrefix(matchStr: StringMatcher, prefix?: string): boolean {
  if (!prefix) {
    return false;
  }

  return matchStr(`${prefix}: `);
}

function getDefaultFiltersCounter(): FilteredMessagesCount {
  const count = (DEFAULT_FILTERS as FilterCountKeys[]).reduce((res, filter) => {
    res[filter] = 0;
    return res;
  }, {} as FilteredMessagesCount);
  count.global = 0;
  return count;
}

//get the point for the corresponding command, regardless of where we're currently paused
function getPausePoint(newMessage: Message, state: MessageState) {
  if (newMessage.type === constants.MESSAGE_TYPE.RESULT && newMessage.parameters[0]) {
    return newMessage.parameters[0].getExecutionPoint() || state.pausedExecutionPoint;
  } else {
    return state.pausedExecutionPoint;
  }
}

// Make sure that message has an execution point which can be used for sorting
// if other messages with real execution points appear later.
export function ensureExecutionPoint(state: MessageState, newMessage: Message) {
  if (newMessage.executionPoint) {
    assert("executionPointTime" in newMessage, "newMessage.executionPointTime not set");
    return;
  }

  // Add a lastExecutionPoint property which will group messages evaluated during
  // the same replay pause point. When applicable, it will place the message immediately
  // after the last visible message in the group without an execution point when sorting.
  let point: ExecutionPoint | string = { checkpoint: 0, progress: 0 },
    time = 0,
    messageCount = 1;
  if (state.pausedExecutionPoint) {
    // @ts-ignore string/obj mismatch
    point = getPausePoint(newMessage, state);
    time = state.pausedExecutionPointTime;
    const lastMessage = getLastMessageWithPoint(state, point);
    if (lastMessage.lastExecutionPoint) {
      messageCount = lastMessage.lastExecutionPoint.messageCount + 1;
    }
  } else if (state.visibleMessages.length) {
    const lastId = state.visibleMessages[state.visibleMessages.length - 1];
    const lastMessage = state.messages.entities[lastId]!;
    if (lastMessage.executionPoint) {
      // If the message is evaluated while we are not paused, we want
      // to make sure that those messages are placed immediately after
      // the execution point's message.
      point = lastMessage.executionPoint;
      time = lastMessage.executionPointTime!;
      messageCount = 0;
    } else {
      point = lastMessage.lastExecutionPoint.point;
      time = lastMessage.lastExecutionPoint.time;
      messageCount = lastMessage.lastExecutionPoint.messageCount + 1;
    }
  }

  newMessage.lastExecutionPoint = { point, time, messageCount };
}

function getLastMessageWithPoint(state: MessageState, point: ExecutionPoint) {
  // Find all of the messageIds with no real execution point and the same progress
  // value as the given point.
  const filteredMessageId = state.visibleMessages.filter(function (p) {
    const currentMessage = state.messages.entities[p]!;

    if (currentMessage.executionPoint) {
      return false;
    }

    // @ts-ignore ExecutionPoint/string mismatch
    return point.progress === currentMessage.lastExecutionPoint.point.progress;
  });

  const lastMessageId = filteredMessageId[filteredMessageId.length - 1];
  return state.messages.entities[lastMessageId] ?? ({} as Message);
}

function messageExecutionPoint(state: MessageState, id: MessageId): string {
  const message = state.messages.entities[id]!;
  // @ts-ignore ExecutionPoint/string
  return message.executionPoint || message.lastExecutionPoint.point;
}

function messageCountSinceLastExecutionPoint(state: MessageState, id: MessageId) {
  const message = state.messages.entities[id]!;
  return message.lastExecutionPoint ? message.lastExecutionPoint.messageCount : 0;
}

/**
 * Sort state.visibleMessages if needed.
 * Be aware that this function MUTATES the `state` argument, which is okay
 * because it actually runs inside of `createSlice` and Immer.
 */
function maybeSortVisibleMessages(state: MessageState, timeStampSort = false) {
  // When using log points while replaying, messages can be added out of order˜
  // with respect to how they originally executed. Use the execution point
  // information in the messages to sort visible messages according to how
  // they originally executed. This isn't necessary if we haven't seen any
  // messages with execution points, as either we aren't replaying or haven't
  // seen any messages yet.
  if (state.hasExecutionPoints) {
    state.visibleMessages.sort((a, b) => {
      const compared = compareNumericStrings(
        messageExecutionPoint(state, a),
        messageExecutionPoint(state, b)
      );
      if (compared < 0) {
        return -1;
      } else if (compared > 0) {
        return 1;
      } else {
        const msgA = state.messages.entities[a]!;
        const msgB = state.messages.entities[b]!;
        if (msgA.evalId) {
          if (!msgB.evalId) {
            return 1;
          }
          if (msgA.evalId !== msgB.evalId) {
            return msgA.evalId - msgB.evalId;
          }
          return msgA.type === "result" ? 1 : -1;
        }
        if (msgB.evalId) {
          return -1;
        }
        const _a = messageCountSinceLastExecutionPoint(state, a);
        const _b = messageCountSinceLastExecutionPoint(state, b);
        return _a < _b ? -1 : _a > _b ? 1 : 0;
      }
    });
  }

  if (timeStampSort) {
    state.visibleMessages.sort((a, b) => {
      const messageA = state.messages.entities[a]!;
      const messageB = state.messages.entities[b]!;

      return messageA.timeStamp! < messageB.timeStamp! ? -1 : 1;
    });
  }
}
