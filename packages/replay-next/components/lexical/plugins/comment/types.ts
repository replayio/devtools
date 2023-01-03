export type FormattedText = {
  format: number | null;
  isMention: boolean;
  text: string;
};

export type FormattedTextRange = FormattedText & {
  beginIndex: number;
  endIndex: number;
};
