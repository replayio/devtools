import { ObjectId } from "@replayio/protocol";
import type { SerializedElement, Store, Wall } from "@replayio/react-devtools-inline/frontend";
import React from "react";

import { assert } from "protocol/utils";
import { recordingTargetCache } from "replay-next/src/suspense/BuildIdCache";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { evaluate } from "replay-next/src/utils/evaluate";
import { recordData } from "replay-next/src/utils/telemetry";
import { ReplayClientInterface } from "shared/client/types";
import { NodePickerContextType } from "ui/components/NodePickerContext";
import { ParsedReactDevToolsAnnotation } from "ui/suspense/annotationsCaches";
import { getJSON } from "ui/utils/objectFetching";
import { sendTelemetryEvent, trackEvent } from "ui/utils/telemetry";

import { nodesToFiberIdsCache, reactDevToolsInjectionCache } from "./injectReactDevtoolsBackend";

// Some internal values not currently included in `@types/react-devtools-inline`
export type ElementWithChildren = SerializedElement & {
  children: number[];
};

export type StoreWithInternals = Store & {
  _idToElement: Map<number, ElementWithChildren>;
};

export class ReplayWall implements Wall {
  private disableNodePicker: NodePickerContextType["disable"];
  private dismissInspectComponentNag: () => void;
  private enableNodePicker: NodePickerContextType["enable"];
  private highlightNode: (nodeId: ObjectId) => void;
  private listener?: (msg: any) => void;
  private pauseId?: string;
  private replayClient: ReplayClientInterface;
  private setProtocolCheckFailed: (failed: boolean) => void;
  private unhighlightNode: () => void;

  // HACK The Wall requires the Store and the Store requires the Wall
  // So this value is set by the caller after initialization
  public store: StoreWithInternals | null = null;

  constructor({
    disableNodePicker,
    dismissInspectComponentNag,
    enableNodePicker,
    highlightNode,
    replayClient,
    setProtocolCheckFailed,
    unhighlightNode,
  }: {
    disableNodePicker: NodePickerContextType["disable"];
    dismissInspectComponentNag: () => void;
    enableNodePicker: NodePickerContextType["enable"];
    highlightNode: (nodeId: ObjectId) => void;
    replayClient: ReplayClientInterface;
    setProtocolCheckFailed: (failed: boolean) => void;
    unhighlightNode: () => void;
  }) {
    this.enableNodePicker = enableNodePicker;
    this.disableNodePicker = disableNodePicker;
    this.setProtocolCheckFailed = setProtocolCheckFailed;
    this.highlightNode = highlightNode;
    this.replayClient = replayClient;
    this.dismissInspectComponentNag = dismissInspectComponentNag;
    this.unhighlightNode = unhighlightNode;
  }

  setPauseId(pauseId: string) {
    this.pauseId = pauseId;
  }

  // called by the frontend to register a listener for receiving backend messages
  listen(listener: (message: any) => void) {
    this.listener = message => {
      try {
        listener(message);
      } catch (error) {
        recordData("react-devtools-frontend-error", {
          errorMessage:
            typeof error === "string"
              ? error
              : error instanceof Error
              ? error.message
              : "Unknown error",
        });
        console.warn("Error in ReactDevTools frontend", error);
      }
    };
    return () => {
      this.listener = undefined;
    };
  }

  // send an annotation from the backend in the recording to the frontend
  sendAnnotation(message: ParsedReactDevToolsAnnotation["contents"]) {
    this.listener?.(message);
  }

  // Called by the frontend to send a request to the backend
  async send(event: string, payload: any) {
    await this.ensureReactDevtoolsBackendLoaded();

    try {
      switch (event) {
        case "inspectElement": {
          this.dismissInspectComponentNag(); // Passport onboarding

          this.sendRequest(event, payload);
          break;
        }

        case "getBridgeProtocol": {
          const response = await this.sendRequest(event, payload);
          if (response === undefined) {
            trackEvent("error.reactdevtools.set_protocol_failed");
            sendTelemetryEvent("reactdevtools.set_protocol_failed");
            this.setProtocolCheckFailed(true);
          }
          break;
        }

        case "highlightNativeElement": {
          const { id: fiberId } = payload;

          const { pauseId, replayClient, store } = this;
          if (pauseId == null || store == null) {
            console.warn('ReplayWall "startInspectingNative" event emitted before initialization');
            return;
          }

          this.unhighlightNode();

          const [, fiberIdsToNodeIds] = await nodesToFiberIdsCache.readAsync(
            replayClient,
            pauseId,
            store
          );

          // Get the first node ID we found for this fiber ID, if available.
          const [nodeId] = fiberIdsToNodeIds.get(fiberId) ?? [];
          if (!nodeId) {
            sendTelemetryEvent("reactdevtools.node_not_found", payload);
            return;
          }

          this.highlightNode(nodeId);
          break;
        }

        case "clearNativeElementHighlight": {
          this.unhighlightNode();
          break;
        }

        case "startInspectingNative": {
          const { pauseId, replayClient, store } = this;
          if (pauseId == null || store == null) {
            console.warn('ReplayWall "startInspectingNative" event emitted before initialization');
            return;
          }

          // Limit the NodePicker logic to check against just the nodes we got back
          const limitToNodeIds: Set<string> = new Set();

          let nodeIdsToFiberIds: Map<ObjectId, number> = new Map();

          this.enableNodePicker(
            {
              limitToNodeIds,
              onDismissed: () => {
                this.listener?.({ event: "stopInspectingNative", payload: true });
              },
              onSelected: (nodeId: ObjectId) => {
                if (nodeId) {
                  const fiberId = nodeIdsToFiberIds.get(nodeId);
                  if (fiberId) {
                    this.listener?.({ event: "selectFiber", payload: fiberId });
                  }
                }
              },
              type: "reactComponent",
            },
            async () => {
              const result = await nodesToFiberIdsCache.readAsync(replayClient, pauseId, store);

              nodeIdsToFiberIds = result[0];

              for (let key of nodeIdsToFiberIds.keys()) {
                limitToNodeIds.add(key);
              }
            }
          );
          break;
        }

        case "stopInspectingNative": {
          this.disableNodePicker();
          break;
        }
      }
    } catch (error) {
      // we catch for the case where a region is unloaded and ThreadFront fails
      console.warn(error);
    }
  }

  public async ensureReactDevtoolsBackendLoaded() {
    if (this.pauseId == null) {
      return;
    }

    const recordingTarget = await recordingTargetCache.readAsync(this.replayClient);
    if (recordingTarget === "chromium") {
      await reactDevToolsInjectionCache.readAsync(this.replayClient, this.pauseId);
    }
  }

  // send a request to the backend in the recording and the reply to the frontend
  private async sendRequest(event: string, payload: any) {
    const originalPauseId = this.pauseId;
    assert(originalPauseId, "Must have a pause ID to send a request!");
    const response = await evaluate({
      replayClient: this.replayClient,
      pauseId: originalPauseId,
      text: ` window.__RECORD_REPLAY_REACT_DEVTOOLS_SEND_MESSAGE__("${event}", ${JSON.stringify(
        payload
      )})`,
    });

    if (response.returned) {
      assert(this.pauseId, "Must have a pause ID to handle a response!");

      const result: any = await getJSON(this.replayClient, this.pauseId, response.returned);
      if (result && this.pauseId === originalPauseId) {
        this.listener?.({ event: result.event, payload: result.data });
      }
      return result;
    }
  }

  public async getComponentLocation(elementID: number) {
    const store = this.store;
    assert(store);

    const rendererID = store.getRendererIDForElement(elementID);
    if (rendererID != null) {
      // See original React DevTools extension implementation for comparison:
      // https://github.com/facebook/react/blob/v18.0.0/packages/react-devtools-extensions/src/main.js#L194-L220

      // Ask the renderer interface to determine the component function,
      // and store it as a global variable on the window
      await this.sendRequest("viewElementSource", { id: elementID, rendererID });

      // This will be evaluated in the paused browser
      function retrieveSelectedReactComponentFunction() {
        const $type: React.ComponentType | undefined = (window as any).$type;
        if ($type != null) {
          if ($type && $type.prototype && $type.prototype.isReactComponent) {
            // inspect Component.render, not constructor
            return $type.prototype.render;
          } else {
            // inspect Functional Component
            return $type;
          }
        }
      }

      const findSavedComponentFunctionCommand = `
        (${retrieveSelectedReactComponentFunction})()
      `;

      const pauseId = this.pauseId;
      assert(pauseId);
      const res = await evaluate({
        replayClient: this.replayClient,
        pauseId,
        text: findSavedComponentFunctionCommand,
      });

      if (res?.returned?.object) {
        const componentFunctionPreview = await objectCache.readAsync(
          this.replayClient,
          pauseId,
          res.returned.object,
          "canOverflow"
        );

        return componentFunctionPreview;
      }
    }
  }
}
