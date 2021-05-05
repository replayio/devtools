import DraftJS from "draft-js";
import * as Editor from "@draft-js-plugins/editor";
import createEmojiPlugin, { defaultTheme as defaultEmojiTheme } from "@draft-js-plugins/emoji";
import createMentionPlugin, {
  defaultTheme as defaultMentionTheme,
} from "@draft-js-plugins/mention";

export {
  DraftJS,
  Editor,
  createEmojiPlugin,
  defaultEmojiTheme,
  createMentionPlugin,
  defaultMentionTheme,
};
