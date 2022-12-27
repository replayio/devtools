import { CloseTimestamp } from "./Connection";
import { TimeRange, TimeStampedPointRange, MouseEvent, KeyboardEvent, NavigationEvent, Annotation, TimeStampedPoint, ExecutionPoint, PointRange } from "./Recording";
import { PauseId, CallStack, PauseData } from "./Pause";
/**
 * Unique identifier for a session which a recording has been loaded into.
 */
export declare type SessionId = string;
/**
 * Level at which a recording can be processed. After <code>basic</code>
 * processing, all console messages, sources, paints, and mouse events will
 * be available immediately.
 */
export declare type ProcessingLevel = "basic";
export interface ensureProcessedParameters {
    /**
     * Level at which the recording should be processed before returning.
     * Defaults to <code>basic</code> if omitted.
     */
    level?: ProcessingLevel;
}
export interface ensureProcessedResult {
}
export interface findMouseEventsParameters {
}
export interface findMouseEventsResult {
}
export interface findKeyboardEventsParameters {
}
export interface findKeyboardEventsResult {
}
export interface findNavigationEventsParameters {
}
export interface findNavigationEventsResult {
}
export interface findAnnotationsParameters {
    /**
     * Any kind to restrict the returned annotations to.
     */
    kind?: string;
}
export interface findAnnotationsResult {
}
export interface getAnnotationKindsParameters {
}
export interface getAnnotationKindsResult {
    kinds: string[];
}
export interface getEndpointParameters {
}
export interface getEndpointResult {
    endpoint: TimeStampedPoint;
}
export interface getPointNearTimeParameters {
    time: number;
}
export interface getPointNearTimeResult {
    point: TimeStampedPoint;
}
export interface getPointsBoundingTimeParameters {
    time: number;
}
export interface getPointsBoundingTimeResult {
    after: TimeStampedPoint;
    before: TimeStampedPoint;
}
export interface createPauseParameters {
    /**
     * Point to create the pause at.
     */
    point: ExecutionPoint;
}
export interface createPauseResult {
    /**
     * Identifier for the new pause.
     */
    pauseId: PauseId;
    /**
     * Stack contents, omitted if there are no frames on the stack at this point.
     */
    stack?: CallStack;
    /**
     * Data describing the frames on the stack and the in scope
     * variables of the topmost frame.
     */
    data: PauseData;
}
export interface releasePauseParameters {
    pauseId: PauseId;
}
export interface releasePauseResult {
}
export interface listenForLoadChangesParameters {
}
export interface listenForLoadChangesResult {
}
export interface requestFocusRangeParameters {
    /**
     * Range to load.
     */
    range: TimeRange;
}
export interface requestFocusRangeResult {
    /**
     * Focus range
     */
    window: PointRange;
}
export interface loadRegionParameters {
    /**
     * Region to load.
     */
    region: TimeRange;
}
export interface loadRegionResult {
}
export interface unloadRegionParameters {
    /**
     * Region to unload.
     */
    region: TimeRange;
}
export interface unloadRegionResult {
}
export interface getBuildIdParameters {
}
export interface getBuildIdResult {
    /**
     * Build identifier originally passed to the RecordReplayAttach API when
     * recording. The build ID includes the platform, target (e.g. gecko,
     * chromium, or node), build date, and a unique identifier. The format
     * of a build ID is not currently consistent between platforms, and is
     * subject to change over time.
     */
    buildId: string;
}
/**
 * Notify clients if the backend expects to destroy the session due to inactivity.
 * Clients are expected to present the user with a notification to allow them
 * to cancel the pending destroy.
 *
 * Clients may assume that this will be a one-time notification for each period
 * of inactivity, meaning that the destroy time will not change unless the
 * pending destroy was cancelled and a new period of inactivity arose.
 *
 * Clients may assume that they will not receive this notification more than
 * 30 minutes before the session is destroyed. The API will aim to provide
 * a minimum of several minutes of lead time to allow a user to provide input
 * to cancel the pending destroy.
 *
 * Clients can expect a <code>Recording.sessionError</code> event when
 * the session is destroyed.
 */
export interface mayDestroy {
    /**
     * The time when the backend expects to destroy the session, or
     * omitted to indicate that a previous pending destroy has been cancelled.
     */
    time?: CloseTimestamp;
}
/**
 * Notify clients if the backend expects to explicitly destroy a session with
 * no recourse for the user.
 *
 * Clients should handle the possibility of multiple events, but may assume
 * that the remaining time will only decrease in further events.
 *
 * Clients may assume that they will not receive this notification more than
 * 30 minutes before the session is destroyed. No explicit expectations
 * are placed on how much time clients will be given before the session is
 * destroyed, but sufficient time for a user to react and load a new session
 * is the goal.
 *
 * Clients can expect a <code>Recording.sessionError</code> event when
 * the session is destroyed.
 */
export interface willDestroy {
    /**
     * The time when the backend expects to destroy the session.
     */
    time: CloseTimestamp;
}
/**
 * Event describing regions of the recording that have not been uploaded.
 */
export interface missingRegions {
    /**
     * Regions that have not been uploaded.
     */
    regions: TimeRange[];
}
/**
 * Event describing regions of the recording that have not been processed.
 */
export interface unprocessedRegions {
    /**
     * Level at which the regions are unprocessed.
     */
    level: ProcessingLevel;
    /**
     * Regions of the recording that haven't been processed at the associated
     * level.
     */
    regions: TimeStampedPointRange[];
}
/**
 * Describes some mouse events that occur in the recording.
 */
export interface mouseEvents {
    events: MouseEvent[];
}
/**
 * Describes some keyboard events that occur in the recording.
 */
export interface keyboardEvents {
    events: KeyboardEvent[];
}
/**
 * Describes some navigate events that occur in the recording.
 */
export interface navigationEvents {
    events: NavigationEvent[];
}
/**
 * Describes some annotations in the recording.
 */
export interface annotations {
    annotations: Annotation[];
}
/**
 * Describes the regions of the recording which are loading or loaded.
 */
export interface loadedRegions {
    /**
     * Timespans which are fully loaded.
     */
    loaded: TimeStampedPointRange[];
    /**
     * Timespans which are in the process of loading. Pauses in these regions
     * can still be used, but will be slower.
     */
    loading: TimeStampedPointRange[];
    /**
     * Timespans which have been indexed. Note: Indexed timespans are a subset
     * of loading in the same way that loaded is a subset of loading.
     */
    indexed: TimeStampedPointRange[];
}
/**
 * An event indicating that something happened in a way that is not yet officially
 * supported in the protocol. This will only be emitted for sessions which
 * specified experimental settings when they were created.
 */
export interface experimentalEvent {
    /**
     * Kind of the event.
     */
    kind: string;
    /**
     * Any associated data for the event.
     */
    data?: any;
}
