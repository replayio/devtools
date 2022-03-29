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
// TODO Disable this for now to avoid circular imports
// import { getGripPreviewItems } from "devtools/packages/devtools-reps";
import { getUnicodeUrlPath } from "devtools/client/shared/unicode-url";
import { getSourceNames } from "devtools/client/shared/source-utils";

import { log } from "protocol/socket";
import { assert, compareNumericStrings } from "protocol/utils";
import type { WebconsoleFiltersState } from "./filters";

type MessageId = string;
type Command = string;

interface Frame {
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

export interface MessageState {
  commandHistory: Command[];
  messages: EntityState<Message>;
  visibleMessages: MessageId[];
  filteredMessagesCount: FilteredMessagesCount;
  messagesUiById: MessageId[];
  logpointMessages: EntityState<LogpointMessageEntry>;
  removedLogpointIds: MessageId[];
  pausedExecutionPoint: string | null;
  pausedExecutionPointTime: number;
  hasExecutionPoints: boolean;
  lastMessageId: MessageId | null;
  overflow: boolean;
  messagesLoaded: boolean;
}

const MAX_HISTORY_LENGTH = 1000;

export const appendToHistory = (command: Command, history: Command[]): Command[] => {
  return uniq([command, ...history].slice(0, MAX_HISTORY_LENGTH));
};

export const messagesAdapter = createEntityAdapter<Message>();
const logpointMessagesAdapter = createEntityAdapter<LogpointMessageEntry>({
  selectId: entry => entry.key,
});

export const initialMessageState = (overrides?: Partial<MessageState>): MessageState =>
  Object.freeze(
    Object.assign(
      {
        // List of all the messages added to the console.
        messages: messagesAdapter.getInitialState(),
        // Array of the visible messages.
        visibleMessages: [],
        // Object for the filtered messages.
        filteredMessagesCount: getDefaultFiltersCounter(),
        // List of the message ids which are opened.
        messagesUiById: [],

        commandHistory: [],

        // Map logpointId:pointString to messages.
        logpointMessages: logpointMessagesAdapter.getInitialState(),
        // Set of logpoint IDs that have been removed
        removedLogpointIds: [],
        // Any execution point we are currently paused at, when replaying.
        pausedExecutionPoint: null,
        pausedExecutionPointTime: 0,
        // Whether any messages with execution points have been seen.
        hasExecutionPoints: false,
        // Id of the last messages that was added.
        lastMessageId: null,
        // Flag that indicates if not all console messages will be displayed.
        overflow: false,

        messagesLoaded: false,
      },
      overrides
    )
  );

/*
function cloneState(state: MessageState) {
  return {
    commandHistory: [...state.commandHistory],
    messagesById: new Map(state.messages),
    visibleMessages: [...state.visibleMessages],
    filteredMessagesCount: { ...state.filteredMessagesCount },
    messagesUiById: [...state.messagesUiById],
    logpointMessages: new Map(state.logpointMessages),
    removedLogpointIds: Array.from(new Set(state.removedLogpointIds)),
    pausedExecutionPoint: state.pausedExecutionPoint,
    pausedExecutionPointTime: state.pausedExecutionPointTime,
    hasExecutionPoints: state.hasExecutionPoints,
    lastMessageId: state.lastMessageId,
    overflow: state.overflow,
    messagesLoaded: state.messagesLoaded,
  };
}
*/

interface PausedAction extends AnyAction {
  type: "PAUSED";
  executionPoint: string;
  time: number;
}

const messagesSlice = createSlice({
  name: "messages",
  initialState: initialMessageState,
  reducers: {
    messagesLoaded(state) {
      state.messagesLoaded = true;
    },
    messagesAdded(
      state,
      action: PayloadAction<{ messages: Message[]; filtersState: WebconsoleFiltersState }>
    ) {
      const { messages, filtersState } = action.payload;
      messages.forEach(message => {
        addMessage(message, state as MessageState, filtersState);

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
    filterStateUpdated(state, action: PayloadAction<WebconsoleFiltersState>) {
      return setVisibleMessages({
        // @ts-ignore Doesn't like `WritableDraft<ValueFront>`
        messagesState: state,
        filtersState: action.payload,
      });
    },
    consoleOverflowed(state) {
      state.overflow = true;
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
  consoleOverflowed,
  filterStateUpdated,
  logpointMessagesCleared,
  messageClosed,
  messageEvaluationsCleared,
  messageOpened,
  messagesAdded,
  messagesLoaded,
} = messagesSlice.actions;

export const messages = messagesSlice.reducer;

/**
 * Add a console message to the state
 */
// eslint-disable-next-line complexity
function addMessage(
  newMessage: Message,
  state: MessageState,
  filtersState: WebconsoleFiltersState
): MessageState {
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
    // state.logpointMessages.set(key, newMessage);
  }

  // Immer will freeze anyway, but this might help skipping the `ValueFront` fields
  const addedMessage = Object.freeze(newMessage);
  messagesAdapter.upsertOne(state.messages, addedMessage);

  const { visible, cause } = getMessageVisibility(addedMessage, filtersState);

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

// TODO Actually remove the dead logic here.
// Left in for PR comparison

/*
// eslint-disable-next-line complexity
function messages(state = initialMessageState(), action: AnyAction) {
  const { messages: messagesById, messagesUiById, visibleMessages } = state;
  const { filtersState } = action;

  log(`WebConsole ${action.type}`);

  let newState;
  switch (action.type) {
    case "MESSAGES_LOADED":
      return { ...state, messagesLoaded: true };
    case "PAUSED":
      if (
        state.pausedExecutionPoint &&
        action.executionPoint &&
        pointEquals(state.pausedExecutionPoint, action.executionPoint) &&
        state.pausedExecutionPointTime == action.time
      ) {
        return state;
      }

      return {
        ...state,
        pausedExecutionPoint: action.executionPoint,
        pausedExecutionPointTime: action.time,
      };
    case constants.MESSAGES_ADD:
      let newState = cloneState(state);
      (action.messages as Message[]).forEach(message => {
        newState = addMessage(message, newState, filtersState);
        if (message.type === "command") {
          newState.commandHistory = appendToHistory(message.messageText, state.commandHistory);
        }
      });
      return newState;

    case constants.MESSAGE_OPEN:
      const openState = { ...state };
      openState.messagesUiById = [...messagesUiById, action.id];
      const currMessage = messagesById.get(action.id);

      return openState;

    case constants.MESSAGE_CLOSE:
      const closeState = { ...state };
      const messageId = action.id;
      const index = closeState.messagesUiById.indexOf(messageId);
      closeState.messagesUiById.splice(index, 1);
      closeState.messagesUiById = [...closeState.messagesUiById];

      return closeState;

    case constants.MESSAGES_CLEAR_EVALUATIONS: {
      const removedIds = [];
      for (const [id, message] of messagesById) {
        if (message.type === MESSAGE_TYPE.COMMAND || message.type === MESSAGE_TYPE.RESULT) {
          removedIds.push(id);
        }
      }

      // If there have been no console evaluations, there's no need to change the state.
      if (removedIds.length === 0) {
        return state;
      }

      return removeMessagesFromState(
        {
          ...state,
        },
        removedIds
      );
    }

    case constants.MESSAGES_CLEAR_EVALUATION: {
      const commandId = action.messageId;

      // This assumes that messages IDs are generated sequentially, and the result's ID
      // should be the command message's ID + 1.
      const resultId = (Number(commandId) + 1).toString();

      return removeMessagesFromState(
        {
          ...state,
        },
        [commandId, resultId]
      );
    }

    case constants.MESSAGES_CLEAR_LOGPOINT: {
      const removedIds = [];
      for (const [id, message] of Object.entries(state.messages.entities)) {
        if (message!.logpointId == action.logpointId) {
          removedIds.push(id);
        }
      }

      return removeMessagesFromState(
        {
          ...state,
          removedLogpointIds: Array.from(new Set([...state.removedLogpointIds, action.logpointId])),
        },
        removedIds
      );
    }

    // TODO Remove this action entirely when the filtered messages is turned into a selector
    case "FILTER_STATE_UPDATED":
      return setVisibleMessages({
        messagesState: state,
        filtersState,
      });

    case "CONSOLE_OVERFLOW": {
      return { ...state, overflow: true };
    }
  }

  return state;
}
*/

interface MessagesFilters {
  messagesState: MessageState;
  filtersState: WebconsoleFiltersState;
}

function setVisibleMessages({
  messagesState,
  filtersState,
  forceTimestampSort = false,
}: MessagesFilters & {
  forceTimestampSort?: boolean;
}) {
  const { messages } = messagesState;

  const messagesToShow: MessageId[] = [];
  const filtered = getDefaultFiltersCounter();

  // messagesById.forEach((message, msgId) => {
  for (const [id, maybeMessage] of Object.entries(messagesState.messages.entities)) {
    // Appease TS, which thinks it could be undefined
    const message = maybeMessage!;
    const { visible, cause } = getMessageVisibility(message, filtersState);

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
  // const newState = {
  //   ...messagesState,
  //   visibleMessages: messagesToShow,
  //   filteredMessagesCount: filtered,
  // };

  maybeSortVisibleMessages(messagesState, forceTimestampSort);

  return messagesState;
}

/**
 * Clean the properties for a given state object and an array of removed messages ids.
 * Be aware that this function MUTATE the `state` argument.
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

  const isInRemovedId = (id: MessageId) => removedMessagesIds.includes(id);

  messagesAdapter.removeMany(state.messages, removedMessagesIds);

  if (state.messagesUiById.find(isInRemovedId)) {
    state.messagesUiById = state.messagesUiById.filter(id => !isInRemovedId(id));
  }

  return state;
}

/**
 * Check if a message should be visible in the console output, and if not, what
 * causes it to be hidden.
 * @param {Message} message: The message to check
 * @param {Object} option: An option object of the following shape:
 *                   - {MessageState} messagesState: The current messages state
 *                   - {FilterState} filtersState: The current filters state
 *
 * @return {Object} An object of the following form:
 *         - visible {Boolean}: true if the message should be visible
 *         - cause {String}: if visible is false, what causes the message to be hidden.
 */
// eslint-disable-next-line complexity
function getMessageVisibility(message: Message, filtersState: WebconsoleFiltersState) {
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

function isUnfilterable(message: Message) {
  return [MESSAGE_TYPE.COMMAND, MESSAGE_TYPE.RESULT, MESSAGE_TYPE.NAVIGATION_MARKER].includes(
    message.type
  );
}

/**
 * Returns true if the message is in node modules and should be hidden
 *
 * @param {Object} message - The message to check the filter against.
 * @param {FilterState} filters - redux "filters" state.
 * @returns {Boolean}
 */
function passNodeModuleFilters(message: Message, filters: WebconsoleFiltersState) {
  return (
    message.frame?.source?.includes("node_modules") &&
    filters[FILTERS.NODEMODULES as keyof WebconsoleFiltersState] == false
  );
}

/**
 * Returns true if the message shouldn't be hidden because of levels filter state.
 *
 * @param {Object} message - The message to check the filter against.
 * @param {FilterState} filters - redux "filters" state.
 * @returns {Boolean}
 */
function passLevelFilters(message: Message, filters: WebconsoleFiltersState) {
  // The message passes the filter if it is not a console call,
  // or if its level matches the state of the corresponding filter.
  return (
    (message.source !== MESSAGE_SOURCE.CONSOLE_API &&
      message.source !== MESSAGE_SOURCE.JAVASCRIPT) ||
    message.type !== MESSAGE_TYPE.LOG ||
    filters[message.level as keyof WebconsoleFiltersState] === true
  );
}

type StringMatcher = (str: string) => boolean;

/**
 * Returns true if the message shouldn't be hidden because of search filter state.
 *
 * @param {Object} message - The message to check the filter against.
 * @param {FilterState} filters - redux "filters" state.
 * @returns {Boolean}
 */
function passSearchFilters(message: Message, filters: WebconsoleFiltersState) {
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
function isTextInFrame(matchStr: StringMatcher, frame?: Frame) {
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
function isTextInParameters(matchStr: StringMatcher, parameters?: ValueFront[]) {
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
) {
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
function isTextInNetEvent(matchStr: StringMatcher, request?: MessageRequest) {
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
function isTextInStackTrace(matchStr: StringMatcher, stacktrace?: StackFrame[]) {
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
function isTextInMessageText(matchStr: StringMatcher, messageText?: string) {
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
function isTextInNotes(matchStr: StringMatcher, notes: Note[] | null) {
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
function isTextInPrefix(matchStr: StringMatcher, prefix?: string) {
  if (!prefix) {
    return false;
  }

  return matchStr(`${prefix}: `);
}

function getDefaultFiltersCounter() {
  const count = (DEFAULT_FILTERS as FilterCountKeys[]).reduce(
    (res: FilteredMessagesCount, filter) => {
      res[filter] = 0;
      return res;
    },
    {} as FilteredMessagesCount
  );
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
    // @ts-ignorestring/obj mismatch
    const lastMessage = getLastMessageWithPoint(state, point);
    if (lastMessage.lastExecutionPoint) {
      messageCount = lastMessage.lastExecutionPoint.messageCount + 1;
    }
  } else if (state.visibleMessages.length) {
    const lastId = state.visibleMessages[state.visibleMessages.length - 1];
    const lastMessage = state.messages.entities[lastId]!;
    if (lastMessage.executionPoint) {
      // If the message is evaluated while we are not paused, we want
      // to make sure that those messages are placed immediately after the execution
      // point's message.
      point = lastMessage.executionPoint;
      time = lastMessage.executionPointTime!;
      messageCount = 0;
    } else {
      point = lastMessage.lastExecutionPoint.point;
      time = lastMessage.lastExecutionPoint.time;
      messageCount = lastMessage.lastExecutionPoint.messageCount + 1;
    }
  }

  // @ts-ignorestring/obj mismatch
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
 *
 * @param {MessageState} state
 * @param {Boolean} timeStampSort: set to true to sort messages by their timestamps.
 */
function maybeSortVisibleMessages(state: MessageState, timeStampSort = false) {
  // When using log points while replaying, messages can be added out of order˜
  // with respect to how they originally executed. Use the execution point
  // information in the messages to sort visible messages according to how
  // they originally executed. This isn't necessary if we haven't seen any
  // messages with execution points, as either we aren't replaying or haven't
  // seen any messages yet.
  if (state.hasExecutionPoints) {
    state.visibleMessages = [...state.visibleMessages].sort((a, b) => {
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
