import { ObjectId, PauseData } from "./Pause";
import { ScreenShotDescription, ScreenShot } from "./Graphics";
/**
 * Description of an event listener on a page.
 */
export interface EventListener {
    /**
     * Node the listener is attached to.
     */
    node: ObjectId;
    /**
     * Handler function associated with the listener.
     */
    handler: ObjectId;
    /**
     * Event being listened for.
     */
    type: string;
    /**
     * Whether the listener captures events.
     */
    capture: boolean;
}
/**
 * Description of a node's contents which is attached to its
 * associated <code>Pause.ObjectPreview.node</code>.
 */
export interface Node {
    /**
     * Value of <code>node.nodeType</code>.
     */
    nodeType: number;
    /**
     * Value of <code>node.nodeName</code>.
     */
    nodeName: string;
    /**
     * Value of <code>node.nodeValue</code>.
     */
    nodeValue?: string;
    /**
     * Value of <code>node.isConnected</code>.
     */
    isConnected: boolean;
    /**
     * For element nodes, the attributes.
     */
    attributes?: Attr[];
    /**
     * For pseudo elements, the pseudo type.
     */
    pseudoType?: PseudoType;
    /**
     * For element nodes, ID of any inline style declaration.
     */
    style?: ObjectId;
    /**
     * ID of any <code>node.parentNode</code>. For the document node in an
     * <code>iframe</code>, this will be the <code>iframe</code> element itself
     * instead of null.
     */
    parentNode?: ObjectId;
    /**
     * IDs of all <code>node.childNodes</code>. For <code>iframe</code> elements
     * this will additionally contain the document element of that frame.
     */
    childNodes?: ObjectId[];
    /**
     * For document nodes, the <code>URL</code> property.
     */
    documentURL?: string;
}
/**
 * Description of an element attribute.
 */
export interface Attr {
    /**
     * Value of <code>attr.name</code>.
     */
    name: string;
    /**
     * Value of <code>attr.value</code>.
     */
    value: string;
}
/**
 * Type of a pseudo element.
 */
export declare type PseudoType = "before" | "after" | "marker";
/**
 * Description of the box model for a node.
 */
export interface BoxModel {
    /**
     * Node this is the box model for.
     */
    node: ObjectId;
    /**
     * Quads holding the node's content.
     */
    content: Quads;
    /**
     * Quads including the content and any padding between the border.
     */
    padding: Quads;
    /**
     * Quads including the border.
     */
    border: Quads;
    /**
     * Quads including the border and any margin between other nodes.
     */
    margin: Quads;
}
/**
 * Compact representation of an array of DOMQuads, projected onto the <code>x/y</code>
 * plane (i.e. <code>z</code> and <code>w</code> values in points are ignored).
 * Each quad is 8 elements, with the <code>x</code> and <code>y</code> coordinates
 * of the four points in the quad. The entire array will have a length that is a
 * multiple of 8.
 */
export declare type Quads = number[];
/**
 * Compact representation of a DOMRect. A rect has four elements, listing the
 * rect's <code>left</code>, <code>top</code>, <code>right</code>, and
 * <code>bottom</code> values in order.
 */
export declare type Rect = number[];
/**
 * Clipping bounds that are applied to an element. These come from an ancestor
 * element that has the CSS overflow property set. Bounds that have no effect
 * on the element are left out.
 */
export interface ClipBounds {
    left?: number;
    top?: number;
    right?: number;
    bottom?: number;
}
/**
 * Describes the bounding client rect for a node.
 */
export interface NodeBounds {
    /**
     * Node being described.
     */
    node: ObjectId;
    /**
     * Bounding client rect for the node. This is the smallest rect that
     * includes all client rects.
     */
    rect: Rect;
    /**
     * All client rects for the node if there is more than one.
     */
    rects?: Rect[];
    /**
     * Clipping bounds for the node.
     */
    clipBounds?: ClipBounds;
    /**
     * Set to <code>"hidden"</code> for nodes with that CSS property
     */
    visibility?: string;
    /**
     * Set to <code>"none"</code> for nodes with that CSS property
     */
    pointerEvents?: string;
}
export interface getDocumentParameters {
}
export interface getDocumentResult {
    /**
     * ID for the document.
     */
    document: ObjectId;
    /**
     * Information about the document and related nodes.
     */
    data: PauseData;
}
export interface getParentNodesParameters {
    /**
     * Node to load the previews for.
     */
    node: ObjectId;
}
export interface getParentNodesResult {
    /**
     * Returned data, including previews for the object and its transitive parents.
     */
    data: PauseData;
}
export interface querySelectorParameters {
    /**
     * Base node for the query.
     */
    node: ObjectId;
    /**
     * Selector to query.
     */
    selector: string;
}
export interface querySelectorResult {
    /**
     * ID of the found node, omitted if none was found.
     */
    result?: ObjectId;
    /**
     * Information about the returned node and related nodes, including all
     * parent nodes up to the root document.
     */
    data: PauseData;
}
export interface getEventListenersParameters {
    /**
     * Node to get listeners for.
     */
    node: ObjectId;
}
export interface getEventListenersResult {
    /**
     * All event listeners for the node.
     */
    listeners: EventListener[];
    /**
     * Additional information about the event listeners.
     */
    data: PauseData;
}
export interface getBoxModelParameters {
    /**
     * Node to get boxes for.
     */
    node: ObjectId;
}
export interface getBoxModelResult {
    /**
     * Box model data for the node.
     */
    model: BoxModel;
}
export interface getBoundingClientRectParameters {
    /**
     * Node to get the bounds for.
     */
    node: ObjectId;
}
export interface getBoundingClientRectResult {
    /**
     * Bounding client rect for the node.
     */
    rect: Rect;
}
export interface getAllBoundingClientRectsParameters {
}
export interface getAllBoundingClientRectsResult {
    /**
     * All elements on the page and their bounding client rects. These are
     * are given in stacking order: elements earlier in the list will be drawn
     * in front of later elements.
     */
    elements: NodeBounds[];
}
export interface performSearchParameters {
    /**
     * Text to search for.
     */
    query: string;
}
export interface performSearchResult {
    /**
     * Nodes whose name, attributes, or text content contains the query string.
     */
    nodes: ObjectId[];
    /**
     * Any data associated with the returned nodes, including all parent nodes
     * up to the root document.
     */
    data: PauseData;
}
export interface repaintGraphicsParameters {
}
export interface repaintGraphicsResult {
    /**
     * Description of the resulting screen shot.
     */
    description: ScreenShotDescription;
    /**
     * Contents of the screen shot. If an identical screen shot was previously
     * returned, this will be omitted.
     */
    screenShot?: ScreenShot;
}
