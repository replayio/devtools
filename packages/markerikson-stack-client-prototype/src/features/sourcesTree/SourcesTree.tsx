import { useMemo } from "react";
import Expandable from "@bvaughn/components/Expandable";

import { useAppDispatch, useAppSelector, useAppStore } from "../../app/hooks";

import { sourceEntrySelected } from "../sources/selectedSourcesSlice";
import { getSourceDetails } from "../sources/sourcesCache";
import { parseSourcesTree, SourceTreeNode } from "./treeUtils";

import fileIcon from "./images/file-small.svg";
import folderIcon from "./images/folder.svg";
import globeIcon from "./images/globe-small.svg";

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
  const dispatch = useAppDispatch();

  if (node.children.length === 0 && node.sourceDetails) {
    const handleClick = () => {
      dispatch(sourceEntrySelected(node.sourceDetails!.id));
    };
    return (
      <div onClick={handleClick}>
        <img src={fileIcon.src} /> {node.name} ({node.sourceDetails!.kind})
      </div>
    );
  }
  const sortedChildren = node.children.slice().sort(sortSourceNodes);

  return (
    <Expandable
      header={
        <span>
          <img src={node.isRoot ? globeIcon.src : folderIcon.src} /> {node.name}
        </span>
      }
      key={node.name}
    >
      {sortedChildren.map(childNode => {
        return (
          <SourcesTreeItem
            node={childNode}
            key={childNode.name + childNode.sourceDetails?.url + childNode.sourceDetails?.kind}
          />
        );
      })}
    </Expandable>
  );
};

export const SourcesTree = () => {
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
          return <SourcesTreeItem node={node} key={node.name + node.sourceDetails?.url} />;
        })}
      </ul>
    </>
  );
};

//  ({entry.kind})
