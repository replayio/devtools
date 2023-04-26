import { ProtocolMessage } from "replay-next/components/console/LoggablesContext";
import { getSourceIfCached } from "replay-next/src/suspense/SourcesCache";

// Messages with pages that match this expression are internal Firefox errors and we should not display them.
const FIREFOX_INTERNAL_REGEX = /resource:\/\/\/modules\/\S+\.jsm/;

export function isFirefoxInternalMessage(message: ProtocolMessage): boolean {
  return message.source === "PageError" && message.text.match(FIREFOX_INTERNAL_REGEX) !== null;
}

const messageToNodeModuleCache: WeakMap<ProtocolMessage, boolean> = new WeakMap();

export function isInNodeModules(message: ProtocolMessage): boolean {
  if (messageToNodeModuleCache.has(message)) {
    return messageToNodeModuleCache.get(message)!;
  } else {
    let topFrame = null;
    if (message.stack?.length && message.data.frames?.length) {
      topFrame = message.data.frames.find(frame => frame.frameId === message.stack![0]);
    }

    let returnValue = false;
    if (topFrame) {
      const sourceId = topFrame.location?.[0].sourceId;
      const source = sourceId ? getSourceIfCached(sourceId) : null;
      if (source) {
        returnValue = !!(source.url?.includes("node_modules") || source.url?.includes("unpkg.com"));

        // Only cache if we've been able to scan the source URLs.
        messageToNodeModuleCache.set(message, returnValue);
      }
    }

    return returnValue;
  }
}
