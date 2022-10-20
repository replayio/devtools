import { parse } from "@bvaughn/src/suspense/SyntaxParsingCache";
import { Suspense } from "react";

import Loader from "../Loader";

import styles from "./SyntaxHighlightedLine.module.css";

type Props = { code: string; editable?: boolean };

export default function SyntaxHighlightedLine({ code, editable }: Props) {
  return (
    <Suspense fallback={<Loader />}>
      <SyntaxHighlightedLineSuspends code={code} editable={editable} />
    </Suspense>
  );
}

function SyntaxHighlightedLineSuspends({ code, editable = false }: Props) {
  const htmlLines = parse(code, "fake.js") || [];

  return (
    <span
      className={styles.Code}
      contentEditable={editable}
      dangerouslySetInnerHTML={{ __html: htmlLines.join("") }}
    />
  );
}
