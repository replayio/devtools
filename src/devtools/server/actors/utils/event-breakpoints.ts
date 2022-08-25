/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Side-effectful import, needed to initialize prefs before read
require("devtools/client/inspector/prefs");

const Services = require("devtools/shared/services");

export type EventId = string;

export interface EventType {
  id: EventId;
  name: string;
}

export interface FullEventType extends EventType {
  type: string;
  message: string;
  eventType?: string;
  filter?: string;
  notificationType?: string;
}

export interface EventTypeCategory {
  name: string;
  events: EventType[];
}

function generalEvent(groupID: string, eventType: string): FullEventType {
  return {
    id: `event.${groupID}.${eventType}`,
    type: "event",
    name: eventType,
    message: `DOM '${eventType}' event`,
    eventType,
    filter: "general",
  };
}
function nodeEvent(groupID: string, eventType: string): FullEventType {
  return {
    ...generalEvent(groupID, eventType),
    filter: "node",
  };
}
function mediaNodeEvent(groupID: string, eventType: string): FullEventType {
  return {
    ...generalEvent(groupID, eventType),
    filter: "media",
  };
}
function globalEvent(groupID: string, eventType: string): FullEventType {
  return {
    ...generalEvent(groupID, eventType),
    message: `Global '${eventType}' event`,
    filter: "global",
  };
}
function xhrEvent(groupID: string, eventType: string): FullEventType {
  return {
    ...generalEvent(groupID, eventType),
    message: `XHR '${eventType}' event`,
    filter: "xhr",
  };
}

function webSocketEvent(groupID: string, eventType: string): FullEventType {
  return {
    ...generalEvent(groupID, eventType),
    message: `WebSocket '${eventType}' event`,
    filter: "websocket",
  };
}

function workerEvent(eventType: string): FullEventType {
  return {
    ...generalEvent("worker", eventType),
    message: `Worker '${eventType}' event`,
    filter: "worker",
  };
}

function timerEvent(
  type: string,
  operation: string,
  name: string,
  notificationType: string
): FullEventType {
  return {
    id: `timer.${type}.${operation}`,
    type: "simple",
    name,
    message: name,
    notificationType,
  };
}

function animationEvent(operation: string, name: string, notificationType: string): FullEventType {
  return {
    id: `animationframe.${operation}`,
    type: "simple",
    name,
    message: name,
    notificationType,
  };
}

const AVAILABLE_BREAKPOINTS = [
  {
    name: "Animation",
    items: [
      animationEvent("request", "Request Animation Frame", "requestAnimationFrame"),
      animationEvent("cancel", "Cancel Animation Frame", "cancelAnimationFrame"),
      animationEvent("fire", "Animation Frame fired", "requestAnimationFrameCallback"),
    ],
  },
  {
    name: "Clipboard",
    items: [
      generalEvent("clipboard", "copy"),
      generalEvent("clipboard", "cut"),
      generalEvent("clipboard", "paste"),
      generalEvent("clipboard", "beforecopy"),
      generalEvent("clipboard", "beforecut"),
      generalEvent("clipboard", "beforepaste"),
    ],
  },
  {
    name: "Control",
    items: [
      generalEvent("control", "resize"),
      generalEvent("control", "scroll"),
      generalEvent("control", "zoom"),
      generalEvent("control", "focus"),
      generalEvent("control", "blur"),
      generalEvent("control", "select"),
      generalEvent("control", "change"),
      generalEvent("control", "submit"),
      generalEvent("control", "reset"),
    ],
  },
  {
    name: "DOM Mutation",
    items: [
      // Deprecated DOM events.
      nodeEvent("dom-mutation", "DOMActivate"),
      nodeEvent("dom-mutation", "DOMFocusIn"),
      nodeEvent("dom-mutation", "DOMFocusOut"),

      // Standard DOM mutation events.
      nodeEvent("dom-mutation", "DOMAttrModified"),
      nodeEvent("dom-mutation", "DOMCharacterDataModified"),
      nodeEvent("dom-mutation", "DOMNodeInserted"),
      nodeEvent("dom-mutation", "DOMNodeInsertedIntoDocument"),
      nodeEvent("dom-mutation", "DOMNodeRemoved"),
      nodeEvent("dom-mutation", "DOMNodeRemovedIntoDocument"),
      nodeEvent("dom-mutation", "DOMSubtreeModified"),

      // DOM load events.
      nodeEvent("dom-mutation", "DOMContentLoaded"),
    ],
  },
  {
    name: "Device",
    items: [globalEvent("device", "deviceorientation"), globalEvent("device", "devicemotion")],
  },
  {
    name: "Drag and Drop",
    items: [
      generalEvent("drag-and-drop", "drag"),
      generalEvent("drag-and-drop", "dragstart"),
      generalEvent("drag-and-drop", "dragend"),
      generalEvent("drag-and-drop", "dragenter"),
      generalEvent("drag-and-drop", "dragover"),
      generalEvent("drag-and-drop", "dragleave"),
      generalEvent("drag-and-drop", "drop"),
    ],
  },
  {
    name: "Keyboard",
    items: [
      Services.prefs && Services.prefs.getBoolPref("dom.input_events.beforeinput.enabled")
        ? generalEvent("keyboard", "beforeinput")
        : null,
      generalEvent("keyboard", "input"),
      generalEvent("keyboard", "keydown"),
      generalEvent("keyboard", "keyup"),
      generalEvent("keyboard", "keypress"),
    ].filter(Boolean) as FullEventType[],
  },
  {
    name: "Load",
    items: [
      globalEvent("load", "load"),
      // TODO: Disabled pending fixes for bug 1569775.
      // globalEvent("load", "beforeunload"),
      // globalEvent("load", "unload"),
      globalEvent("load", "abort"),
      globalEvent("load", "error"),
      globalEvent("load", "hashchange"),
      globalEvent("load", "popstate"),
    ],
  },
  {
    name: "Media",
    items: [
      mediaNodeEvent("media", "play"),
      mediaNodeEvent("media", "pause"),
      mediaNodeEvent("media", "playing"),
      mediaNodeEvent("media", "canplay"),
      mediaNodeEvent("media", "canplaythrough"),
      mediaNodeEvent("media", "seeking"),
      mediaNodeEvent("media", "seeked"),
      mediaNodeEvent("media", "timeupdate"),
      mediaNodeEvent("media", "ended"),
      mediaNodeEvent("media", "ratechange"),
      mediaNodeEvent("media", "durationchange"),
      mediaNodeEvent("media", "volumechange"),
      mediaNodeEvent("media", "loadstart"),
      mediaNodeEvent("media", "progress"),
      mediaNodeEvent("media", "suspend"),
      mediaNodeEvent("media", "abort"),
      mediaNodeEvent("media", "error"),
      mediaNodeEvent("media", "emptied"),
      mediaNodeEvent("media", "stalled"),
      mediaNodeEvent("media", "loadedmetadata"),
      mediaNodeEvent("media", "loadeddata"),
      mediaNodeEvent("media", "waiting"),
    ],
  },
  {
    name: "Mouse",
    items: [
      generalEvent("mouse", "auxclick"),
      generalEvent("mouse", "click"),
      generalEvent("mouse", "dblclick"),
      generalEvent("mouse", "mousedown"),
      generalEvent("mouse", "mouseup"),
      generalEvent("mouse", "mouseover"),
      generalEvent("mouse", "mousemove"),
      generalEvent("mouse", "mouseout"),
      generalEvent("mouse", "mouseenter"),
      generalEvent("mouse", "mouseleave"),
      generalEvent("mouse", "mousewheel"),
      generalEvent("mouse", "wheel"),
      generalEvent("mouse", "contextmenu"),
    ],
  },
  {
    name: "Pointer",
    items: [
      generalEvent("pointer", "pointerover"),
      generalEvent("pointer", "pointerout"),
      generalEvent("pointer", "pointerenter"),
      generalEvent("pointer", "pointerleave"),
      generalEvent("pointer", "pointerdown"),
      generalEvent("pointer", "pointerup"),
      generalEvent("pointer", "pointermove"),
      generalEvent("pointer", "pointercancel"),
      generalEvent("pointer", "gotpointercapture"),
      generalEvent("pointer", "lostpointercapture"),
    ],
  },
  {
    name: "Timer",
    items: [
      timerEvent("timeout", "set", "setTimeout", "setTimeout"),
      timerEvent("timeout", "clear", "clearTimeout", "clearTimeout"),
      timerEvent("timeout", "fire", "setTimeout fired", "setTimeoutCallback"),
      timerEvent("interval", "set", "setInterval", "setInterval"),
      timerEvent("interval", "clear", "clearInterval", "clearInterval"),
      timerEvent("interval", "fire", "setInterval fired", "setIntervalCallback"),
    ],
  },
  {
    name: "Touch",
    items: [
      generalEvent("touch", "touchstart"),
      generalEvent("touch", "touchmove"),
      generalEvent("touch", "touchend"),
      generalEvent("touch", "touchcancel"),
    ],
  },
  {
    name: "WebSocket",
    items: [
      webSocketEvent("websocket", "open"),
      webSocketEvent("websocket", "message"),
      webSocketEvent("websocket", "error"),
      webSocketEvent("websocket", "close"),
    ],
  },
  {
    name: "Worker",
    items: [
      workerEvent("message"),
      workerEvent("messageerror"),

      // Service Worker events.
      globalEvent("serviceworker", "fetch"),
    ],
  },
  {
    name: "XHR",
    items: [
      xhrEvent("xhr", "readystatechange"),
      xhrEvent("xhr", "load"),
      xhrEvent("xhr", "loadstart"),
      xhrEvent("xhr", "loadend"),
      xhrEvent("xhr", "abort"),
      xhrEvent("xhr", "error"),
      xhrEvent("xhr", "progress"),
      xhrEvent("xhr", "timeout"),
    ],
  },
];

const FLAT_EVENTS: FullEventType[] = [];
for (const category of AVAILABLE_BREAKPOINTS) {
  for (const event of category.items) {
    FLAT_EVENTS.push(event);
  }
}
const EVENTS_BY_ID: Record<string, FullEventType> = {};
for (const event of FLAT_EVENTS) {
  if (EVENTS_BY_ID[event.id]) {
    throw new Error("Duplicate event ID detected: " + event.id);
  }
  EVENTS_BY_ID[event.id] = event;
}

const SIMPLE_EVENTS: Record<string, string> = {};
const DOM_EVENTS: Record<string, Record<string, string>> = {};
for (const eventBP of FLAT_EVENTS) {
  if (eventBP.type === "simple") {
    const { notificationType } = eventBP;
    if (SIMPLE_EVENTS[notificationType!]) {
      throw new Error("Duplicate simple event");
    }
    SIMPLE_EVENTS[notificationType!] = eventBP.id;
  } else if (eventBP.type === "event") {
    const { eventType, filter } = eventBP;

    let targetTypes;
    if (filter === "global") {
      targetTypes = ["global"];
    } else if (filter === "xhr") {
      targetTypes = ["xhr"];
    } else if (filter === "websocket") {
      targetTypes = ["websocket"];
    } else if (filter === "worker") {
      targetTypes = ["worker"];
    } else if (filter === "general") {
      targetTypes = ["global", "node"];
    } else if (filter === "node" || filter === "media") {
      targetTypes = ["node"];
    } else {
      throw new Error("Unexpected filter type");
    }

    for (const targetType of targetTypes) {
      let byEventType = DOM_EVENTS[targetType];
      if (!byEventType) {
        byEventType = {};
        DOM_EVENTS[targetType] = byEventType;
      }

      if (byEventType[eventType!]) {
        throw new Error("Duplicate dom event: " + eventType);
      }
      byEventType[eventType!] = eventBP.id;
    }
  } else {
    throw new Error("Unknown type: " + eventBP.type);
  }
}

export function getAvailableEventBreakpoints(): EventTypeCategory[] {
  const available: EventTypeCategory[] = [];
  for (const { name, items } of AVAILABLE_BREAKPOINTS) {
    available.push({
      name,
      events: items.filter(Boolean).map(item => ({
        id: item.id,
        name: item.name,
      })),
    });
  }
  return available;
}
