import { PauseId, ProtocolClient, Object as ProtocolObject } from "@replayio/protocol";
import uniqBy from "lodash/uniqBy";
import { createCache } from "suspense";

import { RuleFront } from "devtools/client/inspector/rules/models/fronts/rule";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { cachePauseData } from "replay-next/src/suspense/PauseCache";
import { ReplayClientInterface } from "shared/client/types";

export interface WiredAppliedRule {
  rule: RuleFront;
  pseudoElement?: string;
}

export const appliedStyleRulesCache = createCache<
  [
    pauseId: PauseId,
    nodeId: string,
    client: ProtocolClient,
    replayClient: ReplayClientInterface,
    sessionId: string
  ],
  WiredAppliedRule[]
>({
  debugLabel: "styleCaches: getAppliedRules",
  getKey: (pauseId: PauseId, nodeId: string) => `${pauseId}|${nodeId}`,
  load: async (
    pauseId: PauseId,
    nodeId: string,
    client: ProtocolClient,
    replayClient: ReplayClientInterface,
    sessionId: string
  ) => {
    const { rules, data } = await client.CSS.getAppliedRules({ node: nodeId }, sessionId, pauseId);

    const uniqueRules = uniqBy(rules, rule => `${rule.rule}|${rule.pseudoElement}`);

    cachePauseData(replayClient, pauseId, data);

    const stylePromises: Promise<ProtocolObject>[] = [];

    const rulePreviews = await Promise.all(
      uniqueRules.map(async appliedRule => {
        return objectCache.readAsync(replayClient, pauseId, appliedRule.rule);
      })
    );

    for (let ruleObject of rulePreviews) {
      if (ruleObject.preview?.rule?.style) {
        stylePromises.push(
          objectCache.readAsync(
            replayClient,
            pauseId,
            ruleObject.preview.rule.style
          ) as Promise<ProtocolObject>
        );
      }

      if (ruleObject.preview?.rule?.parentStyleSheet) {
        stylePromises.push(
          objectCache.readAsync(
            replayClient,
            pauseId,
            ruleObject.preview?.rule?.parentStyleSheet
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

export const computedStylesCache = createCache<
  [pauseId: PauseId, nodeId: string, client: ProtocolClient, sessionId: string],
  Map<string, string> | undefined
>({
  debugLabel: "styleCaches: getComputedStyle",
  getKey: (pauseId, nodeId) => `${pauseId}|${nodeId}`,
  load: async (pauseId, nodeId, client, sessionId) => {
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
});

export const boundingRectsCache = createCache<
  [pauseId: PauseId, nodeId: string, client: ProtocolClient, sessionId: string],
  DOMRect | undefined
>({
  debugLabel: "styleCaches: getBoundingRect",
  getKey: (pauseId, nodeId) => `${pauseId}|${nodeId}`,
  load: async (pauseId, nodeId, client, sessionId) => {
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
});
