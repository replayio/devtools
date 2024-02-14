import { getHighlightedNodeIds } from "devtools/client/inspector/markup/selectors/markup";
import { PreviewNodeHighlighter } from "ui/components/Video/NodeHighlighter/PreviewNodeHighlighter";
import { useAppSelector } from "ui/setup/hooks";

export default function NodeHighlighter() {
  const highlightedNodeIds = useAppSelector(getHighlightedNodeIds);

  return (
    <div id="highlighter-root">
      {highlightedNodeIds?.map(nodeId => (
        <PreviewNodeHighlighter key={nodeId} nodeId={nodeId} />
      ))}
    </div>
  );
}
