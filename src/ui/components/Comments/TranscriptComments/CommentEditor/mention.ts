import type Draft from "draft-js";
import { User } from "ui/types";

// @ts-ignore-line
import { features } from "ui/utils/prefs";

import { DraftJSModule } from "./use-draftjs";

// Borrowed and slightly modified from
// https://github.com/draft-js-plugins/draft-js-plugins/blob/master/packages/mention/src/defaultRegExp.ts
// for creating the entities on load
const defaultRegExp =
  "[" +
  "\\w-\\." + // Latin-1 Supplement (letters only) - https://en.wikipedia.org/wiki/List_of_Unicode_characters#Latin-1_Supplement
  "\xC0-\xD6" +
  "\xD8-\xF6" +
  "\xF8-\xFF" + // Latin Extended-A (without deprecated character) - https://en.wikipedia.org/wiki/List_of_Unicode_characters#Latin_Extended-A
  "\u0100-\u0148" +
  "\u014A-\u017F" + // Cyrillic symbols: \u0410-\u044F - https://en.wikipedia.org/wiki/Cyrillic_script_in_Unicode
  "\u0410-\u044F" + // hiragana (japanese): \u3040-\u309F - https://gist.github.com/ryanmcgrath/982242#file-japaneseregex-js
  "\u3040-\u309F" + // katakana (japanese): \u30A0-\u30FF - https://gist.github.com/ryanmcgrath/982242#file-japaneseregex-js
  "\u30A0-\u30FF" + // For an advanced explaination about Hangul see https://github.com/draft-js-plugins/draft-js-plugins/pull/480#issuecomment-254055437
  // Hangul Jamo (korean): \u3130-\u318F - https://en.wikipedia.org/wiki/Korean_language_and_computers#Hangul_in_Unicode
  // Hangul Syllables (korean): \uAC00-\uD7A3 - https://en.wikipedia.org/wiki/Korean_language_and_computers#Hangul_in_Unicode
  "\u3130-\u318F" +
  "\uAC00-\uD7A3" + // common chinese symbols: \u4e00-\u9eff - http://stackoverflow.com/a/1366113/837709
  "\u4E00-\u9EFF" + // Arabic https://en.wikipedia.org/wiki/Arabic_(Unicode_block)
  "\u0600-\u06FF" + // Vietnamese http://vietunicode.sourceforge.net/charset/
  "\xC0-\u1EF9" +
  "]";

function mentionsEnabled() {
  return features.commentMentions;
}

function addMentions(DraftJS: DraftJSModule, es: Draft.EditorState, users: User[]) {
  if (!mentionsEnabled()) return es;

  const blocks = es.getCurrentContent().getBlocksAsArray();
  blocks.forEach(b => {
    // iterate in reverse order to avoid invalidating the match indices when changing the text
    // @ts-ignore
    const matches = [...b.getText().matchAll(new RegExp(`@(${defaultRegExp}+)`, "ig"))].reverse();
    for (let match of matches) {
      const mention = users.find(u => u.name === match[1]);

      if (!mention) continue;

      // If we find a user for the mention (which we should), create a mention
      // entity and replace the text with the new entity
      const contentStateWithEntity = es.getCurrentContent().createEntity("mention", "IMMUTABLE", {
        mention,
      });
      const selectionState = DraftJS.SelectionState.createEmpty(b.getKey()).merge({
        anchorOffset: match.index,
        focusOffset: match.index + match[0].length,
      });
      const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
      const mentionFragment = DraftJS.Modifier.replaceText(
        es.getCurrentContent(),
        selectionState,
        mention.name,
        undefined,
        entityKey
      );
      es = DraftJS.EditorState.push(es, mentionFragment, "insert-fragment");
    }
  });

  return es;
}

function convertToMarkdown(editorState: Draft.EditorState, DraftJS: DraftJSModule) {
  if (!mentionsEnabled()) return editorState.getCurrentContent().getPlainText();

  const raw = DraftJS.convertToRaw(editorState.getCurrentContent());
  return raw.blocks
    .map(b => {
      const buffer = [];
      let i = 0;
      b.entityRanges.forEach(er => {
        const e = raw.entityMap[er.key];
        if (e.type === "mention") {
          buffer.push(b.text.substring(i, er.offset));
          buffer.push(`@${e.data.mention.nickname}`);
          i = er.offset + er.length;
        }
      });
      buffer.push(b.text.substring(i));

      return buffer.join("");
    })
    .join("\n");
}

export { addMentions, convertToMarkdown, mentionsEnabled };
