import { ObjectId, PauseData, PauseId, Object as ProtocolObject } from "@replayio/protocol";
import { mock } from "jest-mock-extended";

import {
  MockReplayClientInterface,
  createMockReplayClient as createMockReplayClientExternal,
} from "replay-next/src/utils/testing";

export type IdToMockDataMap = { [objectId: ObjectId]: ProtocolObject };

let elementToIdMap: Map<Node, ObjectId> = new Map();
let idCounter = 0;
let mockReplayClient: MockReplayClientInterface;
let mockObjectWithPreviewData: IdToMockDataMap;
let rootNodeId: ObjectId;

function createMockObject({
  childNodes,
  className,
  nodeName,
  nodeType = Node.ELEMENT_NODE,
  nodeValue,
  objectId,
  parentNode,
}: {
  childNodes: string[];
  className: string;
  nodeName: string;
  nodeType: number;
  nodeValue: string | null;
  objectId: ObjectId;
  parentNode: ObjectId | null;
}): ProtocolObject {
  return {
    className,
    objectId,
    preview: {
      getterValues: [],
      node: {
        childNodes,
        isConnected: true,
        nodeName,
        nodeType,
        nodeValue: nodeValue != null ? nodeValue : undefined,
        parentNode: parentNode || undefined,
      },
      properties: [],
    },
  };
}

function createMockPauseData({ objects }: { objects: ProtocolObject[] }): PauseData {
  return {
    objects,
  };
}

function getIdForNode(node: Node): ObjectId {
  let id = elementToIdMap.get(node);
  if (id == null) {
    id = `${++idCounter}`;
    elementToIdMap.set(node, id);
  }
  return id;
}

function parseHTMLStringForTest(html: string) {
  // Self terminated tags aren't parsed correctly
  html = html.replace(/<([^\>]+)\s{0,1}\/\>/g, "<$1></$1>");

  const element = document.createElement("html");
  element.innerHTML = html;

  document.body.appendChild(element);

  const crawl = (node: HTMLElement, parentNodeId: ObjectId) => {
    const objectId = getIdForNode(node);

    let childNodes = Array.from(node.childNodes).map(getIdForNode);

    if (node.nodeName === "IFRAME") {
      const iframe = node as HTMLIFrameElement;
      const encoded = iframe.getAttribute("src") ?? "";
      const decodedHTML = decodeURIComponent(encoded.replace("data:text/html,", ""));

      const innerElement = document.createElement("html");
      innerElement.innerHTML = decodedHTML;

      const contentDocument = iframe.contentDocument!;

      const documentId = getIdForNode(contentDocument);
      const innerElementId = getIdForNode(innerElement);

      mockObjectWithPreviewData[documentId] = createMockObject({
        childNodes: [innerElementId],
        className: "#document",
        nodeName: contentDocument.nodeName,
        nodeType: contentDocument.nodeType,
        nodeValue: contentDocument.nodeValue,
        objectId: documentId,
        parentNode: objectId,
      });

      childNodes = [documentId];

      // JSDom doesn't support IFRAME "srcdoc"
      // nor does it seem to create a non-null contentDocument.body
      // but we can approximate it...
      crawl(innerElement, documentId);
    }

    mockObjectWithPreviewData[objectId] = createMockObject({
      childNodes,
      className: node.nodeName,
      nodeName: node.nodeName,
      nodeType: node.nodeType,
      nodeValue: node.nodeValue,
      objectId,
      parentNode: parentNodeId,
    });

    Array.from(node.childNodes).forEach(child => {
      crawl(child as HTMLElement, objectId);
    });
  };

  rootNodeId = `${++idCounter}`;

  mockObjectWithPreviewData[rootNodeId] = createMockObject({
    childNodes: [getIdForNode(element)],
    className: "HTMLDocument",
    nodeName: "#document",
    nodeType: Node.DOCUMENT_NODE,
    nodeValue: null,
    objectId: rootNodeId,
    parentNode: null,
  });

  crawl(element, rootNodeId);

  document.body.removeChild(element);
}

export function createMockReplayClient(htmlString: string) {
  elementToIdMap = new Map();
  idCounter = 0;
  mockObjectWithPreviewData = {};
  rootNodeId = "";

  mockReplayClient = createMockReplayClientExternal();
  mockReplayClient.findSources.mockImplementation(() => {
    return Promise.resolve([]);
  });
  mockReplayClient.getParentNodes.mockImplementation((pauseId: PauseId, leafNodeId: ObjectId) => {
    const objects: ProtocolObject[] = [];

    let currentNodeId: ObjectId | undefined = leafNodeId;
    while (currentNodeId) {
      const mockNode: ProtocolObject | undefined = mockObjectWithPreviewData[currentNodeId];
      if (mockNode) {
        objects.push(mockNode);

        currentNodeId = mockNode.preview?.node?.parentNode;
      } else {
        break;
      }
    }

    return Promise.resolve({
      data: { objects },
    });
  });
  mockReplayClient.getObjectWithPreview.mockImplementation((objectId: ObjectId) => {
    const mockObject = mockObjectWithPreviewData[objectId];
    if (mockObject) {
      return Promise.resolve(
        createMockPauseData({
          objects: [mockObject],
        })
      );
    }

    throw Error(`No mock data found for objectId: ${objectId}`);
  });

  parseHTMLStringForTest(htmlString);

  return { mockObjectWithPreviewData, replayClient: mockReplayClient, rootNodeId };
}
