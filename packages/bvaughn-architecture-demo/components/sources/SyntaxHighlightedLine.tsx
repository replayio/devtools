import { Suspense } from "react";

import { parse } from "bvaughn-architecture-demo/src/suspense/SyntaxParsingCache";

import Loader from "../Loader";
import styles from "./SyntaxHighlightedLine.module.css";

type Props = { code: string; editable?: boolean; fileExtension?: string };

export default function SyntaxHighlightedLine({ code, editable }: Props) {
  return (
    <Suspense fallback={<Loader />}>
      <SyntaxHighlightedLineSuspends code={code} editable={editable} />
    </Suspense>
  );
}

function SyntaxHighlightedLineSuspends({ code, editable = false, fileExtension = ".js" }: Props) {
  const htmlLines = parse(code, fileExtension) || [];

  return (
    <span
      className={styles.Code}
      contentEditable={editable}
      dangerouslySetInnerHTML={{ __html: htmlLines.join("\n") }}
    />
  );
}
