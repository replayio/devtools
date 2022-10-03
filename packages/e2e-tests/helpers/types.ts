export type Expected = string | boolean | number;

// TODO [FE-626] Would be nice to share this type with the production Console renderers
export type MessageType =
  | "console-error"
  | "console-log"
  | "console-warning"
  | "event"
  | "exception"
  | "log-point"
  | "terminal-expression";
