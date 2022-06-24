import LineHitCounts from "./LineHitCounts";
import ToggleWidgetButton from "./ToggleWidgetButton";

export default function Gutter({ editor }: any) {
  return (
    <>
      <ToggleWidgetButton editor={editor} />
      <LineHitCounts editor={editor} />
    </>
  );
}
