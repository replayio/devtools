import { useEffect, useState } from "react";
import ReactDOM from "react-dom";
const { toEditorLine } = require("devtools/client/debugger/src/utils/editor");

interface WidgetProps {
  location: any;
  editor: any;
  children: JSX.Element;
  insertAt: number;
}

export default function Widget({ location, children, editor, insertAt }: WidgetProps) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (loading) {
      const _node = document.createElement("div");
      setNode(_node);
      setLoading(false);
      return;
    }
    const editorLine = toEditorLine(location.line || 0);
    const _widget = editor.codeMirror.addLineWidget(editorLine, node, {
      insertAt,
    });

    // We are clearing the widget here because not
    // doing so causes breakpoints to show up on the
    // wrong line number when clicking in the gutter.
    return () => _widget.clear();
  }, [loading, node, editor.codeMirror, insertAt, location.line]);

  if (!node) {
    return null;
  }

  return ReactDOM.createPortal(children, node);
}
