import { Frame, PauseId, ProtocolClient, Object as ProtocolObject } from "@replayio/protocol";
import uniqBy from "lodash/uniqBy";

import { createGenericCache } from "@bvaughn/src/suspense/createGenericCache";
import {
  getObjectWithPreviewHelper,
  preCacheObjects,
} from "bvaughn-architecture-demo/src/suspense/ObjectPreviews";

import { RuleFront } from "protocol/thread/rule";
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
  [
    client: ProtocolClient,
    replayClient: ReplayClientInterface,
    sessionId: string,
    pauseId: PauseId,
    nodeId: string
  ],
  WiredAppliedRule[]
>(
  async (client, replayClient, sessionId, pauseId, nodeId) => {
    const { rules, data } = await client.CSS.getAppliedRules({ node: nodeId }, sessionId, pauseId);

    const uniqueRules = uniqBy(rules, rule => `${rule.rule}|${rule.pseudoElement}`);

    preCacheObjects(pauseId, data.objects ?? []);

    const stylePromises: Promise<ProtocolObject>[] = [];

    const rulePreviews = await Promise.all(
      uniqueRules.map(async appliedRule => {
        return getObjectWithPreviewHelper(replayClient, pauseId, appliedRule.rule);
      })
    );

    for (let ruleObject of rulePreviews) {
      if (ruleObject.preview?.rule?.style) {
        stylePromises.push(
          getObjectWithPreviewHelper(replayClient, pauseId, ruleObject.preview.rule.style)
        );
      }

      if (ruleObject.preview?.rule?.parentStyleSheet) {
        stylePromises.push(
          getObjectWithPreviewHelper(
            replayClient,
            pauseId,
            ruleObject.preview?.rule?.parentStyleSheet
          )
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
  (client, replayClient, sessionId, pauseId, nodeId) => `${pauseId}|${nodeId}`
);

export const {
  getValueSuspense: getComputedStyleSuspense,
  getValueAsync: getComputedStyleAsync,
  getValueIfCached: getComputedStyleIfCached,
} = createGenericCache<
  [client: ProtocolClient, sessionId: string, pauseId: PauseId, nodeId: string],
  Map<string, string> | undefined
>(
  async (client, sessionId, pauseId, nodeId) => {
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
  (client, sessionId, pauseId, nodeId) => `${pauseId}|${nodeId}`
);

export const {
  getValueSuspense: getBoundingRectSuspense,
  getValueAsync: getBoundingRectAsync,
  getValueIfCached: getBoundingRectIfCached,
} = createGenericCache<
  [client: ProtocolClient, sessionId: string, pauseId: PauseId, nodeId: string],
  DOMRect | undefined
>(
  async (client, sessionId, pauseId, nodeId) => {
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
  (client, sessionId, pauseId, nodeId) => `${pauseId}|${nodeId}`
);
