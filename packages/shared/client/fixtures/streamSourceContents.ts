import { getCachedSourceContents } from "@bvaughn/src/suspense/SourcesCache";
import { ContentType, SourceId } from "@replayio/protocol";

const SOURCE_INFO_INTERVAL = 25;
const CHUNK_INTERVAL = 100;

// Stub loader for 2bef3f10-d8a5-445e-86d3-1e96eca2db9a
export default async function streamSourceContents(
  sourceId: SourceId,
  maxChunkSize: number,
  onSourceContentsInfo: ({
    codeUnitCount,
    contentType,
    lineCount,
    sourceId,
  }: {
    codeUnitCount: number;
    contentType: ContentType;
    lineCount: number;
    sourceId: SourceId;
  }) => void,
  onSourceContentsChunk: ({ chunk, sourceId }: { chunk: string; sourceId: SourceId }) => void
): Promise<void> {
  const { contents, contentType } = getCachedSourceContents(sourceId)!;

  await new Promise(resolve => setTimeout(resolve, SOURCE_INFO_INTERVAL));

  if (contents === null) {
    throw new Error(`Unknown sourceId: ${sourceId}`);
  }

  onSourceContentsInfo({
    codeUnitCount: contents.length,
    contentType: contentType!,
    lineCount: contents.trim().split("\n").length,
    sourceId,
  });

  let index = 0;

  while (index < contents.length) {
    await new Promise(resolve => setTimeout(resolve, CHUNK_INTERVAL));

    const chunk = contents.slice(index, Math.min(index + maxChunkSize, contents.length));

    index += maxChunkSize;

    onSourceContentsChunk({
      chunk,
      sourceId,
    });
  }
}
