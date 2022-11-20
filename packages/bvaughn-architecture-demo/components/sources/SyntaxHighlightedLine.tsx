import { Suspense } from "react";

import { parse } from "bvaughn-architecture-demo/src/suspense/SyntaxParsingCache";

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
  const htmlLines = parse(code, fileExtension) || [];

  return (
    <span
      className={`${className} ${styles.Code}`}
      dangerouslySetInnerHTML={{ __html: htmlLines.join("\n") }}
    />
  );
}
