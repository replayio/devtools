import LineHitCounts from "./LineHitCounts";
import ToggleWidgetButton from "./ToggleWidgetButton";
import type { SourceEditor } from "../../utils/editor/source-editor";

export default function Gutter({ sourceEditor }: { sourceEditor: SourceEditor }) {
  return (
    <>
      <ToggleWidgetButton editor={sourceEditor} />
      <LineHitCounts sourceEditor={sourceEditor} />
    </>
  );
}
