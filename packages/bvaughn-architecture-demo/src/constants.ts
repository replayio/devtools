import { EventHandlerType } from "@replayio/protocol";

export type EventCategory = {
  category: string;
  eventTypeMap: { [eventType: EventHandlerType]: string };
};

// Forked from src/devtools/server/actors/utils/event-breakpoints.js
export const STANDARD_EVENT_CATEGORIES: EventCategory[] = [
  {
    category: "Animation",
    eventTypeMap: {
      "animationframe.request": "requestAnimationFrame",
      "animationframe.cancel": "cancelAnimationFrame",
      "animationframe.fire": "requestAnimationFrameCallback",
    },
  },
  {
    category: "Clipboard",
    eventTypeMap: {
      "event.clipboard.copy": "copy",
      "event.clipboard.cut": "cut",
      "event.clipboard.paste": "paste",
      "event.clipboard.beforecopy": "beforecopy",
      "event.clipboard.beforecut": "beforecut",
      "event.clipboard.beforepaste": "beforepaste",
    },
  },
  {
    category: "Control",
    eventTypeMap: {
      "event.control.resize": "resize",
      "event.control.scroll": "scroll",
      "event.control.zoom": "zoom",
      "event.control.focus": "focus",
      "event.control.blur": "blur",
      "event.control.select": "select",
      "event.control.change": "change",
      "event.control.submit": "submit",
      "event.control.reset": "reset",
    },
  },
  {
    category: "DOM Mutation",
    eventTypeMap: {
      // Deprecated DOM events.
      "event.dom-mutation.DOMActivate": "DOMActivate",
      "event.dom-mutation.DOMFocusIn": "DOMFocusIn",
      "event.dom-mutation.DOMFocusOut": "DOMFocusOut",

      // Standard DOM mutation events.
      "event.dom-mutation.DOMAttrModified": "DOMAttrModified",
      "event.dom-mutation.DOMCharacterDataModified": "DOMCharacterDataModified",
      "event.dom-mutation.DOMNodeInserted": "DOMNodeInserted",
      "event.dom-mutation.DOMNodeInsertedIntoDocument": "DOMNodeInsertedIntoDocument",
      "event.dom-mutation.DOMNodeRemoved": "DOMNodeRemoved",
      "event.dom-mutation.DOMNodeRemovedIntoDocument": "DOMNodeRemovedIntoDocument",
      "event.dom-mutation.DOMSubtreeModified": "DOMSubtreeModified",

      // DOM load events.
      "event.dom-mutation.DOMContentLoaded": "DOMContentLoaded",
    },
  },
  {
    category: "Device",
    eventTypeMap: {
      "event.device.deviceorientation": "deviceorientation",
      "event.device.devicemotio": "devicemotion",
    },
  },
  {
    category: "Drag and Drop",
    eventTypeMap: {
      "event.drag-and-drop.drag": "drag",
      "event.drag-and-drop.dragstart": "dragstart",
      "event.drag-and-drop.dragend": "dragend",
      "event.drag-and-drop.dragenter": "dragenter",
      "event.drag-and-drop.dragover": "dragover",
      "event.drag-and-drop.dragleave": "dragleave",
      "event.drag-and-drop.drop": "drop",
    },
  },
  {
    category: "Keyboard",
    eventTypeMap: {
      // TODO Check Services.prefs.getBoolPref("dom.input_events.beforeinput.enabled")
      "event.keyboard.beforeinput": "beforeinput",
      "event.keyboard.input": "input",
      "event.keyboard.keydown": "keydown",
      "event.keyboard.keyup": "keyup",
      "event.keyboard.keypress": "keypress",
    },
  },
  {
    category: "Load",
    eventTypeMap: {
      "event.load.load": "load",
      // TODO: Disabled pending fixes for bug 1569775.
      // globalEvent("load", "beforeunload"),
      // globalEvent("load", "unload"),
      "event.load.abort": "abort",
      "event.load.error": "error",
      "event.load.hashchange": "hashchange",
      "event.load.popstate": "popstate",
    },
  },
  {
    category: "Media",
    eventTypeMap: {
      "event.media.play": "play",
      "event.media.pause": "pause",
      "event.media.playing": "playing",
      "event.media.canplay": "canplay",
      "event.media.canplaythrough": "canplaythrough",
      "event.media.seeking": "seeking",
      "event.media.seeked": "seeked",
      "event.media.timeupdate": "timeupdate",
      "event.media.ended": "ended",
      "event.media.ratechange": "ratechange",
      "event.media.durationchange": "durationchange",
      "event.media.volumechange": "volumechange",
      "event.media.loadstart": "loadstart",
      "event.media.progress": "progress",
      "event.media.suspend": "suspend",
      "event.media.abort": "abort",
      "event.media.error": "error",
      "event.media.emptied": "emptied",
      "event.media.stalled": "stalled",
      "event.media.loadedmetadata": "loadedmetadata",
      "event.media.loadeddata": "loadeddata",
      "event.media.waiting": "waiting",
    },
  },
  {
    category: "Mouse",
    eventTypeMap: {
      "event.mouse.auxclick": "auxclick",
      "event.mouse.click": "click",
      "event.mouse.dblclick": "dblclick",
      "event.mouse.mousedown": "mousedown",
      "event.mouse.mouseup": "mouseup",
      "event.mouse.mouseover": "mouseover",
      "event.mouse.mousemove": "mousemove",
      "event.mouse.mouseout": "mouseout",
      "event.mouse.mouseenter": "mouseenter",
      "event.mouse.mouseleave": "mouseleave",
      "event.mouse.mousewheel": "mousewheel",
      "event.mouse.wheel": "wheel",
      "event.mouse.contextmenu": "contextmenu",
    },
  },
  {
    category: "Pointer",
    eventTypeMap: {
      "event.pointer.pointerover": "pointerover",
      "event.pointer.pointerout": "pointerout",
      "event.pointer.pointerenter": "pointerenter",
      "event.pointer.pointerleave": "pointerleave",
      "event.pointer.pointerdown": "pointerdown",
      "event.pointer.pointerup": "pointerup",
      "event.pointer.pointermove": "pointermove",
      "event.pointer.pointercancel": "pointercancel",
      "event.pointer.gotpointercapture": "gotpointercapture",
      "event.pointer.lostpointercapture": "lostpointercapture",
    },
  },
  {
    category: "Timer",
    eventTypeMap: {
      "timer.timeout.set": "setTimeout",
      "timer.timeout.clear": "clearTimeout",
      "timer.timeout.fire": "setTimeoutCallback",
      "timer.interval.set": "setInterval",
      "timer.interval.clear": "clearInterval",
      "timer.interval.fire": "setIntervalCallback",
    },
  },
  {
    category: "Touch",
    eventTypeMap: {
      "event.touch.touchstart": "touchstart",
      "event.touch.touchmove": "touchmove",
      "event.touch.touchend": "touchend",
      "event.touch.touchcancel": "touchcancel",
    },
  },
  {
    category: "WebSocket",
    eventTypeMap: {
      "event.websocket.open": "open",
      "event.websocket.message": "message",
      "event.websocket.error": "error",
      "event.websocket.close": "close",
    },
  },
  {
    category: "Worker",
    eventTypeMap: {
      "event.message": "message",
      "event.messageerror": "messageerror",

      // Service Worker events.
      "event.serviceworker.fetch": "fetch",
    },
  },
  {
    category: "XHR",
    eventTypeMap: {
      "event.xhr.readystatechange": "readystatechange",
      "event.xhr.load": "load",
      "event.xhr.loadstart": "loadstart",
      "event.xhr.loadend": "loadend",
      "event.xhr.abort": "abort",
      "event.xhr.error": "error",
      "event.xhr.progress": "progress",
      "event.xhr.timeout": "timeout",
    },
  },
];
