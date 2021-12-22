/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

const { maybeEscapePropertyName } = require("../../reps/rep-utils");
const ArrayRep = require("../../reps/array");
const GripArrayRep = require("../../reps/grip-array");
const GripMap = require("../../reps/grip-map");
const GripMapEntryRep = require("../../reps/grip-map-entry");
const ErrorRep = require("../../reps/error");
const BigIntRep = require("../../reps/big-int");
const { isLongString } = require("../../reps/string");

const MAX_NUMERICAL_PROPERTIES = 100;

const NODE_TYPES = {
  BUCKET: Symbol("[n…m]"),
  DEFAULT_PROPERTIES: Symbol("<default properties>"),
  ENTRIES: Symbol("<entries>"),
  GET: Symbol("<get>"),
  GRIP: Symbol("GRIP"),
  MAP_ENTRY_KEY: Symbol("<key>"),
  MAP_ENTRY_VALUE: Symbol("<value>"),
  PROMISE_REASON: Symbol("<reason>"),
  PROMISE_STATE: Symbol("<state>"),
  PROMISE_VALUE: Symbol("<value>"),
  PROXY_HANDLER: Symbol("<handler>"),
  PROXY_TARGET: Symbol("<target>"),
  SET: Symbol("<set>"),
  PROTOTYPE: Symbol("<prototype>"),
  BLOCK: Symbol("☲"),
};

let WINDOW_PROPERTIES = {};

if (typeof window === "object") {
  WINDOW_PROPERTIES = Object.getOwnPropertyNames(window);
}

function getType(item) {
  return item.type;
}

function getValue(item) {
  return item.contents;
}

function getFront(item) {
  return item && item.contents && item.contents.front;
}

function getActor(item, roots) {
  const isRoot = isNodeRoot(item, roots);
  const value = getValue(item);
  return isRoot || !value ? null : value.actor;
}

function isNodeRoot(item, roots) {
  const gripItem = getClosestGripNode(item);
  const value = getValue(gripItem);

  return (
    value &&
    roots.some(root => {
      const rootValue = getValue(root);
      return rootValue && rootValue.id() === value.id();
    })
  );
}

function nodeIsBucket(item) {
  return getType(item) === NODE_TYPES.BUCKET;
}

function nodeIsEntries(item) {
  return getType(item) === NODE_TYPES.ENTRIES;
}

function nodeIsMapEntry(item) {
  return GripMapEntryRep.supportsObject(getValue(item));
}

function nodeHasChildren(item) {
  return getValue(item).hasChildren();
}

function nodeHasValue(item) {
  return item && item.contents && item.contents.hasOwnProperty("value");
}

function nodeHasGetterValue(item) {
  return item && item.contents && item.contents.hasOwnProperty("getterValue");
}

function nodeIsObject(item) {
  const value = getValue(item);
  return value && value.isObject();
}

function nodeIsArrayLike(item) {
  const value = getValue(item);
  return GripArrayRep.supportsObject(value) || ArrayRep.supportsObject(value);
}

function nodeIsFunction(item) {
  const value = getValue(item);
  return value && value.className() === "Function";
}

function nodeIsOptimizedOut(item) {
  const value = getValue(item);
  return !nodeHasChildren(item) && value && value.isUnavailable();
}

function nodeIsUninitializedBinding(item) {
  const value = getValue(item);
  return value && value.isUninitialized();
}

// Used to check if an item represents a binding that exists in a sourcemap's
// original file content, but does not match up with a binding found in the
// generated code.
function nodeIsUnmappedBinding(item) {
  return false;
  //const value = getValue(item);
  //return value && value.unmapped;
}

// Used to check if an item represents a binding that exists in the debugger's
// parser result, but does not match up with a binding returned by the
// devtools server.
function nodeIsUnscopedBinding(item) {
  return false;
  //const value = getValue(item);
  //return value && value.unscoped;
}

function nodeIsMissingArguments(item) {
  return false;
  //const value = getValue(item);
  //return !nodeHasChildren(item) && value && value.missingArguments;
}

function nodeHasProperties(item) {
  return !nodeHasChildren(item) && nodeIsObject(item);
}

function nodeIsPrimitive(item) {
  const v = getValue(item);
  return v.isPrimitive() || v.isUninitialized() || v.isUnavailable();
}

function nodeIsDefaultProperties(item) {
  return getType(item) === NODE_TYPES.DEFAULT_PROPERTIES;
}

function isDefaultWindowProperty(name) {
  return WINDOW_PROPERTIES.includes(name);
}

function nodeIsPromise(item) {
  const value = getValue(item);
  if (!value) {
    return false;
  }

  return value.className() == "Promise";
}

function nodeIsProxy(item) {
  const value = getValue(item);
  if (!value) {
    return false;
  }

  return value.className() == "Proxy";
}

function nodeIsPrototype(item) {
  return item.name == "<prototype>";
}

function nodeIsWindow(item) {
  const value = getValue(item);
  if (!value) {
    return false;
  }

  return value.className() == "Window";
}

function nodeIsGetter(item) {
  return getType(item) === NODE_TYPES.GET;
}

function nodeIsSetter(item) {
  return getType(item) === NODE_TYPES.SET;
}

function nodeIsBlock(item) {
  return getValue(item).isScope();
  //return getType(item) === NODE_TYPES.BLOCK;
}

function nodeIsError(item) {
  return ErrorRep.supportsObject(getValue(item));
}

function nodeIsLongString(item) {
  return isLongString(getValue(item));
}

function nodeIsBigInt(item) {
  return BigIntRep.supportsObject(getValue(item));
}

function nodeHasFullText(item) {
  const value = getValue(item);
  return nodeIsLongString(item) && value.hasOwnProperty("fullText");
}

function nodeHasGetter(item) {
  const getter = getNodeGetter(item);
  return getter && getter.type !== "undefined";
}

function nodeHasSetter(item) {
  const setter = getNodeSetter(item);
  return setter && setter.type !== "undefined";
}

function nodeHasAccessors(item) {
  return nodeHasGetter(item) || nodeHasSetter(item);
}

function nodeSupportsNumericalBucketing(item) {
  // We exclude elements with entries since it's the <entries> node
  // itself that can have buckets.
  return (
    (nodeIsArrayLike(item) && !nodeHasEntries(item)) || nodeIsEntries(item) || nodeIsBucket(item)
  );
}

function nodeHasEntries(item) {
  const value = getValue(item);
  if (!value) {
    return false;
  }

  return (
    value.class === "Map" ||
    value.class === "Set" ||
    value.class === "WeakMap" ||
    value.class === "WeakSet" ||
    value.class === "Storage"
  );
}

function nodeNeedsNumericalBuckets(item) {
  return (
    nodeSupportsNumericalBucketing(item) &&
    getNumericalPropertiesCount(item) > MAX_NUMERICAL_PROPERTIES
  );
}

function makeNodesForPromiseProperties(item) {
  const {
    promiseState: { reason, value, state },
  } = getValue(item);

  const properties = [];

  if (state) {
    properties.push(
      createNode({
        parent: item,
        name: "<state>",
        contents: { value: state },
        type: NODE_TYPES.PROMISE_STATE,
      })
    );
  }

  if (reason) {
    properties.push(
      createNode({
        parent: item,
        name: "<reason>",
        contents: { value: reason },
        type: NODE_TYPES.PROMISE_REASON,
      })
    );
  }

  if (value) {
    properties.push(
      createNode({
        parent: item,
        name: "<value>",
        contents: {
          value: value.getGrip ? value.getGrip() : value,
          front: value.getGrip ? value : null,
        },
        type: NODE_TYPES.PROMISE_VALUE,
      })
    );
  }

  return properties;
}

function makeNodesForProxyProperties(loadedProps, item) {
  const { proxyHandler, proxyTarget } = loadedProps;

  const isProxyHandlerFront = proxyHandler && proxyHandler.getGrip;
  const proxyHandlerGrip = isProxyHandlerFront ? proxyHandler.getGrip() : proxyHandler;
  const proxyHandlerFront = isProxyHandlerFront ? proxyHandler : null;

  const isProxyTargetFront = proxyTarget && proxyTarget.getGrip;
  const proxyTargetGrip = isProxyTargetFront ? proxyTarget.getGrip() : proxyTarget;
  const proxyTargetFront = isProxyTargetFront ? proxyTarget : null;

  return [
    createNode({
      parent: item,
      name: "<target>",
      contents: { value: proxyTargetGrip, front: proxyTargetFront },
      type: NODE_TYPES.PROXY_TARGET,
    }),
    createNode({
      parent: item,
      name: "<handler>",
      contents: { value: proxyHandlerGrip, front: proxyHandlerFront },
      type: NODE_TYPES.PROXY_HANDLER,
    }),
  ];
}

function makeNodesForEntries(item) {
  const nodeName = "<entries>";

  return createNode({
    parent: item,
    name: nodeName,
    contents: null,
    type: NODE_TYPES.ENTRIES,
  });
}

function makeNodesForMapEntry(item) {
  const nodeValue = getValue(item);
  if (!nodeValue || !nodeValue.preview) {
    return [];
  }

  const { key, value } = nodeValue.preview;
  const isKeyFront = key && key.getGrip;
  const keyGrip = isKeyFront ? key.getGrip() : key;
  const keyFront = isKeyFront ? key : null;

  const isValueFront = value && value.getGrip;
  const valueGrip = isValueFront ? value.getGrip() : value;
  const valueFront = isValueFront ? value : null;

  return [
    createNode({
      parent: item,
      name: "<key>",
      contents: { value: keyGrip, front: keyFront },
      type: NODE_TYPES.MAP_ENTRY_KEY,
    }),
    createNode({
      parent: item,
      name: "<value>",
      contents: { value: valueGrip, front: valueFront },
      type: NODE_TYPES.MAP_ENTRY_VALUE,
    }),
  ];
}

function getNodeGetter(item) {
  return undefined;
  //return item && item.contents ? item.contents.get : undefined;
}

function getNodeSetter(item) {
  return undefined;
  //return item && item.contents ? item.contents.set : undefined;
}

function sortProperties(properties) {
  return properties.sort((a, b) => {
    // Sort numbers in ascending order and sort strings lexicographically
    const aInt = parseInt(a, 10);
    const bInt = parseInt(b, 10);

    if (isNaN(aInt) || isNaN(bInt)) {
      return a > b ? 1 : -1;
    }

    return aInt - bInt;
  });
}

function makeNumericalBuckets(parent) {
  const numProperties = getNumericalPropertiesCount(parent);

  // We want to have at most a hundred slices.
  const bucketSize = 10 ** Math.max(2, Math.ceil(Math.log10(numProperties)) - 2);
  const numBuckets = Math.ceil(numProperties / bucketSize);

  const buckets = [];
  for (let i = 1; i <= numBuckets; i++) {
    const minKey = (i - 1) * bucketSize;
    const maxKey = Math.min(i * bucketSize - 1, numProperties - 1);
    const startIndex = nodeIsBucket(parent) ? parent.meta.startIndex : 0;
    const minIndex = startIndex + minKey;
    const maxIndex = startIndex + maxKey;
    const bucketName = `[${minIndex}…${maxIndex}]`;

    buckets.push(
      createNode({
        parent,
        name: bucketName,
        contents: null,
        type: NODE_TYPES.BUCKET,
        meta: {
          startIndex: minIndex,
          endIndex: maxIndex,
        },
      })
    );
  }
  return buckets;
}

function makeDefaultPropsBucket(propertiesNames, parent, ownProperties) {
  const userPropertiesNames = [];
  const defaultProperties = [];

  propertiesNames.forEach(name => {
    if (isDefaultWindowProperty(name)) {
      defaultProperties.push(name);
    } else {
      userPropertiesNames.push(name);
    }
  });

  const nodes = makeNodesForOwnProps(userPropertiesNames, parent, ownProperties);

  if (defaultProperties.length > 0) {
    const defaultPropertiesNode = createNode({
      parent,
      name: "<default properties>",
      contents: null,
      type: NODE_TYPES.DEFAULT_PROPERTIES,
    });

    const defaultNodes = makeNodesForOwnProps(
      defaultProperties,
      defaultPropertiesNode,
      ownProperties
    );
    nodes.push(setNodeChildren(defaultPropertiesNode, defaultNodes));
  }
  return nodes;
}

function makeNodesForOwnProps(propertiesNames, parent, ownProperties) {
  return propertiesNames.map(name => {
    const property = ownProperties[name];

    let propertyValue = property;
    if (property && property.hasOwnProperty("getterValue")) {
      propertyValue = property.getterValue;
    } else if (property && property.hasOwnProperty("value")) {
      propertyValue = property.value;
    }

    // propertyValue can be a front (LongString or Object) or a primitive grip.
    const isFront = propertyValue && propertyValue.getGrip;
    const front = isFront ? propertyValue : null;
    const grip = isFront ? front.getGrip() : propertyValue;

    return createNode({
      parent,
      name: maybeEscapePropertyName(name),
      propertyName: name,
      contents: {
        ...(property || {}),
        value: grip,
        front,
      },
    });
  });
}

function makeNodesForProperties(objProps, parent) {
  const { ownProperties = {}, ownSymbols, prototype, safeGetterValues } = objProps;

  const parentValue = getValue(parent);
  const allProperties = { ...ownProperties, ...safeGetterValues };

  // Ignore properties that are neither non-concrete nor getters/setters.
  const propertiesNames = sortProperties(Object.keys(allProperties)).filter(name => {
    if (!allProperties[name]) {
      return false;
    }

    const properties = Object.getOwnPropertyNames(allProperties[name]);
    return properties.some(property => ["value", "getterValue", "get", "set"].includes(property));
  });

  const isParentNodeWindow = parentValue && parentValue.class == "Window";
  const nodes = isParentNodeWindow
    ? makeDefaultPropsBucket(propertiesNames, parent, allProperties)
    : makeNodesForOwnProps(propertiesNames, parent, allProperties);

  if (Array.isArray(ownSymbols)) {
    ownSymbols.forEach((ownSymbol, index) => {
      const descriptorValue = ownSymbol && ownSymbol.descriptor && ownSymbol.descriptor.value;
      const isFront = descriptorValue && descriptorValue.getGrip;
      const symbolGrip = isFront ? descriptorValue.getGrip() : descriptorValue;
      const symbolFront = isFront ? ownSymbol.descriptor.value : null;

      nodes.push(
        createNode({
          parent,
          name: ownSymbol.name,
          path: `symbol-${index}`,
          contents: symbolGrip
            ? {
                value: symbolGrip,
                front: symbolFront,
              }
            : null,
        })
      );
    }, this);
  }

  if (nodeIsPromise(parent)) {
    nodes.push(...makeNodesForPromiseProperties(parent));
  }

  if (nodeHasEntries(parent)) {
    nodes.push(makeNodesForEntries(parent));
  }

  // Add accessor nodes if needed
  const defaultPropertiesNode = isParentNodeWindow
    ? nodes.find(node => nodeIsDefaultProperties(node))
    : null;

  for (const name of propertiesNames) {
    const property = allProperties[name];
    const isDefaultProperty =
      isParentNodeWindow && defaultPropertiesNode && isDefaultWindowProperty(name);
    const parentNode = isDefaultProperty ? defaultPropertiesNode : parent;
    const parentContentsArray =
      isDefaultProperty && defaultPropertiesNode ? defaultPropertiesNode.contents : nodes;

    if (property.get && property.get.type !== "undefined") {
      parentContentsArray.push(
        createGetterNode({
          parent: parentNode,
          property,
          name,
        })
      );
    }

    if (property.set && property.set.type !== "undefined") {
      parentContentsArray.push(
        createSetterNode({
          parent: parentNode,
          property,
          name,
        })
      );
    }
  }

  // Add the prototype if it exists and is not null
  if (prototype && prototype.type !== "null") {
    nodes.push(makeNodeForPrototype(objProps, parent));
  }

  return nodes;
}

function setNodeFullText(loadedProps, node) {
  if (nodeHasFullText(node) || !nodeIsLongString(node)) {
    return node;
  }

  const { fullText } = loadedProps;
  if (nodeHasValue(node)) {
    node.contents.value.fullText = fullText;
  } else if (nodeHasGetterValue(node)) {
    node.contents.getterValue.fullText = fullText;
  }

  return node;
}

function makeNodeForPrototype(objProps, parent) {
  const { prototype } = objProps || {};

  // Add the prototype if it exists and is not null
  if (prototype && prototype.type !== "null") {
    return createNode({
      parent,
      name: "<prototype>",
      contents: {
        value: prototype.getGrip ? prototype.getGrip() : prototype,
        front: prototype.getGrip ? prototype : null,
      },
      type: NODE_TYPES.PROTOTYPE,
    });
  }

  return null;
}

function createNode(options) {
  const { parent, name, propertyName, path, contents, type = NODE_TYPES.GRIP, meta } = options;

  if (contents === undefined) {
    return null;
  }

  // The path is important to uniquely identify the item in the entire
  // tree. This helps debugging & optimizes React's rendering of large
  // lists. The path will be separated by property name.

  return {
    parent,
    name,
    // `name` can be escaped; propertyName contains the original property name.
    propertyName,
    path: createPath(parent && parent.path, path || name),
    contents,
    type,
    meta,
  };
}

function createGetterNode({ parent, property, name }) {
  const isFront = property.get && property.get.getGrip;
  const grip = isFront ? property.get.getGrip() : property.get;
  const front = isFront ? property.get : null;

  return createNode({
    parent,
    name: `<get ${name}()>`,
    contents: { value: grip, front },
    type: NODE_TYPES.GET,
  });
}

function createSetterNode({ parent, property, name }) {
  const isFront = property.set && property.set.getGrip;
  const grip = isFront ? property.set.getGrip() : property.set;
  const front = isFront ? property.set : null;

  return createNode({
    parent,
    name: `<set ${name}()>`,
    contents: { value: grip, front },
    type: NODE_TYPES.SET,
  });
}

function setNodeChildren(node, children) {
  node.contents = children;
  return node;
}

function needsToLoad(item) {
  const value = getValue(item);
  return value.isObject() && !value._elements && value.hasPreviewOverflow();
}

function needsToLoadChildren(item) {
  if (needsToLoad(item)) {
    return true;
  }
  const children = getValue(item).getChildren();
  return children.some(child => needsToLoad(child));
}

function getChildren(options) {
  const { item } = options;

  const children = getValue(item)
    .getChildren()
    .map(child => {
      const { name, contents } = child;
      return {
        name,
        contents,
        path: `${item.path}/${name}`,
        childrenLoaded: !needsToLoadChildren(child),
      };
    });

  return children;
}

// Builds an expression that resolves to the value of the item in question
// e.g. `b` in { a: { b: 2 } } resolves to `a.b`
function getPathExpression(item) {
  if (item && item.parent) {
    const parent = nodeIsBucket(item.parent) ? item.parent.parent : item.parent;
    return `${getPathExpression(parent)}.${item.name}`;
  }

  return item.name;
}

function getParent(item) {
  return item.parent;
}

function getNumericalPropertiesCount(item) {
  if (nodeIsBucket(item)) {
    return item.meta.endIndex - item.meta.startIndex + 1;
  }

  const value = getValue(getClosestGripNode(item));
  if (!value) {
    return 0;
  }

  if (GripArrayRep.supportsObject(value)) {
    return GripArrayRep.getLength(value);
  }

  if (GripMap.supportsObject(value)) {
    return GripMap.getLength(value);
  }

  // TODO: We can also have numerical properties on Objects, but at the
  // moment we don't have a way to distinguish them from non-indexed properties,
  // as they are all computed in a ownPropertiesLength property.

  return 0;
}

function getClosestGripNode(item) {
  const type = getType(item);
  if (
    type !== NODE_TYPES.BUCKET &&
    type !== NODE_TYPES.DEFAULT_PROPERTIES &&
    type !== NODE_TYPES.ENTRIES
  ) {
    return item;
  }

  const parent = getParent(item);
  if (!parent) {
    return null;
  }

  return getClosestGripNode(parent);
}

function getClosestNonBucketNode(item) {
  const type = getType(item);

  if (type !== NODE_TYPES.BUCKET) {
    return item;
  }

  const parent = getParent(item);
  if (!parent) {
    return null;
  }

  return getClosestNonBucketNode(parent);
}

function getParentGripNode(item) {
  const parentNode = getParent(item);
  if (!parentNode) {
    return null;
  }

  return getClosestGripNode(parentNode);
}

function getParentGripValue(item) {
  const parentGripNode = getParentGripNode(item);
  if (!parentGripNode) {
    return null;
  }

  return getValue(parentGripNode);
}

function getParentFront(item) {
  const parentGripNode = getParentGripNode(item);
  if (!parentGripNode) {
    return null;
  }

  return getFront(parentGripNode);
}

function getNonPrototypeParentGripValue(item) {
  const parentGripNode = getParentGripNode(item);
  if (!parentGripNode) {
    return null;
  }

  if (getType(parentGripNode) === NODE_TYPES.PROTOTYPE) {
    return getNonPrototypeParentGripValue(parentGripNode);
  }

  return getValue(parentGripNode);
}

function createPath(parentPath, path) {
  return parentPath ? `${parentPath}◦${path}` : path;
}

module.exports = {
  createNode,
  createGetterNode,
  createSetterNode,
  getActor,
  needsToLoad,
  needsToLoadChildren,
  getChildren,
  getClosestGripNode,
  getClosestNonBucketNode,
  getFront,
  getPathExpression,
  getParent,
  getParentFront,
  getParentGripValue,
  getNonPrototypeParentGripValue,
  getNumericalPropertiesCount,
  getValue,
  makeNodesForEntries,
  makeNodesForPromiseProperties,
  makeNodesForProperties,
  makeNumericalBuckets,
  nodeHasAccessors,
  nodeHasChildren,
  nodeHasEntries,
  nodeHasProperties,
  nodeHasGetter,
  nodeHasSetter,
  nodeIsBlock,
  nodeIsBucket,
  nodeIsDefaultProperties,
  nodeIsEntries,
  nodeIsError,
  nodeIsLongString,
  nodeHasFullText,
  nodeIsFunction,
  nodeIsGetter,
  nodeIsMapEntry,
  nodeIsMissingArguments,
  nodeIsObject,
  nodeIsOptimizedOut,
  nodeIsPrimitive,
  nodeIsPromise,
  nodeIsPrototype,
  nodeIsProxy,
  nodeIsSetter,
  nodeIsUninitializedBinding,
  nodeIsUnmappedBinding,
  nodeIsUnscopedBinding,
  nodeIsWindow,
  nodeNeedsNumericalBuckets,
  nodeSupportsNumericalBucketing,
  setNodeChildren,
  sortProperties,
  NODE_TYPES,
};
