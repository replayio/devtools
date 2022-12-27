import { mayDisconnect, willDisconnect } from "../../protocol/Connection";
import { uploadedData, awaitingSourcemaps, sessionError, createSessionParameters, releaseSessionParameters, processRecordingParameters, addSourceMapParameters, addOriginalSourceParameters } from "../../protocol/Recording";
import { tokenParameters, existsParameters, createParameters } from "../../protocol/Resource";
import { setAccessTokenParameters } from "../../protocol/Authentication";
import { mayDestroy, willDestroy, missingRegions, unprocessedRegions, mouseEvents, keyboardEvents, navigationEvents, annotations, loadedRegions, experimentalEvent, ensureProcessedParameters, findMouseEventsParameters, findKeyboardEventsParameters, findNavigationEventsParameters, findAnnotationsParameters, getAnnotationKindsParameters, getEndpointParameters, getPointNearTimeParameters, getPointsBoundingTimeParameters, createPauseParameters, releasePauseParameters, listenForLoadChangesParameters, requestFocusRangeParameters, loadRegionParameters, unloadRegionParameters, getBuildIdParameters } from "../../protocol/Session";
import { paintPoints, findPaintsParameters, getPaintContentsParameters, getDevicePixelRatioParameters } from "../../protocol/Graphics";
import { newSource, sourceContentsInfo, sourceContentsChunk, searchSourceContentsMatches, functionsMatches, findSourcesParameters, streamSourceContentsParameters, getSourceContentsParameters, getSourceMapParameters, getScopeMapParameters, getPossibleBreakpointsParameters, getHitCountsParameters, getEventHandlerCountParameters, getEventHandlerCountsParameters, searchSourceContentsParameters, getMappedLocationParameters, setBreakpointParameters, removeBreakpointParameters, findResumeTargetParameters, findRewindTargetParameters, findReverseStepOverTargetParameters, findStepOverTargetParameters, findStepInTargetParameters, findStepOutTargetParameters, blackboxSourceParameters, unblackboxSourceParameters, searchFunctionsParameters } from "../../protocol/Debugger";
import { newMessage, findMessagesParameters, findMessagesInRangeParameters } from "../../protocol/Console";
import { evaluateInFrameParameters, evaluateInGlobalParameters, getObjectPropertyParameters, callFunctionParameters, callObjectPropertyParameters, getObjectPreviewParameters, getScopeParameters, getTopFrameParameters, getAllFramesParameters, getFrameArgumentsParameters, getFrameStepsParameters, getExceptionValueParameters } from "../../protocol/Pause";
import { getDocumentParameters, getParentNodesParameters, querySelectorParameters, getEventListenersParameters, getBoxModelParameters, getBoundingClientRectParameters, getAllBoundingClientRectsParameters, performSearchParameters, repaintGraphicsParameters } from "../../protocol/DOM";
import { getComputedStyleParameters, getAppliedRulesParameters } from "../../protocol/CSS";
import { analysisResult, analysisError, analysisPoints, createAnalysisParameters, addLocationParameters, addFunctionEntryPointsParameters, addRandomPointsParameters, addEventHandlerEntryPointsParameters, addExceptionPointsParameters, addPointsParameters, runAnalysisParameters, releaseAnalysisParameters, findAnalysisPointsParameters } from "../../protocol/Analysis";
import { requestBodyData, responseBodyData, requests, getRequestBodyParameters, getResponseBodyParameters, findRequestsParameters } from "../../protocol/Network";
import { getCapabilitiesParameters, convertLocationToFunctionOffsetParameters, convertFunctionOffsetToLocationParameters, convertFunctionOffsetsToLocationsParameters, getStepOffsetsParameters, getHTMLSourceParameters, getFunctionsInRangeParameters, getSourceMapURLParameters, getSheetSourceMapURLParameters, getCurrentMessageContentsParameters, countStackFramesParameters, getStackFunctionIDsParameters, currentGeneratorIdParameters, topFrameLocationParameters, getCurrentNetworkRequestEventParameters, getCurrentNetworkStreamDataParameters, getPossibleBreakpointsForMultipleSourcesParameters } from "../../protocol/Target";
import { createRecordingParameters, setRecordingMetadataParameters, addRecordingDataParameters, finishRecordingParameters, beginRecordingResourceUploadParameters, endRecordingResourceUploadParameters, echoParameters, reportCrashParameters } from "../../protocol/Internal";
import { GenericProtocolClient } from "../generic";
export declare class ProtocolClient {
    private readonly genericClient;
    constructor(genericClient: GenericProtocolClient);
    /**
     * General information about the Websocket connection state.
     */
    Connection: {
        /**
         * Notify clients if the backend expects to disconnect the socket due to inactivity.
         * Clients are expected to present the user with a notification to allow them
         * to cancel the pending disconnect.
         *
         * Clients may assume that this will be a one-time notification for each period
         * of inactivity, meaning that the disconnect time will not change unless the
         * pending disconnect was cancelled and a new period of inactivity arose.
         *
         * Clients may assume that they will not receive this notification more than
         * 30 minutes before the connection is closed. The API will aim to provide
         * a minimum of several minutes of lead time to allow a user to provide input
         * to cancel the pending disconnect.
         */
        addMayDisconnectListener: (listener: (parameters: mayDisconnect) => void) => void;
        removeMayDisconnectListener: (listener?: ((parameters: mayDisconnect) => void) | undefined) => void | undefined;
        /**
         * Notify clients if the backend expects to explicitly disconnect a socket with
         * no recourse for the user.
         *
         * Clients should handle the possibility of multiple events, but may assume
         * that the remaining time will only decrease in further events.
         *
         * Clients may assume that they will not receive this notification more than
         * 30 minutes before the connection is closed. No explicit expectations
         * are placed on how much time clients will be given before the connection is
         * closed, but sufficient time for a user to react and perform an action to
         * reconnect is the goal.
         */
        addWillDisconnectListener: (listener: (parameters: willDisconnect) => void) => void;
        removeWillDisconnectListener: (listener?: ((parameters: willDisconnect) => void) | undefined) => void | undefined;
    };
    /**
     * The Recording domain defines methods for managing recordings.
     */
    Recording: {
        /**
         * Describes how much of a recording's data has been uploaded to the cloud service.
         */
        addUploadedDataListener: (listener: (parameters: uploadedData) => void) => void;
        removeUploadedDataListener: (listener?: ((parameters: uploadedData) => void) | undefined) => void | undefined;
        /**
         * Emitted during 'createSession' if all recording data has been received, but
         * sourcemaps are still pending.
         */
        addAwaitingSourcemapsListener: (listener: (parameters: awaitingSourcemaps) => void) => void;
        removeAwaitingSourcemapsListener: (listener?: ((parameters: awaitingSourcemaps) => void) | undefined) => void | undefined;
        /**
         * Emitted when a session has died due to a server side problem.
         */
        addSessionErrorListener: (listener: (parameters: sessionError) => void) => void;
        removeSessionErrorListener: (listener?: ((parameters: sessionError) => void) | undefined) => void | undefined;
        /**
         * Create a session for inspecting a recording. This command does not return
         * until the recording's contents have been fully received, unless
         * <code>loadPoint</code> is specified. If the contents
         * are incomplete, <code>uploadedData</code> events will be periodically
         * emitted before the command returns. After creating, a <code>sessionError</code>
         * events may be emitted later if the session dies unexpectedly.
         */
        createSession: (parameters: createSessionParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Recording").createSessionResult>;
        /**
         * Release a session and allow its resources to be reclaimed.
         */
        releaseSession: (parameters: releaseSessionParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Recording").releaseSessionResult>;
        /**
         * Begin processing a recording, even if no sessions have been created for it.
         * After calling this, sessions created for the recording (on this connection,
         * or another) may start in a partially or fully processed state and start
         * being used immediately.
         */
        processRecording: (parameters: processRecordingParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Recording").processRecordingResult>;
        /**
         * Add a sourcemap to the recording.
         *
         * The sourcemap will be applied to any file that matches the given
         * set of target hash filters.
         */
        addSourceMap: (parameters: addSourceMapParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Recording").addSourceMapResult>;
        /**
         * Add original source content to a given sourcemap.
         *
         * SourceMaps do not always contain the original source, so this
         * this allows users to explicitly associate the correct source content
         * with a source in the map.
         */
        addOriginalSource: (parameters: addOriginalSourceParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Recording").addOriginalSourceResult>;
    };
    /**
     * The commands for uploading and processing resource files.
     */
    Resource: {
        /**
         * Get the token to use when computing the hashes of a given file.
         */
        token: (parameters: tokenParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Resource").tokenResult>;
        /**
         * Check if a given resource already exists on our servers.
         */
        exists: (parameters: existsParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Resource").existsResult>;
        /**
         * Upload a file, and for ease of use, get a resource proof for it.
         */
        create: (parameters: createParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Resource").createResult>;
    };
    /**
     * The Authentication domain defines a command for authenticating the current user.
     */
    Authentication: {
        /**
         * Set the user's current access token
         */
        setAccessToken: (parameters: setAccessTokenParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Authentication").setAccessTokenResult>;
    };
    /**
     * The Session domain defines methods for using recording sessions. In order to
     * inspect a recording, it must first be loaded into a session via
     * <code>Recording.createSession</code>.
     *
     * After the session is created, it may be in an unprocessed or partially
     * processed state. As documented, some commands do not return until the session
     * has fully processed the recording. Processing starts automatically after the
     * session is created.
     *
     * <br><br>All commands and events in this domain must include a <code>sessionId</code>.
     */
    Session: {
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
        addMayDestroyListener: (listener: (parameters: mayDestroy) => void) => void;
        removeMayDestroyListener: (listener?: ((parameters: mayDestroy) => void) | undefined) => void | undefined;
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
        addWillDestroyListener: (listener: (parameters: willDestroy) => void) => void;
        removeWillDestroyListener: (listener?: ((parameters: willDestroy) => void) | undefined) => void | undefined;
        /**
         * Event describing regions of the recording that have not been uploaded.
         */
        addMissingRegionsListener: (listener: (parameters: missingRegions) => void) => void;
        removeMissingRegionsListener: (listener?: ((parameters: missingRegions) => void) | undefined) => void | undefined;
        /**
         * Event describing regions of the recording that have not been processed.
         */
        addUnprocessedRegionsListener: (listener: (parameters: unprocessedRegions) => void) => void;
        removeUnprocessedRegionsListener: (listener?: ((parameters: unprocessedRegions) => void) | undefined) => void | undefined;
        /**
         * Describes some mouse events that occur in the recording.
         */
        addMouseEventsListener: (listener: (parameters: mouseEvents) => void) => void;
        removeMouseEventsListener: (listener?: ((parameters: mouseEvents) => void) | undefined) => void | undefined;
        /**
         * Describes some keyboard events that occur in the recording.
         */
        addKeyboardEventsListener: (listener: (parameters: keyboardEvents) => void) => void;
        removeKeyboardEventsListener: (listener?: ((parameters: keyboardEvents) => void) | undefined) => void | undefined;
        /**
         * Describes some navigate events that occur in the recording.
         */
        addNavigationEventsListener: (listener: (parameters: navigationEvents) => void) => void;
        removeNavigationEventsListener: (listener?: ((parameters: navigationEvents) => void) | undefined) => void | undefined;
        /**
         * Describes some annotations in the recording.
         */
        addAnnotationsListener: (listener: (parameters: annotations) => void) => void;
        removeAnnotationsListener: (listener?: ((parameters: annotations) => void) | undefined) => void | undefined;
        /**
         * Describes the regions of the recording which are loading or loaded.
         */
        addLoadedRegionsListener: (listener: (parameters: loadedRegions) => void) => void;
        removeLoadedRegionsListener: (listener?: ((parameters: loadedRegions) => void) | undefined) => void | undefined;
        /**
         * An event indicating that something happened in a way that is not yet officially
         * supported in the protocol. This will only be emitted for sessions which
         * specified experimental settings when they were created.
         */
        addExperimentalEventListener: (listener: (parameters: experimentalEvent) => void) => void;
        removeExperimentalEventListener: (listener?: ((parameters: experimentalEvent) => void) | undefined) => void | undefined;
        /**
         * Does not return until the recording is fully processed. Before returning,
         * <code>missingRegions</code> and <code>unprocessedRegions</code> events will
         * be periodically emitted. Commands which require inspecting the recording
         * will not return until that part of the recording has been processed,
         * see <code>ProcessingLevel</code> for details.
         */
        ensureProcessed: (parameters: ensureProcessedParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Session").ensureProcessedResult>;
        /**
         * Find all points in the recording at which a mouse move or click occurred.
         * Does not return until the recording is fully processed. Before returning,
         * <code>mouseEvents</code> events will be periodically emitted. The union
         * of all these events describes all mouse events in the recording.
         */
        findMouseEvents: (parameters: findMouseEventsParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Session").findMouseEventsResult>;
        /**
         * Find all points in the recording at which a keyboard event occurred.
         * Does not return until the recording is fully processed. Before returning,
         * <code>keyboardEvents</code> events will be periodically emitted. The union
         * of all these events describes all keyboard events in the recording.
         */
        findKeyboardEvents: (parameters: findKeyboardEventsParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Session").findKeyboardEventsResult>;
        findNavigationEvents: (parameters: findNavigationEventsParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Session").findNavigationEventsResult>;
        /**
         * Find all points in the recording at which an annotation was added via the
         * RecordReplayOnAnnotation driver API. Does not return until the recording
         * is fully processed. Before returning, <code>annotations</code> events will
         * be periodically emitted, which describe all annotations in the recording,
         * or all annotations of the provided kind.
         */
        findAnnotations: (parameters: findAnnotationsParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Session").findAnnotationsResult>;
        /**
         * Get the different kinds of annotations in the recording.
         */
        getAnnotationKinds: (parameters: getAnnotationKindsParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Session").getAnnotationKindsResult>;
        /**
         * Get the last execution point in the recording.
         */
        getEndpoint: (parameters: getEndpointParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Session").getEndpointResult>;
        /**
         * Get a point near a given time in the recording. Unlike other commands, this
         * command will not raise an error if it is performed for an unloaded time.
         */
        getPointNearTime: (parameters: getPointNearTimeParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Session").getPointNearTimeResult>;
        /**
         * Get points bounding a time. Much like <code>getPointNearTime</code>,
         * this command will not raise an error if it is performed for an unloaded
         * time.
         */
        getPointsBoundingTime: (parameters: getPointsBoundingTimeParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Session").getPointsBoundingTimeResult>;
        /**
         * Create a pause describing the state at an execution point.
         */
        createPause: (parameters: createPauseParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Session").createPauseResult>;
        /**
         * Release a pause and allow its resources to be reclaimed.
         */
        releasePause: (parameters: releasePauseParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Session").releasePauseResult>;
        /**
         * Listen for changes in the loading status of parts of the recording.
         * Does not return until the session has been released. Before returning,
         * <code>loadedRegions</code> events will be emitted when their status changes.
         * By default, the entire recording is loaded. If the recording is long enough,
         * earlier loaded regions may be unloaded to reduce backend resource usage.
         * Pauses cannot be created or used in unloaded parts of the recording,
         * and execution information for analyses and other commands like
         * <code>Debugger.getHitCounts</code> will not be available.
         */
        listenForLoadChanges: (parameters: listenForLoadChangesParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Session").listenForLoadChangesResult>;
        /**
         * Request to load a range between two timestamps. This command will unload areas outside
         * of the requested range.
         *
         * After this command returns, any future commands that are sent will use the
         * new loading range, and might need to wait until it finishes loading
         * before they return.
         *
         * Commands which are sent before this returns or which were still in progress
         * when this was sent may use either the earlier loaded range, the newly
         * loaded range, or some combination of the two.
         */
        requestFocusRange: (parameters: requestFocusRangeParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Session").requestFocusRangeResult>;
        /**
         * Request that an unloaded part of the recording start loading.
         *
         * After this command returns, any future commands that are sent will use the
         * new loading set of regions, and might need to wait until they finish loading
         * before they return.
         *
         * Commands which are sent before this returns or which were still in progress
         * when this was sent may use either the earlier loaded regions, the newly
         * loaded regions, or some combination of the two.
         */
        loadRegion: (parameters: loadRegionParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Session").loadRegionResult>;
        /**
         * Request that part of the recording be unloaded. As for <code>Session.loadRegion</code>,
         * the newly loaded regions will take effect after the command returns, and commands
         * which are sent before this returns or are in progress when it is sent may or may
         * not use the newly loaded regions.
         */
        unloadRegion: (parameters: unloadRegionParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Session").unloadRegionResult>;
        /**
         * Get the identifier of the build used to produce the recording.
         */
        getBuildId: (parameters: getBuildIdParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Session").getBuildIdResult>;
    };
    /**
     * The Graphics domain defines methods for accessing a recording's graphics data.
     *
     * <br><br>All commands and events in this domain must include a <code>sessionId</code>.
     */
    Graphics: {
        /**
         * Describes some points in the recording at which paints occurred. No paint
         * will occur for the recording's beginning execution point.
         */
        addPaintPointsListener: (listener: (parameters: paintPoints) => void) => void;
        removePaintPointsListener: (listener?: ((parameters: paintPoints) => void) | undefined) => void | undefined;
        /**
         * Find all points in the recording at which paints occurred. Does not return
         * until the recording is fully processed. Before returning,
         * <code>paintPoints</code> events will be periodically emitted. The union
         * of all these events describes all paint points in the recording.
         */
        findPaints: (parameters: findPaintsParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Graphics").findPaintsResult>;
        /**
         * Get the graphics at a point where a paint occurred.
         */
        getPaintContents: (parameters: getPaintContentsParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Graphics").getPaintContentsResult>;
        /**
         * Get the value of <code>window.devicePixelRatio</code>. This is the ratio of
         * pixels in screen shots to pixels used by DOM/CSS data such as
         * <code>DOM.getBoundingClientRect</code>.
         */
        getDevicePixelRatio: (parameters: getDevicePixelRatioParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Graphics").getDevicePixelRatioResult>;
    };
    /**
     * The Debugger domain defines methods for accessing sources in the recording
     * and navigating around the recording using breakpoints, stepping, and so forth.
     *
     * <br><br>All commands and events in this domain must include a <code>sessionId</code>.
     */
    Debugger: {
        /**
         * Describes a source in the recording.
         */
        addNewSourceListener: (listener: (parameters: newSource) => void) => void;
        removeNewSourceListener: (listener?: ((parameters: newSource) => void) | undefined) => void | undefined;
        /**
         * Specifies the number of lines in a file.
         */
        addSourceContentsInfoListener: (listener: (parameters: sourceContentsInfo) => void) => void;
        removeSourceContentsInfoListener: (listener?: ((parameters: sourceContentsInfo) => void) | undefined) => void | undefined;
        /**
         * A single chunk of the source's contents. The chunk will be 10,000 code
         * units long unless it is the last chunk in the file, in which case it will
         * be equal to or shorter than 10,000.
         */
        addSourceContentsChunkListener: (listener: (parameters: sourceContentsChunk) => void) => void;
        removeSourceContentsChunkListener: (listener?: ((parameters: sourceContentsChunk) => void) | undefined) => void | undefined;
        addSearchSourceContentsMatchesListener: (listener: (parameters: searchSourceContentsMatches) => void) => void;
        removeSearchSourceContentsMatchesListener: (listener?: ((parameters: searchSourceContentsMatches) => void) | undefined) => void | undefined;
        addFunctionsMatchesListener: (listener: (parameters: functionsMatches) => void) => void;
        removeFunctionsMatchesListener: (listener?: ((parameters: functionsMatches) => void) | undefined) => void | undefined;
        /**
         * Find all sources in the recording. Does not return until the recording is
         * fully processed. Before returning, <code>newSource</code> events will be
         * emitted for every source in the recording.
         */
        findSources: (parameters: findSourcesParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Debugger").findSourcesResult>;
        /**
         * Similar to <code>getSourceContents</code> but instead of returning the
         * entire contents this command will emit one <code>sourceContentsInfo</code>
         * event with details about the source contents, and
         * <code>sourceContentsChunk</code> events with the contents of the file split
         * up into chunks of 10,000 code units.
         */
        streamSourceContents: (parameters: streamSourceContentsParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Debugger").streamSourceContentsResult>;
        /**
         * Get the contents of a source. Unlike <code>streamSourceContents</code>, the
         * entire contents of the file will be returned in the response.
         */
        getSourceContents: (parameters: getSourceContentsParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Debugger").getSourceContentsResult>;
        /**
         * Get the sourcemap of a source.
         */
        getSourceMap: (parameters: getSourceMapParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Debugger").getSourceMapResult>;
        /**
         * Get the mapping of generated to original variable names for the given
         * location (which must be in a generated source).
         */
        getScopeMap: (parameters: getScopeMapParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Debugger").getScopeMapResult>;
        /**
         * Get a compact representation of the locations where breakpoints can be set
         * in a region of a source.
         */
        getPossibleBreakpoints: (parameters: getPossibleBreakpointsParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Debugger").getPossibleBreakpointsResult>;
        /**
         * Get a HitCount object for each of the given locations in the given sourceId.
         * Counts will only be computed for regions in the recording which are loaded.
         */
        getHitCounts: (parameters: getHitCountsParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Debugger").getHitCountsResult>;
        /**
         * Get the number of times handlers for a type of event executed.
         */
        getEventHandlerCount: (parameters: getEventHandlerCountParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Debugger").getEventHandlerCountResult>;
        /**
         * Get the number of times handlers for a type of event executed.
         */
        getEventHandlerCounts: (parameters: getEventHandlerCountsParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Debugger").getEventHandlerCountsResult>;
        searchSourceContents: (parameters: searchSourceContentsParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Debugger").searchSourceContentsResult>;
        /**
         * Get the mapped location for a source location.
         */
        getMappedLocation: (parameters: getMappedLocationParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Debugger").getMappedLocationResult>;
        /**
         * Set a breakpoint at a location.
         */
        setBreakpoint: (parameters: setBreakpointParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Debugger").setBreakpointResult>;
        /**
         * Remove a breakpoint.
         */
        removeBreakpoint: (parameters: removeBreakpointParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Debugger").removeBreakpointResult>;
        /**
         * Find where to pause when running forward from a point.
         */
        findResumeTarget: (parameters: findResumeTargetParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Debugger").findResumeTargetResult>;
        /**
         * Find where to pause when rewinding from a point.
         */
        findRewindTarget: (parameters: findRewindTargetParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Debugger").findRewindTargetResult>;
        /**
         * Find where to pause when reverse-stepping from a point.
         */
        findReverseStepOverTarget: (parameters: findReverseStepOverTargetParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Debugger").findReverseStepOverTargetResult>;
        /**
         * Find where to pause when stepping from a point.
         */
        findStepOverTarget: (parameters: findStepOverTargetParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Debugger").findStepOverTargetResult>;
        /**
         * Find where to pause when stepping from a point and stopping at the entry of
         * any encountered call.
         */
        findStepInTarget: (parameters: findStepInTargetParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Debugger").findStepInTargetResult>;
        /**
         * Find where to pause when stepping out from a frame to the caller.
         */
        findStepOutTarget: (parameters: findStepOutTargetParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Debugger").findStepOutTargetResult>;
        /**
         * Blackbox a source or a region in it. Resume commands like
         * <code>findResumeTarget</code> will not return execution points in
         * blackboxed regions of a source.
         */
        blackboxSource: (parameters: blackboxSourceParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Debugger").blackboxSourceResult>;
        /**
         * Unblackbox a source or a region in it.
         */
        unblackboxSource: (parameters: unblackboxSourceParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Debugger").unblackboxSourceResult>;
        /**
         * Get the function names that match a query.
         */
        searchFunctions: (parameters: searchFunctionsParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Debugger").searchFunctionsResult>;
    };
    /**
     * The Console domain defines methods for accessing messages reported to the console.
     *
     * <br><br>All commands and events in this domain must include a <code>sessionId</code>.
     */
    Console: {
        /**
         * Describes a console message in the recording.
         */
        addNewMessageListener: (listener: (parameters: newMessage) => void) => void;
        removeNewMessageListener: (listener?: ((parameters: newMessage) => void) | undefined) => void | undefined;
        /**
         * Find all messages in the recording. Does not return until the recording is
         * fully processed. Before returning, <code>newMessage</code> events will be
         * emitted for every console message in the recording.
         */
        findMessages: (parameters: findMessagesParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Console").findMessagesResult>;
        /**
         * Find all messages in one area of a recording. Useful if finding all messages in
         * the recording overflowed.
         */
        findMessagesInRange: (parameters: findMessagesInRangeParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Console").findMessagesInRangeResult>;
    };
    /**
     * The Pause domain is used to inspect the state of the program when it is paused
     * at particular execution points.
     *
     * <br><br>All commands and events in this domain must include both a <code>sessionId</code>
     * and a <code>pauseId</code>.
     */
    Pause: {
        /**
         * Evaluate an expression in the context of a call frame. This command is
         * effectful.
         */
        evaluateInFrame: (parameters: evaluateInFrameParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Pause").evaluateInFrameResult>;
        /**
         * Evaluate an expression in a global context. This command is effectful.
         */
        evaluateInGlobal: (parameters: evaluateInGlobalParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Pause").evaluateInGlobalResult>;
        /**
         * Read a property from an object. This command is effectful.
         */
        getObjectProperty: (parameters: getObjectPropertyParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Pause").getObjectPropertyResult>;
        /**
         * Call a function object. This command is effectful.
         */
        callFunction: (parameters: callFunctionParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Pause").callFunctionResult>;
        /**
         * Read a property from an object, then call the result. This command is effectful.
         */
        callObjectProperty: (parameters: callObjectPropertyParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Pause").callObjectPropertyResult>;
        /**
         * Load a preview for an object.
         */
        getObjectPreview: (parameters: getObjectPreviewParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Pause").getObjectPreviewResult>;
        /**
         * Load a scope's contents.
         */
        getScope: (parameters: getScopeParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Pause").getScopeResult>;
        /**
         * Get the topmost frame on the stack.
         */
        getTopFrame: (parameters: getTopFrameParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Pause").getTopFrameResult>;
        /**
         * Get all frames on the stack.
         */
        getAllFrames: (parameters: getAllFramesParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Pause").getAllFramesResult>;
        /**
         * Get the values of a frame's arguments.
         */
        getFrameArguments: (parameters: getFrameArgumentsParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Pause").getFrameArgumentsResult>;
        /**
         * Get the points of all steps that are executed by a frame.
         *
         * If this is a generator frame then steps from all places where the frame
         * executed will be returned, except in parts of the recording are unloaded
         * (see <code>Session.listenForLoadChanges</code>).
         */
        getFrameSteps: (parameters: getFrameStepsParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Pause").getFrameStepsResult>;
        /**
         * Get any exception that is being thrown at this point.
         */
        getExceptionValue: (parameters: getExceptionValueParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Pause").getExceptionValueResult>;
    };
    /**
     * The DOM domain is used to inspect the DOM at particular execution points.
     * Inspecting the DOM requires a <code>Pause.PauseId</code>, and DOM nodes
     * are identified by a <code>Pause.ObjectId</code>.
     *
     * <br><br>All commands and events in this domain must include both a <code>sessionId</code>
     * and a <code>pauseId</code>.
     */
    DOM: {
        /**
         * Get the page's root document.
         */
        getDocument: (parameters: getDocumentParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/DOM").getDocumentResult>;
        /**
         * Load previews for an object and its transitive parents up to the
         * root document.
         */
        getParentNodes: (parameters: getParentNodesParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/DOM").getParentNodesResult>;
        /**
         * Call querySelector() on a node in the page.
         */
        querySelector: (parameters: querySelectorParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/DOM").querySelectorResult>;
        /**
         * Get the event listeners attached to a node in the page.
         */
        getEventListeners: (parameters: getEventListenersParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/DOM").getEventListenersResult>;
        /**
         * Get boxes for a node.
         */
        getBoxModel: (parameters: getBoxModelParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/DOM").getBoxModelResult>;
        /**
         * Get the bounding client rect for a node.
         */
        getBoundingClientRect: (parameters: getBoundingClientRectParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/DOM").getBoundingClientRectResult>;
        /**
         * Get the bounding client rect for all elements on the page.
         */
        getAllBoundingClientRects: (parameters: getAllBoundingClientRectsParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/DOM").getAllBoundingClientRectsResult>;
        /**
         * Search the DOM for nodes containing a string.
         */
        performSearch: (parameters: performSearchParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/DOM").performSearchResult>;
        /**
         * Paint the state of the DOM at this pause, even if no equivalent paint
         * occurred when originally recording. In the latter case a best-effort attempt
         * will be made to paint the current graphics, but the result might not be
         * identical to what would have originally been drawn while recording.
         */
        repaintGraphics: (parameters: repaintGraphicsParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/DOM").repaintGraphicsResult>;
    };
    /**
     * The CSS domain is used to inspect the CSS state at particular execution points.
     *
     * <br><br>All commands and events in this domain must include both a <code>sessionId</code>
     * and a <code>pauseId</code>.
     */
    CSS: {
        /**
         * Get the styles computed for a node.
         */
        getComputedStyle: (parameters: getComputedStyleParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/CSS").getComputedStyleResult>;
        /**
         * Get the style rules being applied to a node.
         */
        getAppliedRules: (parameters: getAppliedRulesParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/CSS").getAppliedRulesResult>;
    };
    /**
     * The Analysis domain is used to efficiently analyze the program state at many
     * execution points. Analysis specifications are based on the MapReduce
     * algorithm: a map operation is performed on all the execution points of
     * interest, and the results are reduced to a summary afterwards.
     *
     * <br><br>The life cycle of an analysis is as follows. First, use <code>createAnalysis</code>
     * to create the analysis and specify its map and reduce operations. Next, use one
     * or more other commands to specify the set of execution points to apply the
     * analysis to. Finally, use <code>runAnalysis</code> to start running the
     * analysis and generate <code>analysisResult</code> events.
     *
     * <br><br>All commands and events in this domain must include a <code>sessionId</code>.
     */
    Analysis: {
        /**
         * Describes some results of an analysis.
         */
        addAnalysisResultListener: (listener: (parameters: analysisResult) => void) => void;
        removeAnalysisResultListener: (listener?: ((parameters: analysisResult) => void) | undefined) => void | undefined;
        /**
         * Describes an error that occurred when running an analysis mapper or reducer
         * function. This will not be emitted for every error, but if there was any
         * error then at least one event will be emitted.
         */
        addAnalysisErrorListener: (listener: (parameters: analysisError) => void) => void;
        removeAnalysisErrorListener: (listener?: ((parameters: analysisError) => void) | undefined) => void | undefined;
        /**
         * Describes some points at which an analysis will run.
         */
        addAnalysisPointsListener: (listener: (parameters: analysisPoints) => void) => void;
        removeAnalysisPointsListener: (listener?: ((parameters: analysisPoints) => void) | undefined) => void | undefined;
        /**
         * Start specifying a new analysis.
         */
        createAnalysis: (parameters: createAnalysisParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Analysis").createAnalysisResult>;
        /**
         * Apply the analysis to every point where a source location executes.
         */
        addLocation: (parameters: addLocationParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Analysis").addLocationResult>;
        /**
         * Apply the analysis to every function entry point in a region of a source.
         */
        addFunctionEntryPoints: (parameters: addFunctionEntryPointsParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Analysis").addFunctionEntryPointsResult>;
        /**
         * Apply the analysis to a random selection of points.
         */
        addRandomPoints: (parameters: addRandomPointsParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Analysis").addRandomPointsResult>;
        /**
         * Apply the analysis to the entry point of every handler for an event.
         */
        addEventHandlerEntryPoints: (parameters: addEventHandlerEntryPointsParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Analysis").addEventHandlerEntryPointsResult>;
        /**
         * Apply the analysis to every point where an exception is thrown.
         */
        addExceptionPoints: (parameters: addExceptionPointsParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Analysis").addExceptionPointsResult>;
        /**
         * Apply the analysis to a specific set of points.
         */
        addPoints: (parameters: addPointsParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Analysis").addPointsResult>;
        /**
         * Run the analysis. After this is called, <code>analysisResult</code> and/or
         * <code>analysisError</code> events will be emitted as results are gathered.
         * Does not return until the analysis has finished and all events have been
         * emitted. Results will not be gathered in parts of the recording that are
         * unloaded, see <code>Session.listenForLoadChanges</code> and
         * <code>Session.requestFocusRange</code>.
         */
        runAnalysis: (parameters: runAnalysisParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Analysis").runAnalysisResult>;
        /**
         * Release an analysis and its server side resources. If the analysis is
         * running, it will be canceled, preventing further <code>analysisResult</code>
         * and <code>analysisError</code> events from being emitted.
         */
        releaseAnalysis: (parameters: releaseAnalysisParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Analysis").releaseAnalysisResult>;
        /**
         * Find the set of execution points at which an analysis will run. After this
         * is called, <code>analysisPoints</code> events will be emitted as the points
         * are found. Does not return until events for all points have been emitted.
         * Points will not be emitted for parts of the recording that are
         * unloaded, see <code>Session.listenForLoadChanges</code> and
         * <code>Session.loadRegion</code>.
         */
        findAnalysisPoints: (parameters: findAnalysisPointsParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Analysis").findAnalysisPointsResult>;
    };
    /**
     * The Network domain is used to inspect the Network state at particular execution points.
     *
     * <br><br>All commands and events in this domain must include both a <code>sessionId</code>.
     */
    Network: {
        /**
         * Emit data about a request body as it is processed.
         * Parts are not guaranteed to be emitted in order.
         */
        addRequestBodyDataListener: (listener: (parameters: requestBodyData) => void) => void;
        removeRequestBodyDataListener: (listener?: ((parameters: requestBodyData) => void) | undefined) => void | undefined;
        /**
         * Emit data about a response body as it is processed.
         * Parts are not guaranteed to be emitted in order.
         */
        addResponseBodyDataListener: (listener: (parameters: responseBodyData) => void) => void;
        removeResponseBodyDataListener: (listener?: ((parameters: responseBodyData) => void) | undefined) => void | undefined;
        /**
         * Describe some requests that were dispatched by the recording.
         *
         * NOTE: There is no guarantee that request information will be available
         * before the request event info, so all temporal combinations should be
         * supported when processing this data.
         */
        addRequestsListener: (listener: (parameters: requests) => void) => void;
        removeRequestsListener: (listener?: ((parameters: requests) => void) | undefined) => void | undefined;
        /**
         * Query the recording for all of the parts of this request body.
         * The server will emit 'requestBodyData' events for all parts, and
         * this command will not complete until all parts have been sent.
         */
        getRequestBody: (parameters: getRequestBodyParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Network").getRequestBodyResult>;
        /**
         * Query the recording for all of the parts of this response body.
         * The server will emit 'responseBodyData' events for all parts, and
         * this command will not complete until all parts have been sent.
         */
        getResponseBody: (parameters: getResponseBodyParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Network").getResponseBodyResult>;
        /**
         * Query the recording for all network data that is available, returning once
         * all 'Network.requests' events have been dispatched.
         */
        findRequests: (parameters: findRequestsParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Network").findRequestsResult>;
    };
    /**
     * The Target domain includes commands that are sent by the Record Replay Driver
     * to the target application which it is attached to. Protocol clients should
     * not use this domain. See https://replay.io/driver for more information.
     */
    Target: {
        /**
         * Query the target for general information about what capabilities it supports.
         */
        getCapabilities: (parameters: getCapabilitiesParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Target").getCapabilitiesResult>;
        /**
         * Get the function ID / offset to use for a source location, if there is one.
         */
        convertLocationToFunctionOffset: (parameters: convertLocationToFunctionOffsetParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Target").convertLocationToFunctionOffsetResult>;
        /**
         * Get the location to use for a function ID / offset.
         */
        convertFunctionOffsetToLocation: (parameters: convertFunctionOffsetToLocationParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Target").convertFunctionOffsetToLocationResult>;
        /**
         * Get all the locations to use for some offsets in a function. This can be
         * implemented more efficiently by some targets than when separate
         * <code>convertFunctionOffsetToLocation</code> commands are used.
         */
        convertFunctionOffsetsToLocations: (parameters: convertFunctionOffsetsToLocationsParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Target").convertFunctionOffsetsToLocationsResult>;
        /**
         * Get the offsets at which execution should pause when stepping around within
         * a frame for a function.
         */
        getStepOffsets: (parameters: getStepOffsetsParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Target").getStepOffsetsResult>;
        /**
         * Get the most complete contents known for an HTML file.
         */
        getHTMLSource: (parameters: getHTMLSourceParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Target").getHTMLSourceResult>;
        /**
         * Get the IDs of all functions in a range within a source.
         */
        getFunctionsInRange: (parameters: getFunctionsInRangeParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Target").getFunctionsInRangeResult>;
        /**
         * Get any source map URL associated with a source.
         */
        getSourceMapURL: (parameters: getSourceMapURLParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Target").getSourceMapURLResult>;
        /**
         * Get any source map URL associated with a style sheet.
         */
        getSheetSourceMapURL: (parameters: getSheetSourceMapURLParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Target").getSheetSourceMapURLResult>;
        /**
         * This command might be sent from within a RecordReplayOnConsoleMessage() call
         * to get contents of the new message. Properties in the result have the same
         * meaning as for <code>Console.Message</code>.
         */
        getCurrentMessageContents: (parameters: getCurrentMessageContentsParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Target").getCurrentMessageContentsResult>;
        /**
         * Count the number of stack frames on the stack. This is equivalent to using
         * the size of the stack returned by <code>Pause.getAllFrames</code>, but can
         * be implemented more efficiently.
         */
        countStackFrames: (parameters: countStackFramesParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Target").countStackFramesResult>;
        /**
         * Get the IDs of the functions for all stack frames, ordered from topmost to
         * bottommost.
         */
        getStackFunctionIDs: (parameters: getStackFunctionIDsParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Target").getStackFunctionIDsResult>;
        /**
         * If the topmost frame on the stack is a generator frame which can be popped
         * and pushed on the stack repeatedly, return a unique ID for the frame which
         * will be consistent across each of those pops and pushes.
         */
        currentGeneratorId: (parameters: currentGeneratorIdParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Target").currentGeneratorIdResult>;
        /**
         * Get the location of the top frame on the stack, if there is one.
         */
        topFrameLocation: (parameters: topFrameLocationParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Target").topFrameLocationResult>;
        /**
         * This command might be sent from within a RecordReplayOnNetworkRequestEvent()
         * call to get contents of the request data.
         */
        getCurrentNetworkRequestEvent: (parameters: getCurrentNetworkRequestEventParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Target").getCurrentNetworkRequestEventResult>;
        /**
         * Fetch the current data entry for a given driver OnNetworkStreamData call.
         */
        getCurrentNetworkStreamData: (parameters: getCurrentNetworkStreamDataParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Target").getCurrentNetworkStreamDataResult>;
        /**
         * This command is used, when supported by the target runtime, to collect all
         * possible breakpoints for all sources of a given region in one batch. This is
         * an optimization over sending one Debugger.getPossibleBreakpoints command for
         * each source.
         */
        getPossibleBreakpointsForMultipleSources: (parameters: getPossibleBreakpointsForMultipleSourcesParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Target").getPossibleBreakpointsForMultipleSourcesResult>;
    };
    /**
     * The Internal domain is for use in software that is used to create recordings
     * and for internal/diagnostic use cases. While use of this domain is not
     * restricted, it won't be very helpful for other users.
     */
    Internal: {
        /**
         * Create a new recording.
         */
        createRecording: (parameters: createRecordingParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Internal").createRecordingResult>;
        /**
         * Adds metadata that is associated with the entire recording in question,
         * as identified by the id field in the recordingData field. This includes things
         * like the URL being recorded as well as the token that is associated with the
         * user who started this recording.
         */
        setRecordingMetadata: (parameters: setRecordingMetadataParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Internal").setRecordingMetadataResult>;
        /**
         * Add data to a recording. The next message sent after this must be a binary
         * message with the data described by this message. A response to this command
         * indicates that the data has been successfully received by the server, but it
         * could still be lost due to a server failure. Use `Internal.finishRecording`
         * if you want to ensure that all data has been successfully stored.
         */
        addRecordingData: (parameters: addRecordingDataParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Internal").addRecordingDataResult>;
        /**
         * Indicate that all data for the given recording has been sent and the recording
         * can be marked ready and complete. If this is not sent, the recording will be
         * finished as a sideeffect of the connection closing, but if backend issues
         * were to fail to save all of the data, there will be no way to know.
         */
        finishRecording: (parameters: finishRecordingParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Internal").finishRecordingResult>;
        /**
         * Lock a given recording so that sessions will not be created
         * until the lock has been removed.
         */
        beginRecordingResourceUpload: (parameters: beginRecordingResourceUploadParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Internal").beginRecordingResourceUploadResult>;
        /**
         * Unlock a lock so that sessions may be created.
         */
        endRecordingResourceUpload: (parameters: endRecordingResourceUploadParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Internal").endRecordingResourceUploadResult>;
        /**
         * For testing network issues.
         */
        echo: (parameters: echoParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Internal").echoResult>;
        /**
         * Report information about a crash while recording.
         */
        reportCrash: (parameters: reportCrashParameters, sessionId?: string | undefined, pauseId?: string | undefined) => Promise<import("../../protocol/Internal").reportCrashResult>;
    };
}
