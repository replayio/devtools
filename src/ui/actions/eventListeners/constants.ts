export type InteractionEventKind = "mousedown" | "keypress";

export const REACT_EVENT_PROPS: Record<InteractionEventKind, string[]> = {
  mousedown: ["onClick"],
  // Users may have added `onChange` to an <input>, or `onkeyPress` to other elements
  keypress: ["onChange", "onKeyPress"],
};

export const EVENT_CLASS_FOR_EVENT_TYPE: Record<InteractionEventKind, string[]> = {
  mousedown: ["MouseEvent"],
  keypress: ["InputEvent", "KeyboardEvent"],
};

export const REACT_16_EVENT_LISTENER_PROP_KEY = "__reactEventHandlers$";
export const REACT_17_18_EVENT_LISTENER_PROP_KEY = "__reactProps$";
