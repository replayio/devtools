import LineHitCounts from "./LineHitCounts";
import ToggleWidgetButton from "./ToggleWidgetButton";
import type { SourceEditor } from "../../utils/editor/source-editor";

export default function Gutter({ editor }: { editor: SourceEditor }) {
  return (
    <>
      <ToggleWidgetButton sourceEditor={editor} />
      <LineHitCounts sourceEditor={editor} />
    </>
  );
}
