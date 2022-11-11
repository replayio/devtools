import { Suspense } from "react";

import { parse } from "bvaughn-architecture-demo/src/suspense/SyntaxParsingCache";

import Loader from "../Loader";
import styles from "./SyntaxHighlightedLine.module.css";

type Props = { code: string; fileExtension?: string };

export default function SyntaxHighlightedLine({ code }: Props) {
  return (
    <Suspense fallback={<Loader />}>
      <SyntaxHighlightedLineSuspends code={code} />
    </Suspense>
  );
}

function SyntaxHighlightedLineSuspends({ code, fileExtension = ".js" }: Props) {
  const htmlLines = parse(code, fileExtension) || [];

  return (
    <span className={styles.Code} dangerouslySetInnerHTML={{ __html: htmlLines.join("\n") }} />
  );
}
