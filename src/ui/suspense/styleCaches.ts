import { PauseId, Object as ProtocolObject } from "@replayio/protocol";
import uniqBy from "lodash/uniqBy";
import { Cache, createCache } from "suspense";

import { createComputedProperties } from "devtools/client/inspector/computed/actions";
import { ComputedPropertyState } from "devtools/client/inspector/computed/state";
import ElementStyle from "devtools/client/inspector/rules/models/element-style";
import { RuleFront } from "devtools/client/inspector/rules/models/fronts/rule";
import RuleModel from "devtools/client/inspector/rules/models/rule";
import TextProperty from "devtools/client/inspector/rules/models/text-property";
import { DeclarationState, RuleState } from "devtools/client/inspector/rules/reducers/rules";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { cachePauseData } from "replay-next/src/suspense/PauseCache";
import { sourcesByIdCache } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientInterface } from "shared/client/types";

import { processedNodeDataCache } from "./nodeCaches";

export interface WiredAppliedRule {
  rule: RuleFront;
  pseudoElement?: string;
}

export interface ParsedCSSRules {
  rules: RuleState[];
  computedProperties: ComputedPropertyState[];
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
    if (!pauseId || !nodeId) {
      return null;
    }
    const nodeInfo = await processedNodeDataCache.readAsync(replayClient, pauseId, nodeId);

    if (!nodeInfo?.isConnected || !nodeInfo?.isElement) {
      return null;
    }

    const elementStyle = new ElementStyle(nodeId, pauseId, replayClient);
    await elementStyle.populate();

    const computed = await computedStyleCache.readAsync(replayClient, pauseId, nodeId);
    const properties = await createComputedProperties(elementStyle, computed);

    return {
      rules: elementStyle.rules?.map(rule => getRuleState(rule)) ?? [],
      computedProperties: properties,
    };
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
