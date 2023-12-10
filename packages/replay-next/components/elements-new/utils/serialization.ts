import { ObjectId } from "@replayio/protocol";

import type { Node as NodeType } from "replay-next/components/elements-new/types";

declare var __RECORD_REPLAY_ARGUMENTS__: {
  getPersistentId?: (value: any) => number | null | void;
  internal?: {
    registerPlainObject?: (value: any) => string | null | void;
  };
};

export function deserializeDOM(rawData: number[]): NodeType | null {
  const stringTable: { [key: number]: string } = {};

  let rootNode: NodeType | null = null;
  let rawDataIndex = 0;

  const stringTableSize = rawData[0];
  for (let index = 0; index < stringTableSize; index++) {
    const key = rawData[++rawDataIndex];
    const stringLength = rawData[++rawDataIndex];
    const string = rawData
      .slice(rawDataIndex + 1, rawDataIndex + 1 + stringLength)
      .map(charCode => String.fromCharCode(charCode))
      .join("");

    stringTable[key] = string;

    rawDataIndex += stringLength;
  }

  const nodesMap: Map<ObjectId, NodeType> = new Map();

  while (rawDataIndex < rawData.length - 1) {
    // Overall structure of each node:
    //   parentObjectId
    //   objectId
    //   nodeType
    //   tagName (or text content) (key id)
    //   number of attribute/value string keys
    //   ...rest (string keys)
    const parentObjectId = "" + rawData[++rawDataIndex];
    const objectId = "" + rawData[++rawDataIndex];
    const nodeType = rawData[++rawDataIndex];
    const tagNameOrTextContentKey = rawData[++rawDataIndex];
    const tagNameOrTextContent =
      tagNameOrTextContentKey !== 0 ? stringTable[tagNameOrTextContentKey] : null;

    const attributeStringKeyCount = rawData[++rawDataIndex];
    const attributeStopIndex = rawDataIndex + attributeStringKeyCount - 1;
    const attributes: { [key: string]: string } = {};

    while (rawDataIndex <= attributeStopIndex) {
      const stringKeyCount = rawData[++rawDataIndex];

      const nameKey = rawData[++rawDataIndex];
      const name = stringTable[nameKey];

      const values = [];
      const valueStopIndex = rawDataIndex + stringKeyCount - 2;
      while (rawDataIndex <= valueStopIndex) {
        const valueKey = rawData[++rawDataIndex];
        const value = stringTable[valueKey];

        values.push(value);
      }

      attributes[name] = values.join(" ");
    }

    const parentObject = parentObjectId ? nodesMap.get(parentObjectId) ?? null : null;

    const node: NodeType = {
      attributes,
      children: [],
      nodeType,
      parentObject,
      objectId,
      tagName: nodeType !== Node.TEXT_NODE ? tagNameOrTextContent ?? null : null,
      textContent: nodeType === Node.TEXT_NODE ? tagNameOrTextContent ?? null : null,
    };

    if (parentObject) {
      parentObject.children.push(node);
    }

    nodesMap.set(objectId, node);

    if (rootNode === null) {
      rootNode = node;
    }
  }

  return rootNode;
}

export function serializeDOM(rootNode: Document): number[] {
  let stringTableKeyCount = 0;

  const stringTableArray: number[] = [];
  const stringTableKeysMap = new Map();

  function getObjectId(value: any) {
    if (typeof __RECORD_REPLAY_ARGUMENTS__ !== "undefined" && __RECORD_REPLAY_ARGUMENTS__ != null) {
      // TODO [FE-2005][FE-2067] With persistent DOM ids, presumably we should switch to using this API?
      // if (__RECORD_REPLAY_ARGUMENTS__.getPersistentId) {
      //   const id = __RECORD_REPLAY_ARGUMENTS__.getPersistentId(value);
      //   if (id) {
      //     return id;
      //   }
      // }

      if (
        __RECORD_REPLAY_ARGUMENTS__.internal &&
        __RECORD_REPLAY_ARGUMENTS__.internal.registerPlainObject
      ) {
        const id = __RECORD_REPLAY_ARGUMENTS__.internal.registerPlainObject(value);
        if (id) {
          return parseInt(id);
        }
      }
    }

    throw Error("Could not find object id");
  }

  function registerString(text: string | undefined) {
    if (!text) {
      return 0;
    }
    if (stringTableKeysMap.has(text)) {
      return stringTableKeysMap.get(text);
    } else {
      const key = ++stringTableKeyCount;
      stringTableKeysMap.set(text, key);

      stringTableArray.push(key);
      stringTableArray.push(text.length);

      for (let charIndex = 0; charIndex < text.length; charIndex++) {
        stringTableArray.push(text.charCodeAt(charIndex));
      }

      return key;
    }
  }

  let nodesArray = [];
  let queue: (number | ChildNode | Document | Element)[] = [0, rootNode];

  while (queue.length > 0) {
    const parentObjectId = queue.shift() as number;
    const domNodeOrText = queue.shift() as Element;

    const objectId = getObjectId(domNodeOrText);

    let { childNodes, classList, id, nodeType, tagName, textContent } = domNodeOrText;

    switch (nodeType) {
      case Node.DOCUMENT_NODE: {
        tagName = "#document";
        break;
      }
      case Node.DOCUMENT_TYPE_NODE: {
        tagName = "<!Doctype>";
        break;
      }
      case Node.TEXT_NODE: {
        textContent = textContent ? textContent.trim() : null;
        break;
      }
      default: {
        tagName = tagName.toLowerCase();
        break;
      }
    }

    let attributes: number[] = [];

    // Attributes are serialized using the following format:
    //   [ 0: stringKeyCount, 1: nameStringKey, ...valueStringKey ]
    //
    // For example, a name-only attribute (e.g. <div data-selected />) might be:
    //   [ 1, 50 ]
    //
    // An id attribute (e.g. <div id="foo" />) might be:
    //   [ 2, 63, 85 ]
    //
    // And a class name attribute (e.g. <div class="foo bar baz" />) might be:
    //   [ 4, 22, 41, 42, 43 ]

    if (typeof domNodeOrText.getAttributeNames === "function") {
      const attributeNames = domNodeOrText.getAttributeNames();
      attributeNames.sort();
      attributeNames.forEach(name => {
        const value = domNodeOrText.getAttribute(name);
        if (value) {
          attributes.push(2);
          attributes.push(registerString(name));
          attributes.push(registerString("" + value));
        } else {
          attributes.push(1);
          attributes.push(registerString(name));
        }
      });
    }

    nodesArray.push(parentObjectId);
    nodesArray.push(objectId);
    nodesArray.push(nodeType);
    nodesArray.push(
      nodeType === Node.TEXT_NODE ? registerString(textContent!) : registerString(tagName)
    );
    nodesArray.push(attributes.length);
    nodesArray.push(...attributes);

    if (childNodes) {
      for (let child of childNodes) {
        switch (child.nodeType) {
          case Node.COMMENT_NODE: {
            break;
          }
          case Node.TEXT_NODE: {
            if (child.textContent?.trim()) {
              queue.push(objectId);
              queue.push(child);
            }
            break;
          }
          default: {
            queue.push(objectId);
            queue.push(child);
            break;
          }
        }
      }
    }

    switch (nodeType) {
      case Node.ELEMENT_NODE: {
        if (domNodeOrText instanceof HTMLIFrameElement) {
          if (domNodeOrText.contentDocument != null) {
            queue.push(objectId);
            queue.push(domNodeOrText.contentDocument);
          }
        }
        break;
      }
    }
  }

  return [stringTableKeyCount, ...stringTableArray, ...nodesArray];
}
