import type { Spread } from "lexical";
import { SerializedTextNode } from "lexical";

export type Collaborator = {
  id: string;
  name: string;
};

export type SerializedMentionsTextNode = Spread<
  {
    id: string;
    name: string;
    type: "mentions-item";
    version: 1;
  },
  SerializedTextNode
>;
