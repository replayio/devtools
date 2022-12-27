export * from "./Connection";
export * from "./Recording";
export * from "./Resource";
export * from "./Authentication";
export * from "./Session";
export * from "./Graphics";
export * from "./Debugger";
export * from "./Console";
export * from "./Pause";
export * from "./DOM";
export * from "./CSS";
export * from "./Analysis";
export * from "./Network";
export * from "./Target";
export * from "./Internal";
import { mayDisconnect, willDisconnect } from "./Connection";
import { uploadedData, awaitingSourcemaps, sessionError, createSessionParameters, createSessionResult, releaseSessionParameters, releaseSessionResult, processRecordingParameters, processRecordingResult, addSourceMapParameters, addSourceMapResult, addOriginalSourceParameters, addOriginalSourceResult } from "./Recording";
import { tokenParameters, tokenResult, existsParameters, existsResult, createParameters, createResult } from "./Resource";
import { setAccessTokenParameters, setAccessTokenResult } from "./Authentication";
import { mayDestroy, willDestroy, missingRegions, unprocessedRegions, mouseEvents, keyboardEvents, navigationEvents, annotations, loadedRegions, experimentalEvent, ensureProcessedParameters, ensureProcessedResult, findMouseEventsParameters, findMouseEventsResult, findKeyboardEventsParameters, findKeyboardEventsResult, findNavigationEventsParameters, findNavigationEventsResult, findAnnotationsParameters, findAnnotationsResult, getAnnotationKindsParameters, getAnnotationKindsResult, getEndpointParameters, getEndpointResult, getPointNearTimeParameters, getPointNearTimeResult, getPointsBoundingTimeParameters, getPointsBoundingTimeResult, createPauseParameters, createPauseResult, releasePauseParameters, releasePauseResult, listenForLoadChangesParameters, listenForLoadChangesResult, requestFocusRangeParameters, requestFocusRangeResult, loadRegionParameters, loadRegionResult, unloadRegionParameters, unloadRegionResult, getBuildIdParameters, getBuildIdResult } from "./Session";
import { paintPoints, findPaintsParameters, findPaintsResult, getPaintContentsParameters, getPaintContentsResult, getDevicePixelRatioParameters, getDevicePixelRatioResult } from "./Graphics";
import { newSource, sourceContentsInfo, sourceContentsChunk, searchSourceContentsMatches, functionsMatches, findSourcesParameters, findSourcesResult, streamSourceContentsParameters, streamSourceContentsResult, getSourceContentsParameters, getSourceContentsResult, getSourceMapParameters, getSourceMapResult, getScopeMapParameters, getScopeMapResult, getPossibleBreakpointsParameters, getPossibleBreakpointsResult, getHitCountsParameters, getHitCountsResult, getEventHandlerCountParameters, getEventHandlerCountResult, getEventHandlerCountsParameters, getEventHandlerCountsResult, searchSourceContentsParameters, searchSourceContentsResult, getMappedLocationParameters, getMappedLocationResult, setBreakpointParameters, setBreakpointResult, removeBreakpointParameters, removeBreakpointResult, findResumeTargetParameters, findResumeTargetResult, findRewindTargetParameters, findRewindTargetResult, findReverseStepOverTargetParameters, findReverseStepOverTargetResult, findStepOverTargetParameters, findStepOverTargetResult, findStepInTargetParameters, findStepInTargetResult, findStepOutTargetParameters, findStepOutTargetResult, blackboxSourceParameters, blackboxSourceResult, unblackboxSourceParameters, unblackboxSourceResult, searchFunctionsParameters, searchFunctionsResult } from "./Debugger";
import { newMessage, findMessagesParameters, findMessagesResult, findMessagesInRangeParameters, findMessagesInRangeResult } from "./Console";
import { evaluateInFrameParameters, evaluateInFrameResult, evaluateInGlobalParameters, evaluateInGlobalResult, getObjectPropertyParameters, getObjectPropertyResult, callFunctionParameters, callFunctionResult, callObjectPropertyParameters, callObjectPropertyResult, getObjectPreviewParameters, getObjectPreviewResult, getScopeParameters, getScopeResult, getTopFrameParameters, getTopFrameResult, getAllFramesParameters, getAllFramesResult, getFrameArgumentsParameters, getFrameArgumentsResult, getFrameStepsParameters, getFrameStepsResult, getExceptionValueParameters, getExceptionValueResult } from "./Pause";
import { getDocumentParameters, getDocumentResult, getParentNodesParameters, getParentNodesResult, querySelectorParameters, querySelectorResult, getEventListenersParameters, getEventListenersResult, getBoxModelParameters, getBoxModelResult, getBoundingClientRectParameters, getBoundingClientRectResult, getAllBoundingClientRectsParameters, getAllBoundingClientRectsResult, performSearchParameters, performSearchResult, repaintGraphicsParameters, repaintGraphicsResult } from "./DOM";
import { getComputedStyleParameters, getComputedStyleResult, getAppliedRulesParameters, getAppliedRulesResult } from "./CSS";
import { analysisResult, analysisError, analysisPoints, createAnalysisParameters, createAnalysisResult, addLocationParameters, addLocationResult, addFunctionEntryPointsParameters, addFunctionEntryPointsResult, addRandomPointsParameters, addRandomPointsResult, addEventHandlerEntryPointsParameters, addEventHandlerEntryPointsResult, addExceptionPointsParameters, addExceptionPointsResult, addPointsParameters, addPointsResult, runAnalysisParameters, runAnalysisResult, releaseAnalysisParameters, releaseAnalysisResult, findAnalysisPointsParameters, findAnalysisPointsResult } from "./Analysis";
import { requestBodyData, responseBodyData, requests, getRequestBodyParameters, getRequestBodyResult, getResponseBodyParameters, getResponseBodyResult, findRequestsParameters, findRequestsResult } from "./Network";
import { getCapabilitiesParameters, getCapabilitiesResult, convertLocationToFunctionOffsetParameters, convertLocationToFunctionOffsetResult, convertFunctionOffsetToLocationParameters, convertFunctionOffsetToLocationResult, convertFunctionOffsetsToLocationsParameters, convertFunctionOffsetsToLocationsResult, getStepOffsetsParameters, getStepOffsetsResult, getHTMLSourceParameters, getHTMLSourceResult, getFunctionsInRangeParameters, getFunctionsInRangeResult, getSourceMapURLParameters, getSourceMapURLResult, getSheetSourceMapURLParameters, getSheetSourceMapURLResult, getCurrentMessageContentsParameters, getCurrentMessageContentsResult, countStackFramesParameters, countStackFramesResult, getStackFunctionIDsParameters, getStackFunctionIDsResult, currentGeneratorIdParameters, currentGeneratorIdResult, topFrameLocationParameters, topFrameLocationResult, getCurrentNetworkRequestEventParameters, getCurrentNetworkRequestEventResult, getCurrentNetworkStreamDataParameters, getCurrentNetworkStreamDataResult, getPossibleBreakpointsForMultipleSourcesParameters, getPossibleBreakpointsForMultipleSourcesResult } from "./Target";
import { createRecordingParameters, createRecordingResult, setRecordingMetadataParameters, setRecordingMetadataResult, addRecordingDataParameters, addRecordingDataResult, finishRecordingParameters, finishRecordingResult, beginRecordingResourceUploadParameters, beginRecordingResourceUploadResult, endRecordingResourceUploadParameters, endRecordingResourceUploadResult, echoParameters, echoResult, reportCrashParameters, reportCrashResult } from "./Internal";
interface Events {
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
    "Connection.mayDisconnect": {
        parameters: mayDisconnect;
        sessionId: false;
    };
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
    "Connection.willDisconnect": {
        parameters: willDisconnect;
        sessionId: false;
    };
    /**
     * Describes how much of a recording's data has been uploaded to the cloud service.
     */
    "Recording.uploadedData": {
        parameters: uploadedData;
        sessionId: false;
    };
    /**
     * Emitted during 'createSession' if all recording data has been received, but
     * sourcemaps are still pending.
     */
    "Recording.awaitingSourcemaps": {
        parameters: awaitingSourcemaps;
        sessionId: false;
    };
    /**
     * Emitted when a session has died due to a server side problem.
     */
    "Recording.sessionError": {
        parameters: sessionError;
        sessionId: false;
    };
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
    "Session.mayDestroy": {
        parameters: mayDestroy;
        sessionId: true;
    };
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
    "Session.willDestroy": {
        parameters: willDestroy;
        sessionId: true;
    };
    /**
     * Event describing regions of the recording that have not been uploaded.
     */
    "Session.missingRegions": {
        parameters: missingRegions;
        sessionId: true;
    };
    /**
     * Event describing regions of the recording that have not been processed.
     */
    "Session.unprocessedRegions": {
        parameters: unprocessedRegions;
        sessionId: true;
    };
    /**
     * Describes some mouse events that occur in the recording.
     */
    "Session.mouseEvents": {
        parameters: mouseEvents;
        sessionId: true;
    };
    /**
     * Describes some keyboard events that occur in the recording.
     */
    "Session.keyboardEvents": {
        parameters: keyboardEvents;
        sessionId: true;
    };
    /**
     * Describes some navigate events that occur in the recording.
     */
    "Session.navigationEvents": {
        parameters: navigationEvents;
        sessionId: true;
    };
    /**
     * Describes some annotations in the recording.
     */
    "Session.annotations": {
        parameters: annotations;
        sessionId: true;
    };
    /**
     * Describes the regions of the recording which are loading or loaded.
     */
    "Session.loadedRegions": {
        parameters: loadedRegions;
        sessionId: true;
    };
    /**
     * An event indicating that something happened in a way that is not yet officially
     * supported in the protocol. This will only be emitted for sessions which
     * specified experimental settings when they were created.
     */
    "Session.experimentalEvent": {
        parameters: experimentalEvent;
        sessionId: true;
    };
    /**
     * Describes some points in the recording at which paints occurred. No paint
     * will occur for the recording's beginning execution point.
     */
    "Graphics.paintPoints": {
        parameters: paintPoints;
        sessionId: true;
    };
    /**
     * Describes a source in the recording.
     */
    "Debugger.newSource": {
        parameters: newSource;
        sessionId: true;
    };
    /**
     * Specifies the number of lines in a file.
     */
    "Debugger.sourceContentsInfo": {
        parameters: sourceContentsInfo;
        sessionId: true;
    };
    /**
     * A single chunk of the source's contents. The chunk will be 10,000 code
     * units long unless it is the last chunk in the file, in which case it will
     * be equal to or shorter than 10,000.
     */
    "Debugger.sourceContentsChunk": {
        parameters: sourceContentsChunk;
        sessionId: true;
    };
    "Debugger.searchSourceContentsMatches": {
        parameters: searchSourceContentsMatches;
        sessionId: true;
    };
    "Debugger.functionsMatches": {
        parameters: functionsMatches;
        sessionId: true;
    };
    /**
     * Describes a console message in the recording.
     */
    "Console.newMessage": {
        parameters: newMessage;
        sessionId: true;
    };
    /**
     * Describes some results of an analysis.
     */
    "Analysis.analysisResult": {
        parameters: analysisResult;
        sessionId: true;
    };
    /**
     * Describes an error that occurred when running an analysis mapper or reducer
     * function. This will not be emitted for every error, but if there was any
     * error then at least one event will be emitted.
     */
    "Analysis.analysisError": {
        parameters: analysisError;
        sessionId: true;
    };
    /**
     * Describes some points at which an analysis will run.
     */
    "Analysis.analysisPoints": {
        parameters: analysisPoints;
        sessionId: true;
    };
    /**
     * Emit data about a request body as it is processed.
     * Parts are not guaranteed to be emitted in order.
     */
    "Network.requestBodyData": {
        parameters: requestBodyData;
        sessionId: true;
    };
    /**
     * Emit data about a response body as it is processed.
     * Parts are not guaranteed to be emitted in order.
     */
    "Network.responseBodyData": {
        parameters: responseBodyData;
        sessionId: true;
    };
    /**
     * Describe some requests that were dispatched by the recording.
     *
     * NOTE: There is no guarantee that request information will be available
     * before the request event info, so all temporal combinations should be
     * supported when processing this data.
     */
    "Network.requests": {
        parameters: requests;
        sessionId: true;
    };
}
export declare type EventMethods = keyof Events;
export declare type EventParams<P extends EventMethods> = Events[P]["parameters"];
export declare type EventHasSessionId<P extends EventMethods> = Events[P]["sessionId"];
interface Commands {
    /**
     * Create a session for inspecting a recording. This command does not return
     * until the recording's contents have been fully received, unless
     * <code>loadPoint</code> is specified. If the contents
     * are incomplete, <code>uploadedData</code> events will be periodically
     * emitted before the command returns. After creating, a <code>sessionError</code>
     * events may be emitted later if the session dies unexpectedly.
     */
    "Recording.createSession": {
        parameters: createSessionParameters;
        result: createSessionResult;
        sessionId: false;
        pauseId: false;
        binary: false;
    };
    /**
     * Release a session and allow its resources to be reclaimed.
     */
    "Recording.releaseSession": {
        parameters: releaseSessionParameters;
        result: releaseSessionResult;
        sessionId: false;
        pauseId: false;
        binary: false;
    };
    /**
     * Begin processing a recording, even if no sessions have been created for it.
     * After calling this, sessions created for the recording (on this connection,
     * or another) may start in a partially or fully processed state and start
     * being used immediately.
     */
    "Recording.processRecording": {
        parameters: processRecordingParameters;
        result: processRecordingResult;
        sessionId: false;
        pauseId: false;
        binary: false;
    };
    /**
     * Add a sourcemap to the recording.
     *
     * The sourcemap will be applied to any file that matches the given
     * set of target hash filters.
     */
    "Recording.addSourceMap": {
        parameters: addSourceMapParameters;
        result: addSourceMapResult;
        sessionId: false;
        pauseId: false;
        binary: false;
    };
    /**
     * Add original source content to a given sourcemap.
     *
     * SourceMaps do not always contain the original source, so this
     * this allows users to explicitly associate the correct source content
     * with a source in the map.
     */
    "Recording.addOriginalSource": {
        parameters: addOriginalSourceParameters;
        result: addOriginalSourceResult;
        sessionId: false;
        pauseId: false;
        binary: false;
    };
    /**
     * Get the token to use when computing the hashes of a given file.
     */
    "Resource.token": {
        parameters: tokenParameters;
        result: tokenResult;
        sessionId: false;
        pauseId: false;
        binary: false;
    };
    /**
     * Check if a given resource already exists on our servers.
     */
    "Resource.exists": {
        parameters: existsParameters;
        result: existsResult;
        sessionId: false;
        pauseId: false;
        binary: false;
    };
    /**
     * Upload a file, and for ease of use, get a resource proof for it.
     */
    "Resource.create": {
        parameters: createParameters;
        result: createResult;
        sessionId: false;
        pauseId: false;
        binary: false;
    };
    /**
     * Set the user's current access token
     */
    "Authentication.setAccessToken": {
        parameters: setAccessTokenParameters;
        result: setAccessTokenResult;
        sessionId: false;
        pauseId: false;
        binary: false;
    };
    /**
     * Does not return until the recording is fully processed. Before returning,
     * <code>missingRegions</code> and <code>unprocessedRegions</code> events will
     * be periodically emitted. Commands which require inspecting the recording
     * will not return until that part of the recording has been processed,
     * see <code>ProcessingLevel</code> for details.
     */
    "Session.ensureProcessed": {
        parameters: ensureProcessedParameters;
        result: ensureProcessedResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Find all points in the recording at which a mouse move or click occurred.
     * Does not return until the recording is fully processed. Before returning,
     * <code>mouseEvents</code> events will be periodically emitted. The union
     * of all these events describes all mouse events in the recording.
     */
    "Session.findMouseEvents": {
        parameters: findMouseEventsParameters;
        result: findMouseEventsResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Find all points in the recording at which a keyboard event occurred.
     * Does not return until the recording is fully processed. Before returning,
     * <code>keyboardEvents</code> events will be periodically emitted. The union
     * of all these events describes all keyboard events in the recording.
     */
    "Session.findKeyboardEvents": {
        parameters: findKeyboardEventsParameters;
        result: findKeyboardEventsResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    "Session.findNavigationEvents": {
        parameters: findNavigationEventsParameters;
        result: findNavigationEventsResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Find all points in the recording at which an annotation was added via the
     * RecordReplayOnAnnotation driver API. Does not return until the recording
     * is fully processed. Before returning, <code>annotations</code> events will
     * be periodically emitted, which describe all annotations in the recording,
     * or all annotations of the provided kind.
     */
    "Session.findAnnotations": {
        parameters: findAnnotationsParameters;
        result: findAnnotationsResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Get the different kinds of annotations in the recording.
     */
    "Session.getAnnotationKinds": {
        parameters: getAnnotationKindsParameters;
        result: getAnnotationKindsResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Get the last execution point in the recording.
     */
    "Session.getEndpoint": {
        parameters: getEndpointParameters;
        result: getEndpointResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Get a point near a given time in the recording. Unlike other commands, this
     * command will not raise an error if it is performed for an unloaded time.
     */
    "Session.getPointNearTime": {
        parameters: getPointNearTimeParameters;
        result: getPointNearTimeResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Get points bounding a time. Much like <code>getPointNearTime</code>,
     * this command will not raise an error if it is performed for an unloaded
     * time.
     */
    "Session.getPointsBoundingTime": {
        parameters: getPointsBoundingTimeParameters;
        result: getPointsBoundingTimeResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Create a pause describing the state at an execution point.
     */
    "Session.createPause": {
        parameters: createPauseParameters;
        result: createPauseResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Release a pause and allow its resources to be reclaimed.
     */
    "Session.releasePause": {
        parameters: releasePauseParameters;
        result: releasePauseResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
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
    "Session.listenForLoadChanges": {
        parameters: listenForLoadChangesParameters;
        result: listenForLoadChangesResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
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
    "Session.requestFocusRange": {
        parameters: requestFocusRangeParameters;
        result: requestFocusRangeResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
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
    "Session.loadRegion": {
        parameters: loadRegionParameters;
        result: loadRegionResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Request that part of the recording be unloaded. As for <code>Session.loadRegion</code>,
     * the newly loaded regions will take effect after the command returns, and commands
     * which are sent before this returns or are in progress when it is sent may or may
     * not use the newly loaded regions.
     */
    "Session.unloadRegion": {
        parameters: unloadRegionParameters;
        result: unloadRegionResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Get the identifier of the build used to produce the recording.
     */
    "Session.getBuildId": {
        parameters: getBuildIdParameters;
        result: getBuildIdResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Find all points in the recording at which paints occurred. Does not return
     * until the recording is fully processed. Before returning,
     * <code>paintPoints</code> events will be periodically emitted. The union
     * of all these events describes all paint points in the recording.
     */
    "Graphics.findPaints": {
        parameters: findPaintsParameters;
        result: findPaintsResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Get the graphics at a point where a paint occurred.
     */
    "Graphics.getPaintContents": {
        parameters: getPaintContentsParameters;
        result: getPaintContentsResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Get the value of <code>window.devicePixelRatio</code>. This is the ratio of
     * pixels in screen shots to pixels used by DOM/CSS data such as
     * <code>DOM.getBoundingClientRect</code>.
     */
    "Graphics.getDevicePixelRatio": {
        parameters: getDevicePixelRatioParameters;
        result: getDevicePixelRatioResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Find all sources in the recording. Does not return until the recording is
     * fully processed. Before returning, <code>newSource</code> events will be
     * emitted for every source in the recording.
     */
    "Debugger.findSources": {
        parameters: findSourcesParameters;
        result: findSourcesResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Similar to <code>getSourceContents</code> but instead of returning the
     * entire contents this command will emit one <code>sourceContentsInfo</code>
     * event with details about the source contents, and
     * <code>sourceContentsChunk</code> events with the contents of the file split
     * up into chunks of 10,000 code units.
     */
    "Debugger.streamSourceContents": {
        parameters: streamSourceContentsParameters;
        result: streamSourceContentsResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Get the contents of a source. Unlike <code>streamSourceContents</code>, the
     * entire contents of the file will be returned in the response.
     */
    "Debugger.getSourceContents": {
        parameters: getSourceContentsParameters;
        result: getSourceContentsResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Get the sourcemap of a source.
     */
    "Debugger.getSourceMap": {
        parameters: getSourceMapParameters;
        result: getSourceMapResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Get the mapping of generated to original variable names for the given
     * location (which must be in a generated source).
     */
    "Debugger.getScopeMap": {
        parameters: getScopeMapParameters;
        result: getScopeMapResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Get a compact representation of the locations where breakpoints can be set
     * in a region of a source.
     */
    "Debugger.getPossibleBreakpoints": {
        parameters: getPossibleBreakpointsParameters;
        result: getPossibleBreakpointsResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Get a HitCount object for each of the given locations in the given sourceId.
     * Counts will only be computed for regions in the recording which are loaded.
     */
    "Debugger.getHitCounts": {
        parameters: getHitCountsParameters;
        result: getHitCountsResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Get the number of times handlers for a type of event executed.
     */
    "Debugger.getEventHandlerCount": {
        parameters: getEventHandlerCountParameters;
        result: getEventHandlerCountResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Get the number of times handlers for a type of event executed.
     */
    "Debugger.getEventHandlerCounts": {
        parameters: getEventHandlerCountsParameters;
        result: getEventHandlerCountsResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    "Debugger.searchSourceContents": {
        parameters: searchSourceContentsParameters;
        result: searchSourceContentsResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Get the mapped location for a source location.
     */
    "Debugger.getMappedLocation": {
        parameters: getMappedLocationParameters;
        result: getMappedLocationResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Set a breakpoint at a location.
     */
    "Debugger.setBreakpoint": {
        parameters: setBreakpointParameters;
        result: setBreakpointResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Remove a breakpoint.
     */
    "Debugger.removeBreakpoint": {
        parameters: removeBreakpointParameters;
        result: removeBreakpointResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Find where to pause when running forward from a point.
     */
    "Debugger.findResumeTarget": {
        parameters: findResumeTargetParameters;
        result: findResumeTargetResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Find where to pause when rewinding from a point.
     */
    "Debugger.findRewindTarget": {
        parameters: findRewindTargetParameters;
        result: findRewindTargetResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Find where to pause when reverse-stepping from a point.
     */
    "Debugger.findReverseStepOverTarget": {
        parameters: findReverseStepOverTargetParameters;
        result: findReverseStepOverTargetResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Find where to pause when stepping from a point.
     */
    "Debugger.findStepOverTarget": {
        parameters: findStepOverTargetParameters;
        result: findStepOverTargetResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Find where to pause when stepping from a point and stopping at the entry of
     * any encountered call.
     */
    "Debugger.findStepInTarget": {
        parameters: findStepInTargetParameters;
        result: findStepInTargetResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Find where to pause when stepping out from a frame to the caller.
     */
    "Debugger.findStepOutTarget": {
        parameters: findStepOutTargetParameters;
        result: findStepOutTargetResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Blackbox a source or a region in it. Resume commands like
     * <code>findResumeTarget</code> will not return execution points in
     * blackboxed regions of a source.
     */
    "Debugger.blackboxSource": {
        parameters: blackboxSourceParameters;
        result: blackboxSourceResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Unblackbox a source or a region in it.
     */
    "Debugger.unblackboxSource": {
        parameters: unblackboxSourceParameters;
        result: unblackboxSourceResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Get the function names that match a query.
     */
    "Debugger.searchFunctions": {
        parameters: searchFunctionsParameters;
        result: searchFunctionsResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Find all messages in the recording. Does not return until the recording is
     * fully processed. Before returning, <code>newMessage</code> events will be
     * emitted for every console message in the recording.
     */
    "Console.findMessages": {
        parameters: findMessagesParameters;
        result: findMessagesResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Find all messages in one area of a recording. Useful if finding all messages in
     * the recording overflowed.
     */
    "Console.findMessagesInRange": {
        parameters: findMessagesInRangeParameters;
        result: findMessagesInRangeResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Evaluate an expression in the context of a call frame. This command is
     * effectful.
     */
    "Pause.evaluateInFrame": {
        parameters: evaluateInFrameParameters;
        result: evaluateInFrameResult;
        sessionId: true;
        pauseId: true;
        binary: false;
    };
    /**
     * Evaluate an expression in a global context. This command is effectful.
     */
    "Pause.evaluateInGlobal": {
        parameters: evaluateInGlobalParameters;
        result: evaluateInGlobalResult;
        sessionId: true;
        pauseId: true;
        binary: false;
    };
    /**
     * Read a property from an object. This command is effectful.
     */
    "Pause.getObjectProperty": {
        parameters: getObjectPropertyParameters;
        result: getObjectPropertyResult;
        sessionId: true;
        pauseId: true;
        binary: false;
    };
    /**
     * Call a function object. This command is effectful.
     */
    "Pause.callFunction": {
        parameters: callFunctionParameters;
        result: callFunctionResult;
        sessionId: true;
        pauseId: true;
        binary: false;
    };
    /**
     * Read a property from an object, then call the result. This command is effectful.
     */
    "Pause.callObjectProperty": {
        parameters: callObjectPropertyParameters;
        result: callObjectPropertyResult;
        sessionId: true;
        pauseId: true;
        binary: false;
    };
    /**
     * Load a preview for an object.
     */
    "Pause.getObjectPreview": {
        parameters: getObjectPreviewParameters;
        result: getObjectPreviewResult;
        sessionId: true;
        pauseId: true;
        binary: false;
    };
    /**
     * Load a scope's contents.
     */
    "Pause.getScope": {
        parameters: getScopeParameters;
        result: getScopeResult;
        sessionId: true;
        pauseId: true;
        binary: false;
    };
    /**
     * Get the topmost frame on the stack.
     */
    "Pause.getTopFrame": {
        parameters: getTopFrameParameters;
        result: getTopFrameResult;
        sessionId: true;
        pauseId: true;
        binary: false;
    };
    /**
     * Get all frames on the stack.
     */
    "Pause.getAllFrames": {
        parameters: getAllFramesParameters;
        result: getAllFramesResult;
        sessionId: true;
        pauseId: true;
        binary: false;
    };
    /**
     * Get the values of a frame's arguments.
     */
    "Pause.getFrameArguments": {
        parameters: getFrameArgumentsParameters;
        result: getFrameArgumentsResult;
        sessionId: true;
        pauseId: true;
        binary: false;
    };
    /**
     * Get the points of all steps that are executed by a frame.
     *
     * If this is a generator frame then steps from all places where the frame
     * executed will be returned, except in parts of the recording are unloaded
     * (see <code>Session.listenForLoadChanges</code>).
     */
    "Pause.getFrameSteps": {
        parameters: getFrameStepsParameters;
        result: getFrameStepsResult;
        sessionId: true;
        pauseId: true;
        binary: false;
    };
    /**
     * Get any exception that is being thrown at this point.
     */
    "Pause.getExceptionValue": {
        parameters: getExceptionValueParameters;
        result: getExceptionValueResult;
        sessionId: true;
        pauseId: true;
        binary: false;
    };
    /**
     * Get the page's root document.
     */
    "DOM.getDocument": {
        parameters: getDocumentParameters;
        result: getDocumentResult;
        sessionId: true;
        pauseId: true;
        binary: false;
    };
    /**
     * Load previews for an object and its transitive parents up to the
     * root document.
     */
    "DOM.getParentNodes": {
        parameters: getParentNodesParameters;
        result: getParentNodesResult;
        sessionId: true;
        pauseId: true;
        binary: false;
    };
    /**
     * Call querySelector() on a node in the page.
     */
    "DOM.querySelector": {
        parameters: querySelectorParameters;
        result: querySelectorResult;
        sessionId: true;
        pauseId: true;
        binary: false;
    };
    /**
     * Get the event listeners attached to a node in the page.
     */
    "DOM.getEventListeners": {
        parameters: getEventListenersParameters;
        result: getEventListenersResult;
        sessionId: true;
        pauseId: true;
        binary: false;
    };
    /**
     * Get boxes for a node.
     */
    "DOM.getBoxModel": {
        parameters: getBoxModelParameters;
        result: getBoxModelResult;
        sessionId: true;
        pauseId: true;
        binary: false;
    };
    /**
     * Get the bounding client rect for a node.
     */
    "DOM.getBoundingClientRect": {
        parameters: getBoundingClientRectParameters;
        result: getBoundingClientRectResult;
        sessionId: true;
        pauseId: true;
        binary: false;
    };
    /**
     * Get the bounding client rect for all elements on the page.
     */
    "DOM.getAllBoundingClientRects": {
        parameters: getAllBoundingClientRectsParameters;
        result: getAllBoundingClientRectsResult;
        sessionId: true;
        pauseId: true;
        binary: false;
    };
    /**
     * Search the DOM for nodes containing a string.
     */
    "DOM.performSearch": {
        parameters: performSearchParameters;
        result: performSearchResult;
        sessionId: true;
        pauseId: true;
        binary: false;
    };
    /**
     * Paint the state of the DOM at this pause, even if no equivalent paint
     * occurred when originally recording. In the latter case a best-effort attempt
     * will be made to paint the current graphics, but the result might not be
     * identical to what would have originally been drawn while recording.
     */
    "DOM.repaintGraphics": {
        parameters: repaintGraphicsParameters;
        result: repaintGraphicsResult;
        sessionId: true;
        pauseId: true;
        binary: false;
    };
    /**
     * Get the styles computed for a node.
     */
    "CSS.getComputedStyle": {
        parameters: getComputedStyleParameters;
        result: getComputedStyleResult;
        sessionId: true;
        pauseId: true;
        binary: false;
    };
    /**
     * Get the style rules being applied to a node.
     */
    "CSS.getAppliedRules": {
        parameters: getAppliedRulesParameters;
        result: getAppliedRulesResult;
        sessionId: true;
        pauseId: true;
        binary: false;
    };
    /**
     * Start specifying a new analysis.
     */
    "Analysis.createAnalysis": {
        parameters: createAnalysisParameters;
        result: createAnalysisResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Apply the analysis to every point where a source location executes.
     */
    "Analysis.addLocation": {
        parameters: addLocationParameters;
        result: addLocationResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Apply the analysis to every function entry point in a region of a source.
     */
    "Analysis.addFunctionEntryPoints": {
        parameters: addFunctionEntryPointsParameters;
        result: addFunctionEntryPointsResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Apply the analysis to a random selection of points.
     */
    "Analysis.addRandomPoints": {
        parameters: addRandomPointsParameters;
        result: addRandomPointsResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Apply the analysis to the entry point of every handler for an event.
     */
    "Analysis.addEventHandlerEntryPoints": {
        parameters: addEventHandlerEntryPointsParameters;
        result: addEventHandlerEntryPointsResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Apply the analysis to every point where an exception is thrown.
     */
    "Analysis.addExceptionPoints": {
        parameters: addExceptionPointsParameters;
        result: addExceptionPointsResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Apply the analysis to a specific set of points.
     */
    "Analysis.addPoints": {
        parameters: addPointsParameters;
        result: addPointsResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Run the analysis. After this is called, <code>analysisResult</code> and/or
     * <code>analysisError</code> events will be emitted as results are gathered.
     * Does not return until the analysis has finished and all events have been
     * emitted. Results will not be gathered in parts of the recording that are
     * unloaded, see <code>Session.listenForLoadChanges</code> and
     * <code>Session.requestFocusRange</code>.
     */
    "Analysis.runAnalysis": {
        parameters: runAnalysisParameters;
        result: runAnalysisResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Release an analysis and its server side resources. If the analysis is
     * running, it will be canceled, preventing further <code>analysisResult</code>
     * and <code>analysisError</code> events from being emitted.
     */
    "Analysis.releaseAnalysis": {
        parameters: releaseAnalysisParameters;
        result: releaseAnalysisResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Find the set of execution points at which an analysis will run. After this
     * is called, <code>analysisPoints</code> events will be emitted as the points
     * are found. Does not return until events for all points have been emitted.
     * Points will not be emitted for parts of the recording that are
     * unloaded, see <code>Session.listenForLoadChanges</code> and
     * <code>Session.loadRegion</code>.
     */
    "Analysis.findAnalysisPoints": {
        parameters: findAnalysisPointsParameters;
        result: findAnalysisPointsResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Query the recording for all of the parts of this request body.
     * The server will emit 'requestBodyData' events for all parts, and
     * this command will not complete until all parts have been sent.
     */
    "Network.getRequestBody": {
        parameters: getRequestBodyParameters;
        result: getRequestBodyResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Query the recording for all of the parts of this response body.
     * The server will emit 'responseBodyData' events for all parts, and
     * this command will not complete until all parts have been sent.
     */
    "Network.getResponseBody": {
        parameters: getResponseBodyParameters;
        result: getResponseBodyResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Query the recording for all network data that is available, returning once
     * all 'Network.requests' events have been dispatched.
     */
    "Network.findRequests": {
        parameters: findRequestsParameters;
        result: findRequestsResult;
        sessionId: true;
        pauseId: false;
        binary: false;
    };
    /**
     * Query the target for general information about what capabilities it supports.
     */
    "Target.getCapabilities": {
        parameters: getCapabilitiesParameters;
        result: getCapabilitiesResult;
        sessionId: false;
        pauseId: false;
        binary: false;
    };
    /**
     * Get the function ID / offset to use for a source location, if there is one.
     */
    "Target.convertLocationToFunctionOffset": {
        parameters: convertLocationToFunctionOffsetParameters;
        result: convertLocationToFunctionOffsetResult;
        sessionId: false;
        pauseId: false;
        binary: false;
    };
    /**
     * Get the location to use for a function ID / offset.
     */
    "Target.convertFunctionOffsetToLocation": {
        parameters: convertFunctionOffsetToLocationParameters;
        result: convertFunctionOffsetToLocationResult;
        sessionId: false;
        pauseId: false;
        binary: false;
    };
    /**
     * Get all the locations to use for some offsets in a function. This can be
     * implemented more efficiently by some targets than when separate
     * <code>convertFunctionOffsetToLocation</code> commands are used.
     */
    "Target.convertFunctionOffsetsToLocations": {
        parameters: convertFunctionOffsetsToLocationsParameters;
        result: convertFunctionOffsetsToLocationsResult;
        sessionId: false;
        pauseId: false;
        binary: false;
    };
    /**
     * Get the offsets at which execution should pause when stepping around within
     * a frame for a function.
     */
    "Target.getStepOffsets": {
        parameters: getStepOffsetsParameters;
        result: getStepOffsetsResult;
        sessionId: false;
        pauseId: false;
        binary: false;
    };
    /**
     * Get the most complete contents known for an HTML file.
     */
    "Target.getHTMLSource": {
        parameters: getHTMLSourceParameters;
        result: getHTMLSourceResult;
        sessionId: false;
        pauseId: false;
        binary: false;
    };
    /**
     * Get the IDs of all functions in a range within a source.
     */
    "Target.getFunctionsInRange": {
        parameters: getFunctionsInRangeParameters;
        result: getFunctionsInRangeResult;
        sessionId: false;
        pauseId: false;
        binary: false;
    };
    /**
     * Get any source map URL associated with a source.
     */
    "Target.getSourceMapURL": {
        parameters: getSourceMapURLParameters;
        result: getSourceMapURLResult;
        sessionId: false;
        pauseId: false;
        binary: false;
    };
    /**
     * Get any source map URL associated with a style sheet.
     */
    "Target.getSheetSourceMapURL": {
        parameters: getSheetSourceMapURLParameters;
        result: getSheetSourceMapURLResult;
        sessionId: false;
        pauseId: false;
        binary: false;
    };
    /**
     * This command might be sent from within a RecordReplayOnConsoleMessage() call
     * to get contents of the new message. Properties in the result have the same
     * meaning as for <code>Console.Message</code>.
     */
    "Target.getCurrentMessageContents": {
        parameters: getCurrentMessageContentsParameters;
        result: getCurrentMessageContentsResult;
        sessionId: false;
        pauseId: false;
        binary: false;
    };
    /**
     * Count the number of stack frames on the stack. This is equivalent to using
     * the size of the stack returned by <code>Pause.getAllFrames</code>, but can
     * be implemented more efficiently.
     */
    "Target.countStackFrames": {
        parameters: countStackFramesParameters;
        result: countStackFramesResult;
        sessionId: false;
        pauseId: false;
        binary: false;
    };
    /**
     * Get the IDs of the functions for all stack frames, ordered from topmost to
     * bottommost.
     */
    "Target.getStackFunctionIDs": {
        parameters: getStackFunctionIDsParameters;
        result: getStackFunctionIDsResult;
        sessionId: false;
        pauseId: false;
        binary: false;
    };
    /**
     * If the topmost frame on the stack is a generator frame which can be popped
     * and pushed on the stack repeatedly, return a unique ID for the frame which
     * will be consistent across each of those pops and pushes.
     */
    "Target.currentGeneratorId": {
        parameters: currentGeneratorIdParameters;
        result: currentGeneratorIdResult;
        sessionId: false;
        pauseId: false;
        binary: false;
    };
    /**
     * Get the location of the top frame on the stack, if there is one.
     */
    "Target.topFrameLocation": {
        parameters: topFrameLocationParameters;
        result: topFrameLocationResult;
        sessionId: false;
        pauseId: false;
        binary: false;
    };
    /**
     * This command might be sent from within a RecordReplayOnNetworkRequestEvent()
     * call to get contents of the request data.
     */
    "Target.getCurrentNetworkRequestEvent": {
        parameters: getCurrentNetworkRequestEventParameters;
        result: getCurrentNetworkRequestEventResult;
        sessionId: false;
        pauseId: false;
        binary: false;
    };
    /**
     * Fetch the current data entry for a given driver OnNetworkStreamData call.
     */
    "Target.getCurrentNetworkStreamData": {
        parameters: getCurrentNetworkStreamDataParameters;
        result: getCurrentNetworkStreamDataResult;
        sessionId: false;
        pauseId: false;
        binary: false;
    };
    /**
     * This command is used, when supported by the target runtime, to collect all
     * possible breakpoints for all sources of a given region in one batch. This is
     * an optimization over sending one Debugger.getPossibleBreakpoints command for
     * each source.
     */
    "Target.getPossibleBreakpointsForMultipleSources": {
        parameters: getPossibleBreakpointsForMultipleSourcesParameters;
        result: getPossibleBreakpointsForMultipleSourcesResult;
        sessionId: false;
        pauseId: false;
        binary: false;
    };
    /**
     * Create a new recording.
     */
    "Internal.createRecording": {
        parameters: createRecordingParameters;
        result: createRecordingResult;
        sessionId: false;
        pauseId: false;
        binary: false;
    };
    /**
     * Adds metadata that is associated with the entire recording in question,
     * as identified by the id field in the recordingData field. This includes things
     * like the URL being recorded as well as the token that is associated with the
     * user who started this recording.
     */
    "Internal.setRecordingMetadata": {
        parameters: setRecordingMetadataParameters;
        result: setRecordingMetadataResult;
        sessionId: false;
        pauseId: false;
        binary: false;
    };
    /**
     * Add data to a recording. The next message sent after this must be a binary
     * message with the data described by this message. A response to this command
     * indicates that the data has been successfully received by the server, but it
     * could still be lost due to a server failure. Use `Internal.finishRecording`
     * if you want to ensure that all data has been successfully stored.
     */
    "Internal.addRecordingData": {
        parameters: addRecordingDataParameters;
        result: addRecordingDataResult;
        sessionId: false;
        pauseId: false;
        binary: true;
    };
    /**
     * Indicate that all data for the given recording has been sent and the recording
     * can be marked ready and complete. If this is not sent, the recording will be
     * finished as a sideeffect of the connection closing, but if backend issues
     * were to fail to save all of the data, there will be no way to know.
     */
    "Internal.finishRecording": {
        parameters: finishRecordingParameters;
        result: finishRecordingResult;
        sessionId: false;
        pauseId: false;
        binary: false;
    };
    /**
     * Lock a given recording so that sessions will not be created
     * until the lock has been removed.
     */
    "Internal.beginRecordingResourceUpload": {
        parameters: beginRecordingResourceUploadParameters;
        result: beginRecordingResourceUploadResult;
        sessionId: false;
        pauseId: false;
        binary: false;
    };
    /**
     * Unlock a lock so that sessions may be created.
     */
    "Internal.endRecordingResourceUpload": {
        parameters: endRecordingResourceUploadParameters;
        result: endRecordingResourceUploadResult;
        sessionId: false;
        pauseId: false;
        binary: false;
    };
    /**
     * For testing network issues.
     */
    "Internal.echo": {
        parameters: echoParameters;
        result: echoResult;
        sessionId: false;
        pauseId: false;
        binary: false;
    };
    /**
     * Report information about a crash while recording.
     */
    "Internal.reportCrash": {
        parameters: reportCrashParameters;
        result: reportCrashResult;
        sessionId: false;
        pauseId: false;
        binary: false;
    };
}
export declare type CommandMethods = keyof Commands;
export declare type CommandParams<P extends CommandMethods> = Commands[P]["parameters"];
export declare type CommandResult<P extends CommandMethods> = Commands[P]["result"];
export declare type CommandHasSessionId<P extends CommandMethods> = Commands[P]["sessionId"];
export declare type CommandHasPauseId<P extends CommandMethods> = Commands[P]["pauseId"];
export declare type CommandHasBinary<P extends CommandMethods> = Commands[P]["binary"];
