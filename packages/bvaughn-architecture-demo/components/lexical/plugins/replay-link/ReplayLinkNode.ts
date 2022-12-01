import { RecordingId } from "@replayio/protocol";
import type { EditorConfig, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from "lexical";
import { $applyNodeReplacement, DecoratorNode } from "lexical";
import { createElement, lazy } from "react";

const ReplayLink = lazy(
  // @ts-ignore
  () => import("./ReplayLink")
);

const REPLAY_URL_REGEX =
  /[\B]{0,1}https:\/\/app\.replay\.io\/recording\/([^\?\B]+)(\?[^\B]+){0,1}[\B]{0,1}/;

export type SerializedReplayLinkNode = Spread<
  {
    url: string;
    type: "replay-link";
    version: 1;
  },
  SerializedLexicalNode
>;

export class ReplayLinkNode extends DecoratorNode<JSX.Element> {
  __url: string;

  static getType(): string {
    return "replay-link";
  }

  static clone(node: ReplayLinkNode): ReplayLinkNode {
    return new ReplayLinkNode(node.__url, node.__key);
  }

  static importJSON(serializedNode: SerializedReplayLinkNode): ReplayLinkNode {
    const { url } = serializedNode;
    const node = $createReplayLinkNode({ url });
    return node;
  }

  static getMatch(text: string): RegExpMatchArray | null {
    return text.match(REPLAY_URL_REGEX);
  }

  static urlToTitle(url: string): string | null {
    if (url) {
      const match = ReplayLinkNode.getMatch(url);
      if (match) {
        const [title] = match[1].split("--");
        return title.replace(/-/g, " ");
      }
    }

    return null;
  }

  constructor(url: string, key?: NodeKey) {
    super(key);

    this.__url = url;
  }

  exportJSON(): SerializedReplayLinkNode {
    return {
      url: this.__url,
      type: "replay-link",
      version: 1,
    };
  }

  getTextContent(): string {
    return this.__url;
  }

  setWidthAndHeight(width: "inherit" | number, height: "inherit" | number): void {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  // View

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement("span");
    const theme = config.theme;
    const className = theme.image;
    if (className !== undefined) {
      span.className = className;
    }
    return span;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): JSX.Element {
    return createElement(ReplayLink, { url: this.__url });
  }
}

export function $createReplayLinkNode({
  key,
  url,
}: {
  key?: NodeKey;
  url: string;
}): ReplayLinkNode {
  return $applyNodeReplacement(new ReplayLinkNode(url, key));
}

export function $isReplayLinkNode(node: LexicalNode | null | undefined): node is ReplayLinkNode {
  return node instanceof ReplayLinkNode;
}
