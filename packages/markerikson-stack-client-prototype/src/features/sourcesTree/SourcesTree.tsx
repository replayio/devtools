import { useMemo } from "react";
import Expandable from "@bvaughn/components/Expandable";

import { useAppDispatch, useAppSelector, useAppStore } from "../../app/hooks";

import { sourceEntrySelected } from "../sources/selectedSourcesSlice";
import { getSourceDetails } from "../sources/sourcesCache";
import { parseSourcesTree, SourceTreeNode } from "./treeUtils";

import fileIcon from "./images/file-small.svg";
import folderIcon from "./images/folder.svg";
import globeIcon from "./images/globe.svg";

console.log(fileIcon);

interface STIProps {
  node: SourceTreeNode;
}

const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

const sortSourceNodes = (a: SourceTreeNode, b: SourceTreeNode) => {
  if (a.children.length === 0) {
    return 1;
  } else if (b.children.length === 0) {
    return -1;
  }
  return collator.compare(a.name, b.name);
};

const SourcesTreeItem = ({ node }: STIProps) => {
  if (node.children.length === 0) {
    return (
      <div>
        <img src={fileIcon.src} /> {node.name}
      </div>
    );
  }
  const sortedChildren = node.children.slice().sort(sortSourceNodes);

  return (
    <Expandable
      header={
        <span>
          <img src={folderIcon.src} /> {node.name}
        </span>
      }
      key={node.name}
    >
      {sortedChildren.map(childNode => {
        return <SourcesTreeItem node={childNode} key={childNode.name + node.sourceDetails?.id} />;
      })}
    </Expandable>
  );
};

export const SourcesTree = () => {
  const dispatch = useAppDispatch();
  const selectedSourceId = useAppSelector(state => state.selectedSources.selectedSourceId);
  const store = useAppStore();

  const sourceDetails = getSourceDetails(store);

  const sourcesTree = useMemo(() => {
    const rootSources = parseSourcesTree(sourceDetails);
    return rootSources.sort(sortSourceNodes);
  }, [sourceDetails]);

  return (
    <>
      <ul>
        {sourcesTree.map(node => {
          return <SourcesTreeItem node={node} key={node.name + node.sourceDetails?.id} />;
        })}
        {/* {sourceDetails.map(entry => {
          const isSelected = selectedSourceId === entry.id;
          let entryText: React.ReactNode = "Unknown URL";

          if (entry.url) {
            entryText = entry.url; // new URL(entry.url!).pathname;
          }
          if (isSelected) {
            entryText = <span style={{ fontWeight: "bold" }}>{entryText}</span>;
          }

          const onLineClicked = () => dispatch(sourceEntrySelected(entry.id));
          return (
            <li key={entry.id} onClick={onLineClicked}>
              {entryText}
            </li>
          );
        })} */}
      </ul>
    </>
  );
};

//  ({entry.kind})
