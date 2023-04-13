import { PauseId, ProtocolClient, Object as ProtocolObject } from "@replayio/protocol";
import uniqBy from "lodash/uniqBy";
import { Cache, createCache } from "suspense";

import { RuleFront } from "devtools/client/inspector/rules/models/fronts/rule";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { cachePauseData } from "replay-next/src/suspense/PauseCache";
import { ReplayClientInterface } from "shared/client/types";

export interface WiredAppliedRule {
  rule: RuleFront;
  pseudoElement?: string;
}

export const appliedRulesCache: Cache<
  [
    protocolClient: ProtocolClient,
    replayClient: ReplayClientInterface,
    sessionId: string,
    pauseId: PauseId,
    nodeId: string
  ],
  WiredAppliedRule[]
> = createCache({
  config: { immutable: true },
  debugLabel: "AppliedRules",
  getKey: ([protocolClient, replayClient, sessionId, pauseId, nodeId]) => `${pauseId}:${nodeId}`,
  load: async ([protocolClient, replayClient, sessionId, pauseId, nodeId]) => {
    const { rules, data } = await protocolClient.CSS.getAppliedRules(
      { node: nodeId },
      sessionId,
      pauseId
    );

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
});

export const computedStyleCache: Cache<
  [client: ProtocolClient, sessionId: string, pauseId: PauseId, nodeId: string],
  Map<string, string> | undefined
> = createCache({
  config: { immutable: true },
  debugLabel: "ComputedStyle",
  getKey: ([protocolClient, sessionId, pauseId, nodeId]) => `${pauseId}:${nodeId}`,
  load: async ([protocolClient, sessionId, pauseId, nodeId]) => {
    try {
      const { computedStyle } = await protocolClient.CSS.getComputedStyle(
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

export const boundingRectCache: Cache<
  [protocolClient: ProtocolClient, sessionId: string, pauseId: PauseId, nodeId: string],
  DOMRect | undefined
> = createCache({
  config: { immutable: true },
  debugLabel: "BoundingRect",
  getKey: ([protocolClient, sessionId, pauseId, nodeId]) => `${pauseId}:${nodeId}`,
  load: async ([protocolClient, sessionId, pauseId, nodeId]) => {
    try {
      const { rect } = await protocolClient.DOM.getBoundingClientRect(
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
