import { SourceId } from "@recordreplay/protocol";
import { Source, SourceContent, Location } from "../reducers/sources";

export function getSourcemapVisualizerURL(
  selectedSource: Source,
  alternateSource: Source
): string | null;
export function getUniqueAlternateSourceId(sourceId: SourceId): {
  sourceId?: SourceId;
  why?: "no-sourcemap" | "not-unique";
};

export function getTextAtPosition(
  sourceId: string,
  asyncContent: SourceContent,
  location: Location
): string;

export function getPrettySourceURL(url: string): string;

export function getPlainUrl(url: string): string;

export function getRawSourceURL(url: string): string;

export function isInlineScript(source: { introductionType?: string | null }): boolean;
