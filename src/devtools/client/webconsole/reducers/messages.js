/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const constants = require("devtools/client/webconsole/constants");
const { DEFAULT_FILTERS, FILTERS, MESSAGE_TYPE, MESSAGE_SOURCE } = constants;

const { pointEquals } = require("protocol/execution-point-utils");
const { getGripPreviewItems } = require("devtools/client/debugger/packages/devtools-reps/src");
const { getUnicodeUrlPath } = require("devtools/client/shared/unicode-url");
const { getSourceNames } = require("devtools/client/shared/source-utils");

const { log } = require("protocol/socket");
const { assert, compareNumericStrings } = require("protocol/utils");
const { appendToHistory } = require("ui/utils/commandHistory");

const MessageState = overrides =>
  Object.freeze(
    Object.assign(
      {
        // List of all the messages added to the console.
        messagesById: new Map(),
        // List of additional data associated with messages (populated async or on-demand at a
        // later time after the message is received).
        messagesPayloadById: new Map(),
        // Array of the visible messages.
        visibleMessages: [],
        // Object for the filtered messages.
        filteredMessagesCount: getDefaultFiltersCounter(),
        // List of the message ids which are opened.
        messagesUiById: [],

        commandHistory: [],

        // Map logpointId:pointString to messages.
        logpointMessages: new Map(),
        // Set of logpoint IDs that have been removed
        removedLogpointIds: new Set(),
        // Any execution point we are currently paused at, when replaying.
        pausedExecutionPoint: null,
        pausedExecutionPointTime: 0,
        // Whether any messages with execution points have been seen.
        hasExecutionPoints: false,
        // Id of the last messages that was added.
        lastMessageId: null,
      },
      overrides
    )
  );

function cloneState(state) {
  return {
    commandHistory: [...state.commandHistory],
    messagesById: new Map(state.messagesById),
    visibleMessages: [...state.visibleMessages],
    filteredMessagesCount: { ...state.filteredMessagesCount },
    messagesUiById: [...state.messagesUiById],
    messagesPayloadById: new Map(state.messagesPayloadById),
    logpointMessages: new Map(state.logpointMessages),
    removedLogpointIds: new Set(state.removedLogpointIds),
    pausedExecutionPoint: state.pausedExecutionPoint,
    pausedExecutionPointTime: state.pausedExecutionPointTime,
    hasExecutionPoints: state.hasExecutionPoints,
    lastMessageId: state.lastMessageId,
  };
}

/**
 * Add a console message to the state.
 *
 * @param {ConsoleMessage} newMessage: The message to add to the state.
 * @param {MessageState} state: The message state ( = managed by this reducer).
 * @param {FiltersState} filtersState: The filters state.
 * @returns {MessageState} a new messages state.
 */
// eslint-disable-next-line complexity
function addMessage(newMessage, state, filtersState) {
  const { messagesById } = state;

  if (newMessage.type === constants.MESSAGE_TYPE.NULL_MESSAGE) {
    // When the message has a NULL type, we don't add it.
    return state;
  }

  // After messages with a given logpoint ID have been removed, ignore all
  // future messages with that ID.
  if (
    newMessage.logpointId &&
    state.removedLogpointIds &&
    state.removedLogpointIds.has(newMessage.logpointId)
  ) {
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
    const existingMessage = state.logpointMessages.get(key);
    if (existingMessage) {
      log(`LogpointFinish ${newMessage.executionPoint}`);
      removedIds.push(existingMessage.id);
    } else {
      log(`LogpointStart ${newMessage.executionPoint}`);
    }
    state.logpointMessages.set(key, newMessage);
  }

  const addedMessage = Object.freeze(newMessage);
  state.messagesById.set(newMessage.id, addedMessage);

  const { visible, cause } = getMessageVisibility(addedMessage, {
    messagesState: state,
    filtersState,
  });

  if (visible) {
    state.visibleMessages.push(newMessage.id);
    maybeSortVisibleMessages(state);
  } else if (DEFAULT_FILTERS.includes(cause)) {
    state.filteredMessagesCount.global++;
    state.filteredMessagesCount[cause]++;
  }

  return removeMessagesFromState(state, removedIds);
}

// eslint-disable-next-line complexity
function messages(state = MessageState(), action) {
  const { messagesById, messagesPayloadById, messagesUiById, visibleMessages } = state;
  const { filtersState } = action;

  log(`WebConsole ${action.type}`);

  let newState;
  switch (action.type) {
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
      action.messages.forEach(message => {
        newState = addMessage(message, newState, filtersState);
        if (message.type === "command") {
          newState.commandHistory = appendToHistory(message.messageText, state.commandHistory);
        }
      });
      return newState;

    case constants.MESSAGES_CLEAR:
      return MessageState({});

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
      for (const [id, message] of messagesById) {
        if (message.logpointId == action.logpointId) {
          removedIds.push(id);
        }
      }

      return removeMessagesFromState(
        {
          ...state,
          removedLogpointIds: new Set([...state.removedLogpointIds, action.logpointId]),
        },
        removedIds
      );
    }

    case constants.MESSAGE_UPDATE_PAYLOAD:
      return {
        ...state,
        messagesPayloadById: new Map(messagesPayloadById).set(action.id, action.data),
      };

    case constants.FILTER_TOGGLE:
    case constants.FILTER_TEXT_SET:
    case constants.FILTERS_CLEAR:
    case constants.DEFAULT_FILTERS_RESET:
      return setVisibleMessages({
        messagesState: state,
        filtersState,
      });
  }

  return state;
}

function setVisibleMessages({ messagesState, filtersState, forceTimestampSort = false }) {
  const { messagesById } = messagesState;

  const messagesToShow = [];
  const filtered = getDefaultFiltersCounter();

  messagesById.forEach((message, msgId) => {
    const { visible, cause } = getMessageVisibility(message, {
      messagesState,
      filtersState,
    });

    if (visible) {
      messagesToShow.push(msgId);
    } else if (DEFAULT_FILTERS.includes(cause)) {
      filtered.global = filtered.global + 1;
      filtered[cause] = filtered[cause] + 1;
    }
  });

  const newState = {
    ...messagesState,
    visibleMessages: messagesToShow,
    filteredMessagesCount: filtered,
  };

  maybeSortVisibleMessages(newState, forceTimestampSort);

  return newState;
}

/**
 * Clean the properties for a given state object and an array of removed messages ids.
 * Be aware that this function MUTATE the `state` argument.
 *
 * @param {MessageState} state
 * @param {Array} removedMessagesIds
 * @returns {MessageState}
 */
function removeMessagesFromState(state, removedMessagesIds) {
  if (!Array.isArray(removedMessagesIds) || removedMessagesIds.length === 0) {
    return state;
  }

  const visibleMessages = [...state.visibleMessages];
  removedMessagesIds.forEach(id => {
    const index = visibleMessages.indexOf(id);
    if (index > -1) {
      visibleMessages.splice(index, 1);
    }
  });

  if (state.visibleMessages.length > visibleMessages.length) {
    state.visibleMessages = visibleMessages;
  }

  const isInRemovedId = id => removedMessagesIds.includes(id);
  const mapHasRemovedIdKey = map => removedMessagesIds.some(id => map.has(id));
  const objectHasRemovedIdKey = obj => Object.keys(obj).findIndex(isInRemovedId) !== -1;

  const cleanUpMap = map => {
    const clonedMap = new Map(map);
    removedMessagesIds.forEach(id => clonedMap.delete(id));
    return clonedMap;
  };
  const cleanUpObject = object =>
    [...Object.entries(object)].reduce((res, [id, value]) => {
      if (!isInRemovedId(id)) {
        res[id] = value;
      }
      return res;
    }, {});

  state.messagesById = cleanUpMap(state.messagesById);

  if (state.messagesUiById.find(isInRemovedId)) {
    state.messagesUiById = state.messagesUiById.filter(id => !isInRemovedId(id));
  }

  if (mapHasRemovedIdKey(state.messagesPayloadById)) {
    state.messagesPayloadById = cleanUpMap(state.messagesPayloadById);
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
function getMessageVisibility(message, { messagesState, filtersState }) {
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

function isUnfilterable(message) {
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
function passNodeModuleFilters(message, filters) {
  return message.frame?.source?.includes("node_modules") && filters[FILTERS.NODEMODULES] == false;
}

/**
 * Returns true if the message shouldn't be hidden because of levels filter state.
 *
 * @param {Object} message - The message to check the filter against.
 * @param {FilterState} filters - redux "filters" state.
 * @returns {Boolean}
 */
function passLevelFilters(message, filters) {
  // The message passes the filter if it is not a console call,
  // or if its level matches the state of the corresponding filter.
  return (
    (message.source !== MESSAGE_SOURCE.CONSOLE_API &&
      message.source !== MESSAGE_SOURCE.JAVASCRIPT) ||
    message.type !== MESSAGE_TYPE.LOG ||
    filters[message.level] === true
  );
}

/**
 * Returns true if the message shouldn't be hidden because of search filter state.
 *
 * @param {Object} message - The message to check the filter against.
 * @param {FilterState} filters - redux "filters" state.
 * @returns {Boolean}
 */
function passSearchFilters(message, filters) {
  const trimmed = (filters.text || "").trim().toLocaleLowerCase();

  // "-"-prefix switched to exclude mode
  const exclude = trimmed.startsWith("-");
  const term = exclude ? trimmed.slice(1) : trimmed;

  let regex;
  if (term.startsWith("/") && term.endsWith("/") && term.length > 2) {
    try {
      regex = new RegExp(term.slice(1, -1), "im");
    } catch (e) {}
  }
  const matchStr = regex ? str => regex.test(str) : str => str.toLocaleLowerCase().includes(term);

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
function isTextInFrame(matchStr, frame) {
  if (!frame) {
    return false;
  }

  const { functionName, line, column, source } = frame;
  const { short } = getSourceNames(source);
  const unicodeShort = getUnicodeUrlPath(short);

  const str = `${functionName ? functionName + " " : ""}${unicodeShort}:${line}:${column}`;
  return matchStr(str);
}

/**
 * Returns true if given text is included in provided parameters.
 */
function isTextInParameters(matchStr, parameters) {
  if (!parameters) {
    return false;
  }

  return parameters.some(parameter => isTextInParameter(matchStr, parameter));
}

/**
 * Returns true if given text is included in provided parameter.
 */
function isTextInParameter(matchStr, parameter, visitedObjectIds = new Set()) {
  if (parameter.isPrimitive()) {
    return matchStr(String(parameter.primitive()));
  }

  if (!parameter.isObject()) {
    return false;
  }

  if (matchStr(parameter.className())) {
    return true;
  }

  const objectId = parameter.id();
  if (visitedObjectIds.has(objectId)) {
    return false;
  }
  visitedObjectIds = new Set(visitedObjectIds);
  visitedObjectIds.add(objectId);

  const previewItems = getGripPreviewItems(parameter);
  for (const item of previewItems) {
    if (isTextInParameter(matchStr, item, visitedObjectIds)) {
      return true;
    }
  }

  return false;
}

/**
 * Returns true if given text is included in provided net event grip.
 */
function isTextInNetEvent(matchStr, request) {
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
function isTextInStackTrace(matchStr, stacktrace) {
  if (!Array.isArray(stacktrace)) {
    return false;
  }

  // isTextInFrame expect the properties of the frame object to be in the same
  // order they are rendered in the Frame component.
  return stacktrace.some(frame =>
    isTextInFrame(matchStr, {
      functionName: frame.functionName || "<anonymous>",
      source: frame.filename,
      lineNumber: frame.lineNumber,
      columnNumber: frame.columnNumber,
    })
  );
}

/**
 * Returns true if given text is included in `messageText` field.
 */
function isTextInMessageText(matchStr, messageText) {
  if (!messageText) {
    return false;
  }

  if (typeof messageText === "string") {
    return matchStr(messageText);
  }

  const grip = messageText && messageText.getGrip ? messageText.getGrip() : messageText;
  if (grip && grip.type === "longString") {
    return matchStr(grip.initial);
  }

  return true;
}

/**
 * Returns true if given text is included in notes.
 */
function isTextInNotes(matchStr, notes) {
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
function isTextInPrefix(matchStr, prefix) {
  if (!prefix) {
    return false;
  }

  return matchStr(`${prefix}: `);
}

function getDefaultFiltersCounter() {
  const count = DEFAULT_FILTERS.reduce((res, filter) => {
    res[filter] = 0;
    return res;
  }, {});
  count.global = 0;
  return count;
}

//get the point for the corresponding command, regardless of where we're currently paused
function getPausePoint(newMessage, state) {
  if (newMessage.type === constants.MESSAGE_TYPE.RESULT && newMessage.parameters[0]) {
    return newMessage.parameters[0].getExecutionPoint() || state.pausedExecutionPoint;
  } else {
    return state.pausedExecutionPoint;
  }
}

// Make sure that message has an execution point which can be used for sorting
// if other messages with real execution points appear later.
function ensureExecutionPoint(state, newMessage) {
  if (newMessage.executionPoint) {
    assert("executionPointTime" in newMessage);
    return;
  }

  // Add a lastExecutionPoint property which will group messages evaluated during
  // the same replay pause point. When applicable, it will place the message immediately
  // after the last visible message in the group without an execution point when sorting.
  let point = { checkpoint: 0, progress: 0 },
    time = 0,
    messageCount = 1;
  if (state.pausedExecutionPoint) {
    point = getPausePoint(newMessage, state);
    time = state.pausedExecutionPointTime;
    const lastMessage = getLastMessageWithPoint(state, point);
    if (lastMessage.lastExecutionPoint) {
      messageCount = lastMessage.lastExecutionPoint.messageCount + 1;
    }
  } else if (state.visibleMessages.length) {
    const lastId = state.visibleMessages[state.visibleMessages.length - 1];
    const lastMessage = state.messagesById.get(lastId);
    if (lastMessage.executionPoint) {
      // If the message is evaluated while we are not paused, we want
      // to make sure that those messages are placed immediately after the execution
      // point's message.
      point = lastMessage.executionPoint;
      time = lastMessage.executionPointTime;
      messageCount = 0;
    } else {
      point = lastMessage.lastExecutionPoint.point;
      time = lastMessage.lastExecutionPoint.time;
      messageCount = lastMessage.lastExecutionPoint.messageCount + 1;
    }
  }

  newMessage.lastExecutionPoint = { point, time, messageCount };
}

function getLastMessageWithPoint(state, point) {
  // Find all of the messageIds with no real execution point and the same progress
  // value as the given point.
  const filteredMessageId = state.visibleMessages.filter(function (p) {
    const currentMessage = state.messagesById.get(p);

    if (currentMessage.executionPoint) {
      return false;
    }

    return point.progress === currentMessage.lastExecutionPoint.point.progress;
  });

  const lastMessageId = filteredMessageId[filteredMessageId.length - 1];
  return state.messagesById.get(lastMessageId) || {};
}

function messageExecutionPoint(state, id) {
  const message = state.messagesById.get(id);
  return message.executionPoint || message.lastExecutionPoint.point;
}

function messageCountSinceLastExecutionPoint(state, id) {
  const message = state.messagesById.get(id);
  return message.lastExecutionPoint ? message.lastExecutionPoint.messageCount : 0;
}

/**
 * Sort state.visibleMessages if needed.
 *
 * @param {MessageState} state
 * @param {Boolean} timeStampSort: set to true to sort messages by their timestamps.
 */
function maybeSortVisibleMessages(state, timeStampSort = false) {
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
        const msgA = state.messagesById.get(a);
        const msgB = state.messagesById.get(b);
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
      const messageA = state.messagesById.get(a);
      const messageB = state.messagesById.get(b);

      return messageA.timeStamp < messageB.timeStamp ? -1 : 1;
    });
  }
}

exports.messages = messages;

// Export for testing purpose.
exports.ensureExecutionPoint = ensureExecutionPoint;

exports.initialMessageState = MessageState;
