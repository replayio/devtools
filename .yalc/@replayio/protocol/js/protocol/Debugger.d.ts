import { TimeStampedPoint, PointRange, ExecutionPoint } from "./Recording";
/**
 * Unique ID for a source.
 */
export declare type SourceId = string;
/**
 * Kind of a source.
 * <br>
 * <br><code>inlineScript</code>: Inline contents of a <code>script</code> element.
 * <br><code>scriptSource</code>: Script loaded via the <code>src</code> attribute
 *   of a <code>script</code> element.
 * <br><code>other</code>: An unspecified kind of source. This does not include any
 *   original sources.
 * <br><code>html</code>: An entire HTML page containing one or more inline scripts.
 *   This is an original source whose generated sources are the inline scripts.
 * <br><code>sourceMapped</code>: An original source specified by a source map.
 *   This will have a generated source associated with the source map.
 *   The source map and its sources must have been
 *   associated with the recording via <code>Recording.addSourceMap</code> and
 *   <code>Recording.addOriginalSource</code>.
 * <br><code>prettyPrinted</code>: An original source which was produced by pretty
 *   printing the associated generated source. Pretty printed sources will
 *   automatically be created for other sources which appear to contain minified
 *   code, including HTML page sources. <code>newSource</code> events will be
 *   emitted for a pretty printed source before the generated source.
 * <br><br>
 */
export declare type SourceKind = "inlineScript" | "scriptSource" | "other" | "html" | "sourceMapped" | "prettyPrinted";
/**
 * A variable mapping containing a generated and an original variable name.
 */
export declare type VariableMapping = string[];
/**
 * Possible content types for sources.
 */
export declare type ContentType = "text/javascript" | "text/html";
/**
 * A combination of a location and the number of times that location was hit
 * during the execution of the currently loaded regions.
 */
export interface HitCount {
    /**
     * Location of the hits.
     */
    location: Location;
    /**
     * Number of times this location was hit in loaded regions.
     */
    hits: number;
}
/**
 * Type of an event which handlers can be associated with.
 */
export declare type EventHandlerType = string;
export interface EventHandlerCount {
    /**
     * The type of event.
     */
    type: EventHandlerType;
    /**
     * The number of times this type of event occurred.
     */
    count: number;
}
export interface SearchSourceContentsMatch {
    location: Location;
    /**
     * Some snippet of text from around the match
     */
    context: string;
    /**
     * The beginning of the match within the context snippet
     */
    contextStart: SourceLocation;
    /**
     * The end of the match within the context snippet
     */
    contextEnd: SourceLocation;
}
/**
 * Location within a particular source.
 */
export interface SourceLocation {
    /**
     * 1-indexed line in the source.
     */
    line: number;
    /**
     * 0-indexed column in the source.
     */
    column: number;
}
/**
 * Set of locations which are all on the same line of the same source.
 */
export interface SameLineSourceLocations {
    /**
     * Common line number for the locations.
     */
    line: number;
    /**
     * Different column numbers for the locations.
     */
    columns: number[];
}
/**
 * Location within a source.
 */
export interface Location extends SourceLocation {
    sourceId: SourceId;
}
/**
 * A location in a generated source, along with corresponding locations in any
 * original sources which the generated source was source mapped from.
 * The generated location is the first element of the array.
 */
export declare type MappedLocation = Location[];
/**
 * ID for a breakpoint.
 */
export declare type BreakpointId = string;
/**
 * Reasons why execution can pause when running forward or backward through
 * the recording.
 * <br>
 * <br><code>endpoint</code>: Ran to the beginning or end of the recording.
 * <br><code>breakpoint</code>: Hit an installed breakpoint.
 * <br><code>debuggerStatement</code>: Hit a debugger statement.
 * <br><code>step</code>: Reached the target of a step operation.
 * <br><br>
 */
export declare type PauseReason = "endpoint" | "breakpoint" | "debuggerStatement" | "step";
/**
 * Description of an execution point.
 */
export interface PointDescription extends TimeStampedPoint {
    /**
     * Location of the topmost frame, omitted if there are no frames on stack.
     */
    frame?: MappedLocation;
}
/**
 * Description of a point where execution can pause after running forward or
 * backward through the recording.
 */
export interface PauseDescription extends PointDescription {
    /**
     * Reason for pausing.
     */
    reason: PauseReason;
}
export interface FunctionMatch {
    loc: Location;
    name: string;
}
/**
 * Identifier for a JS object that persists through the lifetime of that object,
 * unlike Pause.ObjectId which can use different IDs for the same JS object in
 * different pauses.
 */
export declare type PersistentObjectId = string;
export interface findSourcesParameters {
}
export interface findSourcesResult {
}
export interface streamSourceContentsParameters {
    /**
     * Source to fetch the contents for.
     */
    sourceId: SourceId;
}
export interface streamSourceContentsResult {
}
export interface getSourceContentsParameters {
    /**
     * Source to fetch the contents for.
     */
    sourceId: SourceId;
}
export interface getSourceContentsResult {
    /**
     * Contents of the source.
     */
    contents: string;
    /**
     * Content type of the source contents.
     */
    contentType: ContentType;
}
export interface getSourceMapParameters {
    /**
     * Source to fetch the sourcemap for.
     */
    sourceId: SourceId;
}
export interface getSourceMapResult {
    /**
     * The sourcemap of the source (if there is one).
     */
    contents?: string;
}
export interface getScopeMapParameters {
    /**
     * Location in a generated source to fetch the scopemap for.
     */
    location: Location;
}
export interface getScopeMapResult {
    /**
     * The mapping of generated to original variable names.
     */
    map?: VariableMapping[];
}
export interface getPossibleBreakpointsParameters {
    /**
     * Source to return breakpoint locations for.
     */
    sourceId: SourceId;
    /**
     * If specified, earlier breakpoint locations will be excluded.
     */
    begin?: SourceLocation;
    /**
     * If specified, later breakpoint locations will be excluded.
     */
    end?: SourceLocation;
}
export interface getPossibleBreakpointsResult {
    /**
     * All unique breakpoint locations in the specified source and range,
     * sorted in ascending order by line number, with each line's breakpoints
     * sorted in ascending order by column.
     */
    lineLocations: SameLineSourceLocations[];
}
export interface getHitCountsParameters {
    /**
     * Locations for which to retrieve hit counts. Can be chained with the
     * return value of `Debugger.getPossibleBreakpoints`.
     */
    locations: SameLineSourceLocations[];
    /**
     * Source to return breakpoint locations for.
     */
    sourceId: string;
    /**
     * Max number of hit counts to report for each location. For locations with
     * many hits, reducing this number will make the command run faster.
     */
    maxHits?: number;
    /**
     * Any subrange of the recording to restrict the hit counts to.
     */
    range?: PointRange;
}
export interface getHitCountsResult {
    /**
     * Hit counts for the given locations.
     */
    hits: HitCount[];
}
export interface getEventHandlerCountParameters {
    /**
     * Type of event to get the handler count for.
     */
    eventType: EventHandlerType;
    /**
     * Any subrange of the recording to restrict the returned events to.
     */
    range?: PointRange;
}
export interface getEventHandlerCountResult {
    /**
     * How many times handlers for the event type executed.
     */
    count: number;
}
export interface getEventHandlerCountsParameters {
    /**
     * Type of event handler to get the count for.
     */
    eventTypes: EventHandlerType[];
    /**
     * Any subrange of the recording to restrict the returned events to.
     */
    range?: PointRange;
}
export interface getEventHandlerCountsResult {
    /**
     * The handler counts for each event type requested.
     */
    counts: EventHandlerCount[];
}
export interface searchSourceContentsParameters {
    searchId: string;
    query: string;
    /**
     * The sources to search (in the given order).
     * If not specified, all sources will be searched.
     */
    sourceIds?: SourceId[];
    /**
     * The max number of matches to return. If the search generates more than
     * this number of matches, an overflow flag will be present.
     */
    limit?: number;
}
export interface searchSourceContentsResult {
}
export interface getMappedLocationParameters {
    location: Location;
}
export interface getMappedLocationResult {
    mappedLocation: MappedLocation;
}
export interface setBreakpointParameters {
    /**
     * Location to set the breakpoint at.
     */
    location: Location;
    /**
     * Any condition which must evaluate to a non-falsy value for an execution
     * point to hit the breakpoint.
     */
    condition?: string;
}
export interface setBreakpointResult {
    /**
     * ID for the new breakpoint.
     */
    breakpointId: BreakpointId;
}
export interface removeBreakpointParameters {
    breakpointId: BreakpointId;
}
export interface removeBreakpointResult {
}
export interface findResumeTargetParameters {
    /**
     * Point to start the resume from.
     */
    point: ExecutionPoint;
}
export interface findResumeTargetResult {
    /**
     * Point where execution should pause.
     */
    target: PauseDescription;
}
export interface findRewindTargetParameters {
    /**
     * Point to start rewinding from.
     */
    point: ExecutionPoint;
}
export interface findRewindTargetResult {
    /**
     * Point where execution should pause.
     */
    target: PauseDescription;
}
export interface findReverseStepOverTargetParameters {
    /**
     * Point to start reverse-stepping from.
     */
    point: ExecutionPoint;
}
export interface findReverseStepOverTargetResult {
    /**
     * Point where execution should pause.
     */
    target: PauseDescription;
}
export interface findStepOverTargetParameters {
    /**
     * Point to start stepping from.
     */
    point: ExecutionPoint;
}
export interface findStepOverTargetResult {
    /**
     * Point where execution should pause.
     */
    target: PauseDescription;
}
export interface findStepInTargetParameters {
    /**
     * Point to start stepping from.
     */
    point: ExecutionPoint;
}
export interface findStepInTargetResult {
    /**
     * Point where execution should pause.
     */
    target: PauseDescription;
}
export interface findStepOutTargetParameters {
    /**
     * Point to step out from.
     */
    point: ExecutionPoint;
}
export interface findStepOutTargetResult {
    /**
     * Point where execution should pause.
     */
    target: PauseDescription;
}
export interface blackboxSourceParameters {
    /**
     * Source to blackbox.
     */
    sourceId: SourceId;
    /**
     * If specified, earlier locations will keep their blackbox state.
     */
    begin?: SourceLocation;
    /**
     * If specified, later locations will keep their blackbox state.
     */
    end?: SourceLocation;
}
export interface blackboxSourceResult {
}
export interface unblackboxSourceParameters {
    /**
     * Source to unblackbox.
     */
    sourceId: SourceId;
    /**
     * If specified, earlier locations will keep their blackbox state.
     */
    begin?: SourceLocation;
    /**
     * If specified, later locations will keep their blackbox state.
     */
    end?: SourceLocation;
}
export interface unblackboxSourceResult {
}
export interface searchFunctionsParameters {
    searchId: string;
    query: string;
    /**
     * The sources to search (in the given order).
     * If not specified, all sources will be searched.
     */
    sourceIds?: SourceId[];
}
export interface searchFunctionsResult {
}
/**
 * Describes a source in the recording.
 */
export interface newSource {
    /**
     * ID for the source.
     */
    sourceId: SourceId;
    /**
     * Kind of the source.
     */
    kind: SourceKind;
    /**
     * URL of the source. Omitted for dynamically generated sources (from eval etc.).
     */
    url?: string;
    /**
     * If this is an original source, the IDs of the sources which were generated from
     * this one.
     */
    generatedSourceIds?: SourceId[];
    /**
     * The hash of the source's content, computed using the XXHash3 algorithm.
     * This is set for all sources except pretty printed ones.
     */
    contentHash?: string;
}
/**
 * Specifies the number of lines in a file.
 */
export interface sourceContentsInfo {
    /**
     * ID of the source that this event refers to.
     */
    sourceId: SourceId;
    /**
     * Number of UTF-16 code units in this source file.
     */
    codeUnitCount: number;
    /**
     * Number of lines in this source file.
     */
    lineCount: number;
    /**
     * Content type of the source.
     */
    contentType: ContentType;
}
/**
 * A single chunk of the source's contents. The chunk will be 10,000 code
 * units long unless it is the last chunk in the file, in which case it will
 * be equal to or shorter than 10,000.
 */
export interface sourceContentsChunk {
    /**
     * ID of the source that this event refers to.
     */
    sourceId: SourceId;
    /**
     * Contents of this chunk.
     */
    chunk: string;
}
export interface searchSourceContentsMatches {
    searchId: string;
    matches: SearchSourceContentsMatch[];
    /**
     * If a limit was included with the request, this flag will be set to true
     * for the last event emitted.
     */
    overflow: boolean;
}
export interface functionsMatches {
    searchId: string;
    matches: FunctionMatch[];
}
