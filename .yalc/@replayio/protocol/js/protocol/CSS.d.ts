import { ObjectId, PauseData } from "./Pause";
/**
 * A style which is applied to a node.
 */
export interface ComputedStyleProperty {
    /**
     * Name of the style.
     */
    name: string;
    /**
     * Value of the style.
     */
    value: string;
}
/**
 * Information about a rule applied to a node.
 */
export interface AppliedRule {
    /**
     * ID of the rule being applied to the node.
     */
    rule: ObjectId;
    /**
     * Pseudo-element of the node the rule is applied to, if any.
     */
    pseudoElement?: string;
}
/**
 * Description of a CSSRule's contents which is attached to its
 * associated <code>Pause.ObjectPreview.rule</code>.
 */
export interface Rule {
    /**
     * Value of <code>rule.type</code>.
     */
    type: number;
    /**
     * Value of <code>rule.cssText</code>.
     */
    cssText: string;
    /**
     * The ID of any style sheet this rule is associated with.
     */
    parentStyleSheet?: ObjectId;
    /**
     * Start line in the parent style sheet (1-indexed).
     */
    startLine?: number;
    /**
     * Start column in the parent style sheet (0-indexed).
     */
    startColumn?: number;
    /**
     * If the parent style sheet is source mapped, the original location of the rule.
     */
    originalLocation?: OriginalStyleSheetLocation;
    /**
     * For <code>CSSStyleRule</code> objects, the value of <code>rule.selectorText</code>.
     */
    selectorText?: string;
    /**
     * For <code>CSSStyleRule</code> objects, the ID of the rule's style declaration.
     */
    style?: ObjectId;
}
/**
 * Description of a CSSStyleDeclaration's contents which is attached to its
 * associated <code>Pause.ObjectPreview.style</code>.
 */
export interface StyleDeclaration {
    /**
     * Value of <code>style.cssText</code>.
     */
    cssText: string;
    /**
     * If this declaration originates from a CSSStyleRule, ID of that rule.
     */
    parentRule?: ObjectId;
    /**
     * Style properties of this declaration.
     */
    properties: StyleProperty[];
}
/**
 * Information about a style property declaration.
 */
export interface StyleProperty extends ComputedStyleProperty {
    /**
     * Whether the property is marked <code>!important</code>. Defaults to
     * <code>false</code> if omitted.
     */
    important?: boolean;
}
/**
 * Description of a StyleSheet's contents which is attached to its
 * associated <code>Pause.ObjectPreview.styleSheet</code>.
 */
export interface StyleSheet {
    /**
     * URL of the style sheet.
     */
    href?: string;
    /**
     * Whether this sheet is internal to the browser itself.
     */
    isSystem: boolean;
}
/**
 * Location of a rule within an original style sheet.
 */
export interface OriginalStyleSheetLocation {
    /**
     * URL of the original style sheet.
     */
    href: string;
    /**
     * Start line in the style sheet (1-indexed).
     */
    startLine: number;
    /**
     * Start column in the style sheet (0-indexed).
     */
    startColumn: number;
}
export interface getComputedStyleParameters {
    node: ObjectId;
}
export interface getComputedStyleResult {
    computedStyle: ComputedStyleProperty[];
}
export interface getAppliedRulesParameters {
    node: ObjectId;
}
export interface getAppliedRulesResult {
    /**
     * All style rules being applied to the node. This includes rules that
     * apply directly to this node or to one of its pseudo-elements.
     * Rules are grouped by their pseudo-element (if any) and are ordered by
     * precedence, with higher priority rules (higher specificity, or later
     * appearance in style sheets) given first.
     */
    rules: AppliedRule[];
    /**
     * Information about the rules and related objects.
     */
    data: PauseData;
}
