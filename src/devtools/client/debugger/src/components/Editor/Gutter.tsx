import type { SourceEditor } from "../../utils/editor/source-editor";

import LineHitCounts from "./LineHitCounts";
import ToggleWidgetButton from "./ToggleWidgetButton";

export default function Gutter({ sourceEditor }: { sourceEditor: SourceEditor }) {
  return (
    <>
      <ToggleWidgetButton />
      <LineHitCounts sourceEditor={sourceEditor} />
    </>
  );
}
