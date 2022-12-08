import { useLexicalTextEntity } from "@lexical/react/useLexicalTextEntity";
import { TextNode } from "lexical";

import { $createGitHubLinkNode, GitHubLinkNode } from "./GitHubLinkNode";
import { getMatch } from "./regex";

export default function GitHubLinkPlugin(): null {
  useLexicalTextEntity<GitHubLinkNode>(getMatch, GitHubLinkNode, createGitHubLinkNode);

  return null;
}

function createGitHubLinkNode(textNode: TextNode): GitHubLinkNode {
  return $createGitHubLinkNode(textNode.getTextContent());
}
