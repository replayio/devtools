import { newSource as ProtocolSource } from "@replayio/protocol";

export function getSourceFileName(source: ProtocolSource): string | null {
  const fileName = source.url?.split("/")?.pop();
  return fileName || null;
}
