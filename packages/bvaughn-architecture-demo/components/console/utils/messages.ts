import { ProtocolMessage } from "@bvaughn/src/suspense/MessagesCache";

// Messages with pages that match this expression are internal Firefox errors and we should not display them.
const FIREFOX_INTERNAL_REGEX = /resource:\/\/\/modules\/\S+\.jsm/;

export function isFirefoxInternalMessage(message: ProtocolMessage): boolean {
  return message.source === "PageError" && message.text.match(FIREFOX_INTERNAL_REGEX) !== null;
}
