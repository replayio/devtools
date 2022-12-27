import { SessionId } from "./Session";
import { Proof } from "./Resource";
/**
 * Globally unique identifier for a recording.
 */
export declare type RecordingId = string;
/**
 * Unique identifier for the software used to produce a recording.
 */
export declare type BuildId = string;
/**
 * A point in time within a recording, specified as the elapsed time in
 * milliseconds since the recording started. Sub-millisecond resolution
 * is possible.
 */
export declare type TimeStamp = number;
/**
 * Description for a range of time within a recording.
 */
export interface TimeRange {
    begin: TimeStamp;
    end: TimeStamp;
}
/**
 * Identifier for a point within a recording at which the program state can be
 * inspected. Execution points are integers encoded as base-10 numeric strings,
 * such that smaller numbered points precede larger numbered ones. They can be
 * compared by e.g. converting to BigInts and then comparing those BigInts.
 */
export declare type ExecutionPoint = string;
/**
 * A range between two execution points in a recording.
 */
export interface PointRange {
    begin: ExecutionPoint;
    end: ExecutionPoint;
}
/**
 * An execution point and its associated time stamp. Recordings always have a
 * beginning execution point with value "0" and a time stamp of zero.
 */
export interface TimeStampedPoint {
    point: ExecutionPoint;
    time: TimeStamp;
}
/**
 * A range between two points, with associated time stamps.
 */
export interface TimeStampedPointRange {
    begin: TimeStampedPoint;
    end: TimeStampedPoint;
}
/**
 * A mouse event that occurs somewhere in a recording.
 */
export interface MouseEvent extends TimeStampedPoint {
    /**
     * Kind of mouse event.
     */
    kind: MouseEventKind;
    /**
     * X coordinate of the event, relative to the upper left of the page's main window.
     */
    clientX: number;
    /**
     * Y coordinate of the event, relative to the upper left of the page's main window.
     */
    clientY: number;
}
/**
 * Kinds of mouse events described in a recording.
 */
export declare type MouseEventKind = "mousemove" | "mousedown";
/**
 * A keyboard event that occurs somewhere in a recording.
 */
export interface KeyboardEvent extends TimeStampedPoint {
    /**
     * Kind of mouse event.
     */
    kind: KeyboardEventKind;
    /**
     * The DOM-spec key representing the key being pressed. See
     * https://www.w3.org/TR/uievents-code/ for more information.
     * Note: Depending on the platform being recorded, not all key events may be recordable.
     */
    key: string;
}
/**
 * Kinds of keyboard events described in a recording.
 * Note: Platforms should prefer to record key down/up events if possible, but keypress
 * is provided as a simpler fallback for platforms unable to track down/up events.
 */
export declare type KeyboardEventKind = "keydown" | "keyup" | "keypress";
/**
 * A navigate operation that occurs somewhere in a recording.
 */
export interface NavigationEvent extends TimeStampedPoint {
    /**
     * The kind of navigation that occured, if known.
     */
    kind?: string;
    /**
     * The URL that the top-level page navigated to.
     */
    url: string;
}
/**
 * An annotation that was added to a recording.
 */
export interface Annotation extends TimeStampedPoint {
    /**
     * Kind of annotation.
     */
    kind: string;
    /**
     * Data associated with the annotation.
     */
    contents: string;
}
/**
 * An opaque source map identifier.
 */
export declare type SourceMapId = string;
/**
 * The hash of a target for the sourcemap.
 *
 * See Resource.FileHash for further info in the expected format for
 * this hash string.
 */
export declare type SourceMapTargetHash = string;
export interface createSessionParameters {
    /**
     * Recording to load into the session.
     */
    recordingId: RecordingId;
    /**
     * Instead of waiting for the recording to be fully received, only wait until
     * enough of the recording has been received that this point can be loaded.
     */
    loadPoint?: ExecutionPoint;
    /**
     * Settings which can be used to configure the session in ways that are not
     * yet officially supported in the protocol.
     */
    experimentalSettings?: any;
    /**
     * Range to load.
     */
    focusWindow?: TimeRange;
}
export interface createSessionResult {
    /**
     * Identifier for the new session.
     */
    sessionId: SessionId;
}
export interface releaseSessionParameters {
    /**
     * Session to release.
     */
    sessionId: SessionId;
}
export interface releaseSessionResult {
}
export interface processRecordingParameters {
    recordingId: RecordingId;
}
export interface processRecordingResult {
}
export interface addSourceMapParameters {
    /**
     * Recording to apply the sourcemap to.
     */
    recordingId: RecordingId;
    /**
     * Limit this sourcemap to only apply to sources with this content hash.
     */
    targetContentHash?: SourceMapTargetHash;
    /**
     * Limit this sourcemap to only apply to sources with this url hash.
     */
    targetURLHash?: SourceMapTargetHash;
    /**
     * Limit this sourcemap to only apply to sources with this source-map-url hash.
     * e.g. The hash of the 'url' value from Target.getSourceMapURL/Target.getSheetSourceMapURL
     * to tie this map to.
     *
     * Using the url or content hash of the source itself is recommended for more
     * specificity, but if there is no URL and the content is unknown, such as
     * in the case for inline CSS, this is necessary.
     */
    targetMapURLHash?: SourceMapTargetHash;
    /**
     * The sourcemap's resource data.
     */
    resource: Proof;
    /**
     * The baseURL to use when resolving relative paths in the map.
     */
    baseURL: string;
}
export interface addSourceMapResult {
    id: SourceMapId;
}
export interface addOriginalSourceParameters {
    /**
     * Recording to get the description for.
     */
    recordingId: RecordingId;
    /**
     * The original source's resource data.
     */
    resource: Proof;
    /**
     * The parent sourcemap's id.
     */
    parentId: SourceMapId;
    /**
     * The offset in the parent sourcemap's 'sources'.
     */
    parentOffset: number;
}
export interface addOriginalSourceResult {
}
/**
 * Describes how much of a recording's data has been uploaded to the cloud service.
 */
export interface uploadedData {
    /**
     * Recording being described.
     */
    recordingId: RecordingId;
    /**
     * How many bytes of recording data have been received by the cloud service.
     */
    uploaded: number;
    /**
     * Total size of the recording in bytes, if known.
     */
    length?: number;
}
/**
 * Emitted during 'createSession' if all recording data has been received, but
 * sourcemaps are still pending.
 */
export interface awaitingSourcemaps {
    /**
     * Recording being described.
     */
    recordingId: RecordingId;
}
/**
 * Emitted when a session has died due to a server side problem.
 */
export interface sessionError {
    /**
     * Session which died.
     */
    sessionId: SessionId;
    /**
     * Numeric code for the error.
     */
    code: number;
    /**
     * Description of the error.
     */
    message: string;
}
