import { ObjectId } from "@replayio/protocol";

export type Attributes = { [key: string]: string };

export type Node = {
  attributes: Attributes;
  children: Node[];
  nodeType: number;
  parentObject: Node | null;
  objectId: ObjectId;
  tagName: string | null;
  textContent: string | null;
};

export type ItemDisplayMode = "collapsed" | "empty" | "head" | "tail";

export type Item = {
  attributes: Attributes;
  depth: number;
  displayMode: ItemDisplayMode;
  nodeType: number;
  objectId: ObjectId;
  tagName: string | null;
  textContent: string | null;
};

export type Metadata = Node & {
  depth: number;
  isExpanded: boolean;
  weight: number;
};
