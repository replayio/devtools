import { BodyData } from "@recordreplay/protocol";

// These are the types that we know how to display The functions in this file
// have two jobs:
// 1. Map the entire world of content types (see
// http://www.iana.org/assignments/media-types/media-types.xhtml) onto the small
// number of things that we know how to display
// 2. When neccessary, change the form that we are holding that content in so
// that we will be able to display it

export enum Displayable {
  JSON,
  Text,
  Raw,
}

export type JSONBody = {
  // What to display it as when shown in the UI
  as: Displayable.JSON;
  // The content as it is currently held
  content: object;
  // The content-type header that the server sent with this request
  contentType: string;
};

export type RawBody = {
  as: Displayable.Raw;
  content: ArrayBuffer[];
  contentType: string;
};

export type TextBody = {
  as: Displayable.Text;
  content: string;
  contentType: string;
};

// Here we will probably eventually add stuff like Image.
export type DisplayableBody = JSONBody | RawBody | TextBody;

const TEXTISH_CONTENT_TYPES = [
  "application/javascript",
  "application/json",
  "application/xhtml+xml",
  "application/xml",
  "image/svg+xml",
];

export const shouldTryAndTurnIntoText = (contentType: string): boolean => {
  const withoutCharset = contentType.split(";")[0];
  if (withoutCharset.startsWith("text")) {
    return true;
  }
  if (TEXTISH_CONTENT_TYPES.includes(withoutCharset)) {
    return true;
  }
  return false;
};

export const Base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  var binaryString = atob(base64);
  var len = binaryString.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

export const BodyPartsToArrayBuffer = (bodyParts: BodyData[], contentType: string): RawBody => {
  return {
    as: Displayable.Raw,
    content: bodyParts.map(p => p.value).map(Base64ToArrayBuffer),
    contentType,
  };
};

let utf8decoder = new TextDecoder();
export const RawToUTF8 = (input: DisplayableBody): DisplayableBody => {
  if (input.as === Displayable.Raw && shouldTryAndTurnIntoText(input.contentType)) {
    return {
      ...input,
      as: Displayable.Text,
      content: utf8decoder.decode(...input.content),
    };
  } else {
    return input;
  }
};

export const StringToObjectMaybe = (input: DisplayableBody): DisplayableBody => {
  if (input.as === Displayable.Text) {
    try {
      return {
        ...input,
        as: Displayable.JSON,
        content: JSON.parse(input.content),
      };
    } catch (e) {
      return input;
    }
  } else {
    return input;
  }
};

export const URLEncodedToPlaintext = (input: DisplayableBody): DisplayableBody => {
  if (input.contentType === "application/x-www-form-urlencoded" && input.as === Displayable.Text) {
    return {
      ...input,
      as: Displayable.Text,
      content: decodeURI(input.content),
    };
  } else {
    return input;
  }
};
