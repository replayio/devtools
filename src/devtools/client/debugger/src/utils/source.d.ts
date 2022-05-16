import { SourceId } from "@recordreplay/protocol";
import { Source, SourceContent, Location } from "../reducers/sources";
import { AsyncValue } from "./async-value";

export function getTextAtPosition(
  asyncContent: SourceContent | AsyncValue<SourceContent>,
  location: Location
): string;

export function getPrettySourceURL(url: string): string;

export function getPlainUrl(url: string): string;

export function getRawSourceURL(url: string): string;

export function isInlineScript(source: { introductionType?: string | null }): boolean;

export function isNodeModule(source: Source): boolean;
export function isBowerComponent(source: Source): boolean;

export function getFilename(source: Source, rawSourceURL?: string): string;

export function getLineText<T>(asyncContent?: T | AsyncValue<T>, line?: number): string;
