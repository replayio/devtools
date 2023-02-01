import { CommandMethods, CommandParams, CommandResult, ExecutionPoint } from "@replayio/protocol";

/**
 * The type of the built-in `sendCommand` method, in scope in Analysis mappers
 *
 * To use this, use a TS variable declaration in the file with the mapper:
 *
 * ```ts
 * declare let sendCommand: SendCommand
 *
 * function myMapper() {
 *   const res = sendCommand("Pause.getTopFrame", {})
 * }
 * ```
 */
export type SendCommand = <CM extends CommandMethods>(
  message: CM,
  parameters: CommandParams<CM>
) => CommandResult<CM>;

/** The `input` variable in scope in analysis mappers */
export type AnalysisInput = { time: number; pauseId: string; point: ExecutionPoint };

export type AnalysisResultWrapper<T> = {
  key: string | number;
  value: T;
};

/**
 * Strips the outer `function() { }` off of a `fn.toString()` and returns the body
 *
 * Use this to turn a normal TS function into a string for use as an Analysis mapper.
 *
 * **Note**: this _also_ removes _all comments_ from inside the function as well!
 */
export function getFunctionBody(fn: Function) {
  function removeCommentsFromSource(str: string) {
    return str.replace(/(?:\/\*(?:[\s\S]*?)\*\/)|(?:([\s;])+\/\/(?:.*)$)/gm, "$1");
  }
  var s = removeCommentsFromSource(fn.toString());
  return s.substring(s.indexOf("{") + 1, s.lastIndexOf("}"));
}
