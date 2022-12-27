import { SourceId, PointDescription } from "./Debugger";
import { PauseId, Value, CallStack, PauseData } from "./Pause";
import { PointRange } from "./Recording";
/**
 * Contents of a console message.
 */
export interface Message {
    /**
     * Source of the message.
     */
    source: MessageSource;
    /**
     * Severity level of the message.
     */
    level: MessageLevel;
    /**
     * Any text associated with the message.
     */
    text: string;
    /**
     * Any URL associated with the message.
     */
    url?: string;
    /**
     * Any source associated with the message.
     */
    sourceId?: SourceId;
    /**
     * Any 1-indexed line number associated with the message.
     */
    line?: number;
    /**
     * Any 0-indexed column number associated with the message.
     */
    column?: number;
    /**
     * Point associated with the message. For messages added due to uncaught
     * exceptions this is the point at which the exception was thrown. For
     * other types of messages it is the point where the message was added.
     */
    point: PointDescription;
    /**
     * Pause ID associated with the message arguments and stack.
     */
    pauseId: PauseId;
    /**
     * Any arguments to the message.
     */
    argumentValues?: Value[];
    /**
     * Stack contents for the pause, omitted if there are no frames on the
     * stack at the message's point.
     */
    stack?: CallStack;
    /**
     * Data describing the message arguments and frames on the stack.
     */
    data: PauseData;
}
/**
 * Possible sources from which a message can originate.
 */
export declare type MessageSource = "PageError" | "ConsoleAPI";
/**
 * Severity level of a message.
 */
export declare type MessageLevel = "info" | "trace" | "warning" | "error" | "assert";
export interface findMessagesParameters {
}
export interface findMessagesResult {
    /**
     * Set if there were too many messages and not all were returned.
     */
    overflow?: boolean;
}
export interface findMessagesInRangeParameters {
    /**
     * Subrange of the recording to find messages within.
     */
    range: PointRange;
}
export interface findMessagesInRangeResult {
    /**
     * Messages within the specified range.
     */
    messages: Message[];
    /**
     * Whether there were too many messages and not all were returned.
     */
    overflow?: boolean;
}
/**
 * Describes a console message in the recording.
 */
export interface newMessage {
    /**
     * Contents of the message.
     */
    message: Message;
}
