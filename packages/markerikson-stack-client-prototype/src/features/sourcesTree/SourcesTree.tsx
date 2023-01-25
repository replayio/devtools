import classnames from "classnames";
import { useMemo } from "react";

import Expandable from "replay-next/components/Expandable";

import { useAppDispatch, useAppSelector, useAppStore } from "../../app/hooks";
import { sourceEntrySelected } from "../sources/selectedSourcesSlice";
import { getSourceDetails } from "../sources/sourcesCache";
import {
  SourceDetails,
  SourceDetailsEntities,
  openSourceDetailsEntities,
} from "../sources/sourcesSlice";
import { SourceTreeNode, parseSourcesTree } from "./treeUtils";
import "./variables.css";
import styles from "./SourcesTree.module.css";
import fileIcon from "./images/file-small.svg";
import folderIcon from "./images/folder.svg";
import globeIcon from "./images/globe-small.svg";

interface STIProps {
  node: SourceTreeNode;
  sourceDetailsEntities: SourceDetailsEntities;
  selectedSourceId: string | null;
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

const SourcesTreeItem = ({ node, sourceDetailsEntities, selectedSourceId }: STIProps) => {
  const dispatch = useAppDispatch();

  if (node.children.length === 0 && node.sourceDetails) {
    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      dispatch(sourceEntrySelected(node.sourceDetails!.id));
    };

    const relatedDetails: SourceDetails[] = [];
    node.sourceDetails.generated.forEach(generatedId => {
      const generatedDetails = sourceDetailsEntities[generatedId]!;
      relatedDetails.push(generatedDetails);
    });

    if (node.sourceDetails.prettyPrinted) {
      const prettyPrintedDetails = sourceDetailsEntities[node.sourceDetails.prettyPrinted]!;
      relatedDetails.push(prettyPrintedDetails);
    }

    const fileClassname = classnames(styles.treeItem, {
      [styles.active]: node.sourceDetails!.id === selectedSourceId,
    });

    let fileEntryContent = (
      <div onClick={handleClick} className={fileClassname}>
        <img src={fileIcon.src} /> {node.name} ({node.sourceDetails!.kind})
      </div>
    );

    if (relatedDetails.length) {
      fileEntryContent = (
        <Expandable header={fileEntryContent}>
          {relatedDetails.map(childNode => {
            const splitPath = new URL(childNode.url!).pathname.split("/");
            const [fileName] = splitPath.slice(-1);

            const handleClick = (e: React.MouseEvent) => {
              e.stopPropagation();
              e.preventDefault();
              dispatch(sourceEntrySelected(childNode.id));
            };

            const fileClassname = classnames(styles.treeItem, {
              [styles.active]: childNode.id === selectedSourceId,
            });

            return (
              <div key={childNode.id} onClick={handleClick} className={fileClassname}>
                <img src={fileIcon.src} /> {fileName} ({childNode.kind})
              </div>
            );
          })}
        </Expandable>
      );
    }

    return fileEntryContent;
  }
  const sortedChildren = node.children.slice().sort(sortSourceNodes);

  return (
    <Expandable
      header={
        <span className={styles.treeItem}>
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
            sourceDetailsEntities={sourceDetailsEntities}
            selectedSourceId={selectedSourceId}
          />
        );
      })}
    </Expandable>
  );
};

export const SourcesTree = () => {
  const selectedSourceId = useAppSelector(state => state.selectedSources.selectedSourceId);
  const sourceDetailsEntities = useAppSelector(openSourceDetailsEntities);
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
          return (
            <SourcesTreeItem
              node={node}
              sourceDetailsEntities={sourceDetailsEntities}
              selectedSourceId={selectedSourceId}
              key={node.name + node.sourceDetails?.url}
            />
          );
        })}
      </ul>
    </>
  );
};

//  ({entry.kind})
