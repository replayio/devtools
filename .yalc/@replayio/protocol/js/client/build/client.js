"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtocolClient = void 0;
var ProtocolClient = /** @class */ (function () {
    function ProtocolClient(genericClient) {
        var _this = this;
        this.genericClient = genericClient;
        /**
         * General information about the Websocket connection state.
         */
        this.Connection = {
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
            addMayDisconnectListener: function (listener) {
                return _this.genericClient.addEventListener("Connection.mayDisconnect", listener);
            },
            removeMayDisconnectListener: function (listener) { var _a, _b; return (_b = (_a = _this.genericClient).removeEventListener) === null || _b === void 0 ? void 0 : _b.call(_a, "Connection.mayDisconnect", listener); },
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
            addWillDisconnectListener: function (listener) {
                return _this.genericClient.addEventListener("Connection.willDisconnect", listener);
            },
            removeWillDisconnectListener: function (listener) { var _a, _b; return (_b = (_a = _this.genericClient).removeEventListener) === null || _b === void 0 ? void 0 : _b.call(_a, "Connection.willDisconnect", listener); },
        };
        /**
         * The Recording domain defines methods for managing recordings.
         */
        this.Recording = {
            /**
             * Describes how much of a recording's data has been uploaded to the cloud service.
             */
            addUploadedDataListener: function (listener) {
                return _this.genericClient.addEventListener("Recording.uploadedData", listener);
            },
            removeUploadedDataListener: function (listener) { var _a, _b; return (_b = (_a = _this.genericClient).removeEventListener) === null || _b === void 0 ? void 0 : _b.call(_a, "Recording.uploadedData", listener); },
            /**
             * Emitted during 'createSession' if all recording data has been received, but
             * sourcemaps are still pending.
             */
            addAwaitingSourcemapsListener: function (listener) {
                return _this.genericClient.addEventListener("Recording.awaitingSourcemaps", listener);
            },
            removeAwaitingSourcemapsListener: function (listener) { var _a, _b; return (_b = (_a = _this.genericClient).removeEventListener) === null || _b === void 0 ? void 0 : _b.call(_a, "Recording.awaitingSourcemaps", listener); },
            /**
             * Emitted when a session has died due to a server side problem.
             */
            addSessionErrorListener: function (listener) {
                return _this.genericClient.addEventListener("Recording.sessionError", listener);
            },
            removeSessionErrorListener: function (listener) { var _a, _b; return (_b = (_a = _this.genericClient).removeEventListener) === null || _b === void 0 ? void 0 : _b.call(_a, "Recording.sessionError", listener); },
            /**
             * Create a session for inspecting a recording. This command does not return
             * until the recording's contents have been fully received, unless
             * <code>loadPoint</code> is specified. If the contents
             * are incomplete, <code>uploadedData</code> events will be periodically
             * emitted before the command returns. After creating, a <code>sessionError</code>
             * events may be emitted later if the session dies unexpectedly.
             */
            createSession: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Recording.createSession", parameters, sessionId, pauseId);
            },
            /**
             * Release a session and allow its resources to be reclaimed.
             */
            releaseSession: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Recording.releaseSession", parameters, sessionId, pauseId);
            },
            /**
             * Begin processing a recording, even if no sessions have been created for it.
             * After calling this, sessions created for the recording (on this connection,
             * or another) may start in a partially or fully processed state and start
             * being used immediately.
             */
            processRecording: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Recording.processRecording", parameters, sessionId, pauseId);
            },
            /**
             * Add a sourcemap to the recording.
             *
             * The sourcemap will be applied to any file that matches the given
             * set of target hash filters.
             */
            addSourceMap: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Recording.addSourceMap", parameters, sessionId, pauseId);
            },
            /**
             * Add original source content to a given sourcemap.
             *
             * SourceMaps do not always contain the original source, so this
             * this allows users to explicitly associate the correct source content
             * with a source in the map.
             */
            addOriginalSource: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Recording.addOriginalSource", parameters, sessionId, pauseId);
            },
        };
        /**
         * The commands for uploading and processing resource files.
         */
        this.Resource = {
            /**
             * Get the token to use when computing the hashes of a given file.
             */
            token: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Resource.token", parameters, sessionId, pauseId);
            },
            /**
             * Check if a given resource already exists on our servers.
             */
            exists: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Resource.exists", parameters, sessionId, pauseId);
            },
            /**
             * Upload a file, and for ease of use, get a resource proof for it.
             */
            create: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Resource.create", parameters, sessionId, pauseId);
            },
        };
        /**
         * The Authentication domain defines a command for authenticating the current user.
         */
        this.Authentication = {
            /**
             * Set the user's current access token
             */
            setAccessToken: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Authentication.setAccessToken", parameters, sessionId, pauseId);
            },
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
        this.Session = {
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
            addMayDestroyListener: function (listener) {
                return _this.genericClient.addEventListener("Session.mayDestroy", listener);
            },
            removeMayDestroyListener: function (listener) { var _a, _b; return (_b = (_a = _this.genericClient).removeEventListener) === null || _b === void 0 ? void 0 : _b.call(_a, "Session.mayDestroy", listener); },
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
            addWillDestroyListener: function (listener) {
                return _this.genericClient.addEventListener("Session.willDestroy", listener);
            },
            removeWillDestroyListener: function (listener) { var _a, _b; return (_b = (_a = _this.genericClient).removeEventListener) === null || _b === void 0 ? void 0 : _b.call(_a, "Session.willDestroy", listener); },
            /**
             * Event describing regions of the recording that have not been uploaded.
             */
            addMissingRegionsListener: function (listener) {
                return _this.genericClient.addEventListener("Session.missingRegions", listener);
            },
            removeMissingRegionsListener: function (listener) { var _a, _b; return (_b = (_a = _this.genericClient).removeEventListener) === null || _b === void 0 ? void 0 : _b.call(_a, "Session.missingRegions", listener); },
            /**
             * Event describing regions of the recording that have not been processed.
             */
            addUnprocessedRegionsListener: function (listener) {
                return _this.genericClient.addEventListener("Session.unprocessedRegions", listener);
            },
            removeUnprocessedRegionsListener: function (listener) { var _a, _b; return (_b = (_a = _this.genericClient).removeEventListener) === null || _b === void 0 ? void 0 : _b.call(_a, "Session.unprocessedRegions", listener); },
            /**
             * Describes some mouse events that occur in the recording.
             */
            addMouseEventsListener: function (listener) {
                return _this.genericClient.addEventListener("Session.mouseEvents", listener);
            },
            removeMouseEventsListener: function (listener) { var _a, _b; return (_b = (_a = _this.genericClient).removeEventListener) === null || _b === void 0 ? void 0 : _b.call(_a, "Session.mouseEvents", listener); },
            /**
             * Describes some keyboard events that occur in the recording.
             */
            addKeyboardEventsListener: function (listener) {
                return _this.genericClient.addEventListener("Session.keyboardEvents", listener);
            },
            removeKeyboardEventsListener: function (listener) { var _a, _b; return (_b = (_a = _this.genericClient).removeEventListener) === null || _b === void 0 ? void 0 : _b.call(_a, "Session.keyboardEvents", listener); },
            /**
             * Describes some navigate events that occur in the recording.
             */
            addNavigationEventsListener: function (listener) {
                return _this.genericClient.addEventListener("Session.navigationEvents", listener);
            },
            removeNavigationEventsListener: function (listener) { var _a, _b; return (_b = (_a = _this.genericClient).removeEventListener) === null || _b === void 0 ? void 0 : _b.call(_a, "Session.navigationEvents", listener); },
            /**
             * Describes some annotations in the recording.
             */
            addAnnotationsListener: function (listener) {
                return _this.genericClient.addEventListener("Session.annotations", listener);
            },
            removeAnnotationsListener: function (listener) { var _a, _b; return (_b = (_a = _this.genericClient).removeEventListener) === null || _b === void 0 ? void 0 : _b.call(_a, "Session.annotations", listener); },
            /**
             * Describes the regions of the recording which are loading or loaded.
             */
            addLoadedRegionsListener: function (listener) {
                return _this.genericClient.addEventListener("Session.loadedRegions", listener);
            },
            removeLoadedRegionsListener: function (listener) { var _a, _b; return (_b = (_a = _this.genericClient).removeEventListener) === null || _b === void 0 ? void 0 : _b.call(_a, "Session.loadedRegions", listener); },
            /**
             * An event indicating that something happened in a way that is not yet officially
             * supported in the protocol. This will only be emitted for sessions which
             * specified experimental settings when they were created.
             */
            addExperimentalEventListener: function (listener) {
                return _this.genericClient.addEventListener("Session.experimentalEvent", listener);
            },
            removeExperimentalEventListener: function (listener) { var _a, _b; return (_b = (_a = _this.genericClient).removeEventListener) === null || _b === void 0 ? void 0 : _b.call(_a, "Session.experimentalEvent", listener); },
            /**
             * Does not return until the recording is fully processed. Before returning,
             * <code>missingRegions</code> and <code>unprocessedRegions</code> events will
             * be periodically emitted. Commands which require inspecting the recording
             * will not return until that part of the recording has been processed,
             * see <code>ProcessingLevel</code> for details.
             */
            ensureProcessed: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Session.ensureProcessed", parameters, sessionId, pauseId);
            },
            /**
             * Find all points in the recording at which a mouse move or click occurred.
             * Does not return until the recording is fully processed. Before returning,
             * <code>mouseEvents</code> events will be periodically emitted. The union
             * of all these events describes all mouse events in the recording.
             */
            findMouseEvents: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Session.findMouseEvents", parameters, sessionId, pauseId);
            },
            /**
             * Find all points in the recording at which a keyboard event occurred.
             * Does not return until the recording is fully processed. Before returning,
             * <code>keyboardEvents</code> events will be periodically emitted. The union
             * of all these events describes all keyboard events in the recording.
             */
            findKeyboardEvents: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Session.findKeyboardEvents", parameters, sessionId, pauseId);
            },
            findNavigationEvents: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Session.findNavigationEvents", parameters, sessionId, pauseId);
            },
            /**
             * Find all points in the recording at which an annotation was added via the
             * RecordReplayOnAnnotation driver API. Does not return until the recording
             * is fully processed. Before returning, <code>annotations</code> events will
             * be periodically emitted, which describe all annotations in the recording,
             * or all annotations of the provided kind.
             */
            findAnnotations: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Session.findAnnotations", parameters, sessionId, pauseId);
            },
            /**
             * Get the different kinds of annotations in the recording.
             */
            getAnnotationKinds: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Session.getAnnotationKinds", parameters, sessionId, pauseId);
            },
            /**
             * Get the last execution point in the recording.
             */
            getEndpoint: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Session.getEndpoint", parameters, sessionId, pauseId);
            },
            /**
             * Get a point near a given time in the recording. Unlike other commands, this
             * command will not raise an error if it is performed for an unloaded time.
             */
            getPointNearTime: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Session.getPointNearTime", parameters, sessionId, pauseId);
            },
            /**
             * Get points bounding a time. Much like <code>getPointNearTime</code>,
             * this command will not raise an error if it is performed for an unloaded
             * time.
             */
            getPointsBoundingTime: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Session.getPointsBoundingTime", parameters, sessionId, pauseId);
            },
            /**
             * Create a pause describing the state at an execution point.
             */
            createPause: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Session.createPause", parameters, sessionId, pauseId);
            },
            /**
             * Release a pause and allow its resources to be reclaimed.
             */
            releasePause: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Session.releasePause", parameters, sessionId, pauseId);
            },
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
            listenForLoadChanges: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Session.listenForLoadChanges", parameters, sessionId, pauseId);
            },
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
            requestFocusRange: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Session.requestFocusRange", parameters, sessionId, pauseId);
            },
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
            loadRegion: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Session.loadRegion", parameters, sessionId, pauseId);
            },
            /**
             * Request that part of the recording be unloaded. As for <code>Session.loadRegion</code>,
             * the newly loaded regions will take effect after the command returns, and commands
             * which are sent before this returns or are in progress when it is sent may or may
             * not use the newly loaded regions.
             */
            unloadRegion: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Session.unloadRegion", parameters, sessionId, pauseId);
            },
            /**
             * Get the identifier of the build used to produce the recording.
             */
            getBuildId: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Session.getBuildId", parameters, sessionId, pauseId);
            },
        };
        /**
         * The Graphics domain defines methods for accessing a recording's graphics data.
         *
         * <br><br>All commands and events in this domain must include a <code>sessionId</code>.
         */
        this.Graphics = {
            /**
             * Describes some points in the recording at which paints occurred. No paint
             * will occur for the recording's beginning execution point.
             */
            addPaintPointsListener: function (listener) {
                return _this.genericClient.addEventListener("Graphics.paintPoints", listener);
            },
            removePaintPointsListener: function (listener) { var _a, _b; return (_b = (_a = _this.genericClient).removeEventListener) === null || _b === void 0 ? void 0 : _b.call(_a, "Graphics.paintPoints", listener); },
            /**
             * Find all points in the recording at which paints occurred. Does not return
             * until the recording is fully processed. Before returning,
             * <code>paintPoints</code> events will be periodically emitted. The union
             * of all these events describes all paint points in the recording.
             */
            findPaints: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Graphics.findPaints", parameters, sessionId, pauseId);
            },
            /**
             * Get the graphics at a point where a paint occurred.
             */
            getPaintContents: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Graphics.getPaintContents", parameters, sessionId, pauseId);
            },
            /**
             * Get the value of <code>window.devicePixelRatio</code>. This is the ratio of
             * pixels in screen shots to pixels used by DOM/CSS data such as
             * <code>DOM.getBoundingClientRect</code>.
             */
            getDevicePixelRatio: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Graphics.getDevicePixelRatio", parameters, sessionId, pauseId);
            },
        };
        /**
         * The Debugger domain defines methods for accessing sources in the recording
         * and navigating around the recording using breakpoints, stepping, and so forth.
         *
         * <br><br>All commands and events in this domain must include a <code>sessionId</code>.
         */
        this.Debugger = {
            /**
             * Describes a source in the recording.
             */
            addNewSourceListener: function (listener) {
                return _this.genericClient.addEventListener("Debugger.newSource", listener);
            },
            removeNewSourceListener: function (listener) { var _a, _b; return (_b = (_a = _this.genericClient).removeEventListener) === null || _b === void 0 ? void 0 : _b.call(_a, "Debugger.newSource", listener); },
            /**
             * Specifies the number of lines in a file.
             */
            addSourceContentsInfoListener: function (listener) {
                return _this.genericClient.addEventListener("Debugger.sourceContentsInfo", listener);
            },
            removeSourceContentsInfoListener: function (listener) { var _a, _b; return (_b = (_a = _this.genericClient).removeEventListener) === null || _b === void 0 ? void 0 : _b.call(_a, "Debugger.sourceContentsInfo", listener); },
            /**
             * A single chunk of the source's contents. The chunk will be 10,000 code
             * units long unless it is the last chunk in the file, in which case it will
             * be equal to or shorter than 10,000.
             */
            addSourceContentsChunkListener: function (listener) {
                return _this.genericClient.addEventListener("Debugger.sourceContentsChunk", listener);
            },
            removeSourceContentsChunkListener: function (listener) { var _a, _b; return (_b = (_a = _this.genericClient).removeEventListener) === null || _b === void 0 ? void 0 : _b.call(_a, "Debugger.sourceContentsChunk", listener); },
            addSearchSourceContentsMatchesListener: function (listener) {
                return _this.genericClient.addEventListener("Debugger.searchSourceContentsMatches", listener);
            },
            removeSearchSourceContentsMatchesListener: function (listener) { var _a, _b; return (_b = (_a = _this.genericClient).removeEventListener) === null || _b === void 0 ? void 0 : _b.call(_a, "Debugger.searchSourceContentsMatches", listener); },
            addFunctionsMatchesListener: function (listener) {
                return _this.genericClient.addEventListener("Debugger.functionsMatches", listener);
            },
            removeFunctionsMatchesListener: function (listener) { var _a, _b; return (_b = (_a = _this.genericClient).removeEventListener) === null || _b === void 0 ? void 0 : _b.call(_a, "Debugger.functionsMatches", listener); },
            /**
             * Find all sources in the recording. Does not return until the recording is
             * fully processed. Before returning, <code>newSource</code> events will be
             * emitted for every source in the recording.
             */
            findSources: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Debugger.findSources", parameters, sessionId, pauseId);
            },
            /**
             * Similar to <code>getSourceContents</code> but instead of returning the
             * entire contents this command will emit one <code>sourceContentsInfo</code>
             * event with details about the source contents, and
             * <code>sourceContentsChunk</code> events with the contents of the file split
             * up into chunks of 10,000 code units.
             */
            streamSourceContents: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Debugger.streamSourceContents", parameters, sessionId, pauseId);
            },
            /**
             * Get the contents of a source. Unlike <code>streamSourceContents</code>, the
             * entire contents of the file will be returned in the response.
             */
            getSourceContents: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Debugger.getSourceContents", parameters, sessionId, pauseId);
            },
            /**
             * Get the sourcemap of a source.
             */
            getSourceMap: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Debugger.getSourceMap", parameters, sessionId, pauseId);
            },
            /**
             * Get the mapping of generated to original variable names for the given
             * location (which must be in a generated source).
             */
            getScopeMap: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Debugger.getScopeMap", parameters, sessionId, pauseId);
            },
            /**
             * Get a compact representation of the locations where breakpoints can be set
             * in a region of a source.
             */
            getPossibleBreakpoints: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Debugger.getPossibleBreakpoints", parameters, sessionId, pauseId);
            },
            /**
             * Get a HitCount object for each of the given locations in the given sourceId.
             * Counts will only be computed for regions in the recording which are loaded.
             */
            getHitCounts: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Debugger.getHitCounts", parameters, sessionId, pauseId);
            },
            /**
             * Get the number of times handlers for a type of event executed.
             */
            getEventHandlerCount: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Debugger.getEventHandlerCount", parameters, sessionId, pauseId);
            },
            /**
             * Get the number of times handlers for a type of event executed.
             */
            getEventHandlerCounts: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Debugger.getEventHandlerCounts", parameters, sessionId, pauseId);
            },
            searchSourceContents: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Debugger.searchSourceContents", parameters, sessionId, pauseId);
            },
            /**
             * Get the mapped location for a source location.
             */
            getMappedLocation: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Debugger.getMappedLocation", parameters, sessionId, pauseId);
            },
            /**
             * Set a breakpoint at a location.
             */
            setBreakpoint: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Debugger.setBreakpoint", parameters, sessionId, pauseId);
            },
            /**
             * Remove a breakpoint.
             */
            removeBreakpoint: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Debugger.removeBreakpoint", parameters, sessionId, pauseId);
            },
            /**
             * Find where to pause when running forward from a point.
             */
            findResumeTarget: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Debugger.findResumeTarget", parameters, sessionId, pauseId);
            },
            /**
             * Find where to pause when rewinding from a point.
             */
            findRewindTarget: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Debugger.findRewindTarget", parameters, sessionId, pauseId);
            },
            /**
             * Find where to pause when reverse-stepping from a point.
             */
            findReverseStepOverTarget: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Debugger.findReverseStepOverTarget", parameters, sessionId, pauseId);
            },
            /**
             * Find where to pause when stepping from a point.
             */
            findStepOverTarget: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Debugger.findStepOverTarget", parameters, sessionId, pauseId);
            },
            /**
             * Find where to pause when stepping from a point and stopping at the entry of
             * any encountered call.
             */
            findStepInTarget: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Debugger.findStepInTarget", parameters, sessionId, pauseId);
            },
            /**
             * Find where to pause when stepping out from a frame to the caller.
             */
            findStepOutTarget: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Debugger.findStepOutTarget", parameters, sessionId, pauseId);
            },
            /**
             * Blackbox a source or a region in it. Resume commands like
             * <code>findResumeTarget</code> will not return execution points in
             * blackboxed regions of a source.
             */
            blackboxSource: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Debugger.blackboxSource", parameters, sessionId, pauseId);
            },
            /**
             * Unblackbox a source or a region in it.
             */
            unblackboxSource: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Debugger.unblackboxSource", parameters, sessionId, pauseId);
            },
            /**
             * Get the function names that match a query.
             */
            searchFunctions: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Debugger.searchFunctions", parameters, sessionId, pauseId);
            },
        };
        /**
         * The Console domain defines methods for accessing messages reported to the console.
         *
         * <br><br>All commands and events in this domain must include a <code>sessionId</code>.
         */
        this.Console = {
            /**
             * Describes a console message in the recording.
             */
            addNewMessageListener: function (listener) {
                return _this.genericClient.addEventListener("Console.newMessage", listener);
            },
            removeNewMessageListener: function (listener) { var _a, _b; return (_b = (_a = _this.genericClient).removeEventListener) === null || _b === void 0 ? void 0 : _b.call(_a, "Console.newMessage", listener); },
            /**
             * Find all messages in the recording. Does not return until the recording is
             * fully processed. Before returning, <code>newMessage</code> events will be
             * emitted for every console message in the recording.
             */
            findMessages: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Console.findMessages", parameters, sessionId, pauseId);
            },
            /**
             * Find all messages in one area of a recording. Useful if finding all messages in
             * the recording overflowed.
             */
            findMessagesInRange: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Console.findMessagesInRange", parameters, sessionId, pauseId);
            },
        };
        /**
         * The Pause domain is used to inspect the state of the program when it is paused
         * at particular execution points.
         *
         * <br><br>All commands and events in this domain must include both a <code>sessionId</code>
         * and a <code>pauseId</code>.
         */
        this.Pause = {
            /**
             * Evaluate an expression in the context of a call frame. This command is
             * effectful.
             */
            evaluateInFrame: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Pause.evaluateInFrame", parameters, sessionId, pauseId);
            },
            /**
             * Evaluate an expression in a global context. This command is effectful.
             */
            evaluateInGlobal: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Pause.evaluateInGlobal", parameters, sessionId, pauseId);
            },
            /**
             * Read a property from an object. This command is effectful.
             */
            getObjectProperty: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Pause.getObjectProperty", parameters, sessionId, pauseId);
            },
            /**
             * Call a function object. This command is effectful.
             */
            callFunction: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Pause.callFunction", parameters, sessionId, pauseId);
            },
            /**
             * Read a property from an object, then call the result. This command is effectful.
             */
            callObjectProperty: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Pause.callObjectProperty", parameters, sessionId, pauseId);
            },
            /**
             * Load a preview for an object.
             */
            getObjectPreview: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Pause.getObjectPreview", parameters, sessionId, pauseId);
            },
            /**
             * Load a scope's contents.
             */
            getScope: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Pause.getScope", parameters, sessionId, pauseId);
            },
            /**
             * Get the topmost frame on the stack.
             */
            getTopFrame: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Pause.getTopFrame", parameters, sessionId, pauseId);
            },
            /**
             * Get all frames on the stack.
             */
            getAllFrames: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Pause.getAllFrames", parameters, sessionId, pauseId);
            },
            /**
             * Get the values of a frame's arguments.
             */
            getFrameArguments: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Pause.getFrameArguments", parameters, sessionId, pauseId);
            },
            /**
             * Get the points of all steps that are executed by a frame.
             *
             * If this is a generator frame then steps from all places where the frame
             * executed will be returned, except in parts of the recording are unloaded
             * (see <code>Session.listenForLoadChanges</code>).
             */
            getFrameSteps: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Pause.getFrameSteps", parameters, sessionId, pauseId);
            },
            /**
             * Get any exception that is being thrown at this point.
             */
            getExceptionValue: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Pause.getExceptionValue", parameters, sessionId, pauseId);
            },
        };
        /**
         * The DOM domain is used to inspect the DOM at particular execution points.
         * Inspecting the DOM requires a <code>Pause.PauseId</code>, and DOM nodes
         * are identified by a <code>Pause.ObjectId</code>.
         *
         * <br><br>All commands and events in this domain must include both a <code>sessionId</code>
         * and a <code>pauseId</code>.
         */
        this.DOM = {
            /**
             * Get the page's root document.
             */
            getDocument: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("DOM.getDocument", parameters, sessionId, pauseId);
            },
            /**
             * Load previews for an object and its transitive parents up to the
             * root document.
             */
            getParentNodes: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("DOM.getParentNodes", parameters, sessionId, pauseId);
            },
            /**
             * Call querySelector() on a node in the page.
             */
            querySelector: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("DOM.querySelector", parameters, sessionId, pauseId);
            },
            /**
             * Get the event listeners attached to a node in the page.
             */
            getEventListeners: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("DOM.getEventListeners", parameters, sessionId, pauseId);
            },
            /**
             * Get boxes for a node.
             */
            getBoxModel: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("DOM.getBoxModel", parameters, sessionId, pauseId);
            },
            /**
             * Get the bounding client rect for a node.
             */
            getBoundingClientRect: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("DOM.getBoundingClientRect", parameters, sessionId, pauseId);
            },
            /**
             * Get the bounding client rect for all elements on the page.
             */
            getAllBoundingClientRects: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("DOM.getAllBoundingClientRects", parameters, sessionId, pauseId);
            },
            /**
             * Search the DOM for nodes containing a string.
             */
            performSearch: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("DOM.performSearch", parameters, sessionId, pauseId);
            },
            /**
             * Paint the state of the DOM at this pause, even if no equivalent paint
             * occurred when originally recording. In the latter case a best-effort attempt
             * will be made to paint the current graphics, but the result might not be
             * identical to what would have originally been drawn while recording.
             */
            repaintGraphics: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("DOM.repaintGraphics", parameters, sessionId, pauseId);
            },
        };
        /**
         * The CSS domain is used to inspect the CSS state at particular execution points.
         *
         * <br><br>All commands and events in this domain must include both a <code>sessionId</code>
         * and a <code>pauseId</code>.
         */
        this.CSS = {
            /**
             * Get the styles computed for a node.
             */
            getComputedStyle: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("CSS.getComputedStyle", parameters, sessionId, pauseId);
            },
            /**
             * Get the style rules being applied to a node.
             */
            getAppliedRules: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("CSS.getAppliedRules", parameters, sessionId, pauseId);
            },
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
        this.Analysis = {
            /**
             * Describes some results of an analysis.
             */
            addAnalysisResultListener: function (listener) {
                return _this.genericClient.addEventListener("Analysis.analysisResult", listener);
            },
            removeAnalysisResultListener: function (listener) { var _a, _b; return (_b = (_a = _this.genericClient).removeEventListener) === null || _b === void 0 ? void 0 : _b.call(_a, "Analysis.analysisResult", listener); },
            /**
             * Describes an error that occurred when running an analysis mapper or reducer
             * function. This will not be emitted for every error, but if there was any
             * error then at least one event will be emitted.
             */
            addAnalysisErrorListener: function (listener) {
                return _this.genericClient.addEventListener("Analysis.analysisError", listener);
            },
            removeAnalysisErrorListener: function (listener) { var _a, _b; return (_b = (_a = _this.genericClient).removeEventListener) === null || _b === void 0 ? void 0 : _b.call(_a, "Analysis.analysisError", listener); },
            /**
             * Describes some points at which an analysis will run.
             */
            addAnalysisPointsListener: function (listener) {
                return _this.genericClient.addEventListener("Analysis.analysisPoints", listener);
            },
            removeAnalysisPointsListener: function (listener) { var _a, _b; return (_b = (_a = _this.genericClient).removeEventListener) === null || _b === void 0 ? void 0 : _b.call(_a, "Analysis.analysisPoints", listener); },
            /**
             * Start specifying a new analysis.
             */
            createAnalysis: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Analysis.createAnalysis", parameters, sessionId, pauseId);
            },
            /**
             * Apply the analysis to every point where a source location executes.
             */
            addLocation: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Analysis.addLocation", parameters, sessionId, pauseId);
            },
            /**
             * Apply the analysis to every function entry point in a region of a source.
             */
            addFunctionEntryPoints: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Analysis.addFunctionEntryPoints", parameters, sessionId, pauseId);
            },
            /**
             * Apply the analysis to a random selection of points.
             */
            addRandomPoints: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Analysis.addRandomPoints", parameters, sessionId, pauseId);
            },
            /**
             * Apply the analysis to the entry point of every handler for an event.
             */
            addEventHandlerEntryPoints: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Analysis.addEventHandlerEntryPoints", parameters, sessionId, pauseId);
            },
            /**
             * Apply the analysis to every point where an exception is thrown.
             */
            addExceptionPoints: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Analysis.addExceptionPoints", parameters, sessionId, pauseId);
            },
            /**
             * Apply the analysis to a specific set of points.
             */
            addPoints: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Analysis.addPoints", parameters, sessionId, pauseId);
            },
            /**
             * Run the analysis. After this is called, <code>analysisResult</code> and/or
             * <code>analysisError</code> events will be emitted as results are gathered.
             * Does not return until the analysis has finished and all events have been
             * emitted. Results will not be gathered in parts of the recording that are
             * unloaded, see <code>Session.listenForLoadChanges</code> and
             * <code>Session.requestFocusRange</code>.
             */
            runAnalysis: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Analysis.runAnalysis", parameters, sessionId, pauseId);
            },
            /**
             * Release an analysis and its server side resources. If the analysis is
             * running, it will be canceled, preventing further <code>analysisResult</code>
             * and <code>analysisError</code> events from being emitted.
             */
            releaseAnalysis: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Analysis.releaseAnalysis", parameters, sessionId, pauseId);
            },
            /**
             * Find the set of execution points at which an analysis will run. After this
             * is called, <code>analysisPoints</code> events will be emitted as the points
             * are found. Does not return until events for all points have been emitted.
             * Points will not be emitted for parts of the recording that are
             * unloaded, see <code>Session.listenForLoadChanges</code> and
             * <code>Session.loadRegion</code>.
             */
            findAnalysisPoints: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Analysis.findAnalysisPoints", parameters, sessionId, pauseId);
            },
        };
        /**
         * The Network domain is used to inspect the Network state at particular execution points.
         *
         * <br><br>All commands and events in this domain must include both a <code>sessionId</code>.
         */
        this.Network = {
            /**
             * Emit data about a request body as it is processed.
             * Parts are not guaranteed to be emitted in order.
             */
            addRequestBodyDataListener: function (listener) {
                return _this.genericClient.addEventListener("Network.requestBodyData", listener);
            },
            removeRequestBodyDataListener: function (listener) { var _a, _b; return (_b = (_a = _this.genericClient).removeEventListener) === null || _b === void 0 ? void 0 : _b.call(_a, "Network.requestBodyData", listener); },
            /**
             * Emit data about a response body as it is processed.
             * Parts are not guaranteed to be emitted in order.
             */
            addResponseBodyDataListener: function (listener) {
                return _this.genericClient.addEventListener("Network.responseBodyData", listener);
            },
            removeResponseBodyDataListener: function (listener) { var _a, _b; return (_b = (_a = _this.genericClient).removeEventListener) === null || _b === void 0 ? void 0 : _b.call(_a, "Network.responseBodyData", listener); },
            /**
             * Describe some requests that were dispatched by the recording.
             *
             * NOTE: There is no guarantee that request information will be available
             * before the request event info, so all temporal combinations should be
             * supported when processing this data.
             */
            addRequestsListener: function (listener) {
                return _this.genericClient.addEventListener("Network.requests", listener);
            },
            removeRequestsListener: function (listener) { var _a, _b; return (_b = (_a = _this.genericClient).removeEventListener) === null || _b === void 0 ? void 0 : _b.call(_a, "Network.requests", listener); },
            /**
             * Query the recording for all of the parts of this request body.
             * The server will emit 'requestBodyData' events for all parts, and
             * this command will not complete until all parts have been sent.
             */
            getRequestBody: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Network.getRequestBody", parameters, sessionId, pauseId);
            },
            /**
             * Query the recording for all of the parts of this response body.
             * The server will emit 'responseBodyData' events for all parts, and
             * this command will not complete until all parts have been sent.
             */
            getResponseBody: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Network.getResponseBody", parameters, sessionId, pauseId);
            },
            /**
             * Query the recording for all network data that is available, returning once
             * all 'Network.requests' events have been dispatched.
             */
            findRequests: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Network.findRequests", parameters, sessionId, pauseId);
            },
        };
        /**
         * The Target domain includes commands that are sent by the Record Replay Driver
         * to the target application which it is attached to. Protocol clients should
         * not use this domain. See https://replay.io/driver for more information.
         */
        this.Target = {
            /**
             * Query the target for general information about what capabilities it supports.
             */
            getCapabilities: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Target.getCapabilities", parameters, sessionId, pauseId);
            },
            /**
             * Get the function ID / offset to use for a source location, if there is one.
             */
            convertLocationToFunctionOffset: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Target.convertLocationToFunctionOffset", parameters, sessionId, pauseId);
            },
            /**
             * Get the location to use for a function ID / offset.
             */
            convertFunctionOffsetToLocation: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Target.convertFunctionOffsetToLocation", parameters, sessionId, pauseId);
            },
            /**
             * Get all the locations to use for some offsets in a function. This can be
             * implemented more efficiently by some targets than when separate
             * <code>convertFunctionOffsetToLocation</code> commands are used.
             */
            convertFunctionOffsetsToLocations: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Target.convertFunctionOffsetsToLocations", parameters, sessionId, pauseId);
            },
            /**
             * Get the offsets at which execution should pause when stepping around within
             * a frame for a function.
             */
            getStepOffsets: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Target.getStepOffsets", parameters, sessionId, pauseId);
            },
            /**
             * Get the most complete contents known for an HTML file.
             */
            getHTMLSource: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Target.getHTMLSource", parameters, sessionId, pauseId);
            },
            /**
             * Get the IDs of all functions in a range within a source.
             */
            getFunctionsInRange: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Target.getFunctionsInRange", parameters, sessionId, pauseId);
            },
            /**
             * Get any source map URL associated with a source.
             */
            getSourceMapURL: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Target.getSourceMapURL", parameters, sessionId, pauseId);
            },
            /**
             * Get any source map URL associated with a style sheet.
             */
            getSheetSourceMapURL: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Target.getSheetSourceMapURL", parameters, sessionId, pauseId);
            },
            /**
             * This command might be sent from within a RecordReplayOnConsoleMessage() call
             * to get contents of the new message. Properties in the result have the same
             * meaning as for <code>Console.Message</code>.
             */
            getCurrentMessageContents: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Target.getCurrentMessageContents", parameters, sessionId, pauseId);
            },
            /**
             * Count the number of stack frames on the stack. This is equivalent to using
             * the size of the stack returned by <code>Pause.getAllFrames</code>, but can
             * be implemented more efficiently.
             */
            countStackFrames: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Target.countStackFrames", parameters, sessionId, pauseId);
            },
            /**
             * Get the IDs of the functions for all stack frames, ordered from topmost to
             * bottommost.
             */
            getStackFunctionIDs: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Target.getStackFunctionIDs", parameters, sessionId, pauseId);
            },
            /**
             * If the topmost frame on the stack is a generator frame which can be popped
             * and pushed on the stack repeatedly, return a unique ID for the frame which
             * will be consistent across each of those pops and pushes.
             */
            currentGeneratorId: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Target.currentGeneratorId", parameters, sessionId, pauseId);
            },
            /**
             * Get the location of the top frame on the stack, if there is one.
             */
            topFrameLocation: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Target.topFrameLocation", parameters, sessionId, pauseId);
            },
            /**
             * This command might be sent from within a RecordReplayOnNetworkRequestEvent()
             * call to get contents of the request data.
             */
            getCurrentNetworkRequestEvent: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Target.getCurrentNetworkRequestEvent", parameters, sessionId, pauseId);
            },
            /**
             * Fetch the current data entry for a given driver OnNetworkStreamData call.
             */
            getCurrentNetworkStreamData: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Target.getCurrentNetworkStreamData", parameters, sessionId, pauseId);
            },
            /**
             * This command is used, when supported by the target runtime, to collect all
             * possible breakpoints for all sources of a given region in one batch. This is
             * an optimization over sending one Debugger.getPossibleBreakpoints command for
             * each source.
             */
            getPossibleBreakpointsForMultipleSources: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Target.getPossibleBreakpointsForMultipleSources", parameters, sessionId, pauseId);
            },
        };
        /**
         * The Internal domain is for use in software that is used to create recordings
         * and for internal/diagnostic use cases. While use of this domain is not
         * restricted, it won't be very helpful for other users.
         */
        this.Internal = {
            /**
             * Create a new recording.
             */
            createRecording: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Internal.createRecording", parameters, sessionId, pauseId);
            },
            /**
             * Adds metadata that is associated with the entire recording in question,
             * as identified by the id field in the recordingData field. This includes things
             * like the URL being recorded as well as the token that is associated with the
             * user who started this recording.
             */
            setRecordingMetadata: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Internal.setRecordingMetadata", parameters, sessionId, pauseId);
            },
            /**
             * Add data to a recording. The next message sent after this must be a binary
             * message with the data described by this message. A response to this command
             * indicates that the data has been successfully received by the server, but it
             * could still be lost due to a server failure. Use `Internal.finishRecording`
             * if you want to ensure that all data has been successfully stored.
             */
            addRecordingData: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Internal.addRecordingData", parameters, sessionId, pauseId);
            },
            /**
             * Indicate that all data for the given recording has been sent and the recording
             * can be marked ready and complete. If this is not sent, the recording will be
             * finished as a sideeffect of the connection closing, but if backend issues
             * were to fail to save all of the data, there will be no way to know.
             */
            finishRecording: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Internal.finishRecording", parameters, sessionId, pauseId);
            },
            /**
             * Lock a given recording so that sessions will not be created
             * until the lock has been removed.
             */
            beginRecordingResourceUpload: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Internal.beginRecordingResourceUpload", parameters, sessionId, pauseId);
            },
            /**
             * Unlock a lock so that sessions may be created.
             */
            endRecordingResourceUpload: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Internal.endRecordingResourceUpload", parameters, sessionId, pauseId);
            },
            /**
             * For testing network issues.
             */
            echo: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Internal.echo", parameters, sessionId, pauseId);
            },
            /**
             * Report information about a crash while recording.
             */
            reportCrash: function (parameters, sessionId, pauseId) {
                return _this.genericClient.sendCommand("Internal.reportCrash", parameters, sessionId, pauseId);
            },
        };
    }
    return ProtocolClient;
}());
exports.ProtocolClient = ProtocolClient;
