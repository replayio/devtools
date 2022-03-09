import { SourceId } from "@recordreplay/protocol";
import { Source } from "../reducers/sources";

export function getSourcemapVisualizerURL(
  selectedSource: Source,
  alternateSource: Source
): string | null;
export function getUniqueAlternateSourceId(sourceId: SourceId): {
  sourceId?: SourceId;
  why?: "no-sourcemap" | "not-unique";
};
