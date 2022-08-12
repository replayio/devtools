import { ProtocolMessage } from "@bvaughn/src/suspense/MessagesCache";
import { getSourceIfAlreadyLoaded } from "@bvaughn/src/suspense/SourcesCache";

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
    let lastFrame = null;
    if (message.data.frames) {
      lastFrame = message.data.frames[message.data.frames.length - 1];
    }

    let returnValue = false;
    if (lastFrame) {
      const sourceId = lastFrame.location?.[0].sourceId;
      const source = sourceId ? getSourceIfAlreadyLoaded(sourceId) : null;
      if (source) {
        returnValue = !!(source.url?.includes("node_modules") || source.url?.includes("unpkg.com"));

        // Only cache if we've been able to scan the source URLs.
        messageToNodeModuleCache.set(message, returnValue);
      }
    }

    return returnValue;
  }
}
