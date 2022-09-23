import { useEffect, useState } from "react";
import LineHitCounts from "./LineHitCounts";
import ToggleWidgetButton from "./ToggleWidgetButton";
import type { SourceEditor } from "../../utils/editor/source-editor";

// function PlusButton({ editor }: { editor: SourceEditor }) {
//   const [hoveredLine, setHoveredLine] = useState<null | {
//     lineNumber: number;
//     top: number;
//   }>(null);
//   const [editorOffset, setEditorOffset] = useState(0);

//   useEffect(() => {
//     const onLineEnter = ({
//       lineNumberNode,
//       lineNumber,
//     }: {
//       lineNumberNode: HTMLElement;
//       lineNumber: number;
//     }) => {
//       const boundingRect = lineNumberNode.getBoundingClientRect();
//       setHoveredLine({ lineNumber, top: boundingRect.top });
//     };

//     const editorDimensions = editor.editor.display.sizer.getBoundingClientRect();
//     editor.editor.getScrollerElement().addEventListener("mouseleave", e => {
//       console.log("editor mouse out");
//       setHoveredLine(null);
//     });
//     setEditorOffset(86); //editorDimensions.top was unreliable
//     editor.codeMirror.on("lineMouseEnter", onLineEnter);
//     return () => {
//       editor.codeMirror.off("lineMouseEnter", onLineEnter);
//     };
//   }, [editor]);

//   if (!hoveredLine) {
//     return null;
//   }

//   const plusButtonOffset = hoveredLine?.top - editorOffset;
//   console.log(`plusButtonOffset`, plusButtonOffset, hoveredLine.lineNumber, editorOffset);
//   return (
//     <div
//       style={{
//         display: "flex",
//         position: "absolute",
//         top: plusButtonOffset,
//         left: "40px",
//         zIndex: 100,
//         textAlign: "center",
//         color: "white",
//         verticalAlign: "middle",
//         alignItems: "center",
//         justifyContent: "center",
//         fontSize: "18px",
//         height: "20px",
//         width: "20px",
//         borderRadius: "4px",
//       }}
//       className="bg-red-500 "
//     >
//       +
//     </div>
//   );
// }

export default function Gutter({ editor }: { editor: SourceEditor }) {
  return (
    <>
      <ToggleWidgetButton sourceEditor={editor} />
      <LineHitCounts sourceEditor={editor} />
    </>
  );
}
