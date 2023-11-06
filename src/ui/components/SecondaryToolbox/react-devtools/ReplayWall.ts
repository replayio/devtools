import { NodeBounds } from "@replayio/protocol";
import type { SerializedElement, Store, Wall } from "@replayio/react-devtools-inline/frontend";
import React from "react";

import { assert } from "protocol/utils";
import { recordingTargetCache } from "replay-next/src/suspense/BuildIdCache";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { evaluate } from "replay-next/src/utils/evaluate";
import { recordData } from "replay-next/src/utils/telemetry";
import { ReplayClientInterface } from "shared/client/types";
import { ParsedReactDevToolsAnnotation } from "ui/suspense/annotationsCaches";
import { NodePickerOpts } from "ui/utils/nodePicker";
import { getJSON } from "ui/utils/objectFetching";
import { sendTelemetryEvent, trackEvent } from "ui/utils/telemetry";

import { nodesToFiberIdsCache, reactDevToolsInjectionCache } from "./injectReactDevtoolsBackend";

// Some internal values not currently included in `@types/react-devtools-inline`
export type ElementWithChildren = SerializedElement & {
  children: number[];
};

export type NodeOptsWithoutBounds = Omit<NodePickerOpts, "onCheckNodeBounds">;

export type StoreWithInternals = Store & {
  _idToElement: Map<number, ElementWithChildren>;
};

export class ReplayWall implements Wall {
  private _listener?: (msg: any) => void;
  private highlightedElementId?: number;
  store?: StoreWithInternals;
  pauseId?: string;

  constructor(
    private enablePicker: (opts: NodeOptsWithoutBounds) => void,
    private initializePicker: () => void,
    public disablePickerInParentPanel: () => void,
    private highlightNode: (nodeId: string) => void,
    private unhighlightNode: () => void,
    private setProtocolCheckFailed: (failed: boolean) => void,
    private fetchMouseTargetsForPause: () => Promise<NodeBounds[] | undefined>,
    private replayClient: ReplayClientInterface,
    private dismissInspectComponentNag: () => void
  ) {}

  setPauseId(pauseId: string) {
    this.pauseId = pauseId;
  }

  // called by the frontend to register a listener for receiving backend messages
  listen(listener: (msg: any) => void) {
    this._listener = msg => {
      try {
        listener(msg);
      } catch (err) {
        recordData("react-devtools-frontend-error", {
          errorMessage: (err as Error).message,
        });
        console.warn("Error in ReactDevTools frontend", err);
      }
    };
    return () => {
      this._listener = undefined;
    };
  }

  // send an annotation from the backend in the recording to the frontend
  sendAnnotation(message: ParsedReactDevToolsAnnotation["contents"]) {
    this._listener?.(message);
  }

  disablePickerParentAndInternal() {
    this.disablePickerInParentPanel();
    this.disablePickerInsideRDTComponent();
  }

  disablePickerInsideRDTComponent() {
    this._listener?.({ event: "stopInspectingNative", payload: true });
  }

  // This is called  by the `useEffect` in the React DevTools panel.
  async setUpRDTInternalsForCurrentPause() {
    // Preload the React DevTools Backend for this pause
    await this.ensureReactDevtoolsBackendLoaded();
    // We should also kick off a request to pre-fetch the `Map<nodeId, fiberId>` lookup for this pause.
    // That way, we have the data on hand when the user clicks on a node.
    // This is async, but we won't wait for it here.
    this.fetchNodeIdsToFiberIdsForPause();
  }

  async fetchNodeIdsToFiberIdsForPause() {
    return nodesToFiberIdsCache.readAsync(this.replayClient!, this.pauseId!, this.store!);
  }

  // called by the frontend to send a request to the backend
  async send(event: string, payload: any) {
    await this.ensureReactDevtoolsBackendLoaded();

    try {
      switch (event) {
        case "inspectElement": {
          // Passport onboarding
          this.dismissInspectComponentNag();

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
          const { rendererID, id } = payload;

          if (this.highlightedElementId) {
            this.unhighlightNode();
          }
          this.highlightedElementId = id;

          // This _should_ be pre-fetched already, but await just in case
          const [, fiberIdsToNodeIds] = await this.fetchNodeIdsToFiberIdsForPause();

          // Get the first node ID we found for this fiber ID, if available.
          const [nodeId] = fiberIdsToNodeIds.get(id) ?? [];
          if (!nodeId || this.highlightedElementId !== id) {
            sendTelemetryEvent("reactdevtools.node_not_found", payload);
            return;
          }

          this.highlightNode(nodeId);
          break;
        }

        case "clearNativeElementHighlight": {
          this.unhighlightNode();
          this.highlightedElementId = undefined;
          break;
        }

        case "startInspectingNative": {
          // Note that this message takes time to percolate upwards from the RDT internals
          // up to here. This makes coordination of "is the picker active" tricky.
          this.initializePicker();

          const boundingRects = await this.fetchMouseTargetsForPause();

          if (!boundingRects?.length) {
            sendTelemetryEvent("reactdevtools.bounding_client_rects_failed");
            this.disablePickerParentAndInternal();
            break;
          }

          // Should have been pre-fetched already
          const [nodeIdsToFiberIds] = await this.fetchNodeIdsToFiberIdsForPause();
          // Limit the NodePicker logic to check against just the nodes we got back
          const enabledNodeIds: Set<string> = new Set(nodeIdsToFiberIds.keys());

          this.enablePicker({
            name: "reactComponent",
            onHovering: async nodeId => {
              if (nodeId) {
                const fiberId = nodeIdsToFiberIds.get(nodeId);
                if (fiberId) {
                  this._listener?.({ event: "selectFiber", payload: fiberId });
                }
              }
            },
            onPicked: _ => {
              this.disablePickerInsideRDTComponent();
            },
            onHighlightNode: this.highlightNode,
            onUnhighlightNode: this.unhighlightNode,
            onClickOutsideCanvas: () => {
              // Need to both cancel the Redux logic _and_
              // tell the RDT component to stop inspecting
              this.disablePickerParentAndInternal();
            },
            enabledNodeIds,
          });

          break;
        }

        case "stopInspectingNative": {
          this.disablePickerInParentPanel();
          break;
        }
      }
    } catch (err) {
      // we catch for the case where a region is unloaded and ThreadFront fails
      console.warn(err);
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
    const response = await evaluate({
      replayClient: this.replayClient,
      text: ` window.__RECORD_REPLAY_REACT_DEVTOOLS_SEND_MESSAGE__("${event}", ${JSON.stringify(
        payload
      )})`,
    });

    if (response.returned) {
      assert(this.pauseId, "Must have a pause ID to handle a response!");

      const result: any = await getJSON(this.replayClient, this.pauseId, response.returned);
      if (result && this.pauseId === originalPauseId) {
        this._listener?.({ event: result.event, payload: result.data });
      }
      return result;
    }
  }

  public async getComponentLocation(elementID: number) {
    const rendererID = this.store!.getRendererIDForElement(elementID);
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

      const res = await evaluate({
        replayClient: this.replayClient,
        text: findSavedComponentFunctionCommand,
      });

      if (res?.returned?.object) {
        const componentFunctionPreview = await objectCache.readAsync(
          this.replayClient,
          this.pauseId!,
          res.returned.object,
          "canOverflow"
        );

        return componentFunctionPreview;
      }
    }
  }
}
