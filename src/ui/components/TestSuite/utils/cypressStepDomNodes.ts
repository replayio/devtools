declare var __RECORD_REPLAY_ARGUMENTS__: {
  getPersistentId?: (value: any) => number | null | void;

  internal?: {
    registerPlainObject?: (value: any) => string | null | void;
  };
};

declare var __RECORD_REPLAY__: {
  getObjectFromProtocolId?: (id: string | number) => any;
  getProtocolIdForObject?: (object: any) => string | number | null;
};

export function findDOMNodeObjectIdForPersistentId(persistentId: number): string | null {
  if (
    typeof __RECORD_REPLAY__ === "undefined" ||
    __RECORD_REPLAY__ == null ||
    __RECORD_REPLAY__.getProtocolIdForObject == null
  ) {
    return null;
  }

  if (
    typeof __RECORD_REPLAY_ARGUMENTS__ === "undefined" ||
    __RECORD_REPLAY_ARGUMENTS__ == null ||
    __RECORD_REPLAY_ARGUMENTS__.getPersistentId == null
  ) {
    return null;
  }

  const { getPersistentId } = __RECORD_REPLAY_ARGUMENTS__;

  let domNodeId: string | null = null;

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

  const rootNode = document;
  let queue: (number | ChildNode | Document | Element)[] = [0, rootNode];

  // This loop modified from the version in `serialization.ts`,
  // which is used to serialize the entire DOM tree.
  // In our case, we want to _loop_ over the entire DOM tree,
  // but we're only looking to find a single DOM node by persistent ID.
  // It's important that we be able to drill down through iframes,
  // especially since Cypress tests always run in an iframe.
  while (queue.length > 0) {
    const _parentObjectId = queue.shift() as number;
    const domNodeOrText = queue.shift() as Element;

    const objectId = getObjectId(domNodeOrText);
    const nodePersistentId = getPersistentId(domNodeOrText);

    if (persistentId === nodePersistentId) {
      // Turn this back into a string
      domNodeId = `${objectId}`;
      break;
    }

    let { childNodes, nodeType } = domNodeOrText;

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

  return domNodeId;
}
