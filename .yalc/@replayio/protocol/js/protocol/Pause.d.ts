import { MappedLocation, PersistentObjectId, PointDescription } from "./Debugger";
import { Node } from "./DOM";
import { Rule, StyleDeclaration, StyleSheet } from "./CSS";
/**
 * Unique identifier for a pause session where the program state can be inspected.
 * Pauses are each associated with a specific execution point, and when created
 * reflect the program state when it reached that point. Operations on a pause
 * can have side effects due to evaluations and so forth. These side effects will
 * affect later results produced for the same pause, but will have no effect on
 * the state of the program in other pauses.
 */
export declare type PauseId = string;
/**
 * Identifier for a call frame in a pause.
 */
export declare type FrameId = string;
/**
 * Description of the entire call stack: the IDs of all frames, in order
 * starting with the topmost (currently executing) frame.
 */
export declare type CallStack = FrameId[];
/**
 * Identifier for a scope in a pause.
 */
export declare type ScopeId = string;
/**
 * Identifier for a JS object in a pause.
 */
export declare type ObjectId = string;
/**
 * Description of a value. At most one property will be specified.
 * If no properties are specified, the value is <code>undefined</code>.
 */
export interface Value {
    /**
     * For non-object values that are valid JSON values.
     * Long strings may be truncated.
     */
    value?: any;
    /**
     * For object values.
     */
    object?: ObjectId;
    /**
     * String representation of a number that is not a valid JSON value:
     * <code>-0</code>, <code>Infinity</code>, <code>-Infinity</code>,
     * and <code>NaN</code>.
     */
    unserializableNumber?: string;
    /**
     * String representation of a bigint.
     */
    bigint?: string;
    /**
     * String representation of a symbol.
     */
    symbol?: string;
    /**
     * Set for values of variables which haven't been initialized yet.
     */
    uninitialized?: boolean;
    /**
     * Set for values which are not available for some reason.
     */
    unavailable?: boolean;
}
/**
 * Description of a value, with an associated name.
 */
export interface NamedValue extends Value {
    name: string;
}
/**
 * Description of a stack frame.
 */
export interface Frame {
    /**
     * ID of this frame.
     */
    frameId: FrameId;
    /**
     * Type of frame which is executing.
     */
    type: FrameType;
    /**
     * For call frames, the name of the function being called.
     * Omitted if the function has no name.
     */
    functionName?: string;
    /**
     * For call frames, the original name of the function being called.
     * Omitted if the function has no name.
     */
    originalFunctionName?: string;
    /**
     * For call frames, the location of the function being called.
     */
    functionLocation?: MappedLocation;
    /**
     * Location in the source where this frame is paused at.
     */
    location: MappedLocation;
    /**
     * Scope chain for the call frame, from innermost to outermost.
     */
    scopeChain: ScopeId[];
    /**
     * Alternate scope chain determined from any source map for the frame's
     * generated source. This can be structured differently and include
     * different names than the normal scope chain.
     */
    originalScopeChain?: ScopeId[];
    /**
     * <code>this</code> value of the call frame.
     */
    this: Value;
}
/**
 * Different kinds of stack frames.
 */
export declare type FrameType = "call" | "global" | "module" | "eval";
/**
 * Description of a scope.
 */
export interface Scope {
    /**
     * ID of this scope.
     */
    scopeId: ScopeId;
    /**
     * Type of this scope.
     */
    type: ScopeType;
    /**
     * Set for the top-level lexical scope of a function.
     */
    functionLexical?: boolean;
    /**
     * For <code>global</code> and <code>with</code> scopes, the underlying object.
     */
    object?: ObjectId;
    /**
     * For <code>function</code> scopes, the name of the called function.
     */
    functionName?: string;
    /**
     * For <code>function</code> and <code>block</code> scopes, the scope bindings.
     */
    bindings?: NamedValue[];
}
/**
 * Possible types of a scope.
 */
export declare type ScopeType = "global" | "with" | "function" | "block";
/**
 * Description of an object.
 */
export interface Object {
    /**
     * ID of this object.
     */
    objectId: ObjectId;
    /**
     * Object class name.
     */
    className: string;
    /**
     * Any preview data available for the object's contents.
     */
    preview?: ObjectPreview;
    /**
     * Any persistent ID for this object.
     */
    persistentId?: PersistentObjectId;
}
/**
 * Description of some or all of an object's contents.
 */
export interface ObjectPreview {
    /**
     * Set if there are additional contents not in this preview which can be
     * obtained by getting a "full" preview.
     */
    overflow?: boolean;
    /**
     * ID of the prototype, if there is one.
     */
    prototypeId?: ObjectId;
    /**
     * Descriptors of the object's own properties.
     */
    properties?: Property[];
    /**
     * Entries of container objects.
     */
    containerEntries?: ContainerEntry[];
    /**
     * Results of evaluating getter properties from this or the prototype chain
     * on this object, if they could be evaluated without side effects.
     */
    getterValues?: NamedValue[];
    /**
     * For container objects, the number of entries in the container.
     */
    containerEntryCount?: number;
    /**
     * For RegExp objects, the string representation.
     */
    regexpString?: string;
    /**
     * For Date objects, the result of calling <code>getTime()</code>.
     */
    dateTime?: number;
    /**
     * For Proxy objects, the target and handler.
     */
    proxyState?: ProxyStateData;
    /**
     * For Promise objects, the resolution state.
     */
    promiseState?: PromiseStateData;
    /**
     * For Function objects, the name of the function.
     * Omitted for functions with no name.
     */
    functionName?: string;
    /**
     * For Function objects, the names of the parameters.
     */
    functionParameterNames?: string[];
    /**
     * For Function objects, any associated source location.
     */
    functionLocation?: MappedLocation;
    /**
     * For DOM Node objects, information about the node.
     */
    node?: Node;
    /**
     * For CSSRule objects, information about the rule.
     */
    rule?: Rule;
    /**
     * For CSSStyleDeclaration objects, information about the style.
     */
    style?: StyleDeclaration;
    /**
     * For StyleSheet objects, information about the style sheet.
     */
    styleSheet?: StyleSheet;
}
/**
 * Description of an object's own property. The <code>NamedValue</code> members
 * indicate the property's name and its value if it is a data descriptor.
 */
export interface Property extends NamedValue {
    /**
     * Configuration flags for the property, omitted if the property is
     * writable, configurable, and enumerable (a bitmask of <code>7</code>).
     */
    flags?: PropertyConfigurationFlags;
    /**
     * Any getter function if this is an accessor property.
     */
    get?: ObjectId;
    /**
     * Any setter function if this is an accessor property.
     */
    set?: ObjectId;
    /**
     * Set if this property's name is a symbol.
     */
    isSymbol?: boolean;
}
/**
 * Compact bitmask of configuration flags on a property. Possible values in the mask
 * are <code>1</code> (whether the property is writable), <code>2</code>
 * (whether the property is configurable), <code>4</code> (whether the
 * property is enumerable), and combinations of these values using bitwise-or.
 */
export declare type PropertyConfigurationFlags = number;
/**
 * An entry in a container object (maps, sets, weak maps, and weak sets).
 */
export interface ContainerEntry {
    /**
     * For maps and weak maps, this entry's key.
     */
    key?: Value;
    /**
     * This entry's value.
     */
    value: Value;
}
/**
 * The possible states for a promise.
 */
export declare type PromiseState = "pending" | "fulfilled" | "rejected";
/**
 * The internal state data of a promise.
 */
export interface PromiseStateData {
    /**
     * The resolution state.
     */
    state: PromiseState;
    /**
     * The fulfilled/rejected value, if not pending.
     */
    value?: Value;
}
/**
 * The internal state data of a proxy.
 */
export interface ProxyStateData {
    /**
     * The target value the proxy was initialized with. May reference an object or null.
     */
    target: Value;
    /**
     * The handler value the proxy was initialized with. May reference an object or null.
     */
    handler: Value;
}
/**
 * Block of data from this pause which might be useful to the protocol client.
 * To reduce the number of back-and-forth calls required over the protocol,
 * data which wasn't specifically asked for can be returned by commands or
 * events. <code>PauseData</code> objects will not duplicate data from a
 * <code>PauseData</code> object produced earlier for the same pause.
 */
export interface PauseData {
    frames?: Frame[];
    scopes?: Scope[];
    objects?: Object[];
}
/**
 * Result of performing an effectful operation.
 */
export interface Result {
    /**
     * If the operation returned normally, the returned value.
     */
    returned?: Value;
    /**
     * If the operation threw an exception, the thrown value.
     */
    exception?: Value;
    /**
     * Set if the operation failed and no value was returned or thrown.
     * This can happen when operations interact with the system in an
     * unsupported way (such as by calling <code>dump()</code>)
     * or if the evaluation took too long and was forcibly terminated.
     */
    failed?: boolean;
    /**
     * Any additional data associated with the returned/thrown value.
     */
    data: PauseData;
}
/**
 * Levels of detail for an object preview.
 * <br>
 * <br><code>none</code>: Don't actually generate a preview, but just an <code>Object</code>
 *   with non-preview information.
 * <br><code>noProperties</code>: Generate an overflowing preview with no properties.
 * <br><code>canOverflow</code>: Generate a preview with some properties.
 *   If there are too many properties, some may be omitted and the preview will overflow.
 * <br><code>full</code>: Generate a non-overflowing preview with as many properties as possible.
 *   For very large objects, some properties may be omitted from the result.
 * <br><br>
 */
export declare type ObjectPreviewLevel = "none" | "noProperties" | "canOverflow" | "full";
export interface evaluateInFrameParameters {
    /**
     * Frame to perform the evaluation in.
     */
    frameId: FrameId;
    /**
     * Expression to evaluate.
     */
    expression: string;
    /**
     * Execute the expression without side-effects. Usage of this parameter
     * will result in an error response if the target has not opted in to the
     * 'pureEval' capability. If a target has not opted in, it may assume
     * that this parameter will always be false.
     */
    pure?: boolean;
    /**
     * Whether to perform the evaluation in the context of the original
     * scope chain for the frame.
     */
    useOriginalScopes?: boolean;
}
export interface evaluateInFrameResult {
    /**
     * Result of the evaluation.
     */
    result: Result;
}
export interface evaluateInGlobalParameters {
    /**
     * Expression to evaluate.
     */
    expression: string;
    /**
     * Execute the expression without side-effects. Usage of this parameter
     * will result in an error response if the target has not opted in to the
     * 'pureEval' capability. If a target has not opted in, it may assume
     * that this parameter will always be false.
     */
    pure?: boolean;
}
export interface evaluateInGlobalResult {
    /**
     * Result of the evaluation.
     */
    result: Result;
}
export interface getObjectPropertyParameters {
    /**
     * Object to get the property from.
     */
    object: ObjectId;
    /**
     * Property to get.
     */
    name: string;
}
export interface getObjectPropertyResult {
    /**
     * Result of getting the property.
     */
    result: Result;
}
export interface callFunctionParameters {
    /**
     * Function or other object to call.
     */
    object: ObjectId;
    /**
     * <code>this</code> value to use for the call.
     */
    thisValue: Value;
    /**
     * Arguments to use for the call.
     */
    argumentValues: Value[];
}
export interface callFunctionResult {
    /**
     * Result of the call.
     */
    result: Result;
}
export interface callObjectPropertyParameters {
    /**
     * Object to perform the call on.
     */
    object: ObjectId;
    /**
     * Property to call.
     */
    name: string;
    /**
     * Arguments to use for the call.
     */
    argumentValues: Value[];
}
export interface callObjectPropertyResult {
    /**
     * Result of the call.
     */
    result: Result;
}
export interface getObjectPreviewParameters {
    /**
     * Object to load the preview for.
     */
    object: ObjectId;
    /**
     * Amount of data desired in the resulting preview. If omitted, the full
     * non-overflowing preview for the object will be returned.
     */
    level?: ObjectPreviewLevel;
}
export interface getObjectPreviewResult {
    /**
     * Returned data. This includes a preview for the object, and additional
     * data for objects which it references.
     */
    data: PauseData;
}
export interface getScopeParameters {
    /**
     * Scope to load.
     */
    scope: ScopeId;
}
export interface getScopeResult {
    /**
     * Returned data. This includes the scope's contents, and additional data
     * for objects which it references.
     */
    data: PauseData;
}
export interface getTopFrameParameters {
}
export interface getTopFrameResult {
    /**
     * ID of the topmost frame, if there is one.
     */
    frame?: FrameId;
    /**
     * Any data associated with the frame.
     */
    data: PauseData;
}
export interface getAllFramesParameters {
}
export interface getAllFramesResult {
    /**
     * IDs of all frames on the stack.
     */
    frames: CallStack;
    /**
     * Any data associated with the frames.
     */
    data: PauseData;
}
export interface getFrameArgumentsParameters {
    /**
     * Frame to get the parameters for.
     */
    frameId: FrameId;
}
export interface getFrameArgumentsResult {
    /**
     * Current values of each of the frame's arguments. Omitted for non-call frames.
     */
    argumentValues?: Value[];
    /**
     * Any data associated with the argument values.
     */
    data: PauseData;
}
export interface getFrameStepsParameters {
    /**
     * Frame to get steps for.
     */
    frameId: FrameId;
}
export interface getFrameStepsResult {
    /**
     * Execution points for all steps which the frame executes.
     */
    steps: PointDescription[];
}
export interface getExceptionValueParameters {
}
export interface getExceptionValueResult {
    /**
     * If an exception is being thrown, the exception's value.
     */
    exception?: Value;
    /**
     * Any additional data associated with the exception.
     */
    data: PauseData;
}
