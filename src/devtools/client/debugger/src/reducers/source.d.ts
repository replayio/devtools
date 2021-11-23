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

export function getSelectedSource(state: UIState);
