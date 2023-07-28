import dynamic from "next/dynamic";

import { useTheme } from "shared/theme/useTheme";

const ReactJson = dynamic(() => import("react-json-view"), {
  ssr: false,
});

export function JSONViewer({ src }: { src: object }) {
  const theme = useTheme();

  return (
    <ReactJson
      displayDataTypes={false}
      displayObjectSize={false}
      shouldCollapse={false}
      src={src}
      style={{ backgroundColor: "transparent" }}
      theme={theme == "light" ? "rjv-default" : "tube"}
    />
  );
}
