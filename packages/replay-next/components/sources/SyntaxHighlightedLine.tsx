import { Suspense } from "react";

import {
  parsedTokensToHtml,
  syntaxParsingCache,
} from "replay-next/src/suspense/SyntaxParsingCache";

import Loader from "../Loader";
import styles from "./SyntaxHighlightedLine.module.css";

type Props = { code: string; className?: string; fileExtension?: string };

export default function SyntaxHighlightedLine({ className = "", code, fileExtension }: Props) {
  return (
    <Suspense fallback={<Loader />}>
      <SyntaxHighlightedLineSuspends
        className={className}
        code={code}
        fileExtension={fileExtension}
      />
    </Suspense>
  );
}

function SyntaxHighlightedLineSuspends({ code, className = "", fileExtension = ".js" }: Props) {
  const tokens = syntaxParsingCache.read(code, fileExtension);
  const html = parsedTokensToHtml(tokens?.[0] ?? []);

  return (
    <span
      className={`${className} ${styles.Code}`}
      dangerouslySetInnerHTML={{ __html: html }}
      title={code}
    />
  );
}
