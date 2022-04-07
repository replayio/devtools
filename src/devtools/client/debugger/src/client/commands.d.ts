export const setupCommands: object;

export type $FixTypeLaterFunction = Function;

// TODO All of these functions need to be given actual types, preferably by converting this file to TS
export const clientCommands: {
  autocomplete: $FixTypeLaterFunction;
  blackBox: $FixTypeLaterFunction;
  releaseActor: $FixTypeLaterFunction;
  interrupt: $FixTypeLaterFunction;
  pauseGrip: $FixTypeLaterFunction;
  resume: $FixTypeLaterFunction;
  stepIn: $FixTypeLaterFunction;
  stepOut: $FixTypeLaterFunction;
  stepOver: $FixTypeLaterFunction;
  rewind: $FixTypeLaterFunction;
  reverseStepOver: $FixTypeLaterFunction;
  sourceContents: $FixTypeLaterFunction;
  getSourceForActor: $FixTypeLaterFunction;
  getSourceActorBreakpointPositions: $FixTypeLaterFunction;
  getSourceActorBreakableLines: $FixTypeLaterFunction;
  hasBreakpoint: $FixTypeLaterFunction;
  setBreakpoint: $FixTypeLaterFunction;
  setXHRBreakpoint: $FixTypeLaterFunction;
  removeXHRBreakpoint: $FixTypeLaterFunction;
  addWatchpoint: $FixTypeLaterFunction;
  removeWatchpoint: $FixTypeLaterFunction;
  removeBreakpoint: $FixTypeLaterFunction;
  runAnalysis: $FixTypeLaterFunction;
  evaluate: $FixTypeLaterFunction;
  evaluateExpressions: $FixTypeLaterFunction;
  navigate: $FixTypeLaterFunction;
  reload: $FixTypeLaterFunction;
  getProperties: $FixTypeLaterFunction;
  getFrameScopes: $FixTypeLaterFunction;
  getFrames: $FixTypeLaterFunction;
  loadAsyncParentFrames: $FixTypeLaterFunction;
  logExceptions: $FixTypeLaterFunction;
  fetchSources: $FixTypeLaterFunction;
  checkIfAlreadyPaused: $FixTypeLaterFunction;
  registerSourceActor: $FixTypeLaterFunction;
  getMainThread: $FixTypeLaterFunction;
  fetchEventTypePoints: $FixTypeLaterFunction;
  setEventListenerBreakpoints: $FixTypeLaterFunction;
  getFrontByID: $FixTypeLaterFunction;
  fetchAncestorFramePositions: $FixTypeLaterFunction;
  pickExecutionPoints: $FixTypeLaterFunction;
  getSourceActorBreakpointHitCounts;
};
