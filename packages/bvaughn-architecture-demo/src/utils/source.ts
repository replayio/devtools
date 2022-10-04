import { newSource as ProtocolSource } from "@replayio/protocol";

export function getSourceFileName(source: ProtocolSource): string | null {
  return source.url ? getSourceFileNameFromUrl(source.url) : null;
}

export function getSourceFileNameFromUrl(url: string): string | null {
  const fileName = url.split("/")?.pop();
  return fileName || null;
}
