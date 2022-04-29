import { BodyData } from "@recordreplay/protocol";

// These are the body types that we know how to display.
// The functions in this file have two jobs:
//   1. Map the entire world of content types (see
//   http://www.iana.org/assignments/media-types/media-types.xhtml) onto the
//   small number of things that we know how to display
//   2. When neccessary, change the form of that content so that we will be able
//   to display it

export enum Displayable {
  Image,
  JSON,
  Raw,
  Text,
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
  content: Uint8Array;
  contentType: string;
};

export type TextBody = {
  as: Displayable.Text;
  content: string;
  contentType: string;
};

export type ImageBody = {
  as: Displayable.Image;
  content: string; // base64 you can feed into a `src` attribute
  contentType: string;
};

export type DisplayableBody = JSONBody | RawBody | TextBody | ImageBody;

const TEXTISH_CONTENT_TYPES = [
  "application/javascript",
  "application/json",
  "application/octet-stream",
  "application/xhtml+xml",
  "application/xml",
  "image/svg+xml",
];

const withoutCharset = (contentType: string) => contentType.split(";")[0];

export const shouldTryAndTurnIntoText = (contentType: string): boolean => {
  if (contentType.startsWith("text")) {
    return true;
  }
  if (TEXTISH_CONTENT_TYPES.includes(withoutCharset(contentType))) {
    return true;
  }
  return false;
};

const shouldTryAndConvertToImage = (contentType: string) => contentType.startsWith("image");

const Base64ToUInt8Array = (base64: string): Uint8Array => {
  var binaryString = atob(base64);
  var len = binaryString.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const BodyPartsToUInt8Array = (bodyParts: BodyData[], contentType: string): RawBody => {
  let combined = new Uint8Array(bodyParts.reduce((acc, x) => acc + x.length, 0));
  for (const part of bodyParts) {
    combined.set(Base64ToUInt8Array(part.value), part.offset);
  }
  return {
    as: Displayable.Raw,
    content: combined,
    contentType,
  };
};

export const RawToImageMaybe = (input: DisplayableBody): DisplayableBody => {
  if (input.as === Displayable.Raw && shouldTryAndConvertToImage(input.contentType)) {
    return {
      as: Displayable.Image,
      content: Buffer.from(input.content).toString("base64"),
      contentType: input.contentType,
    };
  } else {
    return input;
  }
};

export const RawToUTF8 = (input: DisplayableBody): DisplayableBody => {
  if (input.as === Displayable.Raw && shouldTryAndTurnIntoText(input.contentType)) {
    return {
      ...input,
      as: Displayable.Text,
      content: new TextDecoder().decode(input.content.buffer),
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
