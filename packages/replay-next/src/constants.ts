import { EventHandlerType } from "@replayio/protocol";

type EventCategory = {
  category: string;
  events: Array<{
    label: string;
    type: EventHandlerType;
  }>;
};

// Forked from src/devtools/server/actors/utils/event-breakpoints.js
export const STANDARD_EVENT_CATEGORIES: EventCategory[] = [
  {
    category: "Animation",
    events: [
      { type: "animationframe.request", label: "requestAnimationFrame" },
      { type: "animationframe.cancel", label: "cancelAnimationFrame" },
      { type: "animationframe.fire", label: "requestAnimationFrameCallback" },
    ],
  },
  {
    category: "Clipboard",
    events: [
      { type: "event.clipboard.copy", label: "copy" },
      { type: "event.clipboard.cut", label: "cut" },
      { type: "event.clipboard.paste", label: "paste" },
      { type: "event.clipboard.beforecopy", label: "beforecopy" },
      { type: "event.clipboard.beforecut", label: "beforecut" },
      { type: "event.clipboard.beforepaste", label: "beforepaste" },
    ],
  },
  {
    category: "Control",
    events: [
      { type: "event.control.resize", label: "resize" },
      { type: "event.control.scroll", label: "scroll" },
      { type: "event.control.zoom", label: "zoom" },
      { type: "event.control.focus", label: "focus" },
      { type: "event.control.blur", label: "blur" },
      { type: "event.control.select", label: "select" },
      { type: "event.control.change", label: "change" },
      { type: "event.control.submit", label: "submit" },
      { type: "event.control.reset", label: "reset" },
    ],
  },
  {
    category: "DOM Mutation",
    events: [
      // Deprecated DOM events.
      { type: "event.dom-mutation.DOMActivate", label: "DOMActivate" },
      { type: "event.dom-mutation.DOMFocusIn", label: "DOMFocusIn" },
      { type: "event.dom-mutation.DOMFocusOut", label: "DOMFocusOut" },

      // Standard DOM mutation events.
      { type: "event.dom-mutation.DOMAttrModified", label: "DOMAttrModified" },
      { type: "event.dom-mutation.DOMCharacterDataModified", label: "DOMCharacterDataModified" },
      { type: "event.dom-mutation.DOMNodeInserted", label: "DOMNodeInserted" },
      {
        type: "event.dom-mutation.DOMNodeInsertedIntoDocument",
        label: "DOMNodeInsertedIntoDocument",
      },
      { type: "event.dom-mutation.DOMNodeRemoved", label: "DOMNodeRemoved" },
      {
        type: "event.dom-mutation.DOMNodeRemovedIntoDocument",
        label: "DOMNodeRemovedIntoDocument",
      },
      { type: "event.dom-mutation.DOMSubtreeModified", label: "DOMSubtreeModified" },

      // DOM load events.
      { type: "event.dom-mutation.DOMContentLoaded", label: "DOMContentLoaded" },
    ],
  },
  {
    category: "Device",
    events: [
      { type: "event.device.deviceorientation", label: "deviceorientation" },
      { type: "event.device.devicemotio", label: "devicemotion" },
    ],
  },
  {
    category: "Drag and Drop",
    events: [
      { type: "event.drag-and-drop.drag", label: "drag" },
      { type: "event.drag-and-drop.dragstart", label: "dragstart" },
      { type: "event.drag-and-drop.dragend", label: "dragend" },
      { type: "event.drag-and-drop.dragenter", label: "dragenter" },
      { type: "event.drag-and-drop.dragover", label: "dragover" },
      { type: "event.drag-and-drop.dragleave", label: "dragleave" },
      { type: "event.drag-and-drop.drop", label: "drop" },
    ],
  },
  {
    category: "Keyboard",
    events: [
      { type: "event.keyboard.beforeinput", label: "beforeinput" },
      { type: "event.keyboard.input", label: "input" },
      { type: "event.keyboard.keydown", label: "keydown" },
      { type: "event.keyboard.keyup", label: "keyup" },
      { type: "event.keyboard.keypress", label: "keypress" },
    ],
  },
  {
    category: "Load",
    events: [
      { type: "event.load.load", label: "load" },
      // TODO: Disabled pending fixes for bug 1569775.
      // globalEvent("load", "beforeunload"),
      // globalEvent("load", "unload"),
      { type: "event.load.abort", label: "abort" },
      { type: "event.load.error", label: "error" },
      { type: "event.load.hashchange", label: "hashchange" },
      { type: "event.load.popstate", label: "popstate" },
    ],
  },
  {
    category: "Media",
    events: [
      { type: "event.media.play", label: "play" },
      { type: "event.media.pause", label: "pause" },
      { type: "event.media.playing", label: "playing" },
      { type: "event.media.canplay", label: "canplay" },
      { type: "event.media.canplaythrough", label: "canplaythrough" },
      { type: "event.media.seeking", label: "seeking" },
      { type: "event.media.seeked", label: "seeked" },
      { type: "event.media.timeupdate", label: "timeupdate" },
      { type: "event.media.ended", label: "ended" },
      { type: "event.media.ratechange", label: "ratechange" },
      { type: "event.media.durationchange", label: "durationchange" },
      { type: "event.media.volumechange", label: "volumechange" },
      { type: "event.media.loadstart", label: "loadstart" },
      { type: "event.media.progress", label: "progress" },
      { type: "event.media.suspend", label: "suspend" },
      { type: "event.media.abort", label: "abort" },
      { type: "event.media.error", label: "error" },
      { type: "event.media.emptied", label: "emptied" },
      { type: "event.media.stalled", label: "stalled" },
      { type: "event.media.loadedmetadata", label: "loadedmetadata" },
      { type: "event.media.loadeddata", label: "loadeddata" },
      { type: "event.media.waiting", label: "waiting" },
    ],
  },
  {
    category: "Mouse",
    events: [
      { type: "event.mouse.auxclick", label: "auxclick" },
      { type: "event.mouse.click", label: "click" },
      { type: "event.mouse.dblclick", label: "dblclick" },
      { type: "event.mouse.mousedown", label: "mousedown" },
      { type: "event.mouse.mouseup", label: "mouseup" },
      { type: "event.mouse.mouseover", label: "mouseover" },
      { type: "event.mouse.mousemove", label: "mousemove" },
      { type: "event.mouse.mouseout", label: "mouseout" },
      { type: "event.mouse.mouseenter", label: "mouseenter" },
      { type: "event.mouse.mouseleave", label: "mouseleave" },
      { type: "event.mouse.mousewheel", label: "mousewheel" },
      { type: "event.mouse.wheel", label: "wheel" },
      { type: "event.mouse.contextmenu", label: "contextmenu" },
    ],
  },
  {
    category: "Pointer",
    events: [
      { type: "event.pointer.pointerover", label: "pointerover" },
      { type: "event.pointer.pointerout", label: "pointerout" },
      { type: "event.pointer.pointerenter", label: "pointerenter" },
      { type: "event.pointer.pointerleave", label: "pointerleave" },
      { type: "event.pointer.pointerdown", label: "pointerdown" },
      { type: "event.pointer.pointerup", label: "pointerup" },
      { type: "event.pointer.pointermove", label: "pointermove" },
      { type: "event.pointer.pointercancel", label: "pointercancel" },
      { type: "event.pointer.gotpointercapture", label: "gotpointercapture" },
      { type: "event.pointer.lostpointercapture", label: "lostpointercapture" },
    ],
  },
  {
    category: "Timer",
    events: [
      { type: "timer.timeout.set", label: "setTimeout" },
      { type: "timer.timeout.clear", label: "clearTimeout" },
      { type: "timer.timeout.fire", label: "setTimeoutCallback" },
      { type: "timer.interval.set", label: "setInterval" },
      { type: "timer.interval.clear", label: "clearInterval" },
      { type: "timer.interval.fire", label: "setIntervalCallback" },
    ],
  },
  {
    category: "Touch",
    events: [
      { type: "event.touch.touchstart", label: "touchstart" },
      { type: "event.touch.touchmove", label: "touchmove" },
      { type: "event.touch.touchend", label: "touchend" },
      { type: "event.touch.touchcancel", label: "touchcancel" },
    ],
  },
  {
    category: "WebSocket",
    events: [
      { type: "event.websocket.open", label: "open" },
      { type: "event.websocket.message", label: "message" },
      { type: "event.websocket.error", label: "error" },
      { type: "event.websocket.close", label: "close" },
    ],
  },
  {
    category: "Worker",
    events: [
      { type: "event.message", label: "message" },
      { type: "event.messageerror", label: "messageerror" },

      // Service Worker events.
      { type: "event.serviceworker.fetch", label: "fetch" },
    ],
  },
  {
    category: "XHR",
    events: [
      { type: "event.xhr.readystatechange", label: "readystatechange" },
      { type: "event.xhr.load", label: "load" },
      { type: "event.xhr.loadstart", label: "loadstart" },
      { type: "event.xhr.loadend", label: "loadend" },
      { type: "event.xhr.abort", label: "abort" },
      { type: "event.xhr.error", label: "error" },
      { type: "event.xhr.progress", label: "progress" },
      { type: "event.xhr.timeout", label: "timeout" },
    ],
  },
];
