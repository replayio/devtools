import { UIState } from "ui/state";

type SourceContent = {
  state: "pending" | "fulfilled" | "rejected";
  value: {
    contentType: string;
    type: string;
    value: string;
  };
};
export type Source = {
  content: SourceContent;
  id: string;
  introductionUrl: undefined;
  isBlackBoxed: boolean;
  isExtension: boolean;
  isOriginal: boolean;
  isPrettyPrinted: boolean;
  relativeUrl: string;
  url: string;
  extensionName?: string | null;
  introductionType?: "scriptElement";
};

export function getSelectedSourceWithContent(state: UIState): Source;
export function getIsSourceMappedSource(state: UIState): boolean;
export function getSources(state: UIState): Source[];
export function getSelectedSource(state: UIState);
