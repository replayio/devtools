import uniq from "lodash/uniq";

export type Command = string;

const MAX_HISTORY_LENGTH = 1000;

export const appendToHistory = (command: Command, history: Command[]): Command[] => {
  return uniq([command, ...history].slice(0, MAX_HISTORY_LENGTH));
};
