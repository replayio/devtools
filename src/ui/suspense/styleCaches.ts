import { PauseId, ProtocolClient, Object as ProtocolObject } from "@replayio/protocol";
import uniqBy from "lodash/uniqBy";

import { RuleFront } from "devtools/client/inspector/rules/models/fronts/rule";
import { createGenericCache } from "replay-next/src/suspense/createGenericCache";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { cachePauseData } from "replay-next/src/suspense/PauseCache";
import { ReplayClientInterface } from "shared/client/types";

export interface WiredAppliedRule {
  rule: RuleFront;
  pseudoElement?: string;
}

export const {
  getValueSuspense: getAppliedRulesSuspense,
  getValueAsync: getAppliedRulesAsync,
  getValueIfCached: getAppliedRulesIfCached,
} = createGenericCache<
  [client: ProtocolClient, replayClient: ReplayClientInterface, sessionId: string],
  [pauseId: PauseId, nodeId: string],
  WiredAppliedRule[]
>(
  "styleCaches: getAppliedRules",
  async (pauseId, nodeId, client, replayClient, sessionId) => {
    const { rules, data } = await client.CSS.getAppliedRules({ node: nodeId }, sessionId, pauseId);

    const uniqueRules = uniqBy(rules, rule => `${rule.rule}|${rule.pseudoElement}`);

    cachePauseData(replayClient, pauseId, data);

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
  (pauseId, nodeId) => `${pauseId}|${nodeId}`
);

export const {
  getValueSuspense: getComputedStyleSuspense,
  getValueAsync: getComputedStyleAsync,
  getValueIfCached: getComputedStyleIfCached,
} = createGenericCache<
  [client: ProtocolClient, sessionId: string],
  [pauseId: PauseId, nodeId: string],
  Map<string, string> | undefined
>(
  "styleCaches: getComputedStyle",
  async (pauseId, nodeId, client, sessionId) => {
    try {
      const { computedStyle } = await client.CSS.getComputedStyle(
        {
          node: nodeId,
        },
        sessionId,
        pauseId
      );

      const computedStyleMap = new Map();
      for (const { name, value } of computedStyle) {
        computedStyleMap.set(name, value);
      }

      return computedStyleMap;
    } catch (err) {
      return;
    }
  },
  (pauseId, nodeId) => `${pauseId}|${nodeId}`
);

export const {
  getValueSuspense: getBoundingRectSuspense,
  getValueAsync: getBoundingRectAsync,
  getValueIfCached: getBoundingRectIfCached,
} = createGenericCache<
  [client: ProtocolClient, sessionId: string],
  [pauseId: PauseId, nodeId: string],
  DOMRect | undefined
>(
  "styleCaches: getBoundingRect",
  async (pauseId, nodeId, client, sessionId) => {
    try {
      const { rect } = await client.DOM.getBoundingClientRect(
        {
          node: nodeId,
        },
        sessionId,
        pauseId
      );
      const [left, top, right, bottom] = rect;
      return new DOMRect(left, top, right - left, bottom - top);
    } catch (err) {
      return;
    }
  },
  (pauseId, nodeId) => `${pauseId}|${nodeId}`
);
