import { EditorState } from "prosemirror-state";
import { Node, mergeAttributes, nodeInputRule, PasteRule, markPasteRule } from "@tiptap/core";

export interface GitHubLinkOptions {
  HTMLAttributes: Record<string, any>;
}

export const inputRegex = /(https:\/\/github.com\/(.*)\/(.*)\/(.*)\/(\d+)[^ ]*)/g;

const getAttributes = (match: string[]) => {
  const [href, , org, repo, subpath, id] = match;
  return {
    href,
    org,
    repo,
    subpath,
    id,
  };
};

// More info at:
// https://www.notion.so/replayio/TipTap-Editor-0021afbf0c0e458793eba4c98cbbb47e#5a47e9da0c5d4fd1bd57436b0a48294c
export const GitHubLink = Node.create<GitHubLinkOptions>({
  name: "github-link",

  priority: 100,

  defaultOptions: {
    HTMLAttributes: {
      class: "text-primaryAccentText hover:text-primaryAccentLegacyHover",
      rel: "nofollow",
      target: "_blank",
    },
  },

  addAttributes() {
    return {
      href: { default: null },
      org: { default: null },
      repo: { default: null },
      subpath: { default: null },
      id: { default: null },
      text: "text",
      content: "content",
    };
  },

  atom: true,
  group: "inline",
  inline: true,

  parseHTML() {
    return [{ tag: "a[data-github-link]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "a",
      mergeAttributes({ "data-github-link": "" }, this.options.HTMLAttributes, HTMLAttributes),
      `${node.attrs.org}/${node.attrs.repo}#${node.attrs.id}`,
    ];
  },

  renderText({ node }) {
    return node.attrs.href;
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: inputRegex,
        type: this.type,
        getAttributes,
      }),
    ];
  },

  addPasteRules() {
    return [
      {
        find: inputRegex,
        handler: ({
          state,
          range,
          match,
        }: {
          state: EditorState;
          range: { from: number; to: number };
          match: string[];
        }) => {
          // If this method is getting called it's because our matcher worked.
          // So we should shove a GitHub Link node into where this match was.
          // Thankfully, ProseMirror editors have a nice little `replaceWith`
          // function that basically does just that. I was majorly guided by
          // https://github.com/ueberdosis/tiptap/blob/main/packages/core/src/inputRules/nodeInputRule.ts
          const attributes = getAttributes(match);
          const { tr } = state;
          const start = range.from;
          let end = range.to;

          tr.replaceWith(start, end, this.type.create(attributes));
        },
      },
    ];
  },
});
