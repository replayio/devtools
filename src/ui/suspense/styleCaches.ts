import { PauseId, Object as ProtocolObject } from "@replayio/protocol";
import uniqBy from "lodash/uniqBy";
import { Cache, createCache } from "suspense";

import { createComputedProperties } from "devtools/client/inspector/computed/actions";
import { ComputedPropertyState } from "devtools/client/inspector/computed/state";
import ElementStyle from "devtools/client/inspector/rules/models/element-style";
import { RuleFront } from "devtools/client/inspector/rules/models/fronts/rule";
import type {
  RuleInheritance,
  RuleSelector,
  SourceLink,
} from "devtools/client/inspector/rules/models/rule";
import RuleModel from "devtools/client/inspector/rules/models/rule";
import TextProperty, {
  ComputedPropertyInfo,
  Priority,
} from "devtools/client/inspector/rules/models/text-property";
import { elementCache } from "replay-next/components/elements-new/suspense/ElementCache";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { cachePauseData } from "replay-next/src/suspense/PauseCache";
import { sourcesByIdCache } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientInterface } from "shared/client/types";
import { isElement } from "ui/suspense/nodeCaches";

export interface WiredAppliedRule {
  rule: RuleFront;
  pseudoElement?: string;
}

export interface ParsedCSSRules {
  rules: RuleState[];
  elementStyle: ElementStyle;
}

export const LAYOUT_NUMERIC_FIELDS = [
  "position",
  "top",
  "right",
  "bottom",
  "left",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "border-top-width",
  "border-right-width",
  "border-bottom-width",
  "border-left-width",
  "z-index",
  "box-sizing",
  "display",
  "float",
  "line-height",
] as const;

// https://stackoverflow.com/a/67942573/62937
type ObjectFromList<T extends ReadonlyArray<string>, V = string> = {
  [K in T extends ReadonlyArray<infer U> ? U : never]: V;
};

export type LayoutNumericFields = ObjectFromList<typeof LAYOUT_NUMERIC_FIELDS>;

export type Layout = LayoutNumericFields & {
  width: number;
  height: number;
  autoMargins?: Record<string, number>;
};

export interface DeclarationState {
  /** Array of the computed properties for a CSS declaration. */
  computedProperties: ComputedPropertyInfo[];
  /** An unique CSS declaration id. */
  id: string;
  /** Whether or not the declaration is valid. (Does it make sense for this value
   * to be assigned to this property name?) */
  isDeclarationValid: boolean;
  /** Whether or not the declaration is enabled. */
  isEnabled: boolean;
  /** Whether or not the declaration is invisible. In an inherited rule, only the
   * inherited declarations are shown and the rest are considered invisible. */
  isInvisible: boolean | null;
  /** Whether or not the declaration's property name is known. */
  isKnownProperty: boolean;
  /** Whether or not the property name is valid. */
  isNameValid: boolean;
  /** Whether or not the the declaration is overridden. */
  isOverridden: boolean;
  /** Whether or not the declaration is changed by the user. */
  isPropertyChanged: boolean;
  /** The declaration's property name. */
  name: string;
  /** The declaration's parsed property value. */
  parsedValue: (string | { type: string; value: string })[];
  /** The declaration's priority (either "important" or an empty string). */
  priority: Priority;
  /** The CSS rule id that is associated with this CSS declaration. */
  ruleId: string;
  /** The declaration's property value. */
  value: string;
}

export interface RuleState {
  /** Array of CSS declarations. */
  declarations: DeclarationState[];
  /** An unique CSS rule id. */
  id: string;
  /** An object containing information about the CSS rule's inheritance. */
  inheritance: RuleInheritance | null | undefined;
  /** Whether or not the rule does not match the current selected element. */
  isUnmatched: boolean;
  /* Whether or not the rule is an user agent style. */
  isUserAgentStyle: boolean | null;
  /** An object containing information about the CSS keyframes rules. */
  // keyframesRule: rule.keyframesRule,
  /** The pseudo-element keyword used in the rule. */
  pseudoElement: string;
  /** An object containing information about the CSS rule's selector. */
  selector: RuleSelector;
  /** An object containing information about the CSS rule's stylesheet source. */
  sourceLink: SourceLink;
  /** The type of CSS rule. */
  type: number;
}

export const appliedRulesCache: Cache<
  [replayClient: ReplayClientInterface, pauseId: PauseId, nodeId: string],
  WiredAppliedRule[]
> = createCache({
  config: { immutable: true },
  debugLabel: "AppliedRules",
  getKey: ([replayClient, pauseId, nodeId]) => `${pauseId}:${nodeId}`,
  load: async ([replayClient, pauseId, nodeId]) => {
    const { rules, data } = await replayClient.getAppliedRules(pauseId, nodeId);

    const uniqueRules = uniqBy(rules, rule => `${rule.rule}|${rule.pseudoElement}`);

    const sources = await sourcesByIdCache.readAsync(replayClient);
    cachePauseData(replayClient, sources, pauseId, data);

    const stylePromises: Promise<ProtocolObject>[] = [];

    const rulePreviews = await Promise.all(
      uniqueRules.map(async appliedRule => {
        return objectCache.readAsync(replayClient, pauseId, appliedRule.rule, "canOverflow");
      })
    );

    for (let ruleObject of rulePreviews) {
      if (ruleObject.preview?.rule?.style) {
        stylePromises.push(
          objectCache.readAsync(
            replayClient,
            pauseId,
            ruleObject.preview.rule.style,
            "canOverflow"
          ) as Promise<ProtocolObject>
        );
      }

      if (ruleObject.preview?.rule?.parentStyleSheet) {
        stylePromises.push(
          objectCache.readAsync(
            replayClient,
            pauseId,
            ruleObject.preview?.rule?.parentStyleSheet,
            "canOverflow"
          ) as Promise<ProtocolObject>
        );
      }
    }

    if (stylePromises.length) {
      await Promise.all(stylePromises);
    }

    const wiredRules: WiredAppliedRule[] = uniqueRules.map((appliedRule, i) => {
      return {
        rule: new RuleFront(pauseId, rulePreviews[i]),
        pseudoElement: appliedRule.pseudoElement,
      };
    });
    return wiredRules;
  },
});

export const computedStyleCache: Cache<
  [replayClient: ReplayClientInterface, pauseId: PauseId, nodeId: string],
  Map<string, string> | undefined
> = createCache({
  config: { immutable: true },
  debugLabel: "ComputedStyle",
  getKey: ([replayClient, pauseId, nodeId]) => `${pauseId}:${nodeId}`,
  load: async ([replayClient, pauseId, nodeId]) => {
    try {
      const { computedStyle } = await replayClient.getComputedStyle(pauseId, nodeId);

      const computedStyleMap = new Map();
      for (const { name, value } of computedStyle) {
        computedStyleMap.set(name, value);
      }

      return computedStyleMap;
    } catch (err) {
      return;
    }
  },
});

export function getDeclarationState(declaration: TextProperty, ruleId: string): DeclarationState {
  return {
    // Array of the computed properties for a CSS declaration.
    computedProperties: declaration.computedProperties,
    // An unique CSS declaration id.
    id: declaration.id,
    // Whether or not the declaration is valid. (Does it make sense for this value
    // to be assigned to this property name?)
    isDeclarationValid: declaration.isValid(),
    // Whether or not the declaration is enabled.
    isEnabled: declaration.enabled,
    // Whether or not the declaration is invisible. In an inherited rule, only the
    // inherited declarations are shown and the rest are considered invisible.
    isInvisible: declaration.invisible,
    // Whether or not the declaration's property name is known.
    isKnownProperty: declaration.isKnownProperty,
    // Whether or not the property name is valid.
    isNameValid: declaration.isNameValid(),
    // Whether or not the the declaration is overridden.
    isOverridden: !!declaration.overridden,
    // Whether or not the declaration is changed by the user.
    isPropertyChanged: declaration.isPropertyChanged,
    // The declaration's property name.
    name: declaration.name,
    // The declaration's parsed property value.
    parsedValue: declaration.parsedValue,
    // The declaration's priority (either "important" or an empty string).
    priority: declaration.priority,
    // The CSS rule id that is associated with this CSS declaration.
    ruleId,
    // The declaration's property value.
    value: declaration.value,
  };
}

export function getRuleState(rule: RuleModel): RuleState {
  return {
    // Array of CSS declarations.
    declarations: rule.declarations.map(declaration =>
      getDeclarationState(declaration, rule.domRule.objectId())
    ),
    // An unique CSS rule id.
    id: rule.domRule.objectId(),
    // An object containing information about the CSS rule's inheritance.
    inheritance: rule.inheritance,
    // Whether or not the rule does not match the current selected element.
    isUnmatched: rule.isUnmatched,
    // Whether or not the rule is an user agent style.
    isUserAgentStyle: rule.domRule.isSystem,
    // An object containing information about the CSS keyframes rules.
    // keyframesRule: rule.keyframesRule,
    // The pseudo-element keyword used in the rule.
    pseudoElement: rule.pseudoElement,
    // An object containing information about the CSS rule's selector.
    selector: rule.selector,
    // An object containing information about the CSS rule's stylesheet source.
    sourceLink: rule.sourceLink,
    // The type of CSS rule.
    type: rule.domRule.type,
  };
}

export const cssRulesCache: Cache<
  [
    replayClient: ReplayClientInterface,
    pauseId: PauseId | undefined,
    nodeId: string | null | undefined
  ],
  ParsedCSSRules | null
> = createCache({
  config: { immutable: true },
  debugLabel: "CSSRules",
  getKey: ([replayClient, pauseId, nodeId]) => `${pauseId}:${nodeId}`,
  load: async ([replayClient, pauseId, nodeId]) => {
    if (!pauseId || typeof nodeId !== "string") {
      return null;
    }

    const element = await elementCache.readAsync(replayClient, pauseId, nodeId);
    if (!element.node.isConnected || !isElement(element.node)) {
      return null;
    }

    const elementStyle = new ElementStyle(nodeId, pauseId, replayClient);
    await elementStyle.populate();

    return {
      elementStyle,
      rules: elementStyle.rules?.map(rule => getRuleState(rule)) ?? [],
    };
  },
});

export const computedPropertiesCache: Cache<
  [
    replayClient: ReplayClientInterface,
    pauseId: PauseId | undefined,
    nodeId: string | null | undefined
  ],
  ComputedPropertyState[] | null
> = createCache({
  config: { immutable: true },
  debugLabel: "ComputedProperties",
  getKey: ([replayClient, pauseId, nodeId]) => `${pauseId}:${nodeId}`,
  load: async ([replayClient, pauseId, nodeId]) => {
    if (!pauseId || typeof nodeId !== "string") {
      return null;
    }

    const element = await elementCache.readAsync(replayClient, pauseId, nodeId);
    if (!element.node.isConnected || !isElement(element.node)) {
      return null;
    }

    const parsedRules = await cssRulesCache.readAsync(replayClient, pauseId, nodeId);
    if (!parsedRules) {
      return null;
    }
    const { elementStyle } = parsedRules;

    const computed = await computedStyleCache.readAsync(replayClient, pauseId, nodeId);
    const properties = await createComputedProperties(elementStyle, computed);

    return properties;
  },
});

export const boundingRectCache: Cache<
  [replayClient: ReplayClientInterface, pauseId: PauseId, nodeId: string],
  DOMRect | undefined
> = createCache({
  config: { immutable: true },
  debugLabel: "BoundingRect",
  getKey: ([replayClient, pauseId, nodeId]) => `${pauseId}:${nodeId}`,
  load: async ([replayClient, pauseId, nodeId]) => {
    try {
      const { rect } = await replayClient.getBoundingClientRect(pauseId, nodeId);
      const [left, top, right, bottom] = rect;
      return new DOMRect(left, top, right - left, bottom - top);
    } catch (err) {
      return;
    }
  },
});

export const layoutCache: Cache<
  [
    replayClient: ReplayClientInterface,
    pauseId: PauseId | undefined,
    nodeId: string | undefined | null
  ],
  Layout | null
> = createCache({
  config: { immutable: true },
  debugLabel: "BoundingRect",
  getKey: ([replayClient, pauseId, nodeId]) => `${pauseId}:${nodeId}`,
  load: async ([replayClient, pauseId, nodeId]) => {
    if (!pauseId || typeof nodeId !== "string") {
      return null;
    }
    const [bounds, style] = await Promise.all([
      boundingRectCache.readAsync(replayClient, pauseId, nodeId),
      computedStyleCache.readAsync(replayClient, pauseId, nodeId),
    ]);

    if (!bounds || !style) {
      return null;
    }

    const layout = {
      width: parseFloat(bounds.width.toPrecision(6)),
      height: parseFloat(bounds.height.toPrecision(6)),
      autoMargins: {},
    } as Layout;

    for (const prop of LAYOUT_NUMERIC_FIELDS) {
      layout[prop] = style.get(prop)!;
    }

    return layout;
  },
});
