import { createSelector } from "reselect";
import { getMessagesForTimeline } from "./messages";

export const getEventMessages = createSelector(getMessagesForTimeline, messages => {
  const eventMessages = messages.filter(msg => isEventOfType(msg, "MouseEvent"));
  const deduplicatedMessages = removeDuplicateEvents(eventMessages);
  const mappedEventMessages = deduplicatedMessages.map(msg => ({
    message: msg,
    type: getTypeValue(msg),
    className: getPropValueFromFront("target", msg.parameters[0])._object.className,
  }));

  return mappedEventMessages;
});

function getTypeValue(message) {
  const valueFront = message.parameters[0];
  const getters = valueFront._object.preview.getterValues;

  const typeGetter = getters.find(getter => getter.name == "type");
  const typeValue = typeGetter.value._primitive;

  return typeValue;
}

function getPropValueFromFront(propertyName, front) {
  const { getterValues } = front._object.preview;
  const getter = getterValues.find(e => e.name === propertyName);
  return getter.value;
}

function removeDuplicateEvents(messages) {
  return messages.reduce((acc, msg) => {
    if (isSameEvent(msg, acc[acc.length - 1])) {
      return acc;
    }

    return [...acc, msg];
  }, []);
}

function isSameEvent(newMessage, lastMessage) {
  if (!lastMessage) {
    return false;
  }

  const newX = newMessage.parameters[0]._object.preview.getterValues.find(e => e.name == "x");
  const newXValue = newX.value._primitive;
  const lastX = lastMessage.parameters[0]._object.preview.getterValues.find(e => e.name == "x");
  const lastXValue = lastX.value._primitive;

  return newXValue === lastXValue;
}

function isEventOfType(message, type) {
  const { parameters } = message;
  const valueFront = parameters?.[0];

  if (!valueFront?._object) {
    return false;
  }

  const eventType = getEventType(valueFront);

  return eventType === type;
}

function getEventType(valueFront) {
  let front = valueFront;

  // If the message is referring to a React event, extract the native event first.
  if (getNativeEvent(valueFront)) {
    const nativeEvent = getNativeEvent(valueFront);
    front = nativeEvent.value;
  }

  return front._object.className;
}

function getNativeEvent(valueFront) {
  const objectPreview = valueFront._object.preview;
  const objectProperties = objectPreview.properties;

  if (!objectProperties) {
    return;
  }

  const nativeEvent = objectProperties.find(property => property.name == "nativeEvent");

  return nativeEvent;
}
