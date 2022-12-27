import { SameLineSourceLocations, Location, SourceId, SourceLocation } from "./Debugger";
import { ObjectId, Value } from "./Pause";
import { MessageSource, MessageLevel } from "./Console";
import { RequestEvent } from "./Network";
/**
 * The various capabilities supported by a target.
 */
export interface Capabilities {
    /**
     * True if the target supports the 'pure' parameter. If this is not set,
     * attempts at pure evaluation will not pass the command to the target.
     */
    pureEval?: boolean;
}
/**
 * Represents the data pieces returned from a network stream. Always "data" for now
 * but we'll likely add more in the future to support Websockets.
 */
export interface NetworkStreamData {
    /**
     * A tagged-union identifier for this data type.
     */
    kind: "data";
    /**
     * A string containing the data.
     */
    value: string;
}
export interface PossibleBreakpointsForSource {
    sourceId: SourceId;
    lineLocations: SameLineSourceLocations[];
}
export interface getCapabilitiesParameters {
}
export interface getCapabilitiesResult {
    capabilities: Capabilities;
}
export interface convertLocationToFunctionOffsetParameters {
    location: Location;
}
export interface convertLocationToFunctionOffsetResult {
    functionId?: string;
    offset?: number;
}
export interface convertFunctionOffsetToLocationParameters {
    functionId: string;
    offset?: number;
}
export interface convertFunctionOffsetToLocationResult {
    location: Location;
}
export interface convertFunctionOffsetsToLocationsParameters {
    /**
     * Function ID shared by all the offsets.
     */
    functionId: string;
    /**
     * Sorted array of offsets to compute the locations for.
     */
    offsets: number[];
}
export interface convertFunctionOffsetsToLocationsResult {
    /**
     * Resulting locations, with the same length as <code>offsets</code>.
     */
    locations: Location[];
}
export interface getStepOffsetsParameters {
    functionId: string;
}
export interface getStepOffsetsResult {
    /**
     * Offsets at which execution should stop when stepping. This is a
     * subset of the breakpoint locations in the function, and may be
     * omitted if execution should stop at all breakpoint locations.
     */
    offsets?: number[];
}
export interface getHTMLSourceParameters {
    url: string;
}
export interface getHTMLSourceResult {
    contents: string;
}
export interface getFunctionsInRangeParameters {
    sourceId: SourceId;
    begin?: SourceLocation;
    end?: SourceLocation;
}
export interface getFunctionsInRangeResult {
    functions: string[];
}
export interface getSourceMapURLParameters {
    sourceId: SourceId;
}
export interface getSourceMapURLResult {
    url?: string;
    baseUrl?: string;
}
export interface getSheetSourceMapURLParameters {
    sheet: ObjectId;
}
export interface getSheetSourceMapURLResult {
    url?: string;
    baseUrl?: string;
}
export interface getCurrentMessageContentsParameters {
}
export interface getCurrentMessageContentsResult {
    source: MessageSource;
    level: MessageLevel;
    text: string;
    url?: string;
    sourceId?: SourceId;
    line?: number;
    column?: number;
    argumentValues?: Value[];
}
export interface countStackFramesParameters {
}
export interface countStackFramesResult {
    count: number;
}
export interface getStackFunctionIDsParameters {
}
export interface getStackFunctionIDsResult {
    frameFunctions: string[];
}
export interface currentGeneratorIdParameters {
}
export interface currentGeneratorIdResult {
    id?: number;
}
export interface topFrameLocationParameters {
}
export interface topFrameLocationResult {
    location?: Location;
}
export interface getCurrentNetworkRequestEventParameters {
}
export interface getCurrentNetworkRequestEventResult {
    data: RequestEvent;
}
export interface getCurrentNetworkStreamDataParameters {
    /**
     * The start index within the value to fetch.
     */
    index: number;
    /**
     * The amount of data to fetch.
     */
    length: number;
}
export interface getCurrentNetworkStreamDataResult {
    /**
     * The stream data available at the current location.
     */
    data: NetworkStreamData;
}
export interface getPossibleBreakpointsForMultipleSourcesParameters {
    sourceIds: SourceId[];
}
export interface getPossibleBreakpointsForMultipleSourcesResult {
    possibleBreakpoints: PossibleBreakpointsForSource[];
}
