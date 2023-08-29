import { PauseId, Object as ProtocolObject } from "@replayio/protocol";
import uniqBy from "lodash/uniqBy";
import { Cache, createCache } from "suspense";

import { RuleFront } from "devtools/client/inspector/rules/models/fronts/rule";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { cachePauseData } from "replay-next/src/suspense/PauseCache";
import { sourcesByIdCache } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientInterface } from "shared/client/types";

export interface WiredAppliedRule {
  rule: RuleFront;
  pseudoElement?: string;
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
  [replayClient: ReplayClientInterface, sessionId: string, pauseId: PauseId, nodeId: string],
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
