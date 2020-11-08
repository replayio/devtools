// ThreadFront is the main interface used to interact with the singleton
// WRP session. This interface is based on the one normally used when the
// devtools interact with a thread: at any time the thread is either paused
// at a particular point, or resuming on its way to pause at another point.
//
// This model is different from the one used in the WRP, where queries are
// performed on the state at different points in the recording. This layer
// helps with adapting the devtools to the WRP.

const { sendMessage, addEventListener, log } = require("../socket");
const { defer, assert, EventEmitter, ArrayMap } = require("../utils");
const { MappedLocationCache } = require("../mapped-location-cache");
const { ValueFront } = require("./value");
const { Pause } = require("./pause");

export const ThreadFront = {
  // When replaying there is only a single thread currently. Use this thread ID
  // everywhere needed throughout the devtools client.
  actor: "MainThreadId",

  currentPoint: "0",
  currentPointHasFrames: false,

  // Any pause for the current point.
  currentPause: null,

  // Pauses created for async parent frames of the current point.
  asyncPauses: [],

  // Recording ID being examined.
  recordingId: null,

  // Waiter for the associated session ID.
  sessionId: null,
  sessionWaiter: defer(),

  // Waiter which resolves when the debugger has loaded and we've warped to the endpoint.
  initializedWaiter: defer(),

  // Map sourceId to info about the source.
  sources: new Map(),

  // Resolve hooks for promises waiting on a source ID to be known.
  sourceWaiters: new ArrayMap(),

  // Map URL to sourceId[].
  urlSources: new ArrayMap(),

  // Map sourceId to sourceId[], reversing the generatedSourceIds map.
  originalSources: new ArrayMap(),

  // Source IDs for generated sources which should be preferred over any
  // original source.
  preferredGeneratedSources: new Set(),

  mappedLocations: new MappedLocationCache(),

  skipPausing: false,

  // Points which will be reached when stepping in various directions from a point.
  resumeTargets: new Map(),

  // Epoch which invalidates step targets when advanced.
  resumeTargetEpoch: 0,

  // How many in flight commands can change resume targets we get from the server.
  numPendingInvalidateCommands: 0,

  // Resolve hooks for promises waiting for pending invalidate commands to finish. wai
  invalidateCommandWaiters: [],

  // Pauses for each point we have stopped or might stop at.
  allPauses: new Map(),

  // Map breakpointId to information about the breakpoint, for all installed breakpoints.
  breakpoints: new Map(),

  // Any callback to invoke to adjust the point which we zoom to.
  warpCallback: null,

  async setSessionId(sessionId) {
    this.sessionId = sessionId;
    this.mappedLocations.sessionId = sessionId;
    this.sessionWaiter.resolve(sessionId);

    log(`GotSessionId ${sessionId}`);

    const { endpoint } = await sendMessage("Session.getEndpoint", {}, sessionId);
    this.emit("endpoint", endpoint);
  },

  async initializeToolbox() {
    const sessionId = await this.waitForSession();
    const { endpoint } = await sendMessage("Session.getEndpoint", {}, sessionId);

    // Make sure the debugger has added a pause listener before warping to the endpoint.
    await gToolbox.startPanel("debugger");
    this.timeWarp(endpoint.point, endpoint.time, /* hasFrames */ false, /* force */ true);
    this.initializedWaiter.resolve();

    if (this.testName) {
      sendMessage("Internal.labelTestSession", { sessionId });
      await gToolbox.selectTool("debugger");
      window.Test = require("test/harness");
      const script = document.createElement("script");
      script.src = `/test?${this.testName}`;
      document.head.appendChild(script);
    }
  },

  setTest(test) {
    this.testName = test;
  },

  waitForSession() {
    return this.sessionWaiter.promise;
  },

  async ensureProcessed(onMissingRegions, onUnprocessedRegions) {
    const sessionId = await this.waitForSession();

    addEventListener("Session.missingRegions", onMissingRegions);
    addEventListener("Session.unprocessedRegions", onUnprocessedRegions);

    await sendMessage("Session.ensureProcessed", {}, sessionId);
  },

  timeWarp(point, time, hasFrames, force) {
    log(`TimeWarp ${point}`);

    // The warp callback is used to change the locations where the thread is
    // warping to.
    if (this.warpCallback && !force) {
      const newTarget = this.warpCallback(point, time, hasFrames);
      if (newTarget) {
        point = newTarget.point;
        time = newTarget.time;
        hasFrames = newTarget.hasFrames;
      }
    }

    this.currentPoint = point;
    this.currentPointHasFrames = hasFrames;
    this.currentPause = null;
    this.asyncPauses.length = 0;
    this.emit("paused", { point, hasFrames, time });

    this._precacheResumeTargets();
  },

  async findSources(onSource) {
    const sessionId = await this.waitForSession();
    this.onSource = onSource;

    sendMessage("Debugger.findSources", {}, sessionId);
    addEventListener("Debugger.newSource", source => {
      let { sourceId, kind, url, generatedSourceIds } = source;
      this.sources.set(sourceId, { kind, url, generatedSourceIds });
      if (url) {
        this.urlSources.add(url, sourceId);
      }
      for (const generatedId of generatedSourceIds || []) {
        this.originalSources.add(generatedId, sourceId);
      }
      const waiters = this.sourceWaiters.map.get(sourceId);
      (waiters || []).forEach(resolve => resolve());
      this.sourceWaiters.map.delete(sourceId);
      onSource(source);
    });
  },

  getSourceKind(sourceId) {
    const info = this.sources.get(sourceId);
    return info ? info.kind : null;
  },

  async ensureSource(sourceId) {
    if (!this.sources.has(sourceId)) {
      const { promise, resolve } = defer();
      this.sourceWaiters.add(sourceId, resolve);
      await promise;
    }
    return this.sources.get(sourceId);
  },

  getSourceURLRaw(sourceId) {
    const info = this.sources.get(sourceId);
    return info && info.url;
  },

  async getSourceURL(sourceId) {
    const info = await this.ensureSource(sourceId);
    return info.url;
  },

  getSourceIdsForURL(url) {
    // Ignore IDs which are generated versions of another ID with the same URL.
    // This happens with inline sources for HTML pages, in which case we only
    // want the ID for the HTML itself.
    const ids = this.urlSources.map.get(url) || [];
    return ids.filter(id => {
      const originalIds = this.originalSources.map.get(id);
      return (originalIds || []).every(originalId => !ids.includes(originalId));
    });
  },

  async getSourceContents(sourceId) {
    const { contents, contentType } = await sendMessage(
      "Debugger.getSourceContents",
      { sourceId },
      this.sessionId
    );
    return { contents, contentType };
  },

  async getBreakpointPositionsCompressed(sourceId, range) {
    const begin = range ? range.start : undefined;
    const end = range ? range.end : undefined;
    const { lineLocations } = await sendMessage(
      "Debugger.getPossibleBreakpoints",
      { sourceId, begin, end },
      this.sessionId
    );
    return lineLocations;
  },

  setSkipPausing(skip) {
    this.skipPausing = skip;
  },

  async setBreakpoint(sourceId, line, column, condition) {
    const location = { sourceId, line, column };
    try {
      this._invalidateResumeTargets(async () => {
        const { breakpointId } = await sendMessage(
          "Debugger.setBreakpoint",
          { location, condition },
          this.sessionId
        );
        if (breakpointId) {
          this.breakpoints.set(breakpointId, { location });
        }
      });
    } catch (e) {
      // An error will be generated if the breakpoint location is not valid for
      // this source. We don't keep precise track of which locations are valid
      // for which inline sources in an HTML file (which share the same URL),
      // so ignore these errors.
    }
  },

  setBreakpointByURL(url, line, column, condition) {
    const sources = this.getSourceIdsForURL(url);
    if (!sources) {
      return;
    }
    const sourceIds = this._chooseSourceIdList(sources);
    return Promise.all(
      sourceIds.map(({ sourceId }) => this.setBreakpoint(sourceId, line, column, condition))
    );
  },

  async removeBreakpoint(sourceId, line, column) {
    for (const [breakpointId, { location }] of this.breakpoints.entries()) {
      if (location.sourceId == sourceId && location.line == line && location.column == column) {
        this.breakpoints.delete(breakpointId);
        this._invalidateResumeTargets(async () => {
          await sendMessage("Debugger.removeBreakpoint", { breakpointId }, this.sessionId);
        });
      }
    }
  },

  removeBreakpointByURL(url, line, column) {
    const sources = this.getSourceIdsForURL(url);
    if (!sources) {
      return;
    }
    const sourceIds = this._chooseSourceIdList(sources);
    return Promise.all(
      sourceIds.map(({ sourceId }) => this.removeBreakpoint(sourceId, line, column))
    );
  },

  ensurePause(point) {
    let pause = this.allPauses.get(point);
    if (pause) {
      return pause;
    }
    pause = new Pause(this.sessionId);
    pause.create(point);
    this.allPauses.set(point, pause);
    return pause;
  },

  ensureCurrentPause() {
    if (!this.currentPause) {
      this.currentPause = this.ensurePause(this.currentPoint);
    }
  },

  getFrames() {
    if (!this.currentPointHasFrames) {
      return [];
    }

    this.ensureCurrentPause();
    return this.currentPause.getFrames();
  },

  lastAsyncPause() {
    this.ensureCurrentPause();
    return this.asyncPauses.length
      ? this.asyncPauses[this.asyncPauses.length - 1]
      : this.currentPause;
  },

  async loadAsyncParentFrames() {
    const basePause = this.lastAsyncPause();
    const baseFrames = await basePause.getFrames();
    if (!baseFrames) {
      return [];
    }
    const steps = await basePause.getFrameSteps(baseFrames[baseFrames.length - 1].frameId);
    if (basePause != this.lastAsyncPause()) {
      return [];
    }
    const entryPause = this.ensurePause(steps[0].point);
    this.asyncPauses.push(entryPause);
    const frames = await entryPause.getFrames();
    if (entryPause != this.lastAsyncPause()) {
      return [];
    }
    return frames.slice(1);
  },

  pauseForAsyncIndex(asyncIndex) {
    this.ensureCurrentPause();
    return asyncIndex ? this.asyncPauses[asyncIndex - 1] : this.currentPause;
  },

  getScopes(asyncIndex, frameId) {
    return this.pauseForAsyncIndex(asyncIndex).getScopes(frameId);
  },

  async evaluate(asyncIndex, frameId, text) {
    const pause = this.pauseForAsyncIndex(asyncIndex);
    const rv = await pause.evaluate(frameId, text);
    if (rv.returned) {
      rv.returned = new ValueFront(pause, rv.returned);
    } else if (rv.exception) {
      rv.exception = new ValueFront(pause, rv.exception);
    }
    return rv;
  },

  // Preload step target information and pause data for nearby points.
  async _precacheResumeTargets() {
    if (!this.currentPointHasFrames) {
      return;
    }

    const point = this.currentPoint;
    const epoch = this.resumeTargetEpoch;

    // Each step command, and the transitive steps to queue up after that step is known.
    const stepCommands = [
      {
        command: "Debugger.findReverseStepOverTarget",
        transitive: ["Debugger.findReverseStepOverTarget", "Debugger.findStepInTarget"],
      },
      {
        command: "Debugger.findStepOverTarget",
        transitive: ["Debugger.findStepOverTarget", "Debugger.findStepInTarget"],
      },
      {
        command: "Debugger.findStepInTarget",
        transitive: ["Debugger.findStepOutTarget", "Debugger.findStepInTarget"],
      },
      {
        command: "Debugger.findStepOutTarget",
        transitive: [
          "Debugger.findReverseStepOverTarget",
          "Debugger.findStepOverTarget",
          "Debugger.findStepInTarget",
          "Debugger.findStepOutTarget",
        ],
      },
    ];

    stepCommands.forEach(async ({ command, transitive }) => {
      const target = await this._findResumeTarget(point, command);
      if (epoch != this.resumeTargetEpoch || !target.frame) {
        return;
      }

      // Precache pause data for the point.
      this.ensurePause(target.point);

      if (point != this.currentPoint) {
        return;
      }

      // Look for transitive resume targets.
      transitive.forEach(async command => {
        const transitiveTarget = await this._findResumeTarget(target.point, command);
        if (
          epoch != this.resumeTargetEpoch ||
          point != this.currentPoint ||
          !transitiveTarget.frame
        ) {
          return;
        }
        this.ensurePause(transitiveTarget.point);
      });
    });
  },

  // Perform an operation that will change our cached targets about where resume
  // operations will finish.
  async _invalidateResumeTargets(callback) {
    this.resumeTargets.clear();
    this.resumeTargetEpoch++;
    this.numPendingInvalidateCommands++;

    try {
      await callback();
    } finally {
      if (--this.numPendingInvalidateCommands == 0) {
        this.invalidateCommandWaiters.forEach(resolve => resolve());
        this.invalidateCommandWaiters.length = 0;
        this._precacheResumeTargets();
      }
    }
  },

  // Wait for any in flight invalidation commands to finish. Note: currently
  // this is only used during tests. Uses could be expanded to ensure that we
  // don't perform resumes until all invalidating commands have settled, though
  // this risks slowing things down and/or getting stuck if the server is having
  // a problem.
  waitForInvalidateCommandsToFinish() {
    if (!this.numPendingInvalidateCommands) {
      return;
    }
    const { promise, resolve } = defer();
    this.invalidateCommandWaiters.push(resolve);
    return promise;
  },

  async _findResumeTarget(point, command) {
    // Check already-known resume targets.
    const key = `${point}:${command}`;
    const knownTarget = this.resumeTargets.get(key);
    if (knownTarget) {
      return knownTarget;
    }

    const epoch = this.resumeTargetEpoch;
    const { target } = await sendMessage(command, { point }, this.sessionId);
    if (epoch == this.resumeTargetEpoch) {
      this.resumeTargets.set(key, target);
    }

    return target;
  },

  async _resumeOperation(command, selectedPoint) {
    // Don't allow resumes until we've finished loading and did the initial
    // warp to the endpoint.
    await this.initializedWaiter.promise;

    let resumeEmitted = false;
    let resumeTarget = null;

    const warpToTarget = () => {
      const { point, time, frame } = resumeTarget;
      this.timeWarp(point, time, !!frame);
    };

    setTimeout(() => {
      resumeEmitted = true;
      this.emit("resumed");
      if (resumeTarget) {
        setTimeout(warpToTarget, 0);
      }
    }, 0);

    const point = selectedPoint || this.currentPoint;
    resumeTarget = await this._findResumeTarget(point, command);
    if (resumeEmitted) {
      warpToTarget();
    }
  },

  rewind(point) {
    this._resumeOperation("Debugger.findRewindTarget", point);
  },
  resume(point) {
    this._resumeOperation("Debugger.findResumeTarget", point);
  },
  reverseStepOver(point) {
    this._resumeOperation("Debugger.findReverseStepOverTarget", point);
  },
  stepOver(point) {
    this._resumeOperation("Debugger.findStepOverTarget", point);
  },
  stepIn(point) {
    this._resumeOperation("Debugger.findStepInTarget", point);
  },
  stepOut(point) {
    this._resumeOperation("Debugger.findStepOutTarget", point);
  },

  async resumeTarget(point) {
    await this.initializedWaiter.promise;
    return this._findResumeTarget(point, "Debugger.findResumeTarget");
  },

  blackbox(sourceId, begin, end) {
    return this._invalidateResumeTargets(async () => {
      await sendMessage("Debugger.blackboxSource", { sourceId, begin, end }, this.sessionId);
    });
  },

  unblackbox(sourceId, begin, end) {
    return this._invalidateResumeTargets(async () => {
      await sendMessage("Debugger.unblackboxSource", { sourceId, begin, end }, this.sessionId);
    });
  },

  async findConsoleMessages(onConsoleMessage) {
    const sessionId = await this.waitForSession();

    sendMessage("Console.findMessages", {}, sessionId);
    addEventListener("Console.newMessage", ({ message }) => {
      const pause = new Pause(this.sessionId);
      pause.instantiate(message.pauseId, message.data);
      if (message.argumentValues) {
        message.argumentValues = message.argumentValues.map(v => new ValueFront(pause, v));
      }
      onConsoleMessage(pause, message);
    });
  },

  async getRootDOMNode() {
    if (!this.sessionId) {
      return null;
    }
    this.ensureCurrentPause();
    const pause = this.currentPause;
    await this.currentPause.loadDocument();
    return pause == this.currentPause ? this.getKnownRootDOMNode() : null;
  },

  getKnownRootDOMNode() {
    assert(this.currentPause.documentNode !== undefined);
    return this.currentPause.documentNode;
  },

  async searchDOM(query) {
    if (!this.sessionId) {
      return [];
    }
    this.ensureCurrentPause();
    const pause = this.currentPause;
    const nodes = await this.currentPause.searchDOM(query);
    return pause == this.currentPause ? nodes : null;
  },

  async loadMouseTargets() {
    if (!this.sessionId) {
      return;
    }
    const pause = this.currentPause;
    this.ensureCurrentPause();
    await this.currentPause.loadMouseTargets();
    return pause == this.currentPause;
  },

  async getMouseTarget(x, y) {
    if (!this.sessionId) {
      return null;
    }
    const pause = this.currentPause;
    this.ensureCurrentPause();
    const nodeBounds = await this.currentPause.getMouseTarget(x, y);
    return pause == this.currentPause ? nodeBounds : null;
  },

  async ensureNodeLoaded(objectId) {
    const pause = this.currentPause;
    const node = await pause.ensureDOMFrontAndParents(objectId);
    if (pause != this.currentPause) {
      return null;
    }
    await node.ensureParentsLoaded();
    return pause == this.currentPause ? node : null;
  },

  getFrameSteps(asyncIndex, frameId) {
    return this.pauseForAsyncIndex(asyncIndex).getFrameSteps(frameId);
  },

  getPreferredLocationRaw(locations) {
    const { sourceId } = this._chooseSourceId(locations.map(l => l.sourceId));
    return locations.find(l => l.sourceId == sourceId);
  },

  // Given an RRP MappedLocation array with locations in different sources
  // representing the same generated location (i.e. a generated location plus
  // all the corresponding locations in original or pretty printed sources etc.),
  // choose the location which we should be using within the devtools. Normally
  // this is the most original location, except when preferSource has been used
  // to prefer a generated source instead.
  async getPreferredLocation(locations) {
    await Promise.all(locations.map(({ sourceId }) => this.ensureSource(sourceId)));
    return this.getPreferredLocationRaw(locations);
  },

  async getAlternateLocation(locations) {
    await Promise.all(locations.map(({ sourceId }) => this.ensureSource(sourceId)));
    const { alternateId } = this._chooseSourceId(locations.map(l => l.sourceId));
    if (alternateId) {
      return locations.find(l => l.sourceId == alternateId);
    }
    return null;
  },

  // Get the source which should be used in the devtools from an array of
  // sources representing the same location. If the chosen source is an
  // original or generated source and there is an alternative which users
  // can switch to, also returns that alternative.
  _chooseSourceId(sourceIds) {
    // Ignore inline sources if we have an HTML source containing them.
    if (sourceIds.some(id => this.getSourceKind(id) == "html")) {
      sourceIds = sourceIds.filter(id => this.getSourceKind(id) != "inlineSource");
    }

    // Ignore minified sources.
    sourceIds = sourceIds.filter(id => !this.isMinifiedSource(id));

    // Determine the base generated/original ID to use for the source.
    let generatedId, originalId;
    for (const id of sourceIds) {
      const info = this.sources.get(id);
      if (!info) {
        // Sources haven't finished loading, bail out and return this one.
        return { sourceId: id };
      }
      // Determine the kind of this source, or its minified version.
      let kind = info.kind;
      if (kind == "prettyPrinted") {
        const minifiedInfo = this.sources.get(info.generatedSourceIds[0]);
        if (!minifiedInfo) {
          return { sourceId: id };
        }
        kind = minifiedInfo.kind;
        assert(kind != "prettyPrinted");
      }
      if (kind == "sourceMapped") {
        originalId = id;
      } else {
        assert(!generatedId);
        generatedId = id;
      }
    }

    if (!generatedId) {
      assert(originalId);
      return { sourceId: originalId };
    }

    if (!originalId) {
      return { sourceId: generatedId };
    }

    // Prefer original sources over generated sources, except when overridden
    // through user action.
    if (this.preferredGeneratedSources.has(generatedId)) {
      return { sourceId: generatedId, alternateId: originalId };
    }
    return { sourceId: originalId, alternateId: generatedId };
  },

  // Get the set of chosen sources from a list of source IDs which might
  // represent different generated locations.
  _chooseSourceIdList(sourceIds) {
    const groups = this._groupSourceIds(sourceIds);
    return groups.map(ids => this._chooseSourceId(ids));
  },

  // Group together a set of source IDs according to whether they are generated
  // or original versions of each other.
  _groupSourceIds(sourceIds) {
    const groups = [];
    while (sourceIds.length) {
      const id = sourceIds[0];
      const group = this._getAlternateSourceIds(id).filter(id => sourceIds.includes(id));
      groups.push(group);
      sourceIds = sourceIds.filter(id => !group.includes(id));
    }
    return groups;
  },

  // Get all original/generated IDs which can represent a location in sourceId.
  _getAlternateSourceIds(sourceId) {
    const rv = new Set();
    const worklist = [sourceId];
    while (worklist.length) {
      sourceId = worklist.pop();
      if (rv.has(sourceId)) {
        continue;
      }
      rv.add(sourceId);
      const { generatedSourceIds } = this.sources.get(sourceId);
      (generatedSourceIds || []).forEach(id => worklist.push(id));
      const originalSourceIds = this.originalSources.map.get(sourceId);
      (originalSourceIds || []).forEach(id => worklist.push(id));
    }
    return [...rv];
  },

  // Return whether sourceId is minified and has a pretty printed alternate.
  isMinifiedSource(sourceId) {
    const originalIds = this.originalSources.map.get(sourceId) || [];
    return originalIds.some(id => {
      const info = this.sources.get(id);
      return info && info.kind == "prettyPrinted";
    });
  },

  isSourceMappedSource(sourceId) {
    const info = this.sources.get(sourceId);
    if (!info) {
      return false;
    }
    let kind = info.kind;
    if (kind == "prettyPrinted") {
      const minifiedInfo = this.sources.get(info.generatedSourceIds[0]);
      if (!minifiedInfo) {
        return false;
      }
      kind = minifiedInfo.kind;
      assert(kind != "prettyPrinted");
    }
    return kind == "sourceMapped";
  },

  preferSource(sourceId, value) {
    assert(!this.isSourceMappedSource(sourceId));
    if (value) {
      this.preferredGeneratedSources.add(sourceId);
    } else {
      this.preferredGeneratedSources.delete(sourceId);
    }
  },

  hasPreferredGeneratedSource(location) {
    return location.some(({ sourceId }) => {
      return this.preferredGeneratedSources.has(sourceId);
    });
  },

  // Given a location in a generated source, get the preferred location to use.
  // This has to query the server to get the original / pretty printed locations
  // corresponding to this generated location, so getPreferredLocation is
  // better to use when possible.
  async getPreferredMappedLocation(location) {
    const mappedLocation = await this.mappedLocations.getMappedLocation(location);
    return this.getPreferredLocation(mappedLocation);
  },

  async getRecordingDescription() {
    let description;
    try {
      description = await sendMessage("Recording.getDescription", {
        recordingId: this.recordingId,
      });
    } catch (e) {
      // Getting the description will fail if it was never set. For now we don't
      // set the last screen in this case.
      const sessionId = await this.waitForSession();
      const { endpoint } = await sendMessage("Session.getEndpoint", {}, sessionId);
      description = { duration: endpoint.time };
    }

    return description;
  },

  async watchMetadata(key, callback) {
    if (!this.metadataListeners) {
      addEventListener("Recording.metadataChange", ({ key, newValue }) => {
        this.metadataListeners.forEach(entry => {
          if (entry.key == key) {
            entry.callback(newValue ? JSON.parse(newValue) : undefined);
          }
        });
      });
      this.metadataListeners = [];
    }
    this.metadataListeners.push({ key, callback });

    const { value } = await sendMessage("Recording.metadataStartListening", {
      recordingId: this.recordingId,
      key,
    });
    callback(value ? JSON.parse(value) : undefined);
  },

  async updateMetadata(key, callback) {
    // Keep trying to update the metadata until it succeeds --- we updated it
    // before anyone else did. Use the callback to compute the new value in
    // terms of the old value. The callback can return null to cancel the update.
    let { value } = await sendMessage("Recording.getMetadata", {
      recordingId: this.recordingId,
      key,
    });
    while (true) {
      const newValueRaw = callback(value ? JSON.parse(value) : undefined);
      if (!newValueRaw) {
        // The update was cancelled.
        return;
      }
      const newValue = JSON.stringify(newValueRaw);
      const { updated, currentValue } = await sendMessage("Recording.setMetadata", {
        recordingId: this.recordingId,
        key,
        newValue,
        oldValue: value,
      });
      if (updated) {
        // It worked! Hooray!
        break;
      }
      // Retry with the value that was written by another client.
      value = currentValue;
    }
  },
};

EventEmitter.decorate(ThreadFront);
