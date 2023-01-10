/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 20);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

  "use strict";
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "e", function() { return ElementTypeClass; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "f", function() { return ElementTypeContext; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "h", function() { return ElementTypeFunction; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "g", function() { return ElementTypeForwardRef; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "i", function() { return ElementTypeHostComponent; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "j", function() { return ElementTypeMemo; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "k", function() { return ElementTypeOtherOrUnknown; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "l", function() { return ElementTypeProfiler; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "m", function() { return ElementTypeRoot; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "n", function() { return ElementTypeSuspense; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "o", function() { return ElementTypeSuspenseList; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "p", function() { return ElementTypeTracingMarker; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return ComponentFilterElementType; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ComponentFilterDisplayName; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return ComponentFilterLocation; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return ComponentFilterHOC; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "q", function() { return StrictMode; });
  /**
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  // WARNING
  // The values below are referenced by ComponentFilters (which are saved via localStorage).
  // Do not change them or it will break previously saved user customizations.
  // If new element types are added, use new numbers rather than re-ordering existing ones.
  //
  // Changing these types is also a backwards breaking change for the standalone shell,
  // since the frontend and backend must share the same values-
  // and the backend is embedded in certain environments (like React Native).
  const ElementTypeClass = 1;
  const ElementTypeContext = 2;
  const ElementTypeFunction = 5;
  const ElementTypeForwardRef = 6;
  const ElementTypeHostComponent = 7;
  const ElementTypeMemo = 8;
  const ElementTypeOtherOrUnknown = 9;
  const ElementTypeProfiler = 10;
  const ElementTypeRoot = 11;
  const ElementTypeSuspense = 12;
  const ElementTypeSuspenseList = 13;
  const ElementTypeTracingMarker = 14; // Different types of elements displayed in the Elements tree.
  // These types may be used to visually distinguish types,
  // or to enable/disable certain functionality.
  
  // WARNING
  // The values below are referenced by ComponentFilters (which are saved via localStorage).
  // Do not change them or it will break previously saved user customizations.
  // If new filter types are added, use new numbers rather than re-ordering existing ones.
  const ComponentFilterElementType = 1;
  const ComponentFilterDisplayName = 2;
  const ComponentFilterLocation = 3;
  const ComponentFilterHOC = 4;
  const StrictMode = 1;
  
  /***/ }),
  /* 1 */
  /***/ (function(module, __webpack_exports__, __webpack_require__) {
  
  "use strict";
  /* WEBPACK VAR INJECTION */(function(process) {/* unused harmony export alphaSortKeys */
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "e", function() { return getAllEnumerableKeys; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "l", function() { return getWrappedDisplayName; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "h", function() { return getDisplayName; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "k", function() { return getUID; });
  /* unused harmony export utfDecodeString */
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "p", function() { return utfEncodeString; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "m", function() { return printOperationsArray; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "g", function() { return getDefaultComponentFilters; });
  /* unused harmony export getSavedComponentFilters */
  /* unused harmony export setSavedComponentFilters */
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return castBool; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return castBrowserTheme; });
  /* unused harmony export getAppendComponentStack */
  /* unused harmony export getBreakOnConsoleErrors */
  /* unused harmony export getHideConsoleLogsInStrictMode */
  /* unused harmony export getShowInlineWarningsAndErrors */
  /* unused harmony export getDefaultOpenInEditorURL */
  /* unused harmony export getOpenInEditorURL */
  /* unused harmony export separateDisplayNameAndHOCs */
  /* unused harmony export shallowDiffers */
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "j", function() { return getInObject; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return deletePathInObject; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "n", function() { return renamePathInObject; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "o", function() { return setInObject; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "f", function() { return getDataType; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "i", function() { return getDisplayNameForReactElement; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return formatDataForPreview; });
  /* harmony import */ var lru_cache__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(18);
  /* harmony import */ var lru_cache__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lru_cache__WEBPACK_IMPORTED_MODULE_0__);
  /* harmony import */ var react_is__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6);
  /* harmony import */ var react_is__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_is__WEBPACK_IMPORTED_MODULE_1__);
  /* harmony import */ var shared_ReactSymbols__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(16);
  /* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(3);
  /* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(0);
  /* harmony import */ var _hydration__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(8);
  /* harmony import */ var _isArray__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(5);
  /**
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  
  
  
  
  
  
  
  
  // $FlowFixMe[method-unbinding]
  const hasOwnProperty = Object.prototype.hasOwnProperty;
  const cachedDisplayNames = new WeakMap(); // On large trees, encoding takes significant time.
  // Try to reuse the already encoded strings.
  
  const encodedStringCache = new lru_cache__WEBPACK_IMPORTED_MODULE_0___default.a({
    max: 1000
  });
  function alphaSortKeys(a, b) {
    if (a.toString() > b.toString()) {
      return 1;
    } else if (b.toString() > a.toString()) {
      return -1;
    } else {
      return 0;
    }
  }
  function getAllEnumerableKeys(obj) {
    const keys = new Set();
    let current = obj;
  
    while (current != null) {
      const currentKeys = [...Object.keys(current), ...Object.getOwnPropertySymbols(current)];
      const descriptors = Object.getOwnPropertyDescriptors(current);
      currentKeys.forEach(key => {
        // $FlowFixMe: key can be a Symbol https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/getOwnPropertyDescriptor
        if (descriptors[key].enumerable) {
          keys.add(key);
        }
      });
      current = Object.getPrototypeOf(current);
    }
  
    return keys;
  } // Mirror https://github.com/facebook/react/blob/7c21bf72ace77094fd1910cc350a548287ef8350/packages/shared/getComponentName.js#L27-L37
  
  function getWrappedDisplayName(outerType, innerType, wrapperName, fallbackName) {
    const displayName = outerType.displayName;
    return displayName || `${wrapperName}(${getDisplayName(innerType, fallbackName)})`;
  }
  function getDisplayName(type, fallbackName = 'Anonymous') {
    const nameFromCache = cachedDisplayNames.get(type);
  
    if (nameFromCache != null) {
      return nameFromCache;
    }
  
    let displayName = fallbackName; // The displayName property is not guaranteed to be a string.
    // It's only safe to use for our purposes if it's a string.
    // github.com/facebook/react-devtools/issues/803
  
    if (typeof type.displayName === 'string') {
      displayName = type.displayName;
    } else if (typeof type.name === 'string' && type.name !== '') {
      displayName = type.name;
    }
  
    cachedDisplayNames.set(type, displayName);
    return displayName;
  }
  let uidCounter = 0;
  function getUID() {
    return ++uidCounter;
  }
  function utfDecodeString(array) {
    // Avoid spreading the array (e.g. String.fromCodePoint(...array))
    // Functions arguments are first placed on the stack before the function is called
    // which throws a RangeError for large arrays.
    // See github.com/facebook/react/issues/22293
    let string = '';
  
    for (let i = 0; i < array.length; i++) {
      const char = array[i];
      string += String.fromCodePoint(char);
    }
  
    return string;
  }
  
  function surrogatePairToCodePoint(charCode1, charCode2) {
    return ((charCode1 & 0x3ff) << 10) + (charCode2 & 0x3ff) + 0x10000;
  } // Credit for this encoding approach goes to Tim Down:
  // https://stackoverflow.com/questions/4877326/how-can-i-tell-if-a-string-contains-multibyte-characters-in-javascript
  
  
  function utfEncodeString(string) {
    const cached = encodedStringCache.get(string);
  
    if (cached !== undefined) {
      return cached;
    }
  
    const encoded = [];
    let i = 0;
    let charCode;
  
    while (i < string.length) {
      charCode = string.charCodeAt(i); // Handle multibyte unicode characters (like emoji).
  
      if ((charCode & 0xf800) === 0xd800) {
        encoded.push(surrogatePairToCodePoint(charCode, string.charCodeAt(++i)));
      } else {
        encoded.push(charCode);
      }
  
      ++i;
    }
  
    encodedStringCache.set(string, encoded);
    return encoded;
  }
  function printOperationsArray(operations) {
    // The first two values are always rendererID and rootID
    const rendererID = operations[0];
    const rootID = operations[1];
    const logs = [`operations for renderer:${rendererID} and root:${rootID}`];
    let i = 2; // Reassemble the string table.
  
    const stringTable = [null // ID = 0 corresponds to the null string.
    ];
    const stringTableSize = operations[i++];
    const stringTableEnd = i + stringTableSize;
  
    while (i < stringTableEnd) {
      const nextLength = operations[i++];
      const nextString = utfDecodeString(operations.slice(i, i + nextLength));
      stringTable.push(nextString);
      i += nextLength;
    }
  
    while (i < operations.length) {
      const operation = operations[i];
  
      switch (operation) {
        case _constants__WEBPACK_IMPORTED_MODULE_3__[/* TREE_OPERATION_ADD */ "c"]:
          {
            const id = operations[i + 1];
            const type = operations[i + 2];
            i += 3;
  
            if (type === _types__WEBPACK_IMPORTED_MODULE_4__[/* ElementTypeRoot */ "m"]) {
              logs.push(`Add new root node ${id}`);
              i++; // isStrictModeCompliant
  
              i++; // supportsProfiling
  
              i++; // supportsStrictMode
  
              i++; // hasOwnerMetadata
            } else {
              const parentID = operations[i];
              i++;
              i++; // ownerID
  
              const displayNameStringID = operations[i];
              const displayName = stringTable[displayNameStringID];
              i++;
              i++; // key
  
              logs.push(`Add node ${id} (${displayName || 'null'}) as child of ${parentID}`);
            }
  
            break;
          }
  
        case _constants__WEBPACK_IMPORTED_MODULE_3__[/* TREE_OPERATION_REMOVE */ "d"]:
          {
            const removeLength = operations[i + 1];
            i += 2;
  
            for (let removeIndex = 0; removeIndex < removeLength; removeIndex++) {
              const id = operations[i];
              i += 1;
              logs.push(`Remove node ${id}`);
            }
  
            break;
          }
  
        case _constants__WEBPACK_IMPORTED_MODULE_3__[/* TREE_OPERATION_REMOVE_ROOT */ "e"]:
          {
            i += 1;
            logs.push(`Remove root ${rootID}`);
            break;
          }
  
        case _constants__WEBPACK_IMPORTED_MODULE_3__[/* TREE_OPERATION_SET_SUBTREE_MODE */ "g"]:
          {
            const id = operations[i + 1];
            const mode = operations[i + 1];
            i += 3;
            logs.push(`Mode ${mode} set for subtree with root ${id}`);
            break;
          }
  
        case _constants__WEBPACK_IMPORTED_MODULE_3__[/* TREE_OPERATION_REORDER_CHILDREN */ "f"]:
          {
            const id = operations[i + 1];
            const numChildren = operations[i + 2];
            i += 3;
            const children = operations.slice(i, i + numChildren);
            i += numChildren;
            logs.push(`Re-order node ${id} children ${children.join(',')}`);
            break;
          }
  
        case _constants__WEBPACK_IMPORTED_MODULE_3__[/* TREE_OPERATION_UPDATE_TREE_BASE_DURATION */ "i"]:
          // Base duration updates are only sent while profiling is in progress.
          // We can ignore them at this point.
          // The profiler UI uses them lazily in order to generate the tree.
          i += 3;
          break;
  
        case _constants__WEBPACK_IMPORTED_MODULE_3__[/* TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS */ "h"]:
          const id = operations[i + 1];
          const numErrors = operations[i + 2];
          const numWarnings = operations[i + 3];
          i += 4;
          logs.push(`Node ${id} has ${numErrors} errors and ${numWarnings} warnings`);
          break;
  
        default:
          throw Error(`Unsupported Bridge operation "${operation}"`);
      }
    }
  
    console.log(logs.join('\n  '));
  }
  function getDefaultComponentFilters() {
    return [{
      type: _types__WEBPACK_IMPORTED_MODULE_4__[/* ComponentFilterElementType */ "b"],
      value: _types__WEBPACK_IMPORTED_MODULE_4__[/* ElementTypeHostComponent */ "i"],
      isEnabled: true
    }];
  }
  function getSavedComponentFilters() {
    return getDefaultComponentFilters();
  }
  function setSavedComponentFilters(componentFilters) {}
  
  function parseBool(s) {
    if (s === 'true') {
      return true;
    }
  
    if (s === 'false') {
      return false;
    }
  }
  
  function castBool(v) {
    if (v === true || v === false) {
      return v;
    }
  }
  function castBrowserTheme(v) {
    if (v === 'light' || v === 'dark' || v === 'auto') {
      return v;
    }
  }
  function getAppendComponentStack() {
    return true;
  }
  function getBreakOnConsoleErrors() {
    return false;
  }
  function getHideConsoleLogsInStrictMode() {
    return false;
  }
  function getShowInlineWarningsAndErrors() {
    return true;
  }
  function getDefaultOpenInEditorURL() {
    return typeof process.env.EDITOR_URL === 'string' ? process.env.EDITOR_URL : '';
  }
  function getOpenInEditorURL() {
    return getDefaultOpenInEditorURL();
  }
  function separateDisplayNameAndHOCs(displayName, type) {
    if (displayName === null) {
      return [null, null];
    }
  
    let hocDisplayNames = null;
  
    switch (type) {
      case _types__WEBPACK_IMPORTED_MODULE_4__[/* ElementTypeClass */ "e"]:
      case _types__WEBPACK_IMPORTED_MODULE_4__[/* ElementTypeForwardRef */ "g"]:
      case _types__WEBPACK_IMPORTED_MODULE_4__[/* ElementTypeFunction */ "h"]:
      case _types__WEBPACK_IMPORTED_MODULE_4__[/* ElementTypeMemo */ "j"]:
        if (displayName.indexOf('(') >= 0) {
          const matches = displayName.match(/[^()]+/g);
  
          if (matches != null) {
            displayName = matches.pop();
            hocDisplayNames = matches;
          }
        }
  
        break;
  
      default:
        break;
    }
  
    return [displayName, hocDisplayNames];
  } // Pulled from react-compat
  // https://github.com/developit/preact-compat/blob/7c5de00e7c85e2ffd011bf3af02899b63f699d3a/src/index.js#L349
  
  function shallowDiffers(prev, next) {
    for (const attribute in prev) {
      if (!(attribute in next)) {
        return true;
      }
    }
  
    for (const attribute in next) {
      if (prev[attribute] !== next[attribute]) {
        return true;
      }
    }
  
    return false;
  }
  function getInObject(object, path) {
    return path.reduce((reduced, attr) => {
      if (reduced) {
        if (hasOwnProperty.call(reduced, attr)) {
          return reduced[attr];
        }
  
        if (typeof reduced[Symbol.iterator] === 'function') {
          // Convert iterable to array and return array[index]
          //
          // TRICKY
          // Don't use [...spread] syntax for this purpose.
          // This project uses @babel/plugin-transform-spread in "loose" mode which only works with Array values.
          // Other types (e.g. typed arrays, Sets) will not spread correctly.
          return Array.from(reduced)[attr];
        }
      }
  
      return null;
    }, object);
  }
  function deletePathInObject(object, path) {
    const length = path.length;
    const last = path[length - 1];
  
    if (object != null) {
      const parent = getInObject(object, path.slice(0, length - 1));
  
      if (parent) {
        if (Object(_isArray__WEBPACK_IMPORTED_MODULE_6__[/* default */ "a"])(parent)) {
          parent.splice(last, 1);
        } else {
          delete parent[last];
        }
      }
    }
  }
  function renamePathInObject(object, oldPath, newPath) {
    const length = oldPath.length;
  
    if (object != null) {
      const parent = getInObject(object, oldPath.slice(0, length - 1));
  
      if (parent) {
        const lastOld = oldPath[length - 1];
        const lastNew = newPath[length - 1];
        parent[lastNew] = parent[lastOld];
  
        if (Object(_isArray__WEBPACK_IMPORTED_MODULE_6__[/* default */ "a"])(parent)) {
          parent.splice(lastOld, 1);
        } else {
          delete parent[lastOld];
        }
      }
    }
  }
  function setInObject(object, path, value) {
    const length = path.length;
    const last = path[length - 1];
  
    if (object != null) {
      const parent = getInObject(object, path.slice(0, length - 1));
  
      if (parent) {
        parent[last] = value;
      }
    }
  }
  
  /**
   * Get a enhanced/artificial type string based on the object instance
   */
  function getDataType(data) {
    if (data === null) {
      return 'null';
    } else if (data === undefined) {
      return 'undefined';
    }
  
    if (Object(react_is__WEBPACK_IMPORTED_MODULE_1__["isElement"])(data)) {
      return 'react_element';
    }
  
    if (typeof HTMLElement !== 'undefined' && data instanceof HTMLElement) {
      return 'html_element';
    }
  
    const type = typeof data;
  
    switch (type) {
      case 'bigint':
        return 'bigint';
  
      case 'boolean':
        return 'boolean';
  
      case 'function':
        return 'function';
  
      case 'number':
        if (Number.isNaN(data)) {
          return 'nan';
        } else if (!Number.isFinite(data)) {
          return 'infinity';
        } else {
          return 'number';
        }
  
      case 'object':
        if (Object(_isArray__WEBPACK_IMPORTED_MODULE_6__[/* default */ "a"])(data)) {
          return 'array';
        } else if (ArrayBuffer.isView(data)) {
          return hasOwnProperty.call(data.constructor, 'BYTES_PER_ELEMENT') ? 'typed_array' : 'data_view';
        } else if (data.constructor && data.constructor.name === 'ArrayBuffer') {
          // HACK This ArrayBuffer check is gross; is there a better way?
          // We could try to create a new DataView with the value.
          // If it doesn't error, we know it's an ArrayBuffer,
          // but this seems kind of awkward and expensive.
          return 'array_buffer';
        } else if (typeof data[Symbol.iterator] === 'function') {
          const iterator = data[Symbol.iterator]();
  
          if (!iterator) {// Proxies might break assumptoins about iterators.
            // See github.com/facebook/react/issues/21654
          } else {
            return iterator === data ? 'opaque_iterator' : 'iterator';
          }
        } else if (data.constructor && data.constructor.name === 'RegExp') {
          return 'regexp';
        } else {
          // $FlowFixMe[method-unbinding]
          const toStringValue = Object.prototype.toString.call(data);
  
          if (toStringValue === '[object Date]') {
            return 'date';
          } else if (toStringValue === '[object HTMLAllCollection]') {
            return 'html_all_collection';
          }
        }
  
        return 'object';
  
      case 'string':
        return 'string';
  
      case 'symbol':
        return 'symbol';
  
      case 'undefined':
        if ( // $FlowFixMe[method-unbinding]
        Object.prototype.toString.call(data) === '[object HTMLAllCollection]') {
          return 'html_all_collection';
        }
  
        return 'undefined';
  
      default:
        return 'unknown';
    }
  }
  function getDisplayNameForReactElement(element) {
    const elementType = Object(react_is__WEBPACK_IMPORTED_MODULE_1__["typeOf"])(element);
  
    switch (elementType) {
      case react_is__WEBPACK_IMPORTED_MODULE_1__["ContextConsumer"]:
        return 'ContextConsumer';
  
      case react_is__WEBPACK_IMPORTED_MODULE_1__["ContextProvider"]:
        return 'ContextProvider';
  
      case react_is__WEBPACK_IMPORTED_MODULE_1__["ForwardRef"]:
        return 'ForwardRef';
  
      case react_is__WEBPACK_IMPORTED_MODULE_1__["Fragment"]:
        return 'Fragment';
  
      case react_is__WEBPACK_IMPORTED_MODULE_1__["Lazy"]:
        return 'Lazy';
  
      case react_is__WEBPACK_IMPORTED_MODULE_1__["Memo"]:
        return 'Memo';
  
      case react_is__WEBPACK_IMPORTED_MODULE_1__["Portal"]:
        return 'Portal';
  
      case react_is__WEBPACK_IMPORTED_MODULE_1__["Profiler"]:
        return 'Profiler';
  
      case react_is__WEBPACK_IMPORTED_MODULE_1__["StrictMode"]:
        return 'StrictMode';
  
      case react_is__WEBPACK_IMPORTED_MODULE_1__["Suspense"]:
        return 'Suspense';
  
      case shared_ReactSymbols__WEBPACK_IMPORTED_MODULE_2__[/* REACT_SUSPENSE_LIST_TYPE */ "a"]:
        return 'SuspenseList';
  
      case shared_ReactSymbols__WEBPACK_IMPORTED_MODULE_2__[/* REACT_TRACING_MARKER_TYPE */ "b"]:
        return 'TracingMarker';
  
      default:
        const {
          type
        } = element;
  
        if (typeof type === 'string') {
          return type;
        } else if (typeof type === 'function') {
          return getDisplayName(type, 'Anonymous');
        } else if (type != null) {
          return 'NotImplementedInDevtools';
        } else {
          return 'Element';
        }
  
    }
  }
  const MAX_PREVIEW_STRING_LENGTH = 50;
  
  function truncateForDisplay(string, length = MAX_PREVIEW_STRING_LENGTH) {
    if (string.length > length) {
      return string.substr(0, length) + '…';
    } else {
      return string;
    }
  } // Attempts to mimic Chrome's inline preview for values.
  // For example, the following value...
  //   {
  //      foo: 123,
  //      bar: "abc",
  //      baz: [true, false],
  //      qux: { ab: 1, cd: 2 }
  //   };
  //
  // Would show a preview of...
  //   {foo: 123, bar: "abc", baz: Array(2), qux: {…}}
  //
  // And the following value...
  //   [
  //     123,
  //     "abc",
  //     [true, false],
  //     { foo: 123, bar: "abc" }
  //   ];
  //
  // Would show a preview of...
  //   [123, "abc", Array(2), {…}]
  
  
  function formatDataForPreview(data, showFormattedValue) {
    if (data != null && hasOwnProperty.call(data, _hydration__WEBPACK_IMPORTED_MODULE_5__[/* meta */ "b"].type)) {
      return showFormattedValue ? data[_hydration__WEBPACK_IMPORTED_MODULE_5__[/* meta */ "b"].preview_long] : data[_hydration__WEBPACK_IMPORTED_MODULE_5__[/* meta */ "b"].preview_short];
    }
  
    const type = getDataType(data);
  
    switch (type) {
      case 'html_element':
        return `<${truncateForDisplay(data.tagName.toLowerCase())} />`;
  
      case 'function':
        return truncateForDisplay(`ƒ ${typeof data.name === 'function' ? '' : data.name}() {}`);
  
      case 'string':
        return `"${data}"`;
  
      case 'bigint':
        return truncateForDisplay(data.toString() + 'n');
  
      case 'regexp':
        return truncateForDisplay(data.toString());
  
      case 'symbol':
        return truncateForDisplay(data.toString());
  
      case 'react_element':
        return `<${truncateForDisplay(getDisplayNameForReactElement(data) || 'Unknown')} />`;
  
      case 'array_buffer':
        return `ArrayBuffer(${data.byteLength})`;
  
      case 'data_view':
        return `DataView(${data.buffer.byteLength})`;
  
      case 'array':
        if (showFormattedValue) {
          let formatted = '';
  
          for (let i = 0; i < data.length; i++) {
            if (i > 0) {
              formatted += ', ';
            }
  
            formatted += formatDataForPreview(data[i], false);
  
            if (formatted.length > MAX_PREVIEW_STRING_LENGTH) {
              // Prevent doing a lot of unnecessary iteration...
              break;
            }
          }
  
          return `[${truncateForDisplay(formatted)}]`;
        } else {
          const length = hasOwnProperty.call(data, _hydration__WEBPACK_IMPORTED_MODULE_5__[/* meta */ "b"].size) ? data[_hydration__WEBPACK_IMPORTED_MODULE_5__[/* meta */ "b"].size] : data.length;
          return `Array(${length})`;
        }
  
      case 'typed_array':
        const shortName = `${data.constructor.name}(${data.length})`;
  
        if (showFormattedValue) {
          let formatted = '';
  
          for (let i = 0; i < data.length; i++) {
            if (i > 0) {
              formatted += ', ';
            }
  
            formatted += data[i];
  
            if (formatted.length > MAX_PREVIEW_STRING_LENGTH) {
              // Prevent doing a lot of unnecessary iteration...
              break;
            }
          }
  
          return `${shortName} [${truncateForDisplay(formatted)}]`;
        } else {
          return shortName;
        }
  
      case 'iterator':
        const name = data.constructor.name;
  
        if (showFormattedValue) {
          // TRICKY
          // Don't use [...spread] syntax for this purpose.
          // This project uses @babel/plugin-transform-spread in "loose" mode which only works with Array values.
          // Other types (e.g. typed arrays, Sets) will not spread correctly.
          const array = Array.from(data);
          let formatted = '';
  
          for (let i = 0; i < array.length; i++) {
            const entryOrEntries = array[i];
  
            if (i > 0) {
              formatted += ', ';
            } // TRICKY
            // Browsers display Maps and Sets differently.
            // To mimic their behavior, detect if we've been given an entries tuple.
            //   Map(2) {"abc" => 123, "def" => 123}
            //   Set(2) {"abc", 123}
  
  
            if (Object(_isArray__WEBPACK_IMPORTED_MODULE_6__[/* default */ "a"])(entryOrEntries)) {
              const key = formatDataForPreview(entryOrEntries[0], true);
              const value = formatDataForPreview(entryOrEntries[1], false);
              formatted += `${key} => ${value}`;
            } else {
              formatted += formatDataForPreview(entryOrEntries, false);
            }
  
            if (formatted.length > MAX_PREVIEW_STRING_LENGTH) {
              // Prevent doing a lot of unnecessary iteration...
              break;
            }
          }
  
          return `${name}(${data.size}) {${truncateForDisplay(formatted)}}`;
        } else {
          return `${name}(${data.size})`;
        }
  
      case 'opaque_iterator':
        {
          return data[Symbol.toStringTag];
        }
  
      case 'date':
        return data.toString();
  
      case 'object':
        if (showFormattedValue) {
          const keys = Array.from(getAllEnumerableKeys(data)).sort(alphaSortKeys);
          let formatted = '';
  
          for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
  
            if (i > 0) {
              formatted += ', ';
            }
  
            formatted += `${key.toString()}: ${formatDataForPreview(data[key], false)}`;
  
            if (formatted.length > MAX_PREVIEW_STRING_LENGTH) {
              // Prevent doing a lot of unnecessary iteration...
              break;
            }
          }
  
          return `{${truncateForDisplay(formatted)}}`;
        } else {
          return '{…}';
        }
  
      case 'boolean':
      case 'number':
      case 'infinity':
      case 'nan':
      case 'null':
      case 'undefined':
        return data;
  
      default:
        try {
          return truncateForDisplay(String(data));
        } catch (error) {
          return 'unserializable';
        }
  
    }
  }
  /* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(22)))
  
  /***/ }),
  /* 2 */
  /***/ (function(module, __webpack_exports__, __webpack_require__) {
  
  "use strict";
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return CONCURRENT_MODE_NUMBER; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return CONCURRENT_MODE_SYMBOL_STRING; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return CONTEXT_NUMBER; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return CONTEXT_SYMBOL_STRING; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "r", function() { return SERVER_CONTEXT_SYMBOL_STRING; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "e", function() { return DEPRECATED_ASYNC_MODE_SYMBOL_STRING; });
  /* unused harmony export ELEMENT_NUMBER */
  /* unused harmony export ELEMENT_SYMBOL_STRING */
  /* unused harmony export DEBUG_TRACING_MODE_NUMBER */
  /* unused harmony export DEBUG_TRACING_MODE_SYMBOL_STRING */
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "f", function() { return FORWARD_REF_NUMBER; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "g", function() { return FORWARD_REF_SYMBOL_STRING; });
  /* unused harmony export FRAGMENT_NUMBER */
  /* unused harmony export FRAGMENT_SYMBOL_STRING */
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "h", function() { return LAZY_NUMBER; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "i", function() { return LAZY_SYMBOL_STRING; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "j", function() { return MEMO_NUMBER; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "k", function() { return MEMO_SYMBOL_STRING; });
  /* unused harmony export PORTAL_NUMBER */
  /* unused harmony export PORTAL_SYMBOL_STRING */
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "l", function() { return PROFILER_NUMBER; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "m", function() { return PROFILER_SYMBOL_STRING; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "n", function() { return PROVIDER_NUMBER; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "o", function() { return PROVIDER_SYMBOL_STRING; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "p", function() { return SCOPE_NUMBER; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "q", function() { return SCOPE_SYMBOL_STRING; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "s", function() { return STRICT_MODE_NUMBER; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "t", function() { return STRICT_MODE_SYMBOL_STRING; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "w", function() { return SUSPENSE_NUMBER; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "x", function() { return SUSPENSE_SYMBOL_STRING; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "u", function() { return SUSPENSE_LIST_NUMBER; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "v", function() { return SUSPENSE_LIST_SYMBOL_STRING; });
  /* unused harmony export SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED_SYMBOL_STRING */
  /**
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  // This list should be kept updated to reflect additions to 'shared/ReactSymbols'.
  // DevTools can't import symbols from 'shared/ReactSymbols' directly for two reasons:
  // 1. DevTools requires symbols which may have been deleted in more recent versions (e.g. concurrent mode)
  // 2. DevTools must support both Symbol and numeric forms of each symbol;
  //    Since e.g. standalone DevTools runs in a separate process, it can't rely on its own ES capabilities.
  const CONCURRENT_MODE_NUMBER = 0xeacf;
  const CONCURRENT_MODE_SYMBOL_STRING = 'Symbol(react.concurrent_mode)';
  const CONTEXT_NUMBER = 0xeace;
  const CONTEXT_SYMBOL_STRING = 'Symbol(react.context)';
  const SERVER_CONTEXT_SYMBOL_STRING = 'Symbol(react.server_context)';
  const DEPRECATED_ASYNC_MODE_SYMBOL_STRING = 'Symbol(react.async_mode)';
  const ELEMENT_NUMBER = 0xeac7;
  const ELEMENT_SYMBOL_STRING = 'Symbol(react.element)';
  const DEBUG_TRACING_MODE_NUMBER = 0xeae1;
  const DEBUG_TRACING_MODE_SYMBOL_STRING = 'Symbol(react.debug_trace_mode)';
  const FORWARD_REF_NUMBER = 0xead0;
  const FORWARD_REF_SYMBOL_STRING = 'Symbol(react.forward_ref)';
  const FRAGMENT_NUMBER = 0xeacb;
  const FRAGMENT_SYMBOL_STRING = 'Symbol(react.fragment)';
  const LAZY_NUMBER = 0xead4;
  const LAZY_SYMBOL_STRING = 'Symbol(react.lazy)';
  const MEMO_NUMBER = 0xead3;
  const MEMO_SYMBOL_STRING = 'Symbol(react.memo)';
  const PORTAL_NUMBER = 0xeaca;
  const PORTAL_SYMBOL_STRING = 'Symbol(react.portal)';
  const PROFILER_NUMBER = 0xead2;
  const PROFILER_SYMBOL_STRING = 'Symbol(react.profiler)';
  const PROVIDER_NUMBER = 0xeacd;
  const PROVIDER_SYMBOL_STRING = 'Symbol(react.provider)';
  const SCOPE_NUMBER = 0xead7;
  const SCOPE_SYMBOL_STRING = 'Symbol(react.scope)';
  const STRICT_MODE_NUMBER = 0xeacc;
  const STRICT_MODE_SYMBOL_STRING = 'Symbol(react.strict_mode)';
  const SUSPENSE_NUMBER = 0xead1;
  const SUSPENSE_SYMBOL_STRING = 'Symbol(react.suspense)';
  const SUSPENSE_LIST_NUMBER = 0xead8;
  const SUSPENSE_LIST_SYMBOL_STRING = 'Symbol(react.suspense_list)';
  const SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED_SYMBOL_STRING = 'Symbol(react.server_context.defaultValue)';
  
  /***/ }),
  /* 3 */
  /***/ (function(module, __webpack_exports__, __webpack_require__) {
  
  "use strict";
  /* unused harmony export CHROME_WEBSTORE_EXTENSION_ID */
  /* unused harmony export INTERNAL_EXTENSION_ID */
  /* unused harmony export LOCAL_EXTENSION_ID */
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "j", function() { return __DEBUG__; });
  /* unused harmony export __PERFORMANCE_PROFILE__ */
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return TREE_OPERATION_ADD; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return TREE_OPERATION_REMOVE; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "f", function() { return TREE_OPERATION_REORDER_CHILDREN; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "i", function() { return TREE_OPERATION_UPDATE_TREE_BASE_DURATION; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "h", function() { return TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "e", function() { return TREE_OPERATION_REMOVE_ROOT; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "g", function() { return TREE_OPERATION_SET_SUBTREE_MODE; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return PROFILING_FLAG_BASIC_SUPPORT; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return PROFILING_FLAG_TIMELINE_SUPPORT; });
  /* unused harmony export LOCAL_STORAGE_DEFAULT_TAB_KEY */
  /* unused harmony export LOCAL_STORAGE_COMPONENT_FILTER_PREFERENCES_KEY */
  /* unused harmony export SESSION_STORAGE_LAST_SELECTION_KEY */
  /* unused harmony export LOCAL_STORAGE_OPEN_IN_EDITOR_URL */
  /* unused harmony export LOCAL_STORAGE_PARSE_HOOK_NAMES_KEY */
  /* unused harmony export SESSION_STORAGE_RECORD_CHANGE_DESCRIPTIONS_KEY */
  /* unused harmony export SESSION_STORAGE_RELOAD_AND_PROFILE_KEY */
  /* unused harmony export LOCAL_STORAGE_SHOULD_BREAK_ON_CONSOLE_ERRORS */
  /* unused harmony export LOCAL_STORAGE_BROWSER_THEME */
  /* unused harmony export LOCAL_STORAGE_SHOULD_APPEND_COMPONENT_STACK_KEY */
  /* unused harmony export LOCAL_STORAGE_SHOW_INLINE_WARNINGS_AND_ERRORS_KEY */
  /* unused harmony export LOCAL_STORAGE_TRACE_UPDATES_ENABLED_KEY */
  /* unused harmony export LOCAL_STORAGE_HIDE_CONSOLE_LOGS_IN_STRICT_MODE */
  /* unused harmony export PROFILER_EXPORT_VERSION */
  /* unused harmony export CHANGE_LOG_URL */
  /* unused harmony export UNSUPPORTED_VERSION_URL */
  /* unused harmony export REACT_DEVTOOLS_WORKPLACE_URL */
  /* unused harmony export THEME_STYLES */
  /* unused harmony export COMFORTABLE_LINE_HEIGHT */
  /* unused harmony export COMPACT_LINE_HEIGHT */
  /**
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  const CHROME_WEBSTORE_EXTENSION_ID = 'fmkadmapgofadopljbjfkapdkoienihi';
  const INTERNAL_EXTENSION_ID = 'dnjnjgbfilfphmojnmhliehogmojhclc';
  const LOCAL_EXTENSION_ID = 'ikiahnapldjmdmpkmfhjdjilojjhgcbf'; // Flip this flag to true to enable verbose console debug logging.
  
  const __DEBUG__ = false; // Flip this flag to true to enable performance.mark() and performance.measure() timings.
  
  const __PERFORMANCE_PROFILE__ = false;
  const TREE_OPERATION_ADD = 1;
  const TREE_OPERATION_REMOVE = 2;
  const TREE_OPERATION_REORDER_CHILDREN = 3;
  const TREE_OPERATION_UPDATE_TREE_BASE_DURATION = 4;
  const TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS = 5;
  const TREE_OPERATION_REMOVE_ROOT = 6;
  const TREE_OPERATION_SET_SUBTREE_MODE = 7;
  const PROFILING_FLAG_BASIC_SUPPORT = 0b01;
  const PROFILING_FLAG_TIMELINE_SUPPORT = 0b10;
  const LOCAL_STORAGE_DEFAULT_TAB_KEY = 'React::DevTools::defaultTab';
  const LOCAL_STORAGE_COMPONENT_FILTER_PREFERENCES_KEY = 'React::DevTools::componentFilters';
  const SESSION_STORAGE_LAST_SELECTION_KEY = 'React::DevTools::lastSelection';
  const LOCAL_STORAGE_OPEN_IN_EDITOR_URL = 'React::DevTools::openInEditorUrl';
  const LOCAL_STORAGE_PARSE_HOOK_NAMES_KEY = 'React::DevTools::parseHookNames';
  const SESSION_STORAGE_RECORD_CHANGE_DESCRIPTIONS_KEY = 'React::DevTools::recordChangeDescriptions';
  const SESSION_STORAGE_RELOAD_AND_PROFILE_KEY = 'React::DevTools::reloadAndProfile';
  const LOCAL_STORAGE_SHOULD_BREAK_ON_CONSOLE_ERRORS = 'React::DevTools::breakOnConsoleErrors';
  const LOCAL_STORAGE_BROWSER_THEME = 'React::DevTools::theme';
  const LOCAL_STORAGE_SHOULD_APPEND_COMPONENT_STACK_KEY = 'React::DevTools::appendComponentStack';
  const LOCAL_STORAGE_SHOW_INLINE_WARNINGS_AND_ERRORS_KEY = 'React::DevTools::showInlineWarningsAndErrors';
  const LOCAL_STORAGE_TRACE_UPDATES_ENABLED_KEY = 'React::DevTools::traceUpdatesEnabled';
  const LOCAL_STORAGE_HIDE_CONSOLE_LOGS_IN_STRICT_MODE = 'React::DevTools::hideConsoleLogsInStrictMode';
  const PROFILER_EXPORT_VERSION = 5;
  const CHANGE_LOG_URL = 'https://github.com/facebook/react/blob/main/packages/react-devtools/CHANGELOG.md';
  const UNSUPPORTED_VERSION_URL = 'https://reactjs.org/blog/2019/08/15/new-react-devtools.html#how-do-i-get-the-old-version-back';
  const REACT_DEVTOOLS_WORKPLACE_URL = 'https://fburl.com/react-devtools-workplace-group';
  const THEME_STYLES = {
    light: {
      '--color-attribute-name': '#ef6632',
      '--color-attribute-name-not-editable': '#23272f',
      '--color-attribute-name-inverted': 'rgba(255, 255, 255, 0.7)',
      '--color-attribute-value': '#1a1aa6',
      '--color-attribute-value-inverted': '#ffffff',
      '--color-attribute-editable-value': '#1a1aa6',
      '--color-background': '#ffffff',
      '--color-background-hover': 'rgba(0, 136, 250, 0.1)',
      '--color-background-inactive': '#e5e5e5',
      '--color-background-invalid': '#fff0f0',
      '--color-background-selected': '#0088fa',
      '--color-button-background': '#ffffff',
      '--color-button-background-focus': '#ededed',
      '--color-button': '#5f6673',
      '--color-button-disabled': '#cfd1d5',
      '--color-button-active': '#0088fa',
      '--color-button-focus': '#23272f',
      '--color-button-hover': '#23272f',
      '--color-border': '#eeeeee',
      '--color-commit-did-not-render-fill': '#cfd1d5',
      '--color-commit-did-not-render-fill-text': '#000000',
      '--color-commit-did-not-render-pattern': '#cfd1d5',
      '--color-commit-did-not-render-pattern-text': '#333333',
      '--color-commit-gradient-0': '#37afa9',
      '--color-commit-gradient-1': '#63b19e',
      '--color-commit-gradient-2': '#80b393',
      '--color-commit-gradient-3': '#97b488',
      '--color-commit-gradient-4': '#abb67d',
      '--color-commit-gradient-5': '#beb771',
      '--color-commit-gradient-6': '#cfb965',
      '--color-commit-gradient-7': '#dfba57',
      '--color-commit-gradient-8': '#efbb49',
      '--color-commit-gradient-9': '#febc38',
      '--color-commit-gradient-text': '#000000',
      '--color-component-name': '#6a51b2',
      '--color-component-name-inverted': '#ffffff',
      '--color-component-badge-background': 'rgba(0, 0, 0, 0.1)',
      '--color-component-badge-background-inverted': 'rgba(255, 255, 255, 0.25)',
      '--color-component-badge-count': '#777d88',
      '--color-component-badge-count-inverted': 'rgba(255, 255, 255, 0.7)',
      '--color-console-error-badge-text': '#ffffff',
      '--color-console-error-background': '#fff0f0',
      '--color-console-error-border': '#ffd6d6',
      '--color-console-error-icon': '#eb3941',
      '--color-console-error-text': '#fe2e31',
      '--color-console-warning-badge-text': '#000000',
      '--color-console-warning-background': '#fffbe5',
      '--color-console-warning-border': '#fff5c1',
      '--color-console-warning-icon': '#f4bd00',
      '--color-console-warning-text': '#64460c',
      '--color-context-background': 'rgba(0,0,0,.9)',
      '--color-context-background-hover': 'rgba(255, 255, 255, 0.1)',
      '--color-context-background-selected': '#178fb9',
      '--color-context-border': '#3d424a',
      '--color-context-text': '#ffffff',
      '--color-context-text-selected': '#ffffff',
      '--color-dim': '#777d88',
      '--color-dimmer': '#cfd1d5',
      '--color-dimmest': '#eff0f1',
      '--color-error-background': 'hsl(0, 100%, 97%)',
      '--color-error-border': 'hsl(0, 100%, 92%)',
      '--color-error-text': '#ff0000',
      '--color-expand-collapse-toggle': '#777d88',
      '--color-link': '#0000ff',
      '--color-modal-background': 'rgba(255, 255, 255, 0.75)',
      '--color-bridge-version-npm-background': '#eff0f1',
      '--color-bridge-version-npm-text': '#000000',
      '--color-bridge-version-number': '#0088fa',
      '--color-primitive-hook-badge-background': '#e5e5e5',
      '--color-primitive-hook-badge-text': '#5f6673',
      '--color-record-active': '#fc3a4b',
      '--color-record-hover': '#3578e5',
      '--color-record-inactive': '#0088fa',
      '--color-resize-bar': '#eeeeee',
      '--color-resize-bar-active': '#dcdcdc',
      '--color-resize-bar-border': '#d1d1d1',
      '--color-resize-bar-dot': '#333333',
      '--color-timeline-internal-module': '#d1d1d1',
      '--color-timeline-internal-module-hover': '#c9c9c9',
      '--color-timeline-internal-module-text': '#444',
      '--color-timeline-native-event': '#ccc',
      '--color-timeline-native-event-hover': '#aaa',
      '--color-timeline-network-primary': '#fcf3dc',
      '--color-timeline-network-primary-hover': '#f0e7d1',
      '--color-timeline-network-secondary': '#efc457',
      '--color-timeline-network-secondary-hover': '#e3ba52',
      '--color-timeline-priority-background': '#f6f6f6',
      '--color-timeline-priority-border': '#eeeeee',
      '--color-timeline-user-timing': '#c9cacd',
      '--color-timeline-user-timing-hover': '#93959a',
      '--color-timeline-react-idle': '#d3e5f6',
      '--color-timeline-react-idle-hover': '#c3d9ef',
      '--color-timeline-react-render': '#9fc3f3',
      '--color-timeline-react-render-hover': '#83afe9',
      '--color-timeline-react-render-text': '#11365e',
      '--color-timeline-react-commit': '#c88ff0',
      '--color-timeline-react-commit-hover': '#b281d6',
      '--color-timeline-react-commit-text': '#3e2c4a',
      '--color-timeline-react-layout-effects': '#b281d6',
      '--color-timeline-react-layout-effects-hover': '#9d71bd',
      '--color-timeline-react-layout-effects-text': '#3e2c4a',
      '--color-timeline-react-passive-effects': '#b281d6',
      '--color-timeline-react-passive-effects-hover': '#9d71bd',
      '--color-timeline-react-passive-effects-text': '#3e2c4a',
      '--color-timeline-react-schedule': '#9fc3f3',
      '--color-timeline-react-schedule-hover': '#2683E2',
      '--color-timeline-react-suspense-rejected': '#f1cc14',
      '--color-timeline-react-suspense-rejected-hover': '#ffdf37',
      '--color-timeline-react-suspense-resolved': '#a6e59f',
      '--color-timeline-react-suspense-resolved-hover': '#89d281',
      '--color-timeline-react-suspense-unresolved': '#c9cacd',
      '--color-timeline-react-suspense-unresolved-hover': '#93959a',
      '--color-timeline-thrown-error': '#ee1638',
      '--color-timeline-thrown-error-hover': '#da1030',
      '--color-timeline-text-color': '#000000',
      '--color-timeline-text-dim-color': '#ccc',
      '--color-timeline-react-work-border': '#eeeeee',
      '--color-search-match': 'yellow',
      '--color-search-match-current': '#f7923b',
      '--color-selected-tree-highlight-active': 'rgba(0, 136, 250, 0.1)',
      '--color-selected-tree-highlight-inactive': 'rgba(0, 0, 0, 0.05)',
      '--color-scroll-caret': 'rgba(150, 150, 150, 0.5)',
      '--color-tab-selected-border': '#0088fa',
      '--color-text': '#000000',
      '--color-text-invalid': '#ff0000',
      '--color-text-selected': '#ffffff',
      '--color-toggle-background-invalid': '#fc3a4b',
      '--color-toggle-background-on': '#0088fa',
      '--color-toggle-background-off': '#cfd1d5',
      '--color-toggle-text': '#ffffff',
      '--color-warning-background': '#fb3655',
      '--color-warning-background-hover': '#f82042',
      '--color-warning-text-color': '#ffffff',
      '--color-warning-text-color-inverted': '#fd4d69',
      // The styles below should be kept in sync with 'root.css'
      // They are repeated there because they're used by e.g. tooltips or context menus
      // which get rendered outside of the DOM subtree (where normal theme/styles are written).
      '--color-scroll-thumb': '#c2c2c2',
      '--color-scroll-track': '#fafafa',
      '--color-tooltip-background': 'rgba(0, 0, 0, 0.9)',
      '--color-tooltip-text': '#ffffff'
    },
    dark: {
      '--color-attribute-name': '#9d87d2',
      '--color-attribute-name-not-editable': '#ededed',
      '--color-attribute-name-inverted': '#282828',
      '--color-attribute-value': '#cedae0',
      '--color-attribute-value-inverted': '#ffffff',
      '--color-attribute-editable-value': 'yellow',
      '--color-background': '#282c34',
      '--color-background-hover': 'rgba(255, 255, 255, 0.1)',
      '--color-background-inactive': '#3d424a',
      '--color-background-invalid': '#5c0000',
      '--color-background-selected': '#178fb9',
      '--color-button-background': '#282c34',
      '--color-button-background-focus': '#3d424a',
      '--color-button': '#afb3b9',
      '--color-button-active': '#61dafb',
      '--color-button-disabled': '#4f5766',
      '--color-button-focus': '#a2e9fc',
      '--color-button-hover': '#ededed',
      '--color-border': '#3d424a',
      '--color-commit-did-not-render-fill': '#777d88',
      '--color-commit-did-not-render-fill-text': '#000000',
      '--color-commit-did-not-render-pattern': '#666c77',
      '--color-commit-did-not-render-pattern-text': '#ffffff',
      '--color-commit-gradient-0': '#37afa9',
      '--color-commit-gradient-1': '#63b19e',
      '--color-commit-gradient-2': '#80b393',
      '--color-commit-gradient-3': '#97b488',
      '--color-commit-gradient-4': '#abb67d',
      '--color-commit-gradient-5': '#beb771',
      '--color-commit-gradient-6': '#cfb965',
      '--color-commit-gradient-7': '#dfba57',
      '--color-commit-gradient-8': '#efbb49',
      '--color-commit-gradient-9': '#febc38',
      '--color-commit-gradient-text': '#000000',
      '--color-component-name': '#61dafb',
      '--color-component-name-inverted': '#282828',
      '--color-component-badge-background': 'rgba(255, 255, 255, 0.25)',
      '--color-component-badge-background-inverted': 'rgba(0, 0, 0, 0.25)',
      '--color-component-badge-count': '#8f949d',
      '--color-component-badge-count-inverted': 'rgba(255, 255, 255, 0.7)',
      '--color-console-error-badge-text': '#000000',
      '--color-console-error-background': '#290000',
      '--color-console-error-border': '#5c0000',
      '--color-console-error-icon': '#eb3941',
      '--color-console-error-text': '#fc7f7f',
      '--color-console-warning-badge-text': '#000000',
      '--color-console-warning-background': '#332b00',
      '--color-console-warning-border': '#665500',
      '--color-console-warning-icon': '#f4bd00',
      '--color-console-warning-text': '#f5f2ed',
      '--color-context-background': 'rgba(255,255,255,.95)',
      '--color-context-background-hover': 'rgba(0, 136, 250, 0.1)',
      '--color-context-background-selected': '#0088fa',
      '--color-context-border': '#eeeeee',
      '--color-context-text': '#000000',
      '--color-context-text-selected': '#ffffff',
      '--color-dim': '#8f949d',
      '--color-dimmer': '#777d88',
      '--color-dimmest': '#4f5766',
      '--color-error-background': '#200',
      '--color-error-border': '#900',
      '--color-error-text': '#f55',
      '--color-expand-collapse-toggle': '#8f949d',
      '--color-link': '#61dafb',
      '--color-modal-background': 'rgba(0, 0, 0, 0.75)',
      '--color-bridge-version-npm-background': 'rgba(0, 0, 0, 0.25)',
      '--color-bridge-version-npm-text': '#ffffff',
      '--color-bridge-version-number': 'yellow',
      '--color-primitive-hook-badge-background': 'rgba(0, 0, 0, 0.25)',
      '--color-primitive-hook-badge-text': 'rgba(255, 255, 255, 0.7)',
      '--color-record-active': '#fc3a4b',
      '--color-record-hover': '#a2e9fc',
      '--color-record-inactive': '#61dafb',
      '--color-resize-bar': '#282c34',
      '--color-resize-bar-active': '#31363f',
      '--color-resize-bar-border': '#3d424a',
      '--color-resize-bar-dot': '#cfd1d5',
      '--color-timeline-internal-module': '#303542',
      '--color-timeline-internal-module-hover': '#363b4a',
      '--color-timeline-internal-module-text': '#7f8899',
      '--color-timeline-native-event': '#b2b2b2',
      '--color-timeline-native-event-hover': '#949494',
      '--color-timeline-network-primary': '#fcf3dc',
      '--color-timeline-network-primary-hover': '#e3dbc5',
      '--color-timeline-network-secondary': '#efc457',
      '--color-timeline-network-secondary-hover': '#d6af4d',
      '--color-timeline-priority-background': '#1d2129',
      '--color-timeline-priority-border': '#282c34',
      '--color-timeline-user-timing': '#c9cacd',
      '--color-timeline-user-timing-hover': '#93959a',
      '--color-timeline-react-idle': '#3d485b',
      '--color-timeline-react-idle-hover': '#465269',
      '--color-timeline-react-render': '#2683E2',
      '--color-timeline-react-render-hover': '#1a76d4',
      '--color-timeline-react-render-text': '#11365e',
      '--color-timeline-react-commit': '#731fad',
      '--color-timeline-react-commit-hover': '#611b94',
      '--color-timeline-react-commit-text': '#e5c1ff',
      '--color-timeline-react-layout-effects': '#611b94',
      '--color-timeline-react-layout-effects-hover': '#51167a',
      '--color-timeline-react-layout-effects-text': '#e5c1ff',
      '--color-timeline-react-passive-effects': '#611b94',
      '--color-timeline-react-passive-effects-hover': '#51167a',
      '--color-timeline-react-passive-effects-text': '#e5c1ff',
      '--color-timeline-react-schedule': '#2683E2',
      '--color-timeline-react-schedule-hover': '#1a76d4',
      '--color-timeline-react-suspense-rejected': '#f1cc14',
      '--color-timeline-react-suspense-rejected-hover': '#e4c00f',
      '--color-timeline-react-suspense-resolved': '#a6e59f',
      '--color-timeline-react-suspense-resolved-hover': '#89d281',
      '--color-timeline-react-suspense-unresolved': '#c9cacd',
      '--color-timeline-react-suspense-unresolved-hover': '#93959a',
      '--color-timeline-thrown-error': '#fb3655',
      '--color-timeline-thrown-error-hover': '#f82042',
      '--color-timeline-text-color': '#282c34',
      '--color-timeline-text-dim-color': '#555b66',
      '--color-timeline-react-work-border': '#3d424a',
      '--color-search-match': 'yellow',
      '--color-search-match-current': '#f7923b',
      '--color-selected-tree-highlight-active': 'rgba(23, 143, 185, 0.15)',
      '--color-selected-tree-highlight-inactive': 'rgba(255, 255, 255, 0.05)',
      '--color-scroll-caret': '#4f5766',
      '--color-shadow': 'rgba(0, 0, 0, 0.5)',
      '--color-tab-selected-border': '#178fb9',
      '--color-text': '#ffffff',
      '--color-text-invalid': '#ff8080',
      '--color-text-selected': '#ffffff',
      '--color-toggle-background-invalid': '#fc3a4b',
      '--color-toggle-background-on': '#178fb9',
      '--color-toggle-background-off': '#777d88',
      '--color-toggle-text': '#ffffff',
      '--color-warning-background': '#ee1638',
      '--color-warning-background-hover': '#da1030',
      '--color-warning-text-color': '#ffffff',
      '--color-warning-text-color-inverted': '#ee1638',
      // The styles below should be kept in sync with 'root.css'
      // They are repeated there because they're used by e.g. tooltips or context menus
      // which get rendered outside of the DOM subtree (where normal theme/styles are written).
      '--color-scroll-thumb': '#afb3b9',
      '--color-scroll-track': '#313640',
      '--color-tooltip-background': 'rgba(255, 255, 255, 0.95)',
      '--color-tooltip-text': '#000000'
    },
    compact: {
      '--font-size-monospace-small': '9px',
      '--font-size-monospace-normal': '11px',
      '--font-size-monospace-large': '15px',
      '--font-size-sans-small': '10px',
      '--font-size-sans-normal': '12px',
      '--font-size-sans-large': '14px',
      '--line-height-data': '18px'
    },
    comfortable: {
      '--font-size-monospace-small': '10px',
      '--font-size-monospace-normal': '13px',
      '--font-size-monospace-large': '17px',
      '--font-size-sans-small': '12px',
      '--font-size-sans-normal': '14px',
      '--font-size-sans-large': '16px',
      '--line-height-data': '22px'
    }
  }; // HACK
  //
  // Sometimes the inline target is rendered before root styles are applied,
  // which would result in e.g. NaN itemSize being passed to react-window list.
  
  const COMFORTABLE_LINE_HEIGHT = parseInt(THEME_STYLES.comfortable['--line-height-data'], 10);
  const COMPACT_LINE_HEIGHT = parseInt(THEME_STYLES.compact['--line-height-data'], 10);
  
  
  /***/ }),
  /* 4 */
  /***/ (function(module, __webpack_exports__, __webpack_require__) {
  
  "use strict";
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return cleanForBridge; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return copyToClipboard; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return copyWithDelete; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return copyWithRename; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "e", function() { return copyWithSet; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "h", function() { return getEffectDurations; });
  /* unused harmony export serializeToString */
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "g", function() { return formatWithStyles; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "f", function() { return format; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "i", function() { return isSynchronousXHRSupported; });
  /* harmony import */ var clipboard_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(17);
  /* harmony import */ var clipboard_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(clipboard_js__WEBPACK_IMPORTED_MODULE_0__);
  /* harmony import */ var _hydration__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(8);
  /* harmony import */ var shared_isArray__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(7);
  /**
  /**
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  
  
  
  function cleanForBridge(data, isPathAllowed, path = []) {
    if (data !== null) {
      const cleanedPaths = [];
      const unserializablePaths = [];
      const cleanedData = Object(_hydration__WEBPACK_IMPORTED_MODULE_1__[/* dehydrate */ "a"])(data, cleanedPaths, unserializablePaths, path, isPathAllowed);
      return {
        data: cleanedData,
        cleaned: cleanedPaths,
        unserializable: unserializablePaths
      };
    } else {
      return null;
    }
  }
  function copyToClipboard(value) {
    const safeToCopy = serializeToString(value);
    const text = safeToCopy === undefined ? 'undefined' : safeToCopy;
    const {
      clipboardCopyText
    } = window.__REACT_DEVTOOLS_GLOBAL_HOOK__; // On Firefox navigator.clipboard.writeText has to be called from
    // the content script js code (because it requires the clipboardWrite
    // permission to be allowed out of a "user handling" callback),
    // clipboardCopyText is an helper injected into the page from.
    // injectGlobalHook.
  
    if (typeof clipboardCopyText === 'function') {
      clipboardCopyText(text).catch(err => {});
    } else {
      Object(clipboard_js__WEBPACK_IMPORTED_MODULE_0__["copy"])(text);
    }
  }
  function copyWithDelete(obj, path, index = 0) {
    const key = path[index];
    const updated = Object(shared_isArray__WEBPACK_IMPORTED_MODULE_2__[/* default */ "a"])(obj) ? obj.slice() : { ...obj
    };
  
    if (index + 1 === path.length) {
      if (Object(shared_isArray__WEBPACK_IMPORTED_MODULE_2__[/* default */ "a"])(updated)) {
        updated.splice(key, 1);
      } else {
        delete updated[key];
      }
    } else {
      // $FlowFixMe number or string is fine here
      updated[key] = copyWithDelete(obj[key], path, index + 1);
    }
  
    return updated;
  } // This function expects paths to be the same except for the final value.
  // e.g. ['path', 'to', 'foo'] and ['path', 'to', 'bar']
  
  function copyWithRename(obj, oldPath, newPath, index = 0) {
    const oldKey = oldPath[index];
    const updated = Object(shared_isArray__WEBPACK_IMPORTED_MODULE_2__[/* default */ "a"])(obj) ? obj.slice() : { ...obj
    };
  
    if (index + 1 === oldPath.length) {
      const newKey = newPath[index]; // $FlowFixMe number or string is fine here
  
      updated[newKey] = updated[oldKey];
  
      if (Object(shared_isArray__WEBPACK_IMPORTED_MODULE_2__[/* default */ "a"])(updated)) {
        updated.splice(oldKey, 1);
      } else {
        delete updated[oldKey];
      }
    } else {
      // $FlowFixMe number or string is fine here
      updated[oldKey] = copyWithRename(obj[oldKey], oldPath, newPath, index + 1);
    }
  
    return updated;
  }
  function copyWithSet(obj, path, value, index = 0) {
    if (index >= path.length) {
      return value;
    }
  
    const key = path[index];
    const updated = Object(shared_isArray__WEBPACK_IMPORTED_MODULE_2__[/* default */ "a"])(obj) ? obj.slice() : { ...obj
    }; // $FlowFixMe number or string is fine here
  
    updated[key] = copyWithSet(obj[key], path, value, index + 1);
    return updated;
  }
  function getEffectDurations(root) {
    // Profiling durations are only available for certain builds.
    // If available, they'll be stored on the HostRoot.
    let effectDuration = null;
    let passiveEffectDuration = null;
    const hostRoot = root.current;
  
    if (hostRoot != null) {
      const stateNode = hostRoot.stateNode;
  
      if (stateNode != null) {
        effectDuration = stateNode.effectDuration != null ? stateNode.effectDuration : null;
        passiveEffectDuration = stateNode.passiveEffectDuration != null ? stateNode.passiveEffectDuration : null;
      }
    }
  
    return {
      effectDuration,
      passiveEffectDuration
    };
  }
  function serializeToString(data) {
    const cache = new Set(); // Use a custom replacer function to protect against circular references.
  
    return JSON.stringify(data, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) {
          return;
        }
  
        cache.add(value);
      } // $FlowFixMe
  
  
      if (typeof value === 'bigint') {
        return value.toString() + 'n';
      }
  
      return value;
    });
  } // Formats an array of args with a style for console methods, using
  // the following algorithm:
  //     1. The first param is a string that contains %c
  //          - Bail out and return the args without modifying the styles.
  //            We don't want to affect styles that the developer deliberately set.
  //     2. The first param is a string that doesn't contain %c but contains
  //        string formatting
  //          - [`%c${args[0]}`, style, ...args.slice(1)]
  //          - Note: we assume that the string formatting that the developer uses
  //            is correct.
  //     3. The first param is a string that doesn't contain string formatting
  //        OR is not a string
  //          - Create a formatting string where:
  //                 boolean, string, symbol -> %s
  //                 number -> %f OR %i depending on if it's an int or float
  //                 default -> %o
  
  function formatWithStyles(inputArgs, style) {
    if (inputArgs === undefined || inputArgs === null || inputArgs.length === 0 || // Matches any of %c but not %%c
    typeof inputArgs[0] === 'string' && inputArgs[0].match(/([^%]|^)(%c)/g) || style === undefined) {
      return inputArgs;
    } // Matches any of %(o|O|d|i|s|f), but not %%(o|O|d|i|s|f)
  
  
    const REGEXP = /([^%]|^)((%%)*)(%([oOdisf]))/g;
  
    if (typeof inputArgs[0] === 'string' && inputArgs[0].match(REGEXP)) {
      return [`%c${inputArgs[0]}`, style, ...inputArgs.slice(1)];
    } else {
      const firstArg = inputArgs.reduce((formatStr, elem, i) => {
        if (i > 0) {
          formatStr += ' ';
        }
  
        switch (typeof elem) {
          case 'string':
          case 'boolean':
          case 'symbol':
            return formatStr += '%s';
  
          case 'number':
            const formatting = Number.isInteger(elem) ? '%i' : '%f';
            return formatStr += formatting;
  
          default:
            return formatStr += '%o';
        }
      }, '%c');
      return [firstArg, style, ...inputArgs];
    }
  } // based on https://github.com/tmpfs/format-util/blob/0e62d430efb0a1c51448709abd3e2406c14d8401/format.js#L1
  // based on https://developer.mozilla.org/en-US/docs/Web/API/console#Using_string_substitutions
  // Implements s, d, i and f placeholders
  // NOTE: KEEP IN SYNC with src/hook.js
  
  function format(maybeMessage, ...inputArgs) {
    const args = inputArgs.slice();
    let formatted = String(maybeMessage); // If the first argument is a string, check for substitutions.
  
    if (typeof maybeMessage === 'string') {
      if (args.length) {
        const REGEXP = /(%?)(%([jds]))/g;
        formatted = formatted.replace(REGEXP, (match, escaped, ptn, flag) => {
          let arg = args.shift();
  
          switch (flag) {
            case 's':
              arg += '';
              break;
  
            case 'd':
            case 'i':
              arg = parseInt(arg, 10).toString();
              break;
  
            case 'f':
              arg = parseFloat(arg).toString();
              break;
          }
  
          if (!escaped) {
            return arg;
          }
  
          args.unshift(arg);
          return match;
        });
      }
    } // Arguments that remain after formatting.
  
  
    if (args.length) {
      for (let i = 0; i < args.length; i++) {
        formatted += ' ' + String(args[i]);
      }
    } // Update escaped %% values.
  
  
    formatted = formatted.replace(/%{2,2}/g, '%');
    return String(formatted);
  }
  function isSynchronousXHRSupported() {
    return !!(window.document && window.document.featurePolicy && window.document.featurePolicy.allowsFeature('sync-xhr'));
  }
  
  /***/ }),
  /* 5 */
  /***/ (function(module, __webpack_exports__, __webpack_require__) {
  
  "use strict";
  /**
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  const isArray = Array.isArray;
  /* harmony default export */ __webpack_exports__["a"] = (isArray);
  
  /***/ }),
  /* 6 */
  /***/ (function(module, exports, __webpack_require__) {
  
  "use strict";
  
  
  if (true) {
    module.exports = __webpack_require__(25);
  } else {}
  
  /***/ }),
  /* 7 */
  /***/ (function(module, __webpack_exports__, __webpack_require__) {
  
  "use strict";
  /**
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  const isArrayImpl = Array.isArray; // eslint-disable-next-line no-redeclare
  
  function isArray(a) {
    return isArrayImpl(a);
  }
  
  /* harmony default export */ __webpack_exports__["a"] = (isArray);
  
  /***/ }),
  /* 8 */
  /***/ (function(module, __webpack_exports__, __webpack_require__) {
  
  "use strict";
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return meta; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return dehydrate; });
  /* unused harmony export fillInPath */
  /* unused harmony export hydrate */
  /* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1);
  /**
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  
  const meta = {
    inspectable: Symbol('inspectable'),
    inspected: Symbol('inspected'),
    name: Symbol('name'),
    preview_long: Symbol('preview_long'),
    preview_short: Symbol('preview_short'),
    readonly: Symbol('readonly'),
    size: Symbol('size'),
    type: Symbol('type'),
    unserializable: Symbol('unserializable')
  };
  // This threshold determines the depth at which the bridge "dehydrates" nested data.
  // Dehydration means that we don't serialize the data for e.g. postMessage or stringify,
  // unless the frontend explicitly requests it (e.g. a user clicks to expand a props object).
  //
  // Reducing this threshold will improve the speed of initial component inspection,
  // but may decrease the responsiveness of expanding objects/arrays to inspect further.
  const LEVEL_THRESHOLD = 2;
  /**
   * Generate the dehydrated metadata for complex object instances
   */
  
  function createDehydrated(type, inspectable, data, cleaned, path) {
    cleaned.push(path);
    const dehydrated = {
      inspectable,
      type,
      preview_long: Object(_utils__WEBPACK_IMPORTED_MODULE_0__[/* formatDataForPreview */ "d"])(data, true),
      preview_short: Object(_utils__WEBPACK_IMPORTED_MODULE_0__[/* formatDataForPreview */ "d"])(data, false),
      name: !data.constructor || data.constructor.name === 'Object' ? '' : data.constructor.name
    };
  
    if (type === 'array' || type === 'typed_array') {
      dehydrated.size = data.length;
    } else if (type === 'object') {
      dehydrated.size = Object.keys(data).length;
    }
  
    if (type === 'iterator' || type === 'typed_array') {
      dehydrated.readonly = true;
    }
  
    return dehydrated;
  }
  /**
   * Strip out complex data (instances, functions, and data nested > LEVEL_THRESHOLD levels deep).
   * The paths of the stripped out objects are appended to the `cleaned` list.
   * On the other side of the barrier, the cleaned list is used to "re-hydrate" the cleaned representation into
   * an object with symbols as attributes, so that a sanitized object can be distinguished from a normal object.
   *
   * Input: {"some": {"attr": fn()}, "other": AnInstance}
   * Output: {
   *   "some": {
   *     "attr": {"name": the fn.name, type: "function"}
   *   },
   *   "other": {
   *     "name": "AnInstance",
   *     "type": "object",
   *   },
   * }
   * and cleaned = [["some", "attr"], ["other"]]
   */
  
  
  function dehydrate(data, cleaned, unserializable, path, isPathAllowed, level = 0) {
    const type = Object(_utils__WEBPACK_IMPORTED_MODULE_0__[/* getDataType */ "f"])(data);
    let isPathAllowedCheck;
  
    switch (type) {
      case 'html_element':
        cleaned.push(path);
        return {
          inspectable: false,
          preview_short: Object(_utils__WEBPACK_IMPORTED_MODULE_0__[/* formatDataForPreview */ "d"])(data, false),
          preview_long: Object(_utils__WEBPACK_IMPORTED_MODULE_0__[/* formatDataForPreview */ "d"])(data, true),
          name: data.tagName,
          type
        };
  
      case 'function':
        cleaned.push(path);
        return {
          inspectable: false,
          preview_short: Object(_utils__WEBPACK_IMPORTED_MODULE_0__[/* formatDataForPreview */ "d"])(data, false),
          preview_long: Object(_utils__WEBPACK_IMPORTED_MODULE_0__[/* formatDataForPreview */ "d"])(data, true),
          name: typeof data.name === 'function' || !data.name ? 'function' : data.name,
          type
        };
  
      case 'string':
        isPathAllowedCheck = isPathAllowed(path);
  
        if (isPathAllowedCheck) {
          return data;
        } else {
          return data.length <= 500 ? data : data.slice(0, 500) + '...';
        }
  
      case 'bigint':
        cleaned.push(path);
        return {
          inspectable: false,
          preview_short: Object(_utils__WEBPACK_IMPORTED_MODULE_0__[/* formatDataForPreview */ "d"])(data, false),
          preview_long: Object(_utils__WEBPACK_IMPORTED_MODULE_0__[/* formatDataForPreview */ "d"])(data, true),
          name: data.toString(),
          type
        };
  
      case 'symbol':
        cleaned.push(path);
        return {
          inspectable: false,
          preview_short: Object(_utils__WEBPACK_IMPORTED_MODULE_0__[/* formatDataForPreview */ "d"])(data, false),
          preview_long: Object(_utils__WEBPACK_IMPORTED_MODULE_0__[/* formatDataForPreview */ "d"])(data, true),
          name: data.toString(),
          type
        };
      // React Elements aren't very inspector-friendly,
      // and often contain private fields or circular references.
  
      case 'react_element':
        cleaned.push(path);
        return {
          inspectable: false,
          preview_short: Object(_utils__WEBPACK_IMPORTED_MODULE_0__[/* formatDataForPreview */ "d"])(data, false),
          preview_long: Object(_utils__WEBPACK_IMPORTED_MODULE_0__[/* formatDataForPreview */ "d"])(data, true),
          name: Object(_utils__WEBPACK_IMPORTED_MODULE_0__[/* getDisplayNameForReactElement */ "i"])(data) || 'Unknown',
          type
        };
      // ArrayBuffers error if you try to inspect them.
  
      case 'array_buffer':
      case 'data_view':
        cleaned.push(path);
        return {
          inspectable: false,
          preview_short: Object(_utils__WEBPACK_IMPORTED_MODULE_0__[/* formatDataForPreview */ "d"])(data, false),
          preview_long: Object(_utils__WEBPACK_IMPORTED_MODULE_0__[/* formatDataForPreview */ "d"])(data, true),
          name: type === 'data_view' ? 'DataView' : 'ArrayBuffer',
          size: data.byteLength,
          type
        };
  
      case 'array':
        isPathAllowedCheck = isPathAllowed(path);
  
        if (level >= LEVEL_THRESHOLD && !isPathAllowedCheck) {
          return createDehydrated(type, true, data, cleaned, path);
        }
  
        return data.map((item, i) => dehydrate(item, cleaned, unserializable, path.concat([i]), isPathAllowed, isPathAllowedCheck ? 1 : level + 1));
  
      case 'html_all_collection':
      case 'typed_array':
      case 'iterator':
        isPathAllowedCheck = isPathAllowed(path);
  
        if (level >= LEVEL_THRESHOLD && !isPathAllowedCheck) {
          return createDehydrated(type, true, data, cleaned, path);
        } else {
          const unserializableValue = {
            unserializable: true,
            type: type,
            readonly: true,
            size: type === 'typed_array' ? data.length : undefined,
            preview_short: Object(_utils__WEBPACK_IMPORTED_MODULE_0__[/* formatDataForPreview */ "d"])(data, false),
            preview_long: Object(_utils__WEBPACK_IMPORTED_MODULE_0__[/* formatDataForPreview */ "d"])(data, true),
            name: !data.constructor || data.constructor.name === 'Object' ? '' : data.constructor.name
          }; // TRICKY
          // Don't use [...spread] syntax for this purpose.
          // This project uses @babel/plugin-transform-spread in "loose" mode which only works with Array values.
          // Other types (e.g. typed arrays, Sets) will not spread correctly.
  
          Array.from(data).forEach((item, i) => unserializableValue[i] = dehydrate(item, cleaned, unserializable, path.concat([i]), isPathAllowed, isPathAllowedCheck ? 1 : level + 1));
          unserializable.push(path);
          return unserializableValue;
        }
  
      case 'opaque_iterator':
        cleaned.push(path);
        return {
          inspectable: false,
          preview_short: Object(_utils__WEBPACK_IMPORTED_MODULE_0__[/* formatDataForPreview */ "d"])(data, false),
          preview_long: Object(_utils__WEBPACK_IMPORTED_MODULE_0__[/* formatDataForPreview */ "d"])(data, true),
          name: data[Symbol.toStringTag],
          type
        };
  
      case 'date':
        cleaned.push(path);
        return {
          inspectable: false,
          preview_short: Object(_utils__WEBPACK_IMPORTED_MODULE_0__[/* formatDataForPreview */ "d"])(data, false),
          preview_long: Object(_utils__WEBPACK_IMPORTED_MODULE_0__[/* formatDataForPreview */ "d"])(data, true),
          name: data.toString(),
          type
        };
  
      case 'regexp':
        cleaned.push(path);
        return {
          inspectable: false,
          preview_short: Object(_utils__WEBPACK_IMPORTED_MODULE_0__[/* formatDataForPreview */ "d"])(data, false),
          preview_long: Object(_utils__WEBPACK_IMPORTED_MODULE_0__[/* formatDataForPreview */ "d"])(data, true),
          name: data.toString(),
          type
        };
  
      case 'object':
        isPathAllowedCheck = isPathAllowed(path);
  
        if (level >= LEVEL_THRESHOLD && !isPathAllowedCheck) {
          return createDehydrated(type, true, data, cleaned, path);
        } else {
          const object = {};
          Object(_utils__WEBPACK_IMPORTED_MODULE_0__[/* getAllEnumerableKeys */ "e"])(data).forEach(key => {
            const name = key.toString();
            object[name] = dehydrate(data[key], cleaned, unserializable, path.concat([name]), isPathAllowed, isPathAllowedCheck ? 1 : level + 1);
          });
          return object;
        }
  
      case 'infinity':
      case 'nan':
      case 'undefined':
        // Some values are lossy when sent through a WebSocket.
        // We dehydrate+rehydrate them to preserve their type.
        cleaned.push(path);
        return {
          type
        };
  
      default:
        return data;
    }
  }
  function fillInPath(object, data, path, value) {
    const target = Object(_utils__WEBPACK_IMPORTED_MODULE_0__[/* getInObject */ "j"])(object, path);
  
    if (target != null) {
      if (!target[meta.unserializable]) {
        delete target[meta.inspectable];
        delete target[meta.inspected];
        delete target[meta.name];
        delete target[meta.preview_long];
        delete target[meta.preview_short];
        delete target[meta.readonly];
        delete target[meta.size];
        delete target[meta.type];
      }
    }
  
    if (value !== null && data.unserializable.length > 0) {
      const unserializablePath = data.unserializable[0];
      let isMatch = unserializablePath.length === path.length;
  
      for (let i = 0; i < path.length; i++) {
        if (path[i] !== unserializablePath[i]) {
          isMatch = false;
          break;
        }
      }
  
      if (isMatch) {
        upgradeUnserializable(value, value);
      }
    }
  
    Object(_utils__WEBPACK_IMPORTED_MODULE_0__[/* setInObject */ "o"])(object, path, value);
  }
  function hydrate(object, cleaned, unserializable) {
    cleaned.forEach(path => {
      const length = path.length;
      const last = path[length - 1];
      const parent = Object(_utils__WEBPACK_IMPORTED_MODULE_0__[/* getInObject */ "j"])(object, path.slice(0, length - 1));
  
      if (!parent || !parent.hasOwnProperty(last)) {
        return;
      }
  
      const value = parent[last];
  
      if (!value) {
        return;
      } else if (value.type === 'infinity') {
        parent[last] = Infinity;
      } else if (value.type === 'nan') {
        parent[last] = NaN;
      } else if (value.type === 'undefined') {
        parent[last] = undefined;
      } else {
        // Replace the string keys with Symbols so they're non-enumerable.
        const replaced = {};
        replaced[meta.inspectable] = !!value.inspectable;
        replaced[meta.inspected] = false;
        replaced[meta.name] = value.name;
        replaced[meta.preview_long] = value.preview_long;
        replaced[meta.preview_short] = value.preview_short;
        replaced[meta.size] = value.size;
        replaced[meta.readonly] = !!value.readonly;
        replaced[meta.type] = value.type;
        parent[last] = replaced;
      }
    });
    unserializable.forEach(path => {
      const length = path.length;
      const last = path[length - 1];
      const parent = Object(_utils__WEBPACK_IMPORTED_MODULE_0__[/* getInObject */ "j"])(object, path.slice(0, length - 1));
  
      if (!parent || !parent.hasOwnProperty(last)) {
        return;
      }
  
      const node = parent[last];
      const replacement = { ...node
      };
      upgradeUnserializable(replacement, node);
      parent[last] = replacement;
    });
    return object;
  }
  
  function upgradeUnserializable(destination, source) {
    Object.defineProperties(destination, {
      [meta.inspected]: {
        configurable: true,
        enumerable: false,
        value: !!source.inspected
      },
      [meta.name]: {
        configurable: true,
        enumerable: false,
        value: source.name
      },
      [meta.preview_long]: {
        configurable: true,
        enumerable: false,
        value: source.preview_long
      },
      [meta.preview_short]: {
        configurable: true,
        enumerable: false,
        value: source.preview_short
      },
      [meta.size]: {
        configurable: true,
        enumerable: false,
        value: source.size
      },
      [meta.readonly]: {
        configurable: true,
        enumerable: false,
        value: !!source.readonly
      },
      [meta.type]: {
        configurable: true,
        enumerable: false,
        value: source.type
      },
      [meta.unserializable]: {
        configurable: true,
        enumerable: false,
        value: !!source.unserializable
      }
    });
    delete destination.inspected;
    delete destination.name;
    delete destination.preview_long;
    delete destination.preview_short;
    delete destination.size;
    delete destination.readonly;
    delete destination.type;
    delete destination.unserializable;
  }
  
  /***/ }),
  /* 9 */
  /***/ (function(module, __webpack_exports__, __webpack_require__) {
  
  "use strict";
  /* WEBPACK VAR INJECTION */(function(global) {/* unused harmony export isStringComponentStack */
  /* unused harmony export dangerous_setTargetConsoleForTesting */
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return registerRenderer; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return patch; });
  /* unused harmony export unpatch */
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return patchForStrictMode; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "e", function() { return unpatchForStrictMode; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return patchConsoleUsingWindowValues; });
  /* unused harmony export writeConsolePatchSettingsToWindow */
  /* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(4);
  /* harmony import */ var _renderer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(13);
  /* harmony import */ var _DevToolsFiberComponentStack__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(14);
  /* harmony import */ var react_devtools_feature_flags__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(10);
  /* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(1);
  /**
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  
  
  
  
  
  const OVERRIDE_CONSOLE_METHODS = ['error', 'trace', 'warn'];
  const DIMMED_NODE_CONSOLE_COLOR = '\x1b[2m%s\x1b[0m'; // React's custom built component stack strings match "\s{4}in"
  // Chrome's prefix matches "\s{4}at"
  
  const PREFIX_REGEX = /\s{4}(in|at)\s{1}/; // Firefox and Safari have no prefix ("")
  // but we can fallback to looking for location info (e.g. "foo.js:12:345")
  
  const ROW_COLUMN_NUMBER_REGEX = /:\d+:\d+(\n|$)/;
  function isStringComponentStack(text) {
    return PREFIX_REGEX.test(text) || ROW_COLUMN_NUMBER_REGEX.test(text);
  }
  const STYLE_DIRECTIVE_REGEX = /^%c/; // This function tells whether or not the arguments for a console
  // method has been overridden by the patchForStrictMode function.
  // If it has we'll need to do some special formatting of the arguments
  // so the console color stays consistent
  
  function isStrictModeOverride(args, method) {
    return args.length >= 2 && STYLE_DIRECTIVE_REGEX.test(args[0]) && args[1] === `color: ${getConsoleColor(method) || ''}`;
  }
  
  function getConsoleColor(method) {
    switch (method) {
      case 'warn':
        return consoleSettingsRef.browserTheme === 'light' ? "rgba(250, 180, 50, 0.75)" : "rgba(250, 180, 50, 0.5)";
  
      case 'error':
        return consoleSettingsRef.browserTheme === 'light' ? "rgba(250, 123, 130, 0.75)" : "rgba(250, 123, 130, 0.5)";
  
      case 'log':
      default:
        return consoleSettingsRef.browserTheme === 'light' ? "rgba(125, 125, 125, 0.75)" : "rgba(125, 125, 125, 0.5)";
    }
  }
  
  const injectedRenderers = new Map();
  let targetConsole = console;
  let targetConsoleMethods = {};
  
  for (const method in console) {
    targetConsoleMethods[method] = console[method];
  }
  
  let unpatchFn = null;
  let isNode = false;
  
  try {
    isNode = undefined === global;
  } catch (error) {} // Enables e.g. Jest tests to inject a mock console object.
  
  
  function dangerous_setTargetConsoleForTesting(targetConsoleForTesting) {
    targetConsole = targetConsoleForTesting;
    targetConsoleMethods = {};
  
    for (const method in targetConsole) {
      targetConsoleMethods[method] = console[method];
    }
  } // v16 renderers should use this method to inject internals necessary to generate a component stack.
  // These internals will be used if the console is patched.
  // Injecting them separately allows the console to easily be patched or un-patched later (at runtime).
  
  function registerRenderer(renderer, onErrorOrWarning) {
    const {
      currentDispatcherRef,
      getCurrentFiber,
      findFiberByHostInstance,
      version
    } = renderer; // Ignore React v15 and older because they don't expose a component stack anyway.
  
    if (typeof findFiberByHostInstance !== 'function') {
      return;
    } // currentDispatcherRef gets injected for v16.8+ to support hooks inspection.
    // getCurrentFiber gets injected for v16.9+.
  
  
    if (currentDispatcherRef != null && typeof getCurrentFiber === 'function') {
      const {
        ReactTypeOfWork
      } = Object(_renderer__WEBPACK_IMPORTED_MODULE_1__[/* getInternalReactConstants */ "b"])(version);
      injectedRenderers.set(renderer, {
        currentDispatcherRef,
        getCurrentFiber,
        workTagMap: ReactTypeOfWork,
        onErrorOrWarning
      });
    }
  }
  const consoleSettingsRef = {
    appendComponentStack: false,
    breakOnConsoleErrors: false,
    showInlineWarningsAndErrors: false,
    hideConsoleLogsInStrictMode: false,
    browserTheme: 'dark'
  };
  // Patches console methods to append component stack for the current fiber.
  // Call unpatch() to remove the injected behavior.
  function patch({
    appendComponentStack,
    breakOnConsoleErrors,
    showInlineWarningsAndErrors,
    hideConsoleLogsInStrictMode,
    browserTheme
  }) {
    // Settings may change after we've patched the console.
    // Using a shared ref allows the patch function to read the latest values.
    consoleSettingsRef.appendComponentStack = appendComponentStack;
    consoleSettingsRef.breakOnConsoleErrors = breakOnConsoleErrors;
    consoleSettingsRef.showInlineWarningsAndErrors = showInlineWarningsAndErrors;
    consoleSettingsRef.hideConsoleLogsInStrictMode = hideConsoleLogsInStrictMode;
    consoleSettingsRef.browserTheme = browserTheme;
  
    if (appendComponentStack || breakOnConsoleErrors || showInlineWarningsAndErrors) {
      if (unpatchFn !== null) {
        // Don't patch twice.
        return;
      }
  
      const originalConsoleMethods = {};
  
      unpatchFn = () => {
        for (const method in originalConsoleMethods) {
          try {
            targetConsole[method] = originalConsoleMethods[method];
          } catch (error) {}
        }
      };
  
      OVERRIDE_CONSOLE_METHODS.forEach(method => {
        try {
          const originalMethod = originalConsoleMethods[method] = targetConsole[method].__REACT_DEVTOOLS_ORIGINAL_METHOD__ ? targetConsole[method].__REACT_DEVTOOLS_ORIGINAL_METHOD__ : targetConsole[method];
  
          const overrideMethod = (...args) => {
            let shouldAppendWarningStack = false;
  
            if (method !== 'log') {
              if (consoleSettingsRef.appendComponentStack) {
                const lastArg = args.length > 0 ? args[args.length - 1] : null;
                const alreadyHasComponentStack = typeof lastArg === 'string' && isStringComponentStack(lastArg); // If we are ever called with a string that already has a component stack,
                // e.g. a React error/warning, don't append a second stack.
  
                shouldAppendWarningStack = !alreadyHasComponentStack;
              }
            }
  
            const shouldShowInlineWarningsAndErrors = consoleSettingsRef.showInlineWarningsAndErrors && (method === 'error' || method === 'warn'); // Search for the first renderer that has a current Fiber.
            // We don't handle the edge case of stacks for more than one (e.g. interleaved renderers?)
            // eslint-disable-next-line no-for-of-loops/no-for-of-loops
  
            for (const {
              currentDispatcherRef,
              getCurrentFiber,
              onErrorOrWarning,
              workTagMap
            } of injectedRenderers.values()) {
              const current = getCurrentFiber();
  
              if (current != null) {
                try {
                  if (shouldShowInlineWarningsAndErrors) {
                    // patch() is called by two places: (1) the hook and (2) the renderer backend.
                    // The backend is what implements a message queue, so it's the only one that injects onErrorOrWarning.
                    if (typeof onErrorOrWarning === 'function') {
                      onErrorOrWarning(current, method, // Copy args before we mutate them (e.g. adding the component stack)
                      args.slice());
                    }
                  }
  
                  if (shouldAppendWarningStack) {
                    const componentStack = Object(_DevToolsFiberComponentStack__WEBPACK_IMPORTED_MODULE_2__[/* getStackByFiberInDevAndProd */ "b"])(workTagMap, current, currentDispatcherRef);
  
                    if (componentStack !== '') {
                      if (isStrictModeOverride(args, method)) {
                        args[0] = `${args[0]} %s`;
                        args.push(componentStack);
                      } else {
                        args.push(componentStack);
                      }
                    }
                  }
                } catch (error) {
                  // Don't let a DevTools or React internal error interfere with logging.
                  setTimeout(() => {
                    throw error;
                  }, 0);
                } finally {
                  break;
                }
              }
            }
  
            if (consoleSettingsRef.breakOnConsoleErrors) {
              // --- Welcome to debugging with React DevTools ---
              // This debugger statement means that you've enabled the "break on warnings" feature.
              // Use the browser's Call Stack panel to step out of this override function-
              // to where the original warning or error was logged.
              // eslint-disable-next-line no-debugger
              debugger;
            }
  
            originalMethod(...args);
          };
  
          overrideMethod.__REACT_DEVTOOLS_ORIGINAL_METHOD__ = originalMethod;
          originalMethod.__REACT_DEVTOOLS_OVERRIDE_METHOD__ = overrideMethod;
          targetConsole[method] = overrideMethod;
        } catch (error) {}
      });
    } else {
      unpatch();
    }
  } // Removed component stack patch from console methods.
  
  function unpatch() {
    if (unpatchFn !== null) {
      unpatchFn();
      unpatchFn = null;
    }
  }
  let unpatchForStrictModeFn = null; // NOTE: KEEP IN SYNC with src/hook.js:patchConsoleForInitialRenderInStrictMode
  
  function patchForStrictMode() {
    if (react_devtools_feature_flags__WEBPACK_IMPORTED_MODULE_3__[/* consoleManagedByDevToolsDuringStrictMode */ "a"]) {
      const overrideConsoleMethods = ['error', 'group', 'groupCollapsed', 'info', 'log', 'trace', 'warn'];
  
      if (unpatchForStrictModeFn !== null) {
        // Don't patch twice.
        return;
      }
  
      const originalConsoleMethods = {};
  
      unpatchForStrictModeFn = () => {
        for (const method in originalConsoleMethods) {
          try {
            targetConsole[method] = originalConsoleMethods[method];
          } catch (error) {}
        }
      };
  
      overrideConsoleMethods.forEach(method => {
        try {
          const originalMethod = originalConsoleMethods[method] = targetConsole[method].__REACT_DEVTOOLS_STRICT_MODE_ORIGINAL_METHOD__ ? targetConsole[method].__REACT_DEVTOOLS_STRICT_MODE_ORIGINAL_METHOD__ : targetConsole[method];
  
          const overrideMethod = (...args) => {
            if (!consoleSettingsRef.hideConsoleLogsInStrictMode) {
              // Dim the text color of the double logs if we're not
              // hiding them.
              if (isNode) {
                originalMethod(DIMMED_NODE_CONSOLE_COLOR, Object(_utils__WEBPACK_IMPORTED_MODULE_0__[/* format */ "f"])(...args));
              } else {
                const color = getConsoleColor(method);
  
                if (color) {
                  originalMethod(...Object(_utils__WEBPACK_IMPORTED_MODULE_0__[/* formatWithStyles */ "g"])(args, `color: ${color}`));
                } else {
                  throw Error('Console color is not defined');
                }
              }
            }
          };
  
          overrideMethod.__REACT_DEVTOOLS_STRICT_MODE_ORIGINAL_METHOD__ = originalMethod;
          originalMethod.__REACT_DEVTOOLS_STRICT_MODE_OVERRIDE_METHOD__ = overrideMethod;
          targetConsole[method] = overrideMethod;
        } catch (error) {}
      });
    }
  } // NOTE: KEEP IN SYNC with src/hook.js:unpatchConsoleForInitialRenderInStrictMode
  
  function unpatchForStrictMode() {
    if (react_devtools_feature_flags__WEBPACK_IMPORTED_MODULE_3__[/* consoleManagedByDevToolsDuringStrictMode */ "a"]) {
      if (unpatchForStrictModeFn !== null) {
        unpatchForStrictModeFn();
        unpatchForStrictModeFn = null;
      }
    }
  }
  function patchConsoleUsingWindowValues() {
    var _castBool, _castBool2, _castBool3, _castBool4, _castBrowserTheme;
  
    const appendComponentStack = (_castBool = Object(_utils__WEBPACK_IMPORTED_MODULE_4__[/* castBool */ "a"])(window.__REACT_DEVTOOLS_APPEND_COMPONENT_STACK__)) !== null && _castBool !== void 0 ? _castBool : true;
    const breakOnConsoleErrors = (_castBool2 = Object(_utils__WEBPACK_IMPORTED_MODULE_4__[/* castBool */ "a"])(window.__REACT_DEVTOOLS_BREAK_ON_CONSOLE_ERRORS__)) !== null && _castBool2 !== void 0 ? _castBool2 : false;
    const showInlineWarningsAndErrors = (_castBool3 = Object(_utils__WEBPACK_IMPORTED_MODULE_4__[/* castBool */ "a"])(window.__REACT_DEVTOOLS_SHOW_INLINE_WARNINGS_AND_ERRORS__)) !== null && _castBool3 !== void 0 ? _castBool3 : true;
    const hideConsoleLogsInStrictMode = (_castBool4 = Object(_utils__WEBPACK_IMPORTED_MODULE_4__[/* castBool */ "a"])(window.__REACT_DEVTOOLS_HIDE_CONSOLE_LOGS_IN_STRICT_MODE__)) !== null && _castBool4 !== void 0 ? _castBool4 : false;
    const browserTheme = (_castBrowserTheme = Object(_utils__WEBPACK_IMPORTED_MODULE_4__[/* castBrowserTheme */ "b"])(window.__REACT_DEVTOOLS_BROWSER_THEME__)) !== null && _castBrowserTheme !== void 0 ? _castBrowserTheme : 'dark';
    patch({
      appendComponentStack,
      breakOnConsoleErrors,
      showInlineWarningsAndErrors,
      hideConsoleLogsInStrictMode,
      browserTheme
    });
  } // After receiving cached console patch settings from React Native, we set them on window.
  // When the console is initially patched (in renderer.js and hook.js), these values are read.
  // The browser extension (etc.) sets these values on window, but through another method.
  
  function writeConsolePatchSettingsToWindow(settings) {
    window.__REACT_DEVTOOLS_APPEND_COMPONENT_STACK__ = settings.appendComponentStack;
    window.__REACT_DEVTOOLS_BREAK_ON_CONSOLE_ERRORS__ = settings.breakOnConsoleErrors;
    window.__REACT_DEVTOOLS_SHOW_INLINE_WARNINGS_AND_ERRORS__ = settings.showInlineWarningsAndErrors;
    window.__REACT_DEVTOOLS_HIDE_CONSOLE_LOGS_IN_STRICT_MODE__ = settings.hideConsoleLogsInStrictMode;
    window.__REACT_DEVTOOLS_BROWSER_THEME__ = settings.browserTheme;
  }
  /* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(21)))
  
  /***/ }),
  /* 10 */
  /***/ (function(module, __webpack_exports__, __webpack_require__) {
  
  "use strict";
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return consoleManagedByDevToolsDuringStrictMode; });
  /* unused harmony export enableLogger */
  /* unused harmony export enableNamedHooksFeature */
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return enableProfilerChangedHookIndices; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return enableStyleXFeatures; });
  /* unused harmony export isInternalFacebookBuild */
  /* unused harmony export enableProfilerComponentTree */
  /**
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  
  /************************************************************************
   * This file is forked between different DevTools implementations.
   * It should never be imported directly!
   * It should always be imported from "react-devtools-feature-flags".
   ************************************************************************/
  const consoleManagedByDevToolsDuringStrictMode = true;
  const enableLogger = false;
  const enableNamedHooksFeature = true;
  const enableProfilerChangedHookIndices = true;
  const enableStyleXFeatures = false;
  const isInternalFacebookBuild = false;
  const enableProfilerComponentTree = true;
  /************************************************************************
   * Do not edit the code below.
   * It ensures this fork exports the same types as the default flags file.
   ************************************************************************/
  
  // Flow magic to verify the exports of this file match the original version.
  null;
  
  /***/ }),
  /* 11 */
  /***/ (function(module, __webpack_exports__, __webpack_require__) {
  
  "use strict";
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return EventEmitter; });
  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
  
  /**
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  class EventEmitter {
    constructor() {
      _defineProperty(this, "listenersMap", new Map());
    }
  
    addListener(event, listener) {
      const listeners = this.listenersMap.get(event);
  
      if (listeners === undefined) {
        this.listenersMap.set(event, [listener]);
      } else {
        const index = listeners.indexOf(listener);
  
        if (index < 0) {
          listeners.push(listener);
        }
      }
    }
  
    emit(event, ...args) {
      const listeners = this.listenersMap.get(event);
  
      if (listeners !== undefined) {
        if (listeners.length === 1) {
          // No need to clone or try/catch
          const listener = listeners[0];
          listener.apply(null, args);
        } else {
          let didThrow = false;
          let caughtError = null;
          const clonedListeners = Array.from(listeners);
  
          for (let i = 0; i < clonedListeners.length; i++) {
            const listener = clonedListeners[i];
  
            try {
              listener.apply(null, args);
            } catch (error) {
              if (caughtError === null) {
                didThrow = true;
                caughtError = error;
              }
            }
          }
  
          if (didThrow) {
            throw caughtError;
          }
        }
      }
    }
  
    removeAllListeners() {
      this.listenersMap.clear();
    }
  
    removeListener(event, listener) {
      const listeners = this.listenersMap.get(event);
  
      if (listeners !== undefined) {
        const index = listeners.indexOf(listener);
  
        if (index >= 0) {
          listeners.splice(index, 1);
        }
      }
    }
  
  }
  
  /***/ }),
  /* 12 */
  /***/ (function(module, __webpack_exports__, __webpack_require__) {
  
  "use strict";
  __webpack_require__.r(__webpack_exports__);
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BRIDGE_PROTOCOL", function() { return BRIDGE_PROTOCOL; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "currentBridgeProtocol", function() { return currentBridgeProtocol; });
  /* harmony import */ var _events__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(11);
  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
  
  /**
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  
  const BATCH_DURATION = 100; // This message specifies the version of the DevTools protocol currently supported by the backend,
  // as well as the earliest NPM version (e.g. "4.13.0") that protocol is supported by on the frontend.
  // This enables an older frontend to display an upgrade message to users for a newer, unsupported backend.
  
  // Bump protocol version whenever a backwards breaking change is made
  // in the messages sent between BackendBridge and FrontendBridge.
  // This mapping is embedded in both frontend and backend builds.
  //
  // The backend protocol will always be the latest entry in the BRIDGE_PROTOCOL array.
  //
  // When an older frontend connects to a newer backend,
  // the backend can send the minNpmVersion and the frontend can display an NPM upgrade prompt.
  //
  // When a newer frontend connects with an older protocol version,
  // the frontend can use the embedded minNpmVersion/maxNpmVersion values to display a downgrade prompt.
  const BRIDGE_PROTOCOL = [// This version technically never existed,
  // but a backwards breaking change was added in 4.11,
  // so the safest guess to downgrade the frontend would be to version 4.10.
  {
    version: 0,
    minNpmVersion: '"<4.11.0"',
    maxNpmVersion: '"<4.11.0"'
  }, // Versions 4.11.x – 4.12.x contained the backwards breaking change,
  // but we didn't add the "fix" of checking the protocol version until 4.13,
  // so we don't recommend downgrading to 4.11 or 4.12.
  {
    version: 1,
    minNpmVersion: '4.13.0',
    maxNpmVersion: '4.21.0'
  }, // Version 2 adds a StrictMode-enabled and supports-StrictMode bits to add-root operation.
  {
    version: 2,
    minNpmVersion: '4.22.0',
    maxNpmVersion: null
  }];
  const currentBridgeProtocol = BRIDGE_PROTOCOL[BRIDGE_PROTOCOL.length - 1];
  
  class Bridge extends _events__WEBPACK_IMPORTED_MODULE_0__[/* default */ "a"] {
    constructor(wall) {
      super();
  
      _defineProperty(this, "_isShutdown", false);
  
      _defineProperty(this, "_messageQueue", []);
  
      _defineProperty(this, "_timeoutID", null);
  
      _defineProperty(this, "_wallUnlisten", null);
  
      _defineProperty(this, "_flush", () => {
        // This method is used after the bridge is marked as destroyed in shutdown sequence,
        // so we do not bail out if the bridge marked as destroyed.
        // It is a private method that the bridge ensures is only called at the right times.
        if (this._timeoutID !== null) {
          clearTimeout(this._timeoutID);
          this._timeoutID = null;
        }
  
        if (this._messageQueue.length) {
          for (let i = 0; i < this._messageQueue.length; i += 2) {
            this._wall.send(this._messageQueue[i], ...this._messageQueue[i + 1]);
          }
  
          this._messageQueue.length = 0; // Check again for queued messages in BATCH_DURATION ms. This will keep
          // flushing in a loop as long as messages continue to be added. Once no
          // more are, the timer expires.
  
          this._timeoutID = setTimeout(this._flush, BATCH_DURATION);
        }
      });
  
      _defineProperty(this, "overrideValueAtPath", ({
        id,
        path,
        rendererID,
        type,
        value
      }) => {
        switch (type) {
          case 'context':
            this.send('overrideContext', {
              id,
              path,
              rendererID,
              wasForwarded: true,
              value
            });
            break;
  
          case 'hooks':
            this.send('overrideHookState', {
              id,
              path,
              rendererID,
              wasForwarded: true,
              value
            });
            break;
  
          case 'props':
            this.send('overrideProps', {
              id,
              path,
              rendererID,
              wasForwarded: true,
              value
            });
            break;
  
          case 'state':
            this.send('overrideState', {
              id,
              path,
              rendererID,
              wasForwarded: true,
              value
            });
            break;
        }
      });
  
      this._wall = wall;
      this._wallUnlisten = wall.listen(message => {
        if (message && message.event) {
          this.emit(message.event, message.payload);
        }
      }) || null; // Temporarily support older standalone front-ends sending commands to newer embedded backends.
      // We do this because React Native embeds the React DevTools backend,
      // but cannot control which version of the frontend users use.
  
      this.addListener('overrideValueAtPath', this.overrideValueAtPath);
    } // Listening directly to the wall isn't advised.
    // It can be used to listen for legacy (v3) messages (since they use a different format).
  
  
    get wall() {
      return this._wall;
    }
  
    send(event, ...payload) {
      if (this._isShutdown) {
        console.warn(`Cannot send message "${event}" through a Bridge that has been shutdown.`);
        return;
      } // When we receive a message:
      // - we add it to our queue of messages to be sent
      // - if there hasn't been a message recently, we set a timer for 0 ms in
      //   the future, allowing all messages created in the same tick to be sent
      //   together
      // - if there *has* been a message flushed in the last BATCH_DURATION ms
      //   (or we're waiting for our setTimeout-0 to fire), then _timeoutID will
      //   be set, and we'll simply add to the queue and wait for that
  
  
      this._messageQueue.push(event, payload);
  
      if (!this._timeoutID) {
        this._timeoutID = setTimeout(this._flush, 0);
      }
    }
  
    shutdown() {
      if (this._isShutdown) {
        console.warn('Bridge was already shutdown.');
        return;
      } // Queue the shutdown outgoing message for subscribers.
  
  
      this.send('shutdown'); // Mark this bridge as destroyed, i.e. disable its public API.
  
      this._isShutdown = true; // Disable the API inherited from EventEmitter that can add more listeners and send more messages.
      // $FlowFixMe This property is not writable.
  
      this.addListener = function () {}; // $FlowFixMe This property is not writable.
  
  
      this.emit = function () {}; // NOTE: There's also EventEmitter API like `on` and `prependListener` that we didn't add to our Flow type of EventEmitter.
      // Unsubscribe this bridge incoming message listeners to be sure, and so they don't have to do that.
  
  
      this.removeAllListeners(); // Stop accepting and emitting incoming messages from the wall.
  
      const wallUnlisten = this._wallUnlisten;
  
      if (wallUnlisten) {
        wallUnlisten();
      } // Synchronously flush all queued outgoing messages.
      // At this step the subscribers' code may run in this call stack.
  
  
      do {
        this._flush();
      } while (this._messageQueue.length); // Make sure once again that there is no dangling timer.
  
  
      if (this._timeoutID !== null) {
        clearTimeout(this._timeoutID);
        this._timeoutID = null;
      }
    }
  
  }
  
  /* harmony default export */ __webpack_exports__["default"] = (Bridge);
  
  /***/ }),
  /* 13 */
  /***/ (function(module, __webpack_exports__, __webpack_require__) {
  
  "use strict";
  
  // EXPORTS
  __webpack_require__.d(__webpack_exports__, "b", function() { return /* binding */ getInternalReactConstants; });
  __webpack_require__.d(__webpack_exports__, "a", function() { return /* binding */ attach; });
  
  // EXTERNAL MODULE: ../react-devtools-shared/src/types.js
  var types = __webpack_require__(0);
  
  // EXTERNAL MODULE: ../react-devtools-shared/src/utils.js
  var utils = __webpack_require__(1);
  
  // EXTERNAL MODULE: ../react-devtools-shared/src/backend/utils.js
  var backend_utils = __webpack_require__(4);
  
  // EXTERNAL MODULE: ../react-devtools-shared/src/constants.js
  var constants = __webpack_require__(3);
  
  // EXTERNAL MODULE: C:/Projects/react/build/oss-experimental/react-debug-tools/index.js
  var react_debug_tools = __webpack_require__(19);
  
  // EXTERNAL MODULE: ../react-devtools-shared/src/backend/console.js
  var backend_console = __webpack_require__(9);
  
  // EXTERNAL MODULE: ../react-devtools-shared/src/backend/ReactSymbols.js
  var ReactSymbols = __webpack_require__(2);
  
  // CONCATENATED MODULE: ../react-devtools-shared/src/backend/ReactFiberFlags.js
  /**
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  // This list of flags must be synced with the following file:
  // https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberFlags.js
  const NoFlags =
  /*                      */
  0b000000000000000000000000000;
  const PerformedWork =
  /*                */
  0b000000000000000000000000001;
  const Placement =
  /*                    */
  0b000000000000000000000000010;
  const DidCapture =
  /*                   */
  0b000000000000000000010000000;
  const Hydrating =
  /*                    */
  0b000000000000001000000000000;
  // EXTERNAL MODULE: ../react-devtools-shared/src/config/DevToolsFeatureFlags.extension-oss.js
  var DevToolsFeatureFlags_extension_oss = __webpack_require__(10);
  
  // CONCATENATED MODULE: ../shared/objectIs.js
  /**
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  
  /**
   * inlined Object.is polyfill to avoid requiring consumers ship their own
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
   */
  function is(x, y) {
    return x === y && (x !== 0 || 1 / x === 1 / y) || x !== x && y !== y // eslint-disable-line no-self-compare
    ;
  }
  
  const objectIs = // $FlowFixMe[method-unbinding]
  typeof Object.is === 'function' ? Object.is : is;
  /* harmony default export */ var shared_objectIs = (objectIs);
  // CONCATENATED MODULE: ../shared/hasOwnProperty.js
  /**
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  // $FlowFixMe[method-unbinding]
  const hasOwnProperty_hasOwnProperty = Object.prototype.hasOwnProperty;
  /* harmony default export */ var shared_hasOwnProperty = (hasOwnProperty_hasOwnProperty);
  // EXTERNAL MODULE: ../react-devtools-shared/src/isArray.js
  var isArray = __webpack_require__(5);
  
  // CONCATENATED MODULE: ../react-devtools-shared/src/backend/StyleX/utils.js
  /**
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  
  const cachedStyleNameToValueMap = new Map();
  function getStyleXData(data) {
    const sources = new Set();
    const resolvedStyles = {};
    crawlData(data, sources, resolvedStyles);
    return {
      sources: Array.from(sources).sort(),
      resolvedStyles
    };
  }
  function crawlData(data, sources, resolvedStyles) {
    if (data == null) {
      return;
    }
  
    if (Object(isArray["a" /* default */])(data)) {
      data.forEach(entry => {
        if (entry == null) {
          return;
        }
  
        if (Object(isArray["a" /* default */])(entry)) {
          crawlData(entry, sources, resolvedStyles);
        } else {
          crawlObjectProperties(entry, sources, resolvedStyles);
        }
      });
    } else {
      crawlObjectProperties(data, sources, resolvedStyles);
    }
  
    resolvedStyles = Object.fromEntries(Object.entries(resolvedStyles).sort());
  }
  
  function crawlObjectProperties(entry, sources, resolvedStyles) {
    const keys = Object.keys(entry);
    keys.forEach(key => {
      const value = entry[key];
  
      if (typeof value === 'string') {
        if (key === value) {
          // Special case; this key is the name of the style's source/file/module.
          sources.add(key);
        } else {
          resolvedStyles[key] = getPropertyValueForStyleName(value);
        }
      } else {
        const nestedStyle = {};
        resolvedStyles[key] = nestedStyle;
        crawlData([value], sources, nestedStyle);
      }
    });
  }
  
  function getPropertyValueForStyleName(styleName) {
    if (cachedStyleNameToValueMap.has(styleName)) {
      return cachedStyleNameToValueMap.get(styleName);
    }
  
    for (let styleSheetIndex = 0; styleSheetIndex < document.styleSheets.length; styleSheetIndex++) {
      const styleSheet = document.styleSheets[styleSheetIndex]; // $FlowFixMe Flow doesn't konw about these properties
  
      const rules = styleSheet.rules || styleSheet.cssRules; // $FlowFixMe `rules` is mixed
  
      for (let ruleIndex = 0; ruleIndex < rules.length; ruleIndex++) {
        // $FlowFixMe `rules` is mixed
        const rule = rules[ruleIndex]; // $FlowFixMe Flow doesn't konw about these properties
  
        const {
          cssText,
          selectorText,
          style
        } = rule;
  
        if (selectorText != null) {
          if (selectorText.startsWith(`.${styleName}`)) {
            const match = cssText.match(/{ *([a-z\-]+):/);
  
            if (match !== null) {
              const property = match[1];
              const value = style.getPropertyValue(property);
              cachedStyleNameToValueMap.set(styleName, value);
              return value;
            } else {
              return null;
            }
          }
        }
      }
    }
  
    return null;
  }
  // EXTERNAL MODULE: ../shared/isArray.js
  var shared_isArray = __webpack_require__(7);
  
  // CONCATENATED MODULE: ../react-devtools-timeline/src/constants.js
  /**
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  
  const REACT_TOTAL_NUM_LANES = 31; // Increment this number any time a backwards breaking change is made to the profiler metadata.
  
  const SCHEDULING_PROFILER_VERSION = 1;
  const SNAPSHOT_MAX_HEIGHT = 60;
  // EXTERNAL MODULE: ../react-devtools-shared/src/backend/DevToolsFiberComponentStack.js + 2 modules
  var DevToolsFiberComponentStack = __webpack_require__(14);
  
  // CONCATENATED MODULE: ../react-devtools-shared/src/backend/profilingHooks.js
  /**
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  
  
   // Add padding to the start/stop time of the profile.
  // This makes the UI nicer to use.
  
  const TIME_OFFSET = 10;
  let performanceTarget = null; // If performance exists and supports the subset of the User Timing API that we require.
  
  let supportsUserTiming = typeof performance !== 'undefined' && // $FlowFixMe[method-unbinding]
  typeof performance.mark === 'function' && // $FlowFixMe[method-unbinding]
  typeof performance.clearMarks === 'function';
  let supportsUserTimingV3 = false;
  
  if (supportsUserTiming) {
    const CHECK_V3_MARK = '__v3';
    const markOptions = {};
    Object.defineProperty(markOptions, 'startTime', {
      get: function () {
        supportsUserTimingV3 = true;
        return 0;
      },
      set: function () {}
    });
  
    try {
      // $FlowFixMe: Flow expects the User Timing level 2 API.
      performance.mark(CHECK_V3_MARK, markOptions);
    } catch (error) {// Ignore
    } finally {
      performance.clearMarks(CHECK_V3_MARK);
    }
  }
  
  if (supportsUserTimingV3) {
    performanceTarget = performance;
  } // Some environments (e.g. React Native / Hermes) don't support the performance API yet.
  
  
  const getCurrentTime = // $FlowFixMe[method-unbinding]
  typeof performance === 'object' && typeof performance.now === 'function' ? () => performance.now() : () => Date.now(); // Mocking the Performance Object (and User Timing APIs) for testing is fragile.
  // This API allows tests to directly override the User Timing APIs.
  
  function setPerformanceMock_ONLY_FOR_TESTING(performanceMock) {
    performanceTarget = performanceMock;
    supportsUserTiming = performanceMock !== null;
    supportsUserTimingV3 = performanceMock !== null;
  }
  function createProfilingHooks({
    getDisplayNameForFiber,
    getIsProfiling,
    getLaneLabelMap,
    workTagMap,
    currentDispatcherRef,
    reactVersion
  }) {
    let currentBatchUID = 0;
    let currentReactComponentMeasure = null;
    let currentReactMeasuresStack = [];
    let currentTimelineData = null;
    let currentFiberStacks = new Map();
    let isProfiling = false;
    let nextRenderShouldStartNewBatch = false;
  
    function getRelativeTime() {
      const currentTime = getCurrentTime();
  
      if (currentTimelineData) {
        if (currentTimelineData.startTime === 0) {
          currentTimelineData.startTime = currentTime - TIME_OFFSET;
        }
  
        return currentTime - currentTimelineData.startTime;
      }
  
      return 0;
    }
  
    function getInternalModuleRanges() {
      /* global __REACT_DEVTOOLS_GLOBAL_HOOK__ */
      if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.getInternalModuleRanges === 'function') {
        // Ask the DevTools hook for module ranges that may have been reported by the current renderer(s).
        // Don't do this eagerly like the laneToLabelMap,
        // because some modules might not yet have registered their boundaries when the renderer is injected.
        const ranges = __REACT_DEVTOOLS_GLOBAL_HOOK__.getInternalModuleRanges(); // This check would not be required,
        // except that it's possible for things to override __REACT_DEVTOOLS_GLOBAL_HOOK__.
  
  
        if (Object(shared_isArray["a" /* default */])(ranges)) {
          return ranges;
        }
      }
  
      return null;
    }
  
    function getTimelineData() {
      return currentTimelineData;
    }
  
    function laneToLanesArray(lanes) {
      const lanesArray = [];
      let lane = 1;
  
      for (let index = 0; index < REACT_TOTAL_NUM_LANES; index++) {
        if (lane & lanes) {
          lanesArray.push(lane);
        }
  
        lane *= 2;
      }
  
      return lanesArray;
    }
  
    const laneToLabelMap = typeof getLaneLabelMap === 'function' ? getLaneLabelMap() : null;
  
    function markMetadata() {
      markAndClear(`--react-version-${reactVersion}`);
      markAndClear(`--profiler-version-${SCHEDULING_PROFILER_VERSION}`);
      const ranges = getInternalModuleRanges();
  
      if (ranges) {
        for (let i = 0; i < ranges.length; i++) {
          const range = ranges[i];
  
          if (Object(shared_isArray["a" /* default */])(range) && range.length === 2) {
            const [startStackFrame, stopStackFrame] = ranges[i];
            markAndClear(`--react-internal-module-start-${startStackFrame}`);
            markAndClear(`--react-internal-module-stop-${stopStackFrame}`);
          }
        }
      }
  
      if (laneToLabelMap != null) {
        const labels = Array.from(laneToLabelMap.values()).join(',');
        markAndClear(`--react-lane-labels-${labels}`);
      }
    }
  
    function markAndClear(markName) {
      // This method won't be called unless these functions are defined, so we can skip the extra typeof check.
      performanceTarget.mark(markName);
      performanceTarget.clearMarks(markName);
    }
  
    function recordReactMeasureStarted(type, lanes) {
      // Decide what depth thi work should be rendered at, based on what's on the top of the stack.
      // It's okay to render over top of "idle" work but everything else should be on its own row.
      let depth = 0;
  
      if (currentReactMeasuresStack.length > 0) {
        const top = currentReactMeasuresStack[currentReactMeasuresStack.length - 1];
        depth = top.type === 'render-idle' ? top.depth : top.depth + 1;
      }
  
      const lanesArray = laneToLanesArray(lanes);
      const reactMeasure = {
        type,
        batchUID: currentBatchUID,
        depth,
        lanes: lanesArray,
        timestamp: getRelativeTime(),
        duration: 0
      };
      currentReactMeasuresStack.push(reactMeasure);
  
      if (currentTimelineData) {
        const {
          batchUIDToMeasuresMap,
          laneToReactMeasureMap
        } = currentTimelineData;
        let reactMeasures = batchUIDToMeasuresMap.get(currentBatchUID);
  
        if (reactMeasures != null) {
          reactMeasures.push(reactMeasure);
        } else {
          batchUIDToMeasuresMap.set(currentBatchUID, [reactMeasure]);
        }
  
        lanesArray.forEach(lane => {
          reactMeasures = laneToReactMeasureMap.get(lane);
  
          if (reactMeasures) {
            reactMeasures.push(reactMeasure);
          }
        });
      }
    }
  
    function recordReactMeasureCompleted(type) {
      const currentTime = getRelativeTime();
  
      if (currentReactMeasuresStack.length === 0) {
        console.error('Unexpected type "%s" completed at %sms while currentReactMeasuresStack is empty.', type, currentTime); // Ignore work "completion" user timing mark that doesn't complete anything
  
        return;
      }
  
      const top = currentReactMeasuresStack.pop();
  
      if (top.type !== type) {
        console.error('Unexpected type "%s" completed at %sms before "%s" completed.', type, currentTime, top.type);
      } // $FlowFixMe This property should not be writable outside of this function.
  
  
      top.duration = currentTime - top.timestamp;
  
      if (currentTimelineData) {
        currentTimelineData.duration = getRelativeTime() + TIME_OFFSET;
      }
    }
  
    function markCommitStarted(lanes) {
      if (isProfiling) {
        recordReactMeasureStarted('commit', lanes); // TODO (timeline) Re-think this approach to "batching"; I don't think it works for Suspense or pre-rendering.
        // This issue applies to the User Timing data also.
  
        nextRenderShouldStartNewBatch = true;
      }
  
      if (supportsUserTimingV3) {
        markAndClear(`--commit-start-${lanes}`); // Some metadata only needs to be logged once per session,
        // but if profiling information is being recorded via the Performance tab,
        // DevTools has no way of knowing when the recording starts.
        // Because of that, we log thie type of data periodically (once per commit).
  
        markMetadata();
      }
    }
  
    function markCommitStopped() {
      if (isProfiling) {
        recordReactMeasureCompleted('commit');
        recordReactMeasureCompleted('render-idle');
      }
  
      if (supportsUserTimingV3) {
        markAndClear('--commit-stop');
      }
    }
  
    function markComponentRenderStarted(fiber) {
      if (isProfiling || supportsUserTimingV3) {
        const componentName = getDisplayNameForFiber(fiber) || 'Unknown';
  
        if (isProfiling) {
          // TODO (timeline) Record and cache component stack
          if (isProfiling) {
            currentReactComponentMeasure = {
              componentName,
              duration: 0,
              timestamp: getRelativeTime(),
              type: 'render',
              warning: null
            };
          }
        }
  
        if (supportsUserTimingV3) {
          markAndClear(`--component-render-start-${componentName}`);
        }
      }
    }
  
    function markComponentRenderStopped() {
      if (isProfiling) {
        if (currentReactComponentMeasure) {
          if (currentTimelineData) {
            currentTimelineData.componentMeasures.push(currentReactComponentMeasure);
          } // $FlowFixMe[incompatible-use] found when upgrading Flow
  
  
          currentReactComponentMeasure.duration = // $FlowFixMe[incompatible-use] found when upgrading Flow
          getRelativeTime() - currentReactComponentMeasure.timestamp;
          currentReactComponentMeasure = null;
        }
      }
  
      if (supportsUserTimingV3) {
        markAndClear('--component-render-stop');
      }
    }
  
    function markComponentLayoutEffectMountStarted(fiber) {
      if (isProfiling || supportsUserTimingV3) {
        const componentName = getDisplayNameForFiber(fiber) || 'Unknown';
  
        if (isProfiling) {
          // TODO (timeline) Record and cache component stack
          if (isProfiling) {
            currentReactComponentMeasure = {
              componentName,
              duration: 0,
              timestamp: getRelativeTime(),
              type: 'layout-effect-mount',
              warning: null
            };
          }
        }
  
        if (supportsUserTimingV3) {
          markAndClear(`--component-layout-effect-mount-start-${componentName}`);
        }
      }
    }
  
    function markComponentLayoutEffectMountStopped() {
      if (isProfiling) {
        if (currentReactComponentMeasure) {
          if (currentTimelineData) {
            currentTimelineData.componentMeasures.push(currentReactComponentMeasure);
          } // $FlowFixMe[incompatible-use] found when upgrading Flow
  
  
          currentReactComponentMeasure.duration = // $FlowFixMe[incompatible-use] found when upgrading Flow
          getRelativeTime() - currentReactComponentMeasure.timestamp;
          currentReactComponentMeasure = null;
        }
      }
  
      if (supportsUserTimingV3) {
        markAndClear('--component-layout-effect-mount-stop');
      }
    }
  
    function markComponentLayoutEffectUnmountStarted(fiber) {
      if (isProfiling || supportsUserTimingV3) {
        const componentName = getDisplayNameForFiber(fiber) || 'Unknown';
  
        if (isProfiling) {
          // TODO (timeline) Record and cache component stack
          if (isProfiling) {
            currentReactComponentMeasure = {
              componentName,
              duration: 0,
              timestamp: getRelativeTime(),
              type: 'layout-effect-unmount',
              warning: null
            };
          }
        }
  
        if (supportsUserTimingV3) {
          markAndClear(`--component-layout-effect-unmount-start-${componentName}`);
        }
      }
    }
  
    function markComponentLayoutEffectUnmountStopped() {
      if (isProfiling) {
        if (currentReactComponentMeasure) {
          if (currentTimelineData) {
            currentTimelineData.componentMeasures.push(currentReactComponentMeasure);
          } // $FlowFixMe[incompatible-use] found when upgrading Flow
  
  
          currentReactComponentMeasure.duration = // $FlowFixMe[incompatible-use] found when upgrading Flow
          getRelativeTime() - currentReactComponentMeasure.timestamp;
          currentReactComponentMeasure = null;
        }
      }
  
      if (supportsUserTimingV3) {
        markAndClear('--component-layout-effect-unmount-stop');
      }
    }
  
    function markComponentPassiveEffectMountStarted(fiber) {
      if (isProfiling || supportsUserTimingV3) {
        const componentName = getDisplayNameForFiber(fiber) || 'Unknown';
  
        if (isProfiling) {
          // TODO (timeline) Record and cache component stack
          if (isProfiling) {
            currentReactComponentMeasure = {
              componentName,
              duration: 0,
              timestamp: getRelativeTime(),
              type: 'passive-effect-mount',
              warning: null
            };
          }
        }
  
        if (supportsUserTimingV3) {
          markAndClear(`--component-passive-effect-mount-start-${componentName}`);
        }
      }
    }
  
    function markComponentPassiveEffectMountStopped() {
      if (isProfiling) {
        if (currentReactComponentMeasure) {
          if (currentTimelineData) {
            currentTimelineData.componentMeasures.push(currentReactComponentMeasure);
          } // $FlowFixMe[incompatible-use] found when upgrading Flow
  
  
          currentReactComponentMeasure.duration = // $FlowFixMe[incompatible-use] found when upgrading Flow
          getRelativeTime() - currentReactComponentMeasure.timestamp;
          currentReactComponentMeasure = null;
        }
      }
  
      if (supportsUserTimingV3) {
        markAndClear('--component-passive-effect-mount-stop');
      }
    }
  
    function markComponentPassiveEffectUnmountStarted(fiber) {
      if (isProfiling || supportsUserTimingV3) {
        const componentName = getDisplayNameForFiber(fiber) || 'Unknown';
  
        if (isProfiling) {
          // TODO (timeline) Record and cache component stack
          if (isProfiling) {
            currentReactComponentMeasure = {
              componentName,
              duration: 0,
              timestamp: getRelativeTime(),
              type: 'passive-effect-unmount',
              warning: null
            };
          }
        }
  
        if (supportsUserTimingV3) {
          markAndClear(`--component-passive-effect-unmount-start-${componentName}`);
        }
      }
    }
  
    function markComponentPassiveEffectUnmountStopped() {
      if (isProfiling) {
        if (currentReactComponentMeasure) {
          if (currentTimelineData) {
            currentTimelineData.componentMeasures.push(currentReactComponentMeasure);
          } // $FlowFixMe[incompatible-use] found when upgrading Flow
  
  
          currentReactComponentMeasure.duration = // $FlowFixMe[incompatible-use] found when upgrading Flow
          getRelativeTime() - currentReactComponentMeasure.timestamp;
          currentReactComponentMeasure = null;
        }
      }
  
      if (supportsUserTimingV3) {
        markAndClear('--component-passive-effect-unmount-stop');
      }
    }
  
    function markComponentErrored(fiber, thrownValue, lanes) {
      if (isProfiling || supportsUserTimingV3) {
        const componentName = getDisplayNameForFiber(fiber) || 'Unknown';
        const phase = fiber.alternate === null ? 'mount' : 'update';
        let message = '';
  
        if (thrownValue !== null && typeof thrownValue === 'object' && typeof thrownValue.message === 'string') {
          message = thrownValue.message;
        } else if (typeof thrownValue === 'string') {
          message = thrownValue;
        }
  
        if (isProfiling) {
          // TODO (timeline) Record and cache component stack
          if (currentTimelineData) {
            currentTimelineData.thrownErrors.push({
              componentName,
              message,
              phase,
              timestamp: getRelativeTime(),
              type: 'thrown-error'
            });
          }
        }
  
        if (supportsUserTimingV3) {
          markAndClear(`--error-${componentName}-${phase}-${message}`);
        }
      }
    }
  
    const PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map; // $FlowFixMe: Flow cannot handle polymorphic WeakMaps
  
    const wakeableIDs = new PossiblyWeakMap();
    let wakeableID = 0;
  
    function getWakeableID(wakeable) {
      if (!wakeableIDs.has(wakeable)) {
        wakeableIDs.set(wakeable, wakeableID++);
      }
  
      return wakeableIDs.get(wakeable);
    }
  
    function markComponentSuspended(fiber, wakeable, lanes) {
      if (isProfiling || supportsUserTimingV3) {
        const eventType = wakeableIDs.has(wakeable) ? 'resuspend' : 'suspend';
        const id = getWakeableID(wakeable);
        const componentName = getDisplayNameForFiber(fiber) || 'Unknown';
        const phase = fiber.alternate === null ? 'mount' : 'update'; // Following the non-standard fn.displayName convention,
        // frameworks like Relay may also annotate Promises with a displayName,
        // describing what operation/data the thrown Promise is related to.
        // When this is available we should pass it along to the Timeline.
  
        const displayName = wakeable.displayName || '';
        let suspenseEvent = null;
  
        if (isProfiling) {
          // TODO (timeline) Record and cache component stack
          suspenseEvent = {
            componentName,
            depth: 0,
            duration: 0,
            id: `${id}`,
            phase,
            promiseName: displayName,
            resolution: 'unresolved',
            timestamp: getRelativeTime(),
            type: 'suspense',
            warning: null
          };
  
          if (currentTimelineData) {
            currentTimelineData.suspenseEvents.push(suspenseEvent);
          }
        }
  
        if (supportsUserTimingV3) {
          markAndClear(`--suspense-${eventType}-${id}-${componentName}-${phase}-${lanes}-${displayName}`);
        }
  
        wakeable.then(() => {
          if (suspenseEvent) {
            suspenseEvent.duration = getRelativeTime() - suspenseEvent.timestamp;
            suspenseEvent.resolution = 'resolved';
          }
  
          if (supportsUserTimingV3) {
            markAndClear(`--suspense-resolved-${id}-${componentName}`);
          }
        }, () => {
          if (suspenseEvent) {
            suspenseEvent.duration = getRelativeTime() - suspenseEvent.timestamp;
            suspenseEvent.resolution = 'rejected';
          }
  
          if (supportsUserTimingV3) {
            markAndClear(`--suspense-rejected-${id}-${componentName}`);
          }
        });
      }
    }
  
    function markLayoutEffectsStarted(lanes) {
      if (isProfiling) {
        recordReactMeasureStarted('layout-effects', lanes);
      }
  
      if (supportsUserTimingV3) {
        markAndClear(`--layout-effects-start-${lanes}`);
      }
    }
  
    function markLayoutEffectsStopped() {
      if (isProfiling) {
        recordReactMeasureCompleted('layout-effects');
      }
  
      if (supportsUserTimingV3) {
        markAndClear('--layout-effects-stop');
      }
    }
  
    function markPassiveEffectsStarted(lanes) {
      if (isProfiling) {
        recordReactMeasureStarted('passive-effects', lanes);
      }
  
      if (supportsUserTimingV3) {
        markAndClear(`--passive-effects-start-${lanes}`);
      }
    }
  
    function markPassiveEffectsStopped() {
      if (isProfiling) {
        recordReactMeasureCompleted('passive-effects');
      }
  
      if (supportsUserTimingV3) {
        markAndClear('--passive-effects-stop');
      }
    }
  
    function markRenderStarted(lanes) {
      if (isProfiling) {
        if (nextRenderShouldStartNewBatch) {
          nextRenderShouldStartNewBatch = false;
          currentBatchUID++;
        } // If this is a new batch of work, wrap an "idle" measure around it.
        // Log it before the "render" measure to preserve the stack ordering.
  
  
        if (currentReactMeasuresStack.length === 0 || currentReactMeasuresStack[currentReactMeasuresStack.length - 1].type !== 'render-idle') {
          recordReactMeasureStarted('render-idle', lanes);
        }
  
        recordReactMeasureStarted('render', lanes);
      }
  
      if (supportsUserTimingV3) {
        markAndClear(`--render-start-${lanes}`);
      }
    }
  
    function markRenderYielded() {
      if (isProfiling) {
        recordReactMeasureCompleted('render');
      }
  
      if (supportsUserTimingV3) {
        markAndClear('--render-yield');
      }
    }
  
    function markRenderStopped() {
      if (isProfiling) {
        recordReactMeasureCompleted('render');
      }
  
      if (supportsUserTimingV3) {
        markAndClear('--render-stop');
      }
    }
  
    function markRenderScheduled(lane) {
      if (isProfiling) {
        if (currentTimelineData) {
          currentTimelineData.schedulingEvents.push({
            lanes: laneToLanesArray(lane),
            timestamp: getRelativeTime(),
            type: 'schedule-render',
            warning: null
          });
        }
      }
  
      if (supportsUserTimingV3) {
        markAndClear(`--schedule-render-${lane}`);
      }
    }
  
    function markForceUpdateScheduled(fiber, lane) {
      if (isProfiling || supportsUserTimingV3) {
        const componentName = getDisplayNameForFiber(fiber) || 'Unknown';
  
        if (isProfiling) {
          // TODO (timeline) Record and cache component stack
          if (currentTimelineData) {
            currentTimelineData.schedulingEvents.push({
              componentName,
              lanes: laneToLanesArray(lane),
              timestamp: getRelativeTime(),
              type: 'schedule-force-update',
              warning: null
            });
          }
        }
  
        if (supportsUserTimingV3) {
          markAndClear(`--schedule-forced-update-${lane}-${componentName}`);
        }
      }
    }
  
    function getParentFibers(fiber) {
      const parents = [];
      let parent = fiber;
  
      while (parent !== null) {
        parents.push(parent);
        parent = parent.return;
      }
  
      return parents;
    }
  
    function markStateUpdateScheduled(fiber, lane) {
      if (isProfiling || supportsUserTimingV3) {
        const componentName = getDisplayNameForFiber(fiber) || 'Unknown';
  
        if (isProfiling) {
          // TODO (timeline) Record and cache component stack
          if (currentTimelineData) {
            const event = {
              componentName,
              // Store the parent fibers so we can post process
              // them after we finish profiling
              lanes: laneToLanesArray(lane),
              timestamp: getRelativeTime(),
              type: 'schedule-state-update',
              warning: null
            };
            currentFiberStacks.set(event, getParentFibers(fiber)); // $FlowFixMe[incompatible-use] found when upgrading Flow
  
            currentTimelineData.schedulingEvents.push(event);
          }
        }
  
        if (supportsUserTimingV3) {
          markAndClear(`--schedule-state-update-${lane}-${componentName}`);
        }
      }
    }
  
    function toggleProfilingStatus(value) {
      if (isProfiling !== value) {
        isProfiling = value;
  
        if (isProfiling) {
          const internalModuleSourceToRanges = new Map();
  
          if (supportsUserTimingV3) {
            const ranges = getInternalModuleRanges();
  
            if (ranges) {
              for (let i = 0; i < ranges.length; i++) {
                const range = ranges[i];
  
                if (Object(shared_isArray["a" /* default */])(range) && range.length === 2) {
                  const [startStackFrame, stopStackFrame] = ranges[i];
                  markAndClear(`--react-internal-module-start-${startStackFrame}`);
                  markAndClear(`--react-internal-module-stop-${stopStackFrame}`);
                }
              }
            }
          }
  
          const laneToReactMeasureMap = new Map();
          let lane = 1;
  
          for (let index = 0; index < REACT_TOTAL_NUM_LANES; index++) {
            laneToReactMeasureMap.set(lane, []);
            lane *= 2;
          }
  
          currentBatchUID = 0;
          currentReactComponentMeasure = null;
          currentReactMeasuresStack = [];
          currentFiberStacks = new Map();
          currentTimelineData = {
            // Session wide metadata; only collected once.
            internalModuleSourceToRanges,
            laneToLabelMap: laneToLabelMap || new Map(),
            reactVersion,
            // Data logged by React during profiling session.
            componentMeasures: [],
            schedulingEvents: [],
            suspenseEvents: [],
            thrownErrors: [],
            // Data inferred based on what React logs.
            batchUIDToMeasuresMap: new Map(),
            duration: 0,
            laneToReactMeasureMap,
            startTime: 0,
            // Data only available in Chrome profiles.
            flamechart: [],
            nativeEvents: [],
            networkMeasures: [],
            otherUserTimingMarks: [],
            snapshots: [],
            snapshotHeight: 0
          };
          nextRenderShouldStartNewBatch = true;
        } else {
          // Postprocess Profile data
          if (currentTimelineData !== null) {
            currentTimelineData.schedulingEvents.forEach(event => {
              if (event.type === 'schedule-state-update') {
                // TODO(luna): We can optimize this by creating a map of
                // fiber to component stack instead of generating the stack
                // for every fiber every time
                const fiberStack = currentFiberStacks.get(event);
  
                if (fiberStack && currentDispatcherRef != null) {
                  event.componentStack = fiberStack.reduce((trace, fiber) => {
                    return trace + Object(DevToolsFiberComponentStack["a" /* describeFiber */])(workTagMap, fiber, currentDispatcherRef);
                  }, '');
                }
              }
            });
          } // Clear the current fiber stacks so we don't hold onto the fibers
          // in memory after profiling finishes
  
  
          currentFiberStacks.clear();
        }
      }
    }
  
    return {
      getTimelineData,
      profilingHooks: {
        markCommitStarted,
        markCommitStopped,
        markComponentRenderStarted,
        markComponentRenderStopped,
        markComponentPassiveEffectMountStarted,
        markComponentPassiveEffectMountStopped,
        markComponentPassiveEffectUnmountStarted,
        markComponentPassiveEffectUnmountStopped,
        markComponentLayoutEffectMountStarted,
        markComponentLayoutEffectMountStopped,
        markComponentLayoutEffectUnmountStarted,
        markComponentLayoutEffectUnmountStopped,
        markComponentErrored,
        markComponentSuspended,
        markLayoutEffectsStarted,
        markLayoutEffectsStopped,
        markPassiveEffectsStarted,
        markPassiveEffectsStopped,
        markRenderStarted,
        markRenderYielded,
        markRenderStopped,
        markRenderScheduled,
        markForceUpdateScheduled,
        markStateUpdateScheduled
      },
      toggleProfilingStatus
    };
  }
  // CONCATENATED MODULE: ../react-devtools-shared/src/backend/renderer.js
  /**
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  function semvercmp(a, b) {
    var pa = a.split('.');
    var pb = b.split('.');
  
    for (var i = 0; i < 3; i++) {
      var na = Number(pa[i]);
      var nb = Number(pb[i]);
      if (na > nb) return 1;
      if (nb > na) return -1;
      if (!isNaN(na) && isNaN(nb)) return 1;
      if (isNaN(na) && !isNaN(nb)) return -1;
    }
  
    return 0;
  }
  
  function gt(a, b) {
    return semvercmp(a, b) === 1;
  }
  
  function gte(a, b) {
    return semvercmp(a, b) > -1;
  }
  
  function getFiberFlags(fiber) {
    // The name of this field changed from "effectTag" to "flags"
    return fiber.flags !== undefined ? fiber.flags : fiber.effectTag;
  } // Some environments (e.g. React Native / Hermes) don't support the performance API yet.
  
  
  const renderer_getCurrentTime = // $FlowFixMe[method-unbinding]
  typeof performance === 'object' && typeof performance.now === 'function' ? () => performance.now() : () => Date.now();
  function getInternalReactConstants(version) {
    // **********************************************************
    // The section below is copied from files in React repo.
    // Keep it in sync, and add version guards if it changes.
    //
    // Technically these priority levels are invalid for versions before 16.9,
    // but 16.9 is the first version to report priority level to DevTools,
    // so we can avoid checking for earlier versions and support pre-16.9 canary releases in the process.
    let ReactPriorityLevels = {
      ImmediatePriority: 99,
      UserBlockingPriority: 98,
      NormalPriority: 97,
      LowPriority: 96,
      IdlePriority: 95,
      NoPriority: 90
    };
  
    if (gt(version, '17.0.2')) {
      ReactPriorityLevels = {
        ImmediatePriority: 1,
        UserBlockingPriority: 2,
        NormalPriority: 3,
        LowPriority: 4,
        IdlePriority: 5,
        NoPriority: 0
      };
    }
  
    let StrictModeBits = 0;
  
    if (gte(version, '18.0.0-alpha')) {
      // 18+
      StrictModeBits = 0b011000;
    } else if (gte(version, '16.9.0')) {
      // 16.9 - 17
      StrictModeBits = 0b1;
    } else if (gte(version, '16.3.0')) {
      // 16.3 - 16.8
      StrictModeBits = 0b10;
    }
  
    let ReactTypeOfWork = null; // **********************************************************
    // The section below is copied from files in React repo.
    // Keep it in sync, and add version guards if it changes.
    //
    // TODO Update the gt() check below to be gte() whichever the next version number is.
    // Currently the version in Git is 17.0.2 (but that version has not been/may not end up being released).
  
    if (gt(version, '17.0.1')) {
      ReactTypeOfWork = {
        CacheComponent: 24,
        // Experimental
        ClassComponent: 1,
        ContextConsumer: 9,
        ContextProvider: 10,
        CoroutineComponent: -1,
        // Removed
        CoroutineHandlerPhase: -1,
        // Removed
        DehydratedSuspenseComponent: 18,
        // Behind a flag
        ForwardRef: 11,
        Fragment: 7,
        FunctionComponent: 0,
        HostComponent: 5,
        HostPortal: 4,
        HostRoot: 3,
        HostResource: 26,
        // In reality, 18.2+. But doesn't hurt to include it here
        HostSingleton: 27,
        // Same as above
        HostText: 6,
        IncompleteClassComponent: 17,
        IndeterminateComponent: 2,
        LazyComponent: 16,
        LegacyHiddenComponent: 23,
        MemoComponent: 14,
        Mode: 8,
        OffscreenComponent: 22,
        // Experimental
        Profiler: 12,
        ScopeComponent: 21,
        // Experimental
        SimpleMemoComponent: 15,
        SuspenseComponent: 13,
        SuspenseListComponent: 19,
        // Experimental
        TracingMarkerComponent: 25,
        // Experimental - This is technically in 18 but we don't
        // want to fork again so we're adding it here instead
        YieldComponent: -1 // Removed
  
      };
    } else if (gte(version, '17.0.0-alpha')) {
      ReactTypeOfWork = {
        CacheComponent: -1,
        // Doesn't exist yet
        ClassComponent: 1,
        ContextConsumer: 9,
        ContextProvider: 10,
        CoroutineComponent: -1,
        // Removed
        CoroutineHandlerPhase: -1,
        // Removed
        DehydratedSuspenseComponent: 18,
        // Behind a flag
        ForwardRef: 11,
        Fragment: 7,
        FunctionComponent: 0,
        HostComponent: 5,
        HostPortal: 4,
        HostRoot: 3,
        HostResource: -1,
        // Doesn't exist yet
        HostSingleton: -1,
        // Doesn't exist yet
        HostText: 6,
        IncompleteClassComponent: 17,
        IndeterminateComponent: 2,
        LazyComponent: 16,
        LegacyHiddenComponent: 24,
        MemoComponent: 14,
        Mode: 8,
        OffscreenComponent: 23,
        // Experimental
        Profiler: 12,
        ScopeComponent: 21,
        // Experimental
        SimpleMemoComponent: 15,
        SuspenseComponent: 13,
        SuspenseListComponent: 19,
        // Experimental
        TracingMarkerComponent: -1,
        // Doesn't exist yet
        YieldComponent: -1 // Removed
  
      };
    } else if (gte(version, '16.6.0-beta.0')) {
      ReactTypeOfWork = {
        CacheComponent: -1,
        // Doesn't exist yet
        ClassComponent: 1,
        ContextConsumer: 9,
        ContextProvider: 10,
        CoroutineComponent: -1,
        // Removed
        CoroutineHandlerPhase: -1,
        // Removed
        DehydratedSuspenseComponent: 18,
        // Behind a flag
        ForwardRef: 11,
        Fragment: 7,
        FunctionComponent: 0,
        HostComponent: 5,
        HostPortal: 4,
        HostRoot: 3,
        HostResource: -1,
        // Doesn't exist yet
        HostSingleton: -1,
        // Doesn't exist yet
        HostText: 6,
        IncompleteClassComponent: 17,
        IndeterminateComponent: 2,
        LazyComponent: 16,
        LegacyHiddenComponent: -1,
        MemoComponent: 14,
        Mode: 8,
        OffscreenComponent: -1,
        // Experimental
        Profiler: 12,
        ScopeComponent: -1,
        // Experimental
        SimpleMemoComponent: 15,
        SuspenseComponent: 13,
        SuspenseListComponent: 19,
        // Experimental
        TracingMarkerComponent: -1,
        // Doesn't exist yet
        YieldComponent: -1 // Removed
  
      };
    } else if (gte(version, '16.4.3-alpha')) {
      ReactTypeOfWork = {
        CacheComponent: -1,
        // Doesn't exist yet
        ClassComponent: 2,
        ContextConsumer: 11,
        ContextProvider: 12,
        CoroutineComponent: -1,
        // Removed
        CoroutineHandlerPhase: -1,
        // Removed
        DehydratedSuspenseComponent: -1,
        // Doesn't exist yet
        ForwardRef: 13,
        Fragment: 9,
        FunctionComponent: 0,
        HostComponent: 7,
        HostPortal: 6,
        HostRoot: 5,
        HostResource: -1,
        // Doesn't exist yet
        HostSingleton: -1,
        // Doesn't exist yet
        HostText: 8,
        IncompleteClassComponent: -1,
        // Doesn't exist yet
        IndeterminateComponent: 4,
        LazyComponent: -1,
        // Doesn't exist yet
        LegacyHiddenComponent: -1,
        MemoComponent: -1,
        // Doesn't exist yet
        Mode: 10,
        OffscreenComponent: -1,
        // Experimental
        Profiler: 15,
        ScopeComponent: -1,
        // Experimental
        SimpleMemoComponent: -1,
        // Doesn't exist yet
        SuspenseComponent: 16,
        SuspenseListComponent: -1,
        // Doesn't exist yet
        TracingMarkerComponent: -1,
        // Doesn't exist yet
        YieldComponent: -1 // Removed
  
      };
    } else {
      ReactTypeOfWork = {
        CacheComponent: -1,
        // Doesn't exist yet
        ClassComponent: 2,
        ContextConsumer: 12,
        ContextProvider: 13,
        CoroutineComponent: 7,
        CoroutineHandlerPhase: 8,
        DehydratedSuspenseComponent: -1,
        // Doesn't exist yet
        ForwardRef: 14,
        Fragment: 10,
        FunctionComponent: 1,
        HostComponent: 5,
        HostPortal: 4,
        HostRoot: 3,
        HostResource: -1,
        // Doesn't exist yet
        HostSingleton: -1,
        // Doesn't exist yet
        HostText: 6,
        IncompleteClassComponent: -1,
        // Doesn't exist yet
        IndeterminateComponent: 0,
        LazyComponent: -1,
        // Doesn't exist yet
        LegacyHiddenComponent: -1,
        MemoComponent: -1,
        // Doesn't exist yet
        Mode: 11,
        OffscreenComponent: -1,
        // Experimental
        Profiler: 15,
        ScopeComponent: -1,
        // Experimental
        SimpleMemoComponent: -1,
        // Doesn't exist yet
        SuspenseComponent: 16,
        SuspenseListComponent: -1,
        // Doesn't exist yet
        TracingMarkerComponent: -1,
        // Doesn't exist yet
        YieldComponent: 9
      };
    } // **********************************************************
    // End of copied code.
    // **********************************************************
  
  
    function getTypeSymbol(type) {
      const symbolOrNumber = typeof type === 'object' && type !== null ? type.$$typeof : type;
      return typeof symbolOrNumber === 'symbol' ? // $FlowFixMe `toString()` doesn't match the type signature?
      symbolOrNumber.toString() : symbolOrNumber;
    }
  
    const {
      CacheComponent,
      ClassComponent,
      IncompleteClassComponent,
      FunctionComponent,
      IndeterminateComponent,
      ForwardRef,
      HostRoot,
      HostResource,
      HostSingleton,
      HostComponent,
      HostPortal,
      HostText,
      Fragment,
      LazyComponent,
      LegacyHiddenComponent,
      MemoComponent,
      OffscreenComponent,
      Profiler,
      ScopeComponent,
      SimpleMemoComponent,
      SuspenseComponent,
      SuspenseListComponent,
      TracingMarkerComponent
    } = ReactTypeOfWork;
  
    function resolveFiberType(type) {
      const typeSymbol = getTypeSymbol(type);
  
      switch (typeSymbol) {
        case ReactSymbols["j" /* MEMO_NUMBER */]:
        case ReactSymbols["k" /* MEMO_SYMBOL_STRING */]:
          // recursively resolving memo type in case of memo(forwardRef(Component))
          return resolveFiberType(type.type);
  
        case ReactSymbols["f" /* FORWARD_REF_NUMBER */]:
        case ReactSymbols["g" /* FORWARD_REF_SYMBOL_STRING */]:
          return type.render;
  
        default:
          return type;
      }
    } // NOTICE Keep in sync with shouldFilterFiber() and other get*ForFiber methods
  
  
    function getDisplayNameForFiber(fiber) {
      const {
        elementType,
        type,
        tag
      } = fiber;
      let resolvedType = type;
  
      if (typeof type === 'object' && type !== null) {
        resolvedType = resolveFiberType(type);
      }
  
      let resolvedContext = null;
  
      switch (tag) {
        case CacheComponent:
          return 'Cache';
  
        case ClassComponent:
        case IncompleteClassComponent:
          return Object(utils["h" /* getDisplayName */])(resolvedType);
  
        case FunctionComponent:
        case IndeterminateComponent:
          return Object(utils["h" /* getDisplayName */])(resolvedType);
  
        case ForwardRef:
          return Object(utils["l" /* getWrappedDisplayName */])(elementType, resolvedType, 'ForwardRef', 'Anonymous');
  
        case HostRoot:
          const fiberRoot = fiber.stateNode;
  
          if (fiberRoot != null && fiberRoot._debugRootType !== null) {
            return fiberRoot._debugRootType;
          }
  
          return null;
  
        case HostComponent:
        case HostSingleton:
        case HostResource:
          return type;
  
        case HostPortal:
        case HostText:
          return null;
  
        case Fragment:
          return 'Fragment';
  
        case LazyComponent:
          // This display name will not be user visible.
          // Once a Lazy component loads its inner component, React replaces the tag and type.
          // This display name will only show up in console logs when DevTools DEBUG mode is on.
          return 'Lazy';
  
        case MemoComponent:
        case SimpleMemoComponent:
          // Display name in React does not use `Memo` as a wrapper but fallback name.
          return Object(utils["l" /* getWrappedDisplayName */])(elementType, resolvedType, 'Memo', 'Anonymous');
  
        case SuspenseComponent:
          return 'Suspense';
  
        case LegacyHiddenComponent:
          return 'LegacyHidden';
  
        case OffscreenComponent:
          return 'Offscreen';
  
        case ScopeComponent:
          return 'Scope';
  
        case SuspenseListComponent:
          return 'SuspenseList';
  
        case Profiler:
          return 'Profiler';
  
        case TracingMarkerComponent:
          return 'TracingMarker';
  
        default:
          const typeSymbol = getTypeSymbol(type);
  
          switch (typeSymbol) {
            case ReactSymbols["a" /* CONCURRENT_MODE_NUMBER */]:
            case ReactSymbols["b" /* CONCURRENT_MODE_SYMBOL_STRING */]:
            case ReactSymbols["e" /* DEPRECATED_ASYNC_MODE_SYMBOL_STRING */]:
              return null;
  
            case ReactSymbols["n" /* PROVIDER_NUMBER */]:
            case ReactSymbols["o" /* PROVIDER_SYMBOL_STRING */]:
              // 16.3.0 exposed the context object as "context"
              // PR #12501 changed it to "_context" for 16.3.1+
              // NOTE Keep in sync with inspectElementRaw()
              resolvedContext = fiber.type._context || fiber.type.context;
              return `${resolvedContext.displayName || 'Context'}.Provider`;
  
            case ReactSymbols["c" /* CONTEXT_NUMBER */]:
            case ReactSymbols["d" /* CONTEXT_SYMBOL_STRING */]:
            case ReactSymbols["r" /* SERVER_CONTEXT_SYMBOL_STRING */]:
              // 16.3-16.5 read from "type" because the Consumer is the actual context object.
              // 16.6+ should read from "type._context" because Consumer can be different (in DEV).
              // NOTE Keep in sync with inspectElementRaw()
              resolvedContext = fiber.type._context || fiber.type; // NOTE: TraceUpdatesBackendManager depends on the name ending in '.Consumer'
              // If you change the name, figure out a more resilient way to detect it.
  
              return `${resolvedContext.displayName || 'Context'}.Consumer`;
  
            case ReactSymbols["s" /* STRICT_MODE_NUMBER */]:
            case ReactSymbols["t" /* STRICT_MODE_SYMBOL_STRING */]:
              return null;
  
            case ReactSymbols["l" /* PROFILER_NUMBER */]:
            case ReactSymbols["m" /* PROFILER_SYMBOL_STRING */]:
              return `Profiler(${fiber.memoizedProps.id})`;
  
            case ReactSymbols["p" /* SCOPE_NUMBER */]:
            case ReactSymbols["q" /* SCOPE_SYMBOL_STRING */]:
              return 'Scope';
  
            default:
              // Unknown element type.
              // This may mean a new element type that has not yet been added to DevTools.
              return null;
          }
  
      }
    }
  
    return {
      getDisplayNameForFiber,
      getTypeSymbol,
      ReactPriorityLevels,
      ReactTypeOfWork,
      StrictModeBits
    };
  } // Map of one or more Fibers in a pair to their unique id number.
  // We track both Fibers to support Fast Refresh,
  // which may forcefully replace one of the pair as part of hot reloading.
  // In that case it's still important to be able to locate the previous ID during subsequent renders.
  
  const fiberToIDMap = new Map(); // Map of id to one (arbitrary) Fiber in a pair.
  // This Map is used to e.g. get the display name for a Fiber or schedule an update,
  // operations that should be the same whether the current and work-in-progress Fiber is used.
  
  const idToArbitraryFiberMap = new Map();
  function attach(hook, rendererID, renderer, global) {
    // Newer versions of the reconciler package also specific reconciler version.
    // If that version number is present, use it.
    // Third party renderer versions may not match the reconciler version,
    // and the latter is what's important in terms of tags and symbols.
    const version = renderer.reconcilerVersion || renderer.version;
    const {
      getDisplayNameForFiber,
      getTypeSymbol,
      ReactPriorityLevels,
      ReactTypeOfWork,
      StrictModeBits
    } = getInternalReactConstants(version);
    const {
      CacheComponent,
      ClassComponent,
      ContextConsumer,
      DehydratedSuspenseComponent,
      ForwardRef,
      Fragment,
      FunctionComponent,
      HostRoot,
      HostResource,
      HostSingleton,
      HostPortal,
      HostComponent,
      HostText,
      IncompleteClassComponent,
      IndeterminateComponent,
      LegacyHiddenComponent,
      MemoComponent,
      OffscreenComponent,
      SimpleMemoComponent,
      SuspenseComponent,
      SuspenseListComponent,
      TracingMarkerComponent
    } = ReactTypeOfWork;
    const {
      ImmediatePriority,
      UserBlockingPriority,
      NormalPriority,
      LowPriority,
      IdlePriority,
      NoPriority
    } = ReactPriorityLevels;
    const {
      getLaneLabelMap,
      injectProfilingHooks,
      overrideHookState,
      overrideHookStateDeletePath,
      overrideHookStateRenamePath,
      overrideProps,
      overridePropsDeletePath,
      overridePropsRenamePath,
      scheduleRefresh,
      setErrorHandler,
      setSuspenseHandler,
      scheduleUpdate
    } = renderer;
    const supportsTogglingError = typeof setErrorHandler === 'function' && typeof scheduleUpdate === 'function';
    const supportsTogglingSuspense = typeof setSuspenseHandler === 'function' && typeof scheduleUpdate === 'function';
  
    if (typeof scheduleRefresh === 'function') {
      // When Fast Refresh updates a component, the frontend may need to purge cached information.
      // For example, ASTs cached for the component (for named hooks) may no longer be valid.
      // Send a signal to the frontend to purge this cached information.
      // The "fastRefreshScheduled" dispatched is global (not Fiber or even Renderer specific).
      // This is less effecient since it means the front-end will need to purge the entire cache,
      // but this is probably an okay trade off in order to reduce coupling between the DevTools and Fast Refresh.
      renderer.scheduleRefresh = (...args) => {
        try {
          hook.emit('fastRefreshScheduled');
        } finally {
          return scheduleRefresh(...args);
        }
      };
    }
  
    let getTimelineData = null;
    let toggleProfilingStatus = null;
  
    if (typeof injectProfilingHooks === 'function') {
      const response = createProfilingHooks({
        getDisplayNameForFiber,
        getIsProfiling: () => isProfiling,
        getLaneLabelMap,
        currentDispatcherRef: renderer.currentDispatcherRef,
        workTagMap: ReactTypeOfWork,
        reactVersion: version
      }); // Pass the Profiling hooks to the reconciler for it to call during render.
  
      injectProfilingHooks(response.profilingHooks); // Hang onto this toggle so we can notify the external methods of profiling status changes.
  
      getTimelineData = response.getTimelineData;
      toggleProfilingStatus = response.toggleProfilingStatus;
    } // Tracks Fibers with recently changed number of error/warning messages.
    // These collections store the Fiber rather than the ID,
    // in order to avoid generating an ID for Fibers that never get mounted
    // (due to e.g. Suspense or error boundaries).
    // onErrorOrWarning() adds Fibers and recordPendingErrorsAndWarnings() later clears them.
  
  
    const fibersWithChangedErrorOrWarningCounts = new Set();
    const pendingFiberToErrorsMap = new Map();
    const pendingFiberToWarningsMap = new Map(); // Mapping of fiber IDs to error/warning messages and counts.
  
    const fiberIDToErrorsMap = new Map();
    const fiberIDToWarningsMap = new Map();
  
    function clearErrorsAndWarnings() {
      // eslint-disable-next-line no-for-of-loops/no-for-of-loops
      for (const id of fiberIDToErrorsMap.keys()) {
        const fiber = idToArbitraryFiberMap.get(id);
  
        if (fiber != null) {
          fibersWithChangedErrorOrWarningCounts.add(fiber);
          updateMostRecentlyInspectedElementIfNecessary(id);
        }
      } // eslint-disable-next-line no-for-of-loops/no-for-of-loops
  
  
      for (const id of fiberIDToWarningsMap.keys()) {
        const fiber = idToArbitraryFiberMap.get(id);
  
        if (fiber != null) {
          fibersWithChangedErrorOrWarningCounts.add(fiber);
          updateMostRecentlyInspectedElementIfNecessary(id);
        }
      }
  
      fiberIDToErrorsMap.clear();
      fiberIDToWarningsMap.clear();
      flushPendingEvents();
    }
  
    function clearMessageCountHelper(fiberID, pendingFiberToMessageCountMap, fiberIDToMessageCountMap) {
      const fiber = idToArbitraryFiberMap.get(fiberID);
  
      if (fiber != null) {
        // Throw out any pending changes.
        pendingFiberToErrorsMap.delete(fiber);
  
        if (fiberIDToMessageCountMap.has(fiberID)) {
          fiberIDToMessageCountMap.delete(fiberID); // If previous flushed counts have changed, schedule an update too.
  
          fibersWithChangedErrorOrWarningCounts.add(fiber);
          flushPendingEvents();
          updateMostRecentlyInspectedElementIfNecessary(fiberID);
        } else {
          fibersWithChangedErrorOrWarningCounts.delete(fiber);
        }
      }
    }
  
    function clearErrorsForFiberID(fiberID) {
      clearMessageCountHelper(fiberID, pendingFiberToErrorsMap, fiberIDToErrorsMap);
    }
  
    function clearWarningsForFiberID(fiberID) {
      clearMessageCountHelper(fiberID, pendingFiberToWarningsMap, fiberIDToWarningsMap);
    }
  
    function updateMostRecentlyInspectedElementIfNecessary(fiberID) {
      if (mostRecentlyInspectedElement !== null && mostRecentlyInspectedElement.id === fiberID) {
        hasElementUpdatedSinceLastInspected = true;
      }
    } // Called when an error or warning is logged during render, commit, or passive (including unmount functions).
  
  
    function onErrorOrWarning(fiber, type, args) {
      if (type === 'error') {
        const maybeID = getFiberIDUnsafe(fiber); // if this is an error simulated by us to trigger error boundary, ignore
  
        if (maybeID != null && forceErrorForFiberIDs.get(maybeID) === true) {
          return;
        }
      }
  
      const message = Object(backend_utils["f" /* format */])(...args);
  
      if (constants["j" /* __DEBUG__ */]) {
        debug('onErrorOrWarning', fiber, null, `${type}: "${message}"`);
      } // Mark this Fiber as needed its warning/error count updated during the next flush.
  
  
      fibersWithChangedErrorOrWarningCounts.add(fiber); // Track the warning/error for later.
  
      const fiberMap = type === 'error' ? pendingFiberToErrorsMap : pendingFiberToWarningsMap;
      const messageMap = fiberMap.get(fiber);
  
      if (messageMap != null) {
        const count = messageMap.get(message) || 0;
        messageMap.set(message, count + 1);
      } else {
        fiberMap.set(fiber, new Map([[message, 1]]));
      } // Passive effects may trigger errors or warnings too;
      // In this case, we should wait until the rest of the passive effects have run,
      // but we shouldn't wait until the next commit because that might be a long time.
      // This would also cause "tearing" between an inspected Component and the tree view.
      // Then again we don't want to flush too soon because this could be an error during async rendering.
      // Use a debounce technique to ensure that we'll eventually flush.
  
  
      flushPendingErrorsAndWarningsAfterDelay();
    } // Patching the console enables DevTools to do a few useful things:
    // * Append component stacks to warnings and error messages
    // * Disable logging during re-renders to inspect hooks (see inspectHooksOfFiber)
  
  
    Object(backend_console["d" /* registerRenderer */])(renderer, onErrorOrWarning); // The renderer interface can't read these preferences directly,
    // because it is stored in localStorage within the context of the extension.
    // It relies on the extension to pass the preference through via the global.
  
    Object(backend_console["b" /* patchConsoleUsingWindowValues */])();
  
    const debug = (name, fiber, parentFiber, extraString = '') => {
      if (constants["j" /* __DEBUG__ */]) {
        const displayName = fiber.tag + ':' + (getDisplayNameForFiber(fiber) || 'null');
        const maybeID = getFiberIDUnsafe(fiber) || '<no id>';
        const parentDisplayName = parentFiber ? parentFiber.tag + ':' + (getDisplayNameForFiber(parentFiber) || 'null') : '';
        const maybeParentID = parentFiber ? getFiberIDUnsafe(parentFiber) || '<no-id>' : '';
        console.groupCollapsed(`[renderer] %c${name} %c${displayName} (${maybeID}) %c${parentFiber ? `${parentDisplayName} (${maybeParentID})` : ''} %c${extraString}`, 'color: red; font-weight: bold;', 'color: blue;', 'color: purple;', 'color: black;');
        console.log(new Error().stack.split('\n').slice(1).join('\n'));
        console.groupEnd();
      }
    }; // Configurable Components tree filters.
  
  
    const hideElementsWithDisplayNames = new Set();
    const hideElementsWithPaths = new Set();
    const hideElementsWithTypes = new Set(); // Highlight updates
  
    let traceUpdatesEnabled = false;
    const traceUpdatesForNodes = new Set();
  
    function applyComponentFilters(componentFilters) {
      hideElementsWithTypes.clear();
      hideElementsWithDisplayNames.clear();
      hideElementsWithPaths.clear();
      componentFilters.forEach(componentFilter => {
        if (!componentFilter.isEnabled) {
          return;
        }
  
        switch (componentFilter.type) {
          case types["a" /* ComponentFilterDisplayName */]:
            if (componentFilter.isValid && componentFilter.value !== '') {
              hideElementsWithDisplayNames.add(new RegExp(componentFilter.value, 'i'));
            }
  
            break;
  
          case types["b" /* ComponentFilterElementType */]:
            hideElementsWithTypes.add(componentFilter.value);
            break;
  
          case types["d" /* ComponentFilterLocation */]:
            if (componentFilter.isValid && componentFilter.value !== '') {
              hideElementsWithPaths.add(new RegExp(componentFilter.value, 'i'));
            }
  
            break;
  
          case types["c" /* ComponentFilterHOC */]:
            hideElementsWithDisplayNames.add(new RegExp('\\('));
            break;
  
          default:
            console.warn(`Invalid component filter type "${componentFilter.type}"`);
            break;
        }
      });
    } // The renderer interface can't read saved component filters directly,
    // because they are stored in localStorage within the context of the extension.
    // Instead it relies on the extension to pass filters through.
  
  
    if (window.__REACT_DEVTOOLS_COMPONENT_FILTERS__ != null) {
      applyComponentFilters(window.__REACT_DEVTOOLS_COMPONENT_FILTERS__);
    } else {
      // Unfortunately this feature is not expected to work for React Native for now.
      // It would be annoying for us to spam YellowBox warnings with unactionable stuff,
      // so for now just skip this message...
      //console.warn('⚛️ DevTools: Could not locate saved component filters');
      // Fallback to assuming the default filters in this case.
      applyComponentFilters(Object(utils["g" /* getDefaultComponentFilters */])());
    } // If necessary, we can revisit optimizing this operation.
    // For example, we could add a new recursive unmount tree operation.
    // The unmount operations are already significantly smaller than mount operations though.
    // This is something to keep in mind for later.
  
  
    function updateComponentFilters(componentFilters) {
      if (isProfiling) {
        // Re-mounting a tree while profiling is in progress might break a lot of assumptions.
        // If necessary, we could support this- but it doesn't seem like a necessary use case.
        throw Error('Cannot modify filter preferences while profiling');
      } // Recursively unmount all roots.
  
  
      hook.getFiberRoots(rendererID).forEach(root => {
        currentRootID = getOrGenerateFiberID(root.current); // The TREE_OPERATION_REMOVE_ROOT operation serves two purposes:
        // 1. It avoids sending unnecessary bridge traffic to clear a root.
        // 2. It preserves Fiber IDs when remounting (below) which in turn ID to error/warning mapping.
  
        pushOperation(constants["e" /* TREE_OPERATION_REMOVE_ROOT */]);
        flushPendingEvents(root);
        currentRootID = -1;
      });
      applyComponentFilters(componentFilters); // Reset pseudo counters so that new path selections will be persisted.
  
      rootDisplayNameCounter.clear(); // Recursively re-mount all roots with new filter criteria applied.
  
      hook.getFiberRoots(rendererID).forEach(root => {
        currentRootID = getOrGenerateFiberID(root.current);
        setRootPseudoKey(currentRootID, root.current);
        mountFiberRecursively(root.current, null, false, false);
        flushPendingEvents(root);
        currentRootID = -1;
      }); // Also re-evaluate all error and warning counts given the new filters.
  
      reevaluateErrorsAndWarnings();
      flushPendingEvents();
    } // NOTICE Keep in sync with get*ForFiber methods
  
  
    function shouldFilterFiber(fiber) {
      const {
        _debugSource,
        tag,
        type,
        key
      } = fiber;
  
      switch (tag) {
        case DehydratedSuspenseComponent:
          // TODO: ideally we would show dehydrated Suspense immediately.
          // However, it has some special behavior (like disconnecting
          // an alternate and turning into real Suspense) which breaks DevTools.
          // For now, ignore it, and only show it once it gets hydrated.
          // https://github.com/bvaughn/react-devtools-experimental/issues/197
          return true;
  
        case HostPortal:
        case HostText:
        case LegacyHiddenComponent:
        case OffscreenComponent:
          return true;
  
        case HostRoot:
          // It is never valid to filter the root element.
          return false;
  
        case Fragment:
          return key === null;
  
        default:
          const typeSymbol = getTypeSymbol(type);
  
          switch (typeSymbol) {
            case ReactSymbols["a" /* CONCURRENT_MODE_NUMBER */]:
            case ReactSymbols["b" /* CONCURRENT_MODE_SYMBOL_STRING */]:
            case ReactSymbols["e" /* DEPRECATED_ASYNC_MODE_SYMBOL_STRING */]:
            case ReactSymbols["s" /* STRICT_MODE_NUMBER */]:
            case ReactSymbols["t" /* STRICT_MODE_SYMBOL_STRING */]:
              return true;
  
            default:
              break;
          }
  
      }
  
      const elementType = getElementTypeForFiber(fiber);
  
      if (hideElementsWithTypes.has(elementType)) {
        return true;
      }
  
      if (hideElementsWithDisplayNames.size > 0) {
        const displayName = getDisplayNameForFiber(fiber);
  
        if (displayName != null) {
          // eslint-disable-next-line no-for-of-loops/no-for-of-loops
          for (const displayNameRegExp of hideElementsWithDisplayNames) {
            if (displayNameRegExp.test(displayName)) {
              return true;
            }
          }
        }
      }
  
      if (_debugSource != null && hideElementsWithPaths.size > 0) {
        const {
          fileName
        } = _debugSource; // eslint-disable-next-line no-for-of-loops/no-for-of-loops
  
        for (const pathRegExp of hideElementsWithPaths) {
          if (pathRegExp.test(fileName)) {
            return true;
          }
        }
      }
  
      return false;
    } // NOTICE Keep in sync with shouldFilterFiber() and other get*ForFiber methods
  
  
    function getElementTypeForFiber(fiber) {
      const {
        type,
        tag
      } = fiber;
  
      switch (tag) {
        case ClassComponent:
        case IncompleteClassComponent:
          return types["e" /* ElementTypeClass */];
  
        case FunctionComponent:
        case IndeterminateComponent:
          return types["h" /* ElementTypeFunction */];
  
        case ForwardRef:
          return types["g" /* ElementTypeForwardRef */];
  
        case HostRoot:
          return types["m" /* ElementTypeRoot */];
  
        case HostComponent:
        case HostResource:
        case HostSingleton:
          return types["i" /* ElementTypeHostComponent */];
  
        case HostPortal:
        case HostText:
        case Fragment:
          return types["k" /* ElementTypeOtherOrUnknown */];
  
        case MemoComponent:
        case SimpleMemoComponent:
          return types["j" /* ElementTypeMemo */];
  
        case SuspenseComponent:
          return types["n" /* ElementTypeSuspense */];
  
        case SuspenseListComponent:
          return types["o" /* ElementTypeSuspenseList */];
  
        case TracingMarkerComponent:
          return types["p" /* ElementTypeTracingMarker */];
  
        default:
          const typeSymbol = getTypeSymbol(type);
  
          switch (typeSymbol) {
            case ReactSymbols["a" /* CONCURRENT_MODE_NUMBER */]:
            case ReactSymbols["b" /* CONCURRENT_MODE_SYMBOL_STRING */]:
            case ReactSymbols["e" /* DEPRECATED_ASYNC_MODE_SYMBOL_STRING */]:
              return types["k" /* ElementTypeOtherOrUnknown */];
  
            case ReactSymbols["n" /* PROVIDER_NUMBER */]:
            case ReactSymbols["o" /* PROVIDER_SYMBOL_STRING */]:
              return types["f" /* ElementTypeContext */];
  
            case ReactSymbols["c" /* CONTEXT_NUMBER */]:
            case ReactSymbols["d" /* CONTEXT_SYMBOL_STRING */]:
              return types["f" /* ElementTypeContext */];
  
            case ReactSymbols["s" /* STRICT_MODE_NUMBER */]:
            case ReactSymbols["t" /* STRICT_MODE_SYMBOL_STRING */]:
              return types["k" /* ElementTypeOtherOrUnknown */];
  
            case ReactSymbols["l" /* PROFILER_NUMBER */]:
            case ReactSymbols["m" /* PROFILER_SYMBOL_STRING */]:
              return types["l" /* ElementTypeProfiler */];
  
            default:
              return types["k" /* ElementTypeOtherOrUnknown */];
          }
  
      }
    } // When profiling is supported, we store the latest tree base durations for each Fiber.
    // This is so that we can quickly capture a snapshot of those values if profiling starts.
    // If we didn't store these values, we'd have to crawl the tree when profiling started,
    // and use a slow path to find each of the current Fibers.
  
  
    const idToTreeBaseDurationMap = new Map(); // When profiling is supported, we store the latest tree base durations for each Fiber.
    // This map enables us to filter these times by root when sending them to the frontend.
  
    const idToRootMap = new Map(); // When a mount or update is in progress, this value tracks the root that is being operated on.
  
    let currentRootID = -1;
  
    function getReplayPersistentID(obj) {
      const id = __RECORD_REPLAY_ARGUMENTS__.getPersistentId(obj);
  
      if (!id) {
        throw new Error(`Missing persistent ID for fiber ${obj} ${obj.constructor}`);
      }
  
      return id;
    }
  
    function getReplayFiberID(fiber) {
      const id = getReplayPersistentID(fiber);
  
      if (!fiber.alternate) {
        return id;
      }
  
      const alternateId = getReplayPersistentID(fiber.alternate);
      return Math.min(id, alternateId);
    } // Returns the unique ID for a Fiber or generates and caches a new one if the Fiber hasn't been seen before.
    // Once this method has been called for a Fiber, untrackFiberID() should always be called later to avoid leaking.
  
  
    function getOrGenerateFiberID(fiber) {
      let id = null;
  
      if (fiberToIDMap.has(fiber)) {
        id = fiberToIDMap.get(fiber);
      } else {
        const {
          alternate
        } = fiber;
  
        if (alternate !== null && fiberToIDMap.has(alternate)) {
          id = fiberToIDMap.get(alternate);
        }
      }
  
      let didGenerateID = false;
  
      if (id === null) {
        didGenerateID = true;
        id = getReplayFiberID(fiber);
      } // This refinement is for Flow purposes only.
  
  
      const refinedID = id; // Make sure we're tracking this Fiber
      // e.g. if it just mounted or an error was logged during initial render.
  
      if (!fiberToIDMap.has(fiber)) {
        fiberToIDMap.set(fiber, refinedID);
        idToArbitraryFiberMap.set(refinedID, fiber);
      } // Also make sure we're tracking its alternate,
      // e.g. in case this is the first update after mount.
  
  
      const {
        alternate
      } = fiber;
  
      if (alternate !== null) {
        if (!fiberToIDMap.has(alternate)) {
          fiberToIDMap.set(alternate, refinedID);
        }
      }
  
      if (constants["j" /* __DEBUG__ */]) {
        if (didGenerateID) {
          debug('getOrGenerateFiberID()', fiber, fiber.return, 'Generated a new UID');
        }
      }
  
      return refinedID;
    } // Returns an ID if one has already been generated for the Fiber or throws.
  
  
    function getFiberIDThrows(fiber) {
      const maybeID = getFiberIDUnsafe(fiber);
  
      if (maybeID !== null) {
        return maybeID;
      }
  
      throw Error(`Could not find ID for Fiber "${getDisplayNameForFiber(fiber) || ''}"`);
    } // Returns an ID if one has already been generated for the Fiber or null if one has not been generated.
    // Use this method while e.g. logging to avoid over-retaining Fibers.
  
  
    function getFiberIDUnsafe(fiber) {
      if (fiberToIDMap.has(fiber)) {
        return fiberToIDMap.get(fiber);
      } else {
        const {
          alternate
        } = fiber;
  
        if (alternate !== null && fiberToIDMap.has(alternate)) {
          return fiberToIDMap.get(alternate);
        }
      }
  
      return null;
    } // Removes a Fiber (and its alternate) from the Maps used to track their id.
    // This method should always be called when a Fiber is unmounting.
  
  
    function untrackFiberID(fiber) {
      if (constants["j" /* __DEBUG__ */]) {
        debug('untrackFiberID()', fiber, fiber.return, 'schedule after delay');
      } // Untrack Fibers after a slight delay in order to support a Fast Refresh edge case:
      // 1. Component type is updated and Fast Refresh schedules an update+remount.
      // 2. flushPendingErrorsAndWarningsAfterDelay() runs, sees the old Fiber is no longer mounted
      //    (it's been disconnected by Fast Refresh), and calls untrackFiberID() to clear it from the Map.
      // 3. React flushes pending passive effects before it runs the next render,
      //    which logs an error or warning, which causes a new ID to be generated for this Fiber.
      // 4. DevTools now tries to unmount the old Component with the new ID.
      //
      // The underlying problem here is the premature clearing of the Fiber ID,
      // but DevTools has no way to detect that a given Fiber has been scheduled for Fast Refresh.
      // (The "_debugNeedsRemount" flag won't necessarily be set.)
      //
      // The best we can do is to delay untracking by a small amount,
      // and give React time to process the Fast Refresh delay.
  
  
      untrackFibersSet.add(fiber); // React may detach alternate pointers during unmount;
      // Since our untracking code is async, we should explicily track the pending alternate here as well.
  
      const alternate = fiber.alternate;
  
      if (alternate !== null) {
        untrackFibersSet.add(alternate);
      }
  
      if (untrackFibersTimeoutID === null) {
        untrackFibersTimeoutID = setTimeout(untrackFibers, 1000);
      }
    }
  
    const untrackFibersSet = new Set();
    let untrackFibersTimeoutID = null;
  
    function untrackFibers() {
      if (untrackFibersTimeoutID !== null) {
        clearTimeout(untrackFibersTimeoutID);
        untrackFibersTimeoutID = null;
      }
  
      untrackFibersSet.forEach(fiber => {
        const fiberID = getFiberIDUnsafe(fiber);
  
        if (fiberID !== null) {
          idToArbitraryFiberMap.delete(fiberID); // Also clear any errors/warnings associated with this fiber.
  
          clearErrorsForFiberID(fiberID);
          clearWarningsForFiberID(fiberID);
        }
  
        fiberToIDMap.delete(fiber);
        const {
          alternate
        } = fiber;
  
        if (alternate !== null) {
          fiberToIDMap.delete(alternate);
        }
  
        if (forceErrorForFiberIDs.has(fiberID)) {
          forceErrorForFiberIDs.delete(fiberID);
  
          if (forceErrorForFiberIDs.size === 0 && setErrorHandler != null) {
            setErrorHandler(shouldErrorFiberAlwaysNull);
          }
        }
      });
      untrackFibersSet.clear();
    }
  
    function getChangeDescription(prevFiber, nextFiber) {
      switch (getElementTypeForFiber(nextFiber)) {
        case types["e" /* ElementTypeClass */]:
        case types["h" /* ElementTypeFunction */]:
        case types["j" /* ElementTypeMemo */]:
        case types["g" /* ElementTypeForwardRef */]:
          if (prevFiber === null) {
            return {
              context: null,
              didHooksChange: false,
              isFirstMount: true,
              props: null,
              state: null
            };
          } else {
            const data = {
              context: getContextChangedKeys(nextFiber),
              didHooksChange: false,
              isFirstMount: false,
              props: getChangedKeys(prevFiber.memoizedProps, nextFiber.memoizedProps),
              state: getChangedKeys(prevFiber.memoizedState, nextFiber.memoizedState)
            }; // Only traverse the hooks list once, depending on what info we're returning.
  
            if (DevToolsFeatureFlags_extension_oss["b" /* enableProfilerChangedHookIndices */]) {
              const indices = getChangedHooksIndices(prevFiber.memoizedState, nextFiber.memoizedState);
              data.hooks = indices;
              data.didHooksChange = indices !== null && indices.length > 0;
            } else {
              data.didHooksChange = didHooksChange(prevFiber.memoizedState, nextFiber.memoizedState);
            }
  
            return data;
          }
  
        default:
          return null;
      }
    }
  
    function updateContextsForFiber(fiber) {
      switch (getElementTypeForFiber(fiber)) {
        case types["e" /* ElementTypeClass */]:
        case types["g" /* ElementTypeForwardRef */]:
        case types["h" /* ElementTypeFunction */]:
        case types["j" /* ElementTypeMemo */]:
          if (idToContextsMap !== null) {
            const id = getFiberIDThrows(fiber);
            const contexts = getContextsForFiber(fiber);
  
            if (contexts !== null) {
              // $FlowFixMe[incompatible-use] found when upgrading Flow
              idToContextsMap.set(id, contexts);
            }
          }
  
          break;
  
        default:
          break;
      }
    } // Differentiates between a null context value and no context.
  
  
    const NO_CONTEXT = {};
  
    function getContextsForFiber(fiber) {
      let legacyContext = NO_CONTEXT;
      let modernContext = NO_CONTEXT;
  
      switch (getElementTypeForFiber(fiber)) {
        case types["e" /* ElementTypeClass */]:
          const instance = fiber.stateNode;
  
          if (instance != null) {
            if (instance.constructor && instance.constructor.contextType != null) {
              modernContext = instance.context;
            } else {
              legacyContext = instance.context;
  
              if (legacyContext && Object.keys(legacyContext).length === 0) {
                legacyContext = NO_CONTEXT;
              }
            }
          }
  
          return [legacyContext, modernContext];
  
        case types["g" /* ElementTypeForwardRef */]:
        case types["h" /* ElementTypeFunction */]:
        case types["j" /* ElementTypeMemo */]:
          const dependencies = fiber.dependencies;
  
          if (dependencies && dependencies.firstContext) {
            modernContext = dependencies.firstContext;
          }
  
          return [legacyContext, modernContext];
  
        default:
          return null;
      }
    } // Record all contexts at the time profiling is started.
    // Fibers only store the current context value,
    // so we need to track them separately in order to determine changed keys.
  
  
    function crawlToInitializeContextsMap(fiber) {
      const id = getFiberIDUnsafe(fiber); // Not all Fibers in the subtree have mounted yet.
      // For example, Offscreen (hidden) or Suspense (suspended) subtrees won't yet be tracked.
      // We can safely skip these subtrees.
  
      if (id !== null) {
        updateContextsForFiber(fiber);
        let current = fiber.child;
  
        while (current !== null) {
          crawlToInitializeContextsMap(current);
          current = current.sibling;
        }
      }
    }
  
    function getContextChangedKeys(fiber) {
      if (idToContextsMap !== null) {
        const id = getFiberIDThrows(fiber); // $FlowFixMe[incompatible-use] found when upgrading Flow
  
        const prevContexts = idToContextsMap.has(id) ? // $FlowFixMe[incompatible-use] found when upgrading Flow
        idToContextsMap.get(id) : null;
        const nextContexts = getContextsForFiber(fiber);
  
        if (prevContexts == null || nextContexts == null) {
          return null;
        }
  
        const [prevLegacyContext, prevModernContext] = prevContexts;
        const [nextLegacyContext, nextModernContext] = nextContexts;
  
        switch (getElementTypeForFiber(fiber)) {
          case types["e" /* ElementTypeClass */]:
            if (prevContexts && nextContexts) {
              if (nextLegacyContext !== NO_CONTEXT) {
                return getChangedKeys(prevLegacyContext, nextLegacyContext);
              } else if (nextModernContext !== NO_CONTEXT) {
                return prevModernContext !== nextModernContext;
              }
            }
  
            break;
  
          case types["g" /* ElementTypeForwardRef */]:
          case types["h" /* ElementTypeFunction */]:
          case types["j" /* ElementTypeMemo */]:
            if (nextModernContext !== NO_CONTEXT) {
              let prevContext = prevModernContext;
              let nextContext = nextModernContext;
  
              while (prevContext && nextContext) {
                // Note this only works for versions of React that support this key (e.v. 18+)
                // For older versions, there's no good way to read the current context value after render has completed.
                // This is because React maintains a stack of context values during render,
                // but by the time DevTools is called, render has finished and the stack is empty.
                if (!shared_objectIs(prevContext.memoizedValue, nextContext.memoizedValue)) {
                  return true;
                }
  
                prevContext = prevContext.next;
                nextContext = nextContext.next;
              }
  
              return false;
            }
  
            break;
  
          default:
            break;
        }
      }
  
      return null;
    }
  
    function isHookThatCanScheduleUpdate(hookObject) {
      const queue = hookObject.queue;
  
      if (!queue) {
        return false;
      }
  
      const boundHasOwnProperty = shared_hasOwnProperty.bind(queue); // Detect the shape of useState() or useReducer()
      // using the attributes that are unique to these hooks
      // but also stable (e.g. not tied to current Lanes implementation)
  
      const isStateOrReducer = boundHasOwnProperty('pending') && boundHasOwnProperty('dispatch') && typeof queue.dispatch === 'function'; // Detect useSyncExternalStore()
  
      const isSyncExternalStore = boundHasOwnProperty('value') && boundHasOwnProperty('getSnapshot') && typeof queue.getSnapshot === 'function'; // These are the only types of hooks that can schedule an update.
  
      return isStateOrReducer || isSyncExternalStore;
    }
  
    function didStatefulHookChange(prev, next) {
      const prevMemoizedState = prev.memoizedState;
      const nextMemoizedState = next.memoizedState;
  
      if (isHookThatCanScheduleUpdate(prev)) {
        return prevMemoizedState !== nextMemoizedState;
      }
  
      return false;
    }
  
    function didHooksChange(prev, next) {
      if (prev == null || next == null) {
        return false;
      } // We can't report anything meaningful for hooks changes.
  
  
      if (next.hasOwnProperty('baseState') && next.hasOwnProperty('memoizedState') && next.hasOwnProperty('next') && next.hasOwnProperty('queue')) {
        while (next !== null) {
          if (didStatefulHookChange(prev, next)) {
            return true;
          } else {
            next = next.next;
            prev = prev.next;
          }
        }
      }
  
      return false;
    }
  
    function getChangedHooksIndices(prev, next) {
      if (DevToolsFeatureFlags_extension_oss["b" /* enableProfilerChangedHookIndices */]) {
        if (prev == null || next == null) {
          return null;
        }
  
        const indices = [];
        let index = 0;
  
        if (next.hasOwnProperty('baseState') && next.hasOwnProperty('memoizedState') && next.hasOwnProperty('next') && next.hasOwnProperty('queue')) {
          while (next !== null) {
            if (didStatefulHookChange(prev, next)) {
              indices.push(index);
            }
  
            next = next.next;
            prev = prev.next;
            index++;
          }
        }
  
        return indices;
      }
  
      return null;
    }
  
    function getChangedKeys(prev, next) {
      if (prev == null || next == null) {
        return null;
      } // We can't report anything meaningful for hooks changes.
  
  
      if (next.hasOwnProperty('baseState') && next.hasOwnProperty('memoizedState') && next.hasOwnProperty('next') && next.hasOwnProperty('queue')) {
        return null;
      }
  
      const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
      const changedKeys = []; // eslint-disable-next-line no-for-of-loops/no-for-of-loops
  
      for (const key of keys) {
        if (prev[key] !== next[key]) {
          changedKeys.push(key);
        }
      }
  
      return changedKeys;
    } // eslint-disable-next-line no-unused-vars
  
  
    function didFiberRender(prevFiber, nextFiber) {
      switch (nextFiber.tag) {
        case ClassComponent:
        case FunctionComponent:
        case ContextConsumer:
        case MemoComponent:
        case SimpleMemoComponent:
        case ForwardRef:
          // For types that execute user code, we check PerformedWork effect.
          // We don't reflect bailouts (either referential or sCU) in DevTools.
          // eslint-disable-next-line no-bitwise
          return (getFiberFlags(nextFiber) & PerformedWork) === PerformedWork;
        // Note: ContextConsumer only gets PerformedWork effect in 16.3.3+
        // so it won't get highlighted with React 16.3.0 to 16.3.2.
  
        default:
          // For host components and other types, we compare inputs
          // to determine whether something is an update.
          return prevFiber.memoizedProps !== nextFiber.memoizedProps || prevFiber.memoizedState !== nextFiber.memoizedState || prevFiber.ref !== nextFiber.ref;
      }
    }
  
    const pendingOperations = [];
    const pendingRealUnmountedIDs = [];
    const pendingSimulatedUnmountedIDs = [];
    let pendingOperationsQueue = [];
    const pendingStringTable = new Map();
    let pendingStringTableLength = 0;
    let pendingUnmountedRootID = null;
  
    function pushOperation(op) {
      if (true) {
        if (!Number.isInteger(op)) {
          console.error('pushOperation() was called but the value is not an integer.', op);
        }
      }
  
      pendingOperations.push(op);
    }
  
    function shouldBailoutWithPendingOperations() {
      if (isProfiling) {
        if (currentCommitProfilingMetadata != null && currentCommitProfilingMetadata.durations.length > 0) {
          return false;
        }
      }
  
      return pendingOperations.length === 0 && pendingRealUnmountedIDs.length === 0 && pendingSimulatedUnmountedIDs.length === 0 && pendingUnmountedRootID === null;
    }
  
    function flushOrQueueOperations(operations) {
      if (shouldBailoutWithPendingOperations()) {
        return;
      }
  
      if (pendingOperationsQueue !== null) {
        pendingOperationsQueue.push(operations);
      } else {
        hook.emit('operations', operations);
      }
    }
  
    let flushPendingErrorsAndWarningsAfterDelayTimeoutID = null;
  
    function clearPendingErrorsAndWarningsAfterDelay() {
      if (flushPendingErrorsAndWarningsAfterDelayTimeoutID !== null) {
        clearTimeout(flushPendingErrorsAndWarningsAfterDelayTimeoutID);
        flushPendingErrorsAndWarningsAfterDelayTimeoutID = null;
      }
    }
  
    function flushPendingErrorsAndWarningsAfterDelay() {
      clearPendingErrorsAndWarningsAfterDelay();
      flushPendingErrorsAndWarningsAfterDelayTimeoutID = setTimeout(() => {
        flushPendingErrorsAndWarningsAfterDelayTimeoutID = null;
  
        if (pendingOperations.length > 0) {
          // On the off chance that something else has pushed pending operations,
          // we should bail on warnings; it's probably not safe to push midway.
          return;
        }
  
        recordPendingErrorsAndWarnings();
  
        if (shouldBailoutWithPendingOperations()) {
          // No warnings or errors to flush; we can bail out early here too.
          return;
        } // We can create a smaller operations array than flushPendingEvents()
        // because we only need to flush warning and error counts.
        // Only a few pieces of fixed information are required up front.
  
  
        const operations = new Array(3 + pendingOperations.length);
        operations[0] = rendererID;
        operations[1] = currentRootID;
        operations[2] = 0; // String table size
  
        for (let j = 0; j < pendingOperations.length; j++) {
          operations[3 + j] = pendingOperations[j];
        }
  
        flushOrQueueOperations(operations);
        pendingOperations.length = 0;
      }, 1000);
    }
  
    function reevaluateErrorsAndWarnings() {
      fibersWithChangedErrorOrWarningCounts.clear();
      fiberIDToErrorsMap.forEach((countMap, fiberID) => {
        const fiber = idToArbitraryFiberMap.get(fiberID);
  
        if (fiber != null) {
          fibersWithChangedErrorOrWarningCounts.add(fiber);
        }
      });
      fiberIDToWarningsMap.forEach((countMap, fiberID) => {
        const fiber = idToArbitraryFiberMap.get(fiberID);
  
        if (fiber != null) {
          fibersWithChangedErrorOrWarningCounts.add(fiber);
        }
      });
      recordPendingErrorsAndWarnings();
    }
  
    function mergeMapsAndGetCountHelper(fiber, fiberID, pendingFiberToMessageCountMap, fiberIDToMessageCountMap) {
      let newCount = 0;
      let messageCountMap = fiberIDToMessageCountMap.get(fiberID);
      const pendingMessageCountMap = pendingFiberToMessageCountMap.get(fiber);
  
      if (pendingMessageCountMap != null) {
        if (messageCountMap == null) {
          messageCountMap = pendingMessageCountMap;
          fiberIDToMessageCountMap.set(fiberID, pendingMessageCountMap);
        } else {
          // This Flow refinement should not be necessary and yet...
          const refinedMessageCountMap = messageCountMap;
          pendingMessageCountMap.forEach((pendingCount, message) => {
            const previousCount = refinedMessageCountMap.get(message) || 0;
            refinedMessageCountMap.set(message, previousCount + pendingCount);
          });
        }
      }
  
      if (!shouldFilterFiber(fiber)) {
        if (messageCountMap != null) {
          messageCountMap.forEach(count => {
            newCount += count;
          });
        }
      }
  
      pendingFiberToMessageCountMap.delete(fiber);
      return newCount;
    }
  
    function recordPendingErrorsAndWarnings() {
      clearPendingErrorsAndWarningsAfterDelay();
      fibersWithChangedErrorOrWarningCounts.forEach(fiber => {
        const fiberID = getFiberIDUnsafe(fiber);
  
        if (fiberID === null) {// Don't send updates for Fibers that didn't mount due to e.g. Suspense or an error boundary.
        } else {
          const errorCount = mergeMapsAndGetCountHelper(fiber, fiberID, pendingFiberToErrorsMap, fiberIDToErrorsMap);
          const warningCount = mergeMapsAndGetCountHelper(fiber, fiberID, pendingFiberToWarningsMap, fiberIDToWarningsMap);
          pushOperation(constants["h" /* TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS */]);
          pushOperation(fiberID);
          pushOperation(errorCount);
          pushOperation(warningCount);
        } // Always clean up so that we don't leak.
  
  
        pendingFiberToErrorsMap.delete(fiber);
        pendingFiberToWarningsMap.delete(fiber);
      });
      fibersWithChangedErrorOrWarningCounts.clear();
    }
  
    function flushPendingEvents(root) {
      // Add any pending errors and warnings to the operations array.
      // We do this just before flushing, so we can ignore errors for no-longer-mounted Fibers.
      recordPendingErrorsAndWarnings();
  
      if (shouldBailoutWithPendingOperations()) {
        // If we aren't profiling, we can just bail out here.
        // No use sending an empty update over the bridge.
        //
        // The Profiler stores metadata for each commit and reconstructs the app tree per commit using:
        // (1) an initial tree snapshot and
        // (2) the operations array for each commit
        // Because of this, it's important that the operations and metadata arrays align,
        // So it's important not to omit even empty operations while profiling is active.
        return;
      }
  
      const numUnmountIDs = pendingRealUnmountedIDs.length + pendingSimulatedUnmountedIDs.length + (pendingUnmountedRootID === null ? 0 : 1);
      const operations = new Array( // Identify which renderer this update is coming from.
      2 + // [rendererID, rootFiberID]
      // How big is the string table?
      1 + // [stringTableLength]
      // Then goes the actual string table.
      pendingStringTableLength + ( // All unmounts are batched in a single message.
      // [TREE_OPERATION_REMOVE, removedIDLength, ...ids]
      numUnmountIDs > 0 ? 2 + numUnmountIDs : 0) + // Regular operations
      pendingOperations.length); // Identify which renderer this update is coming from.
      // This enables roots to be mapped to renderers,
      // Which in turn enables fiber props, states, and hooks to be inspected.
  
      let i = 0;
      operations[i++] = rendererID;
      operations[i++] = currentRootID; // Now fill in the string table.
      // [stringTableLength, str1Length, ...str1, str2Length, ...str2, ...]
  
      operations[i++] = pendingStringTableLength;
      pendingStringTable.forEach((entry, stringKey) => {
        const encodedString = entry.encodedString; // Don't use the string length.
        // It won't work for multibyte characters (like emoji).
  
        const length = encodedString.length;
        operations[i++] = length;
  
        for (let j = 0; j < length; j++) {
          operations[i + j] = encodedString[j];
        }
  
        i += length;
      });
  
      if (numUnmountIDs > 0) {
        // All unmounts except roots are batched in a single message.
        operations[i++] = constants["d" /* TREE_OPERATION_REMOVE */]; // The first number is how many unmounted IDs we're gonna send.
  
        operations[i++] = numUnmountIDs; // Fill in the real unmounts in the reverse order.
        // They were inserted parents-first by React, but we want children-first.
        // So we traverse our array backwards.
  
        for (let j = pendingRealUnmountedIDs.length - 1; j >= 0; j--) {
          operations[i++] = pendingRealUnmountedIDs[j];
        } // Fill in the simulated unmounts (hidden Suspense subtrees) in their order.
        // (We want children to go before parents.)
        // They go *after* the real unmounts because we know for sure they won't be
        // children of already pushed "real" IDs. If they were, we wouldn't be able
        // to discover them during the traversal, as they would have been deleted.
  
  
        for (let j = 0; j < pendingSimulatedUnmountedIDs.length; j++) {
          operations[i + j] = pendingSimulatedUnmountedIDs[j];
        }
  
        i += pendingSimulatedUnmountedIDs.length; // The root ID should always be unmounted last.
  
        if (pendingUnmountedRootID !== null) {
          operations[i] = pendingUnmountedRootID;
          i++;
        }
      } // Fill in the rest of the operations.
  
  
      for (let j = 0; j < pendingOperations.length; j++) {
        operations[i + j] = pendingOperations[j];
      }
  
      i += pendingOperations.length; // Let the frontend know about tree operations.
  
      flushOrQueueOperations(operations); // Reset all of the pending state now that we've told the frontend about it.
  
      pendingOperations.length = 0;
      pendingRealUnmountedIDs.length = 0;
      pendingSimulatedUnmountedIDs.length = 0;
      pendingUnmountedRootID = null;
      pendingStringTable.clear();
      pendingStringTableLength = 0;
    }
  
    function getStringID(string) {
      if (string === null) {
        return 0;
      }
  
      const existingEntry = pendingStringTable.get(string);
  
      if (existingEntry !== undefined) {
        return existingEntry.id;
      }
  
      const id = pendingStringTable.size + 1;
      const encodedString = Object(utils["p" /* utfEncodeString */])(string);
      pendingStringTable.set(string, {
        encodedString,
        id
      }); // The string table total length needs to account both for the string length,
      // and for the array item that contains the length itself.
      //
      // Don't use string length for this table.
      // It won't work for multibyte characters (like emoji).
  
      pendingStringTableLength += encodedString.length + 1;
      return id;
    }
  
    function recordMount(fiber, parentFiber) {
      const isRoot = fiber.tag === HostRoot;
      const id = getOrGenerateFiberID(fiber);
  
      if (constants["j" /* __DEBUG__ */]) {
        debug('recordMount()', fiber, parentFiber);
      }
  
      const hasOwnerMetadata = fiber.hasOwnProperty('_debugOwner');
      const isProfilingSupported = fiber.hasOwnProperty('treeBaseDuration'); // Adding a new field here would require a bridge protocol version bump (a backwads breaking change).
      // Instead let's re-purpose a pre-existing field to carry more information.
  
      let profilingFlags = 0;
  
      if (isProfilingSupported) {
        profilingFlags = constants["a" /* PROFILING_FLAG_BASIC_SUPPORT */];
  
        if (typeof injectProfilingHooks === 'function') {
          profilingFlags |= constants["b" /* PROFILING_FLAG_TIMELINE_SUPPORT */];
        }
      }
  
      if (isRoot) {
        pushOperation(constants["c" /* TREE_OPERATION_ADD */]);
        pushOperation(id);
        pushOperation(types["m" /* ElementTypeRoot */]);
        pushOperation((fiber.mode & StrictModeBits) !== 0 ? 1 : 0);
        pushOperation(profilingFlags);
        pushOperation(StrictModeBits !== 0 ? 1 : 0);
        pushOperation(hasOwnerMetadata ? 1 : 0);
  
        if (isProfiling) {
          if (displayNamesByRootID !== null) {
            displayNamesByRootID.set(id, getDisplayNameForRoot(fiber));
          }
        }
      } else {
        const {
          key
        } = fiber;
        const displayName = getDisplayNameForFiber(fiber);
        const elementType = getElementTypeForFiber(fiber);
        const {
          _debugOwner
        } = fiber; // Ideally we should call getFiberIDThrows() for _debugOwner,
        // since owners are almost always higher in the tree (and so have already been processed),
        // but in some (rare) instances reported in open source, a descendant mounts before an owner.
        // Since this is a DEV only field it's probably okay to also just lazily generate and ID here if needed.
        // See https://github.com/facebook/react/issues/21445
  
        const ownerID = _debugOwner != null ? getOrGenerateFiberID(_debugOwner) : 0;
        const parentID = parentFiber ? getFiberIDThrows(parentFiber) : 0;
        const displayNameStringID = getStringID(displayName); // This check is a guard to handle a React element that has been modified
        // in such a way as to bypass the default stringification of the "key" property.
  
        const keyString = key === null ? null : String(key);
        const keyStringID = getStringID(keyString);
        pushOperation(constants["c" /* TREE_OPERATION_ADD */]);
        pushOperation(id);
        pushOperation(elementType);
        pushOperation(parentID);
        pushOperation(ownerID);
        pushOperation(displayNameStringID);
        pushOperation(keyStringID); // If this subtree has a new mode, let the frontend know.
  
        if ((fiber.mode & StrictModeBits) !== 0 && (parentFiber.mode & StrictModeBits) === 0) {
          pushOperation(constants["g" /* TREE_OPERATION_SET_SUBTREE_MODE */]);
          pushOperation(id);
          pushOperation(types["q" /* StrictMode */]);
        }
      }
  
      if (isProfilingSupported) {
        idToRootMap.set(id, currentRootID);
        recordProfilingDurations(fiber);
      }
    }
  
    function recordUnmount(fiber, isSimulated) {
      if (constants["j" /* __DEBUG__ */]) {
        debug('recordUnmount()', fiber, null, isSimulated ? 'unmount is simulated' : '');
      }
  
      if (trackedPathMatchFiber !== null) {
        // We're in the process of trying to restore previous selection.
        // If this fiber matched but is being unmounted, there's no use trying.
        // Reset the state so we don't keep holding onto it.
        if (fiber === trackedPathMatchFiber || fiber === trackedPathMatchFiber.alternate) {
          setTrackedPath(null);
        }
      }
  
      const persistentID = getReplayFiberID(fiber);
      const unsafeID = persistentID;
  
      if (unsafeID === null) {
        // If we've never seen this Fiber, it might be inside of a legacy render Suspense fragment (so the store is not even aware of it).
        // In that case we can just ignore it or it will cause errors later on.
        // One example of this is a Lazy component that never resolves before being unmounted.
        //
        // This also might indicate a Fast Refresh force-remount scenario.
        //
        // TODO: This is fragile and can obscure actual bugs.
        return;
      } // Flow refinement.
  
  
      const id = unsafeID;
      const isRoot = fiber.tag === HostRoot;
  
      if (isRoot) {
        // Roots must be removed only after all children (pending and simulated) have been removed.
        // So we track it separately.
        pendingUnmountedRootID = id;
      } else if (!shouldFilterFiber(fiber)) {
        // To maintain child-first ordering,
        // we'll push it into one of these queues,
        // and later arrange them in the correct order.
        if (isSimulated) {
          pendingSimulatedUnmountedIDs.push(id);
        } else {
          pendingRealUnmountedIDs.push(id);
        }
      }
  
      if (!fiber._debugNeedsRemount) {
        untrackFiberID(fiber);
        const isProfilingSupported = fiber.hasOwnProperty('treeBaseDuration');
  
        if (isProfilingSupported) {
          idToRootMap.delete(id);
          idToTreeBaseDurationMap.delete(id);
        }
      }
    }
  
    function mountFiberRecursively(firstChild, parentFiber, traverseSiblings, traceNearestHostComponentUpdate) {
      // Iterate over siblings rather than recursing.
      // This reduces the chance of stack overflow for wide trees (e.g. lists with many items).
      let fiber = firstChild;
  
      while (fiber !== null) {
        // Generate an ID even for filtered Fibers, in case it's needed later (e.g. for Profiling).
        getOrGenerateFiberID(fiber);
  
        if (constants["j" /* __DEBUG__ */]) {
          debug('mountFiberRecursively()', fiber, parentFiber);
        } // If we have the tree selection from previous reload, try to match this Fiber.
        // Also remember whether to do the same for siblings.
  
  
        const mightSiblingsBeOnTrackedPath = updateTrackedPathStateBeforeMount(fiber);
        const shouldIncludeInTree = !shouldFilterFiber(fiber);
  
        if (shouldIncludeInTree) {
          recordMount(fiber, parentFiber);
        }
  
        if (traceUpdatesEnabled) {
          if (traceNearestHostComponentUpdate) {
            const elementType = getElementTypeForFiber(fiber); // If an ancestor updated, we should mark the nearest host nodes for highlighting.
  
            if (elementType === types["i" /* ElementTypeHostComponent */]) {
              traceUpdatesForNodes.add(fiber.stateNode);
              traceNearestHostComponentUpdate = false;
            }
          } // We intentionally do not re-enable the traceNearestHostComponentUpdate flag in this branch,
          // because we don't want to highlight every host node inside of a newly mounted subtree.
  
        }
  
        const isSuspense = fiber.tag === ReactTypeOfWork.SuspenseComponent;
  
        if (isSuspense) {
          const isTimedOut = fiber.memoizedState !== null;
  
          if (isTimedOut) {
            // Special case: if Suspense mounts in a timed-out state,
            // get the fallback child from the inner fragment and mount
            // it as if it was our own child. Updates handle this too.
            const primaryChildFragment = fiber.child;
            const fallbackChildFragment = primaryChildFragment ? primaryChildFragment.sibling : null;
            const fallbackChild = fallbackChildFragment ? fallbackChildFragment.child : null;
  
            if (fallbackChild !== null) {
              mountFiberRecursively(fallbackChild, shouldIncludeInTree ? fiber : parentFiber, true, traceNearestHostComponentUpdate);
            }
          } else {
            let primaryChild = null;
            const areSuspenseChildrenConditionallyWrapped = OffscreenComponent === -1;
  
            if (areSuspenseChildrenConditionallyWrapped) {
              primaryChild = fiber.child;
            } else if (fiber.child !== null) {
              primaryChild = fiber.child.child;
            }
  
            if (primaryChild !== null) {
              mountFiberRecursively(primaryChild, shouldIncludeInTree ? fiber : parentFiber, true, traceNearestHostComponentUpdate);
            }
          }
        } else {
          if (fiber.child !== null) {
            mountFiberRecursively(fiber.child, shouldIncludeInTree ? fiber : parentFiber, true, traceNearestHostComponentUpdate);
          }
        } // We're exiting this Fiber now, and entering its siblings.
        // If we have selection to restore, we might need to re-activate tracking.
  
  
        updateTrackedPathStateAfterMount(mightSiblingsBeOnTrackedPath);
        fiber = traverseSiblings ? fiber.sibling : null;
      }
    } // We use this to simulate unmounting for Suspense trees
    // when we switch from primary to fallback.
  
  
    function unmountFiberChildrenRecursively(fiber) {
      if (constants["j" /* __DEBUG__ */]) {
        debug('unmountFiberChildrenRecursively()', fiber);
      } // We might meet a nested Suspense on our way.
  
  
      const isTimedOutSuspense = fiber.tag === ReactTypeOfWork.SuspenseComponent && fiber.memoizedState !== null;
      let child = fiber.child;
  
      if (isTimedOutSuspense) {
        // If it's showing fallback tree, let's traverse it instead.
        const primaryChildFragment = fiber.child;
        const fallbackChildFragment = primaryChildFragment ? primaryChildFragment.sibling : null; // Skip over to the real Fiber child.
  
        child = fallbackChildFragment ? fallbackChildFragment.child : null;
      }
  
      while (child !== null) {
        // Record simulated unmounts children-first.
        // We skip nodes without return because those are real unmounts.
        if (child.return !== null) {
          unmountFiberChildrenRecursively(child);
          recordUnmount(child, true);
        }
  
        child = child.sibling;
      }
    }
  
    function recordProfilingDurations(fiber) {
      const id = getFiberIDThrows(fiber);
      const {
        actualDuration,
        treeBaseDuration
      } = fiber;
      idToTreeBaseDurationMap.set(id, treeBaseDuration || 0);
  
      if (isProfiling) {
        const {
          alternate
        } = fiber; // It's important to update treeBaseDuration even if the current Fiber did not render,
        // because it's possible that one of its descendants did.
  
        if (alternate == null || treeBaseDuration !== alternate.treeBaseDuration) {
          // Tree base duration updates are included in the operations typed array.
          // So we have to convert them from milliseconds to microseconds so we can send them as ints.
          const convertedTreeBaseDuration = Math.floor((treeBaseDuration || 0) * 1000);
          pushOperation(constants["i" /* TREE_OPERATION_UPDATE_TREE_BASE_DURATION */]);
          pushOperation(id);
          pushOperation(convertedTreeBaseDuration);
        }
  
        if (alternate == null || didFiberRender(alternate, fiber)) {
          if (actualDuration != null) {
            // The actual duration reported by React includes time spent working on children.
            // This is useful information, but it's also useful to be able to exclude child durations.
            // The frontend can't compute this, since the immediate children may have been filtered out.
            // So we need to do this on the backend.
            // Note that this calculated self duration is not the same thing as the base duration.
            // The two are calculated differently (tree duration does not accumulate).
            let selfDuration = actualDuration;
            let child = fiber.child;
  
            while (child !== null) {
              selfDuration -= child.actualDuration || 0;
              child = child.sibling;
            } // If profiling is active, store durations for elements that were rendered during the commit.
            // Note that we should do this for any fiber we performed work on, regardless of its actualDuration value.
            // In some cases actualDuration might be 0 for fibers we worked on (particularly if we're using Date.now)
            // In other cases (e.g. Memo) actualDuration might be greater than 0 even if we "bailed out".
  
  
            const metadata = currentCommitProfilingMetadata;
            metadata.durations.push(id, actualDuration, selfDuration);
            metadata.maxActualDuration = Math.max(metadata.maxActualDuration, actualDuration);
  
            if (recordChangeDescriptions) {
              const changeDescription = getChangeDescription(alternate, fiber);
  
              if (changeDescription !== null) {
                if (metadata.changeDescriptions !== null) {
                  metadata.changeDescriptions.set(id, changeDescription);
                }
              }
  
              updateContextsForFiber(fiber);
            }
          }
        }
      }
    }
  
    function recordResetChildren(fiber, childSet) {
      if (constants["j" /* __DEBUG__ */]) {
        debug('recordResetChildren()', childSet, fiber);
      } // The frontend only really cares about the displayName, key, and children.
      // The first two don't really change, so we are only concerned with the order of children here.
      // This is trickier than a simple comparison though, since certain types of fibers are filtered.
  
  
      const nextChildren = []; // This is a naive implementation that shallowly recourses children.
      // We might want to revisit this if it proves to be too inefficient.
  
      let child = childSet;
  
      while (child !== null) {
        findReorderedChildrenRecursively(child, nextChildren);
        child = child.sibling;
      }
  
      const numChildren = nextChildren.length;
  
      if (numChildren < 2) {
        // No need to reorder.
        return;
      }
  
      pushOperation(constants["f" /* TREE_OPERATION_REORDER_CHILDREN */]);
      pushOperation(getFiberIDThrows(fiber));
      pushOperation(numChildren);
  
      for (let i = 0; i < nextChildren.length; i++) {
        pushOperation(nextChildren[i]);
      }
    }
  
    function findReorderedChildrenRecursively(fiber, nextChildren) {
      if (!shouldFilterFiber(fiber)) {
        nextChildren.push(getFiberIDThrows(fiber));
      } else {
        let child = fiber.child;
        const isTimedOutSuspense = fiber.tag === SuspenseComponent && fiber.memoizedState !== null;
  
        if (isTimedOutSuspense) {
          // Special case: if Suspense mounts in a timed-out state,
          // get the fallback child from the inner fragment,
          // and skip over the primary child.
          const primaryChildFragment = fiber.child;
          const fallbackChildFragment = primaryChildFragment ? primaryChildFragment.sibling : null;
          const fallbackChild = fallbackChildFragment ? fallbackChildFragment.child : null;
  
          if (fallbackChild !== null) {
            child = fallbackChild;
          }
        }
  
        while (child !== null) {
          findReorderedChildrenRecursively(child, nextChildren);
          child = child.sibling;
        }
      }
    } // Returns whether closest unfiltered fiber parent needs to reset its child list.
  
  
    function updateFiberRecursively(nextFiber, prevFiber, parentFiber, traceNearestHostComponentUpdate) {
      const id = getOrGenerateFiberID(nextFiber);
  
      if (constants["j" /* __DEBUG__ */]) {
        debug('updateFiberRecursively()', nextFiber, parentFiber);
      }
  
      if (traceUpdatesEnabled) {
        const elementType = getElementTypeForFiber(nextFiber);
  
        if (traceNearestHostComponentUpdate) {
          // If an ancestor updated, we should mark the nearest host nodes for highlighting.
          if (elementType === types["i" /* ElementTypeHostComponent */]) {
            traceUpdatesForNodes.add(nextFiber.stateNode);
            traceNearestHostComponentUpdate = false;
          }
        } else {
          if (elementType === types["h" /* ElementTypeFunction */] || elementType === types["e" /* ElementTypeClass */] || elementType === types["f" /* ElementTypeContext */] || elementType === types["j" /* ElementTypeMemo */] || elementType === types["g" /* ElementTypeForwardRef */]) {
            // Otherwise if this is a traced ancestor, flag for the nearest host descendant(s).
            traceNearestHostComponentUpdate = didFiberRender(prevFiber, nextFiber);
          }
        }
      }
  
      if (mostRecentlyInspectedElement !== null && mostRecentlyInspectedElement.id === id && didFiberRender(prevFiber, nextFiber)) {
        // If this Fiber has updated, clear cached inspected data.
        // If it is inspected again, it may need to be re-run to obtain updated hooks values.
        hasElementUpdatedSinceLastInspected = true;
      }
  
      const shouldIncludeInTree = !shouldFilterFiber(nextFiber);
      const isSuspense = nextFiber.tag === SuspenseComponent;
      let shouldResetChildren = false; // The behavior of timed-out Suspense trees is unique.
      // Rather than unmount the timed out content (and possibly lose important state),
      // React re-parents this content within a hidden Fragment while the fallback is showing.
      // This behavior doesn't need to be observable in the DevTools though.
      // It might even result in a bad user experience for e.g. node selection in the Elements panel.
      // The easiest fix is to strip out the intermediate Fragment fibers,
      // so the Elements panel and Profiler don't need to special case them.
      // Suspense components only have a non-null memoizedState if they're timed-out.
  
      const prevDidTimeout = isSuspense && prevFiber.memoizedState !== null;
      const nextDidTimeOut = isSuspense && nextFiber.memoizedState !== null; // The logic below is inspired by the code paths in updateSuspenseComponent()
      // inside ReactFiberBeginWork in the React source code.
  
      if (prevDidTimeout && nextDidTimeOut) {
        // Fallback -> Fallback:
        // 1. Reconcile fallback set.
        const nextFiberChild = nextFiber.child;
        const nextFallbackChildSet = nextFiberChild ? nextFiberChild.sibling : null; // Note: We can't use nextFiber.child.sibling.alternate
        // because the set is special and alternate may not exist.
  
        const prevFiberChild = prevFiber.child;
        const prevFallbackChildSet = prevFiberChild ? prevFiberChild.sibling : null;
  
        if (nextFallbackChildSet != null && prevFallbackChildSet != null && updateFiberRecursively(nextFallbackChildSet, prevFallbackChildSet, nextFiber, traceNearestHostComponentUpdate)) {
          shouldResetChildren = true;
        }
      } else if (prevDidTimeout && !nextDidTimeOut) {
        // Fallback -> Primary:
        // 1. Unmount fallback set
        // Note: don't emulate fallback unmount because React actually did it.
        // 2. Mount primary set
        const nextPrimaryChildSet = nextFiber.child;
  
        if (nextPrimaryChildSet !== null) {
          mountFiberRecursively(nextPrimaryChildSet, shouldIncludeInTree ? nextFiber : parentFiber, true, traceNearestHostComponentUpdate);
        }
  
        shouldResetChildren = true;
      } else if (!prevDidTimeout && nextDidTimeOut) {
        // Primary -> Fallback:
        // 1. Hide primary set
        // This is not a real unmount, so it won't get reported by React.
        // We need to manually walk the previous tree and record unmounts.
        unmountFiberChildrenRecursively(prevFiber); // 2. Mount fallback set
  
        const nextFiberChild = nextFiber.child;
        const nextFallbackChildSet = nextFiberChild ? nextFiberChild.sibling : null;
  
        if (nextFallbackChildSet != null) {
          mountFiberRecursively(nextFallbackChildSet, shouldIncludeInTree ? nextFiber : parentFiber, true, traceNearestHostComponentUpdate);
          shouldResetChildren = true;
        }
      } else {
        // Common case: Primary -> Primary.
        // This is the same code path as for non-Suspense fibers.
        if (nextFiber.child !== prevFiber.child) {
          // If the first child is different, we need to traverse them.
          // Each next child will be either a new child (mount) or an alternate (update).
          let nextChild = nextFiber.child;
          let prevChildAtSameIndex = prevFiber.child;
  
          while (nextChild) {
            // We already know children will be referentially different because
            // they are either new mounts or alternates of previous children.
            // Schedule updates and mounts depending on whether alternates exist.
            // We don't track deletions here because they are reported separately.
            if (nextChild.alternate) {
              const prevChild = nextChild.alternate;
  
              if (updateFiberRecursively(nextChild, prevChild, shouldIncludeInTree ? nextFiber : parentFiber, traceNearestHostComponentUpdate)) {
                // If a nested tree child order changed but it can't handle its own
                // child order invalidation (e.g. because it's filtered out like host nodes),
                // propagate the need to reset child order upwards to this Fiber.
                shouldResetChildren = true;
              } // However we also keep track if the order of the children matches
              // the previous order. They are always different referentially, but
              // if the instances line up conceptually we'll want to know that.
  
  
              if (prevChild !== prevChildAtSameIndex) {
                shouldResetChildren = true;
              }
            } else {
              mountFiberRecursively(nextChild, shouldIncludeInTree ? nextFiber : parentFiber, false, traceNearestHostComponentUpdate);
              shouldResetChildren = true;
            } // Try the next child.
  
  
            nextChild = nextChild.sibling; // Advance the pointer in the previous list so that we can
            // keep comparing if they line up.
  
            if (!shouldResetChildren && prevChildAtSameIndex !== null) {
              prevChildAtSameIndex = prevChildAtSameIndex.sibling;
            }
          } // If we have no more children, but used to, they don't line up.
  
  
          if (prevChildAtSameIndex !== null) {
            shouldResetChildren = true;
          }
        } else {
          if (traceUpdatesEnabled) {
            // If we're tracing updates and we've bailed out before reaching a host node,
            // we should fall back to recursively marking the nearest host descendants for highlight.
            if (traceNearestHostComponentUpdate) {
              const hostFibers = findAllCurrentHostFibers(getFiberIDThrows(nextFiber));
              hostFibers.forEach(hostFiber => {
                traceUpdatesForNodes.add(hostFiber.stateNode);
              });
            }
          }
        }
      }
  
      if (shouldIncludeInTree) {
        const isProfilingSupported = nextFiber.hasOwnProperty('treeBaseDuration');
  
        if (isProfilingSupported) {
          recordProfilingDurations(nextFiber);
        }
      }
  
      if (shouldResetChildren) {
        // We need to crawl the subtree for closest non-filtered Fibers
        // so that we can display them in a flat children set.
        if (shouldIncludeInTree) {
          // Normally, search for children from the rendered child.
          let nextChildSet = nextFiber.child;
  
          if (nextDidTimeOut) {
            // Special case: timed-out Suspense renders the fallback set.
            const nextFiberChild = nextFiber.child;
            nextChildSet = nextFiberChild ? nextFiberChild.sibling : null;
          }
  
          if (nextChildSet != null) {
            recordResetChildren(nextFiber, nextChildSet);
          } // We've handled the child order change for this Fiber.
          // Since it's included, there's no need to invalidate parent child order.
  
  
          return false;
        } else {
          // Let the closest unfiltered parent Fiber reset its child order instead.
          return true;
        }
      } else {
        return false;
      }
    }
  
    function cleanup() {// We don't patch any methods so there is no cleanup.
    }
  
    function rootSupportsProfiling(root) {
      if (root.memoizedInteractions != null) {
        // v16 builds include this field for the scheduler/tracing API.
        return true;
      } else if (root.current != null && root.current.hasOwnProperty('treeBaseDuration')) {
        // The scheduler/tracing API was removed in v17 though
        // so we need to check a non-root Fiber.
        return true;
      } else {
        return false;
      }
    }
  
    function flushInitialOperations() {
      const localPendingOperationsQueue = pendingOperationsQueue;
      pendingOperationsQueue = null;
  
      if (localPendingOperationsQueue !== null && localPendingOperationsQueue.length > 0) {
        // We may have already queued up some operations before the frontend connected
        // If so, let the frontend know about them.
        localPendingOperationsQueue.forEach(operations => {
          hook.emit('operations', operations);
        });
      } else {
        // Before the traversals, remember to start tracking
        // our path in case we have selection to restore.
        if (trackedPath !== null) {
          mightBeOnTrackedPath = true;
        } // If we have not been profiling, then we can just walk the tree and build up its current state as-is.
  
  
        hook.getFiberRoots(rendererID).forEach(root => {
          currentRootID = getOrGenerateFiberID(root.current);
          setRootPseudoKey(currentRootID, root.current); // Handle multi-renderer edge-case where only some v16 renderers support profiling.
  
          if (isProfiling && rootSupportsProfiling(root)) {
            // If profiling is active, store commit time and duration.
            // The frontend may request this information after profiling has stopped.
            currentCommitProfilingMetadata = {
              changeDescriptions: recordChangeDescriptions ? new Map() : null,
              durations: [],
              commitTime: renderer_getCurrentTime() - profilingStartTime,
              maxActualDuration: 0,
              priorityLevel: null,
              updaters: getUpdatersList(root),
              effectDuration: null,
              passiveEffectDuration: null
            };
          }
  
          mountFiberRecursively(root.current, null, false, false);
          flushPendingEvents(root);
          currentRootID = -1;
        });
      }
    }
  
    function getUpdatersList(root) {
      return root.memoizedUpdaters != null ? Array.from(root.memoizedUpdaters).filter(fiber => getFiberIDUnsafe(fiber) !== null).map(fiberToSerializedElement) : null;
    }
  
    function handleCommitFiberUnmount(fiber) {
      // If the untrackFiberSet already has the unmounted Fiber, this means we've already
      // recordedUnmount, so we don't need to do it again. If we don't do this, we might
      // end up double-deleting Fibers in some cases (like Legacy Suspense).
      if (!untrackFibersSet.has(fiber)) {
        // This is not recursive.
        // We can't traverse fibers after unmounting so instead
        // we rely on React telling us about each unmount.
        recordUnmount(fiber, false);
      }
    }
  
    function handlePostCommitFiberRoot(root) {
      if (isProfiling && rootSupportsProfiling(root)) {
        if (currentCommitProfilingMetadata !== null) {
          const {
            effectDuration,
            passiveEffectDuration
          } = Object(backend_utils["h" /* getEffectDurations */])(root); // $FlowFixMe[incompatible-use] found when upgrading Flow
  
          currentCommitProfilingMetadata.effectDuration = effectDuration; // $FlowFixMe[incompatible-use] found when upgrading Flow
  
          currentCommitProfilingMetadata.passiveEffectDuration = passiveEffectDuration;
        }
      }
    }
  
    function handleCommitFiberRoot(root, priorityLevel) {
      const current = root.current;
      const alternate = current.alternate; // Flush any pending Fibers that we are untracking before processing the new commit.
      // If we don't do this, we might end up double-deleting Fibers in some cases (like Legacy Suspense).
  
      untrackFibers();
      currentRootID = getOrGenerateFiberID(current); // Before the traversals, remember to start tracking
      // our path in case we have selection to restore.
  
      if (trackedPath !== null) {
        mightBeOnTrackedPath = true;
      }
  
      if (traceUpdatesEnabled) {
        traceUpdatesForNodes.clear();
      } // Handle multi-renderer edge-case where only some v16 renderers support profiling.
  
  
      const isProfilingSupported = rootSupportsProfiling(root);
  
      if (isProfiling && isProfilingSupported) {
        // If profiling is active, store commit time and duration.
        // The frontend may request this information after profiling has stopped.
        currentCommitProfilingMetadata = {
          changeDescriptions: recordChangeDescriptions ? new Map() : null,
          durations: [],
          commitTime: renderer_getCurrentTime() - profilingStartTime,
          maxActualDuration: 0,
          priorityLevel: priorityLevel == null ? null : formatPriorityLevel(priorityLevel),
          updaters: getUpdatersList(root),
          // Initialize to null; if new enough React version is running,
          // these values will be read during separate handlePostCommitFiberRoot() call.
          effectDuration: null,
          passiveEffectDuration: null
        };
      }
  
      if (alternate) {
        // TODO: relying on this seems a bit fishy.
        const wasMounted = alternate.memoizedState != null && alternate.memoizedState.element != null && // A dehydrated root is not considered mounted
        alternate.memoizedState.isDehydrated !== true;
        const isMounted = current.memoizedState != null && current.memoizedState.element != null && // A dehydrated root is not considered mounted
        current.memoizedState.isDehydrated !== true;
  
        if (!wasMounted && isMounted) {
          // Mount a new root.
          setRootPseudoKey(currentRootID, current);
          mountFiberRecursively(current, null, false, false);
        } else if (wasMounted && isMounted) {
          // Update an existing root.
          updateFiberRecursively(current, alternate, null, false);
        } else if (wasMounted && !isMounted) {
          // Unmount an existing root.
          removeRootPseudoKey(currentRootID);
          recordUnmount(current, false);
        }
      } else {
        // Mount a new root.
        setRootPseudoKey(currentRootID, current);
        mountFiberRecursively(current, null, false, false);
      }
  
      if (isProfiling && isProfilingSupported) {
        if (!shouldBailoutWithPendingOperations()) {
          const commitProfilingMetadata = rootToCommitProfilingMetadataMap.get(currentRootID);
  
          if (commitProfilingMetadata != null) {
            commitProfilingMetadata.push(currentCommitProfilingMetadata);
          } else {
            rootToCommitProfilingMetadataMap.set(currentRootID, [currentCommitProfilingMetadata]);
          }
        }
      } // We're done here.
  
  
      flushPendingEvents(root);
  
      if (traceUpdatesEnabled) {
        hook.emit('traceUpdates', traceUpdatesForNodes);
      }
  
      currentRootID = -1;
    }
  
    function findAllCurrentHostFibers(id) {
      const fibers = [];
      const fiber = findCurrentFiberUsingSlowPathById(id);
  
      if (!fiber) {
        return fibers;
      } // Next we'll drill down this component to find all HostComponent/Text.
  
  
      let node = fiber;
  
      while (true) {
        if (node.tag === HostComponent || node.tag === HostText) {
          fibers.push(node);
        } else if (node.child) {
          node.child.return = node;
          node = node.child;
          continue;
        }
  
        if (node === fiber) {
          return fibers;
        }
  
        while (!node.sibling) {
          if (!node.return || node.return === fiber) {
            return fibers;
          }
  
          node = node.return;
        }
  
        node.sibling.return = node.return;
        node = node.sibling;
      } // Flow needs the return here, but ESLint complains about it.
      // eslint-disable-next-line no-unreachable
  
  
      return fibers;
    }
  
    function findNativeNodesForFiberID(id) {
      try {
        let fiber = findCurrentFiberUsingSlowPathById(id);
  
        if (fiber === null) {
          return null;
        } // Special case for a timed-out Suspense.
  
  
        const isTimedOutSuspense = fiber.tag === SuspenseComponent && fiber.memoizedState !== null;
  
        if (isTimedOutSuspense) {
          // A timed-out Suspense's findDOMNode is useless.
          // Try our best to find the fallback directly.
          const maybeFallbackFiber = fiber.child && fiber.child.sibling;
  
          if (maybeFallbackFiber != null) {
            fiber = maybeFallbackFiber;
          }
        }
  
        const hostFibers = findAllCurrentHostFibers(id);
        return hostFibers.map(hostFiber => hostFiber.stateNode).filter(Boolean);
      } catch (err) {
        // The fiber might have unmounted by now.
        return null;
      }
    }
  
    function getDisplayNameForFiberID(id) {
      const fiber = idToArbitraryFiberMap.get(id);
      return fiber != null ? getDisplayNameForFiber(fiber) : null;
    }
  
    function getFiberForNative(hostInstance) {
      return renderer.findFiberByHostInstance(hostInstance);
    }
  
    function getFiberIDForNative(hostInstance, findNearestUnfilteredAncestor = false) {
      let fiber = renderer.findFiberByHostInstance(hostInstance);
  
      if (fiber != null) {
        if (findNearestUnfilteredAncestor) {
          while (fiber !== null && shouldFilterFiber(fiber)) {
            fiber = fiber.return;
          }
        }
  
        return getFiberIDThrows(fiber);
      }
  
      return null;
    } // This function is copied from React and should be kept in sync:
    // https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberTreeReflection.js
  
  
    function assertIsMounted(fiber) {
      if (getNearestMountedFiber(fiber) !== fiber) {
        throw new Error('Unable to find node on an unmounted component.');
      }
    } // This function is copied from React and should be kept in sync:
    // https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberTreeReflection.js
  
  
    function getNearestMountedFiber(fiber) {
      let node = fiber;
      let nearestMounted = fiber;
  
      if (!fiber.alternate) {
        // If there is no alternate, this might be a new tree that isn't inserted
        // yet. If it is, then it will have a pending insertion effect on it.
        let nextNode = node;
  
        do {
          node = nextNode;
  
          if ((node.flags & (Placement | Hydrating)) !== NoFlags) {
            // This is an insertion or in-progress hydration. The nearest possible
            // mounted fiber is the parent but we need to continue to figure out
            // if that one is still mounted.
            nearestMounted = node.return;
          } // $FlowFixMe[incompatible-type] we bail out when we get a null
  
  
          nextNode = node.return;
        } while (nextNode);
      } else {
        while (node.return) {
          node = node.return;
        }
      }
  
      if (node.tag === HostRoot) {
        // TODO: Check if this was a nested HostRoot when used with
        // renderContainerIntoSubtree.
        return nearestMounted;
      } // If we didn't hit the root, that means that we're in an disconnected tree
      // that has been unmounted.
  
  
      return null;
    } // This function is copied from React and should be kept in sync:
    // https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberTreeReflection.js
    // It would be nice if we updated React to inject this function directly (vs just indirectly via findDOMNode).
    // BEGIN copied code
  
  
    function findCurrentFiberUsingSlowPathById(id) {
      const fiber = idToArbitraryFiberMap.get(id);
  
      if (fiber == null) {
        console.warn(`Could not find Fiber with id "${id}"`);
        return null;
      }
  
      const alternate = fiber.alternate;
  
      if (!alternate) {
        // If there is no alternate, then we only need to check if it is mounted.
        const nearestMounted = getNearestMountedFiber(fiber);
  
        if (nearestMounted === null) {
          throw new Error('Unable to find node on an unmounted component.');
        }
  
        if (nearestMounted !== fiber) {
          return null;
        }
  
        return fiber;
      } // If we have two possible branches, we'll walk backwards up to the root
      // to see what path the root points to. On the way we may hit one of the
      // special cases and we'll deal with them.
  
  
      let a = fiber;
      let b = alternate;
  
      while (true) {
        const parentA = a.return;
  
        if (parentA === null) {
          // We're at the root.
          break;
        }
  
        const parentB = parentA.alternate;
  
        if (parentB === null) {
          // There is no alternate. This is an unusual case. Currently, it only
          // happens when a Suspense component is hidden. An extra fragment fiber
          // is inserted in between the Suspense fiber and its children. Skip
          // over this extra fragment fiber and proceed to the next parent.
          const nextParent = parentA.return;
  
          if (nextParent !== null) {
            a = b = nextParent;
            continue;
          } // If there's no parent, we're at the root.
  
  
          break;
        } // If both copies of the parent fiber point to the same child, we can
        // assume that the child is current. This happens when we bailout on low
        // priority: the bailed out fiber's child reuses the current child.
  
  
        if (parentA.child === parentB.child) {
          let child = parentA.child;
  
          while (child) {
            if (child === a) {
              // We've determined that A is the current branch.
              assertIsMounted(parentA);
              return fiber;
            }
  
            if (child === b) {
              // We've determined that B is the current branch.
              assertIsMounted(parentA);
              return alternate;
            }
  
            child = child.sibling;
          } // We should never have an alternate for any mounting node. So the only
          // way this could possibly happen is if this was unmounted, if at all.
  
  
          throw new Error('Unable to find node on an unmounted component.');
        }
  
        if (a.return !== b.return) {
          // The return pointer of A and the return pointer of B point to different
          // fibers. We assume that return pointers never criss-cross, so A must
          // belong to the child set of A.return, and B must belong to the child
          // set of B.return.
          a = parentA;
          b = parentB;
        } else {
          // The return pointers point to the same fiber. We'll have to use the
          // default, slow path: scan the child sets of each parent alternate to see
          // which child belongs to which set.
          //
          // Search parent A's child set
          let didFindChild = false;
          let child = parentA.child;
  
          while (child) {
            if (child === a) {
              didFindChild = true;
              a = parentA;
              b = parentB;
              break;
            }
  
            if (child === b) {
              didFindChild = true;
              b = parentA;
              a = parentB;
              break;
            }
  
            child = child.sibling;
          }
  
          if (!didFindChild) {
            // Search parent B's child set
            child = parentB.child;
  
            while (child) {
              if (child === a) {
                didFindChild = true;
                a = parentB;
                b = parentA;
                break;
              }
  
              if (child === b) {
                didFindChild = true;
                b = parentB;
                a = parentA;
                break;
              }
  
              child = child.sibling;
            }
  
            if (!didFindChild) {
              throw new Error('Child was not found in either parent set. This indicates a bug ' + 'in React related to the return pointer. Please file an issue.');
            }
          }
        }
  
        if (a.alternate !== b) {
          throw new Error("Return fibers should always be each others' alternates. " + 'This error is likely caused by a bug in React. Please file an issue.');
        }
      } // If the root is not a host container, we're in a disconnected tree. I.e.
      // unmounted.
  
  
      if (a.tag !== HostRoot) {
        throw new Error('Unable to find node on an unmounted component.');
      }
  
      if (a.stateNode.current === a) {
        // We've determined that A is the current branch.
        return fiber;
      } // Otherwise B has to be current branch.
  
  
      return alternate;
    } // END copied code
  
  
    function prepareViewAttributeSource(id, path) {
      if (isMostRecentlyInspectedElement(id)) {
        window.$attribute = Object(utils["j" /* getInObject */])(mostRecentlyInspectedElement, path);
      }
    }
  
    function prepareViewElementSource(id) {
      const fiber = idToArbitraryFiberMap.get(id);
  
      if (fiber == null) {
        console.warn(`Could not find Fiber with id "${id}"`);
        return;
      }
  
      const {
        elementType,
        tag,
        type
      } = fiber;
  
      switch (tag) {
        case ClassComponent:
        case IncompleteClassComponent:
        case IndeterminateComponent:
        case FunctionComponent:
          global.$type = type;
          break;
  
        case ForwardRef:
          global.$type = type.render;
          break;
  
        case MemoComponent:
        case SimpleMemoComponent:
          global.$type = elementType != null && elementType.type != null ? elementType.type : type;
          break;
  
        default:
          global.$type = null;
          break;
      }
    }
  
    function fiberToSerializedElement(fiber) {
      return {
        displayName: getDisplayNameForFiber(fiber) || 'Anonymous',
        id: getFiberIDThrows(fiber),
        key: fiber.key,
        type: getElementTypeForFiber(fiber)
      };
    }
  
    function getOwnersList(id) {
      const fiber = findCurrentFiberUsingSlowPathById(id);
  
      if (fiber == null) {
        return null;
      }
  
      const {
        _debugOwner
      } = fiber;
      const owners = [fiberToSerializedElement(fiber)];
  
      if (_debugOwner) {
        let owner = _debugOwner;
  
        while (owner !== null) {
          owners.unshift(fiberToSerializedElement(owner));
          owner = owner._debugOwner || null;
        }
      }
  
      return owners;
    } // Fast path props lookup for React Native style editor.
    // Could use inspectElementRaw() but that would require shallow rendering hooks components,
    // and could also mess with memoization.
  
  
    function getInstanceAndStyle(id) {
      let instance = null;
      let style = null;
      const fiber = findCurrentFiberUsingSlowPathById(id);
  
      if (fiber !== null) {
        instance = fiber.stateNode;
  
        if (fiber.memoizedProps !== null) {
          style = fiber.memoizedProps.style;
        }
      }
  
      return {
        instance,
        style
      };
    }
  
    function isErrorBoundary(fiber) {
      const {
        tag,
        type
      } = fiber;
  
      switch (tag) {
        case ClassComponent:
        case IncompleteClassComponent:
          const instance = fiber.stateNode;
          return typeof type.getDerivedStateFromError === 'function' || instance !== null && typeof instance.componentDidCatch === 'function';
  
        default:
          return false;
      }
    }
  
    function getNearestErrorBoundaryID(fiber) {
      let parent = fiber.return;
  
      while (parent !== null) {
        if (isErrorBoundary(parent)) {
          return getFiberIDUnsafe(parent);
        }
  
        parent = parent.return;
      }
  
      return null;
    }
  
    function inspectElementRaw(id) {
      const fiber = findCurrentFiberUsingSlowPathById(id);
  
      if (fiber == null) {
        return null;
      }
  
      const {
        _debugOwner,
        _debugSource,
        stateNode,
        key,
        memoizedProps,
        memoizedState,
        dependencies,
        tag,
        type
      } = fiber;
      const elementType = getElementTypeForFiber(fiber);
      const usesHooks = (tag === FunctionComponent || tag === SimpleMemoComponent || tag === ForwardRef) && (!!memoizedState || !!dependencies); // TODO Show custom UI for Cache like we do for Suspense
      // For now, just hide state data entirely since it's not meant to be inspected.
  
      const showState = !usesHooks && tag !== CacheComponent;
      const typeSymbol = getTypeSymbol(type);
      let canViewSource = false;
      let context = null;
  
      if (tag === ClassComponent || tag === FunctionComponent || tag === IncompleteClassComponent || tag === IndeterminateComponent || tag === MemoComponent || tag === ForwardRef || tag === SimpleMemoComponent) {
        canViewSource = true;
  
        if (stateNode && stateNode.context != null) {
          // Don't show an empty context object for class components that don't use the context API.
          const shouldHideContext = elementType === types["e" /* ElementTypeClass */] && !(type.contextTypes || type.contextType);
  
          if (!shouldHideContext) {
            context = stateNode.context;
          }
        }
      } else if (typeSymbol === ReactSymbols["c" /* CONTEXT_NUMBER */] || typeSymbol === ReactSymbols["d" /* CONTEXT_SYMBOL_STRING */]) {
        // 16.3-16.5 read from "type" because the Consumer is the actual context object.
        // 16.6+ should read from "type._context" because Consumer can be different (in DEV).
        // NOTE Keep in sync with getDisplayNameForFiber()
        const consumerResolvedContext = type._context || type; // Global context value.
  
        context = consumerResolvedContext._currentValue || null; // Look for overridden value.
  
        let current = fiber.return;
  
        while (current !== null) {
          const currentType = current.type;
          const currentTypeSymbol = getTypeSymbol(currentType);
  
          if (currentTypeSymbol === ReactSymbols["n" /* PROVIDER_NUMBER */] || currentTypeSymbol === ReactSymbols["o" /* PROVIDER_SYMBOL_STRING */]) {
            // 16.3.0 exposed the context object as "context"
            // PR #12501 changed it to "_context" for 16.3.1+
            // NOTE Keep in sync with getDisplayNameForFiber()
            const providerResolvedContext = currentType._context || currentType.context;
  
            if (providerResolvedContext === consumerResolvedContext) {
              context = current.memoizedProps.value;
              break;
            }
          }
  
          current = current.return;
        }
      }
  
      let hasLegacyContext = false;
  
      if (context !== null) {
        hasLegacyContext = !!type.contextTypes; // To simplify hydration and display logic for context, wrap in a value object.
        // Otherwise simple values (e.g. strings, booleans) become harder to handle.
  
        context = {
          value: context
        };
      }
  
      let owners = null;
  
      if (_debugOwner) {
        owners = [];
        let owner = _debugOwner;
  
        while (owner !== null) {
          owners.push(fiberToSerializedElement(owner));
          owner = owner._debugOwner || null;
        }
      }
  
      const isTimedOutSuspense = tag === SuspenseComponent && memoizedState !== null;
      let hooks = null;
  
      if (usesHooks) {
        const originalConsoleMethods = {}; // Temporarily disable all console logging before re-running the hook.
  
        for (const method in console) {
          try {
            originalConsoleMethods[method] = console[method];
  
            console[method] = () => {};
          } catch (error) {}
        }
  
        try {
          hooks = Object(react_debug_tools["inspectHooksOfFiber"])(fiber, renderer.currentDispatcherRef, true // Include source location info for hooks
          );
        } finally {
          // Restore original console functionality.
          for (const method in originalConsoleMethods) {
            try {
              console[method] = originalConsoleMethods[method];
            } catch (error) {}
          }
        }
      }
  
      let rootType = null;
      let current = fiber;
  
      while (current.return !== null) {
        current = current.return;
      }
  
      const fiberRoot = current.stateNode;
  
      if (fiberRoot != null && fiberRoot._debugRootType !== null) {
        rootType = fiberRoot._debugRootType;
      }
  
      const errors = fiberIDToErrorsMap.get(id) || new Map();
      const warnings = fiberIDToWarningsMap.get(id) || new Map();
      const isErrored = (fiber.flags & DidCapture) !== NoFlags || forceErrorForFiberIDs.get(id) === true;
      let targetErrorBoundaryID;
  
      if (isErrorBoundary(fiber)) {
        // if the current inspected element is an error boundary,
        // either that we want to use it to toggle off error state
        // or that we allow to force error state on it if it's within another
        // error boundary
        targetErrorBoundaryID = isErrored ? id : getNearestErrorBoundaryID(fiber);
      } else {
        targetErrorBoundaryID = getNearestErrorBoundaryID(fiber);
      }
  
      const plugins = {
        stylex: null
      };
  
      if (DevToolsFeatureFlags_extension_oss["c" /* enableStyleXFeatures */]) {
        if (memoizedProps.hasOwnProperty('xstyle')) {
          plugins.stylex = getStyleXData(memoizedProps.xstyle);
        }
      }
  
      return {
        id,
        // Does the current renderer support editable hooks and function props?
        canEditHooks: typeof overrideHookState === 'function',
        canEditFunctionProps: typeof overrideProps === 'function',
        // Does the current renderer support advanced editing interface?
        canEditHooksAndDeletePaths: typeof overrideHookStateDeletePath === 'function',
        canEditHooksAndRenamePaths: typeof overrideHookStateRenamePath === 'function',
        canEditFunctionPropsDeletePaths: typeof overridePropsDeletePath === 'function',
        canEditFunctionPropsRenamePaths: typeof overridePropsRenamePath === 'function',
        canToggleError: supportsTogglingError && targetErrorBoundaryID != null,
        // Is this error boundary in error state.
        isErrored,
        targetErrorBoundaryID,
        canToggleSuspense: supportsTogglingSuspense && ( // If it's showing the real content, we can always flip fallback.
        !isTimedOutSuspense || // If it's showing fallback because we previously forced it to,
        // allow toggling it back to remove the fallback override.
        forceFallbackForSuspenseIDs.has(id)),
        // Can view component source location.
        canViewSource,
        // Does the component have legacy context attached to it.
        hasLegacyContext,
        key: key != null ? key : null,
        displayName: getDisplayNameForFiber(fiber),
        type: elementType,
        // Inspectable properties.
        // TODO Review sanitization approach for the below inspectable values.
        context,
        hooks,
        props: memoizedProps,
        state: showState ? memoizedState : null,
        errors: Array.from(errors.entries()),
        warnings: Array.from(warnings.entries()),
        // List of owners
        owners,
        // Location of component in source code.
        source: _debugSource || null,
        rootType,
        rendererPackageName: renderer.rendererPackageName,
        rendererVersion: renderer.version,
        plugins
      };
    }
  
    let mostRecentlyInspectedElement = null;
    let hasElementUpdatedSinceLastInspected = false;
    let currentlyInspectedPaths = {};
  
    function isMostRecentlyInspectedElement(id) {
      return mostRecentlyInspectedElement !== null && mostRecentlyInspectedElement.id === id;
    }
  
    function isMostRecentlyInspectedElementCurrent(id) {
      return isMostRecentlyInspectedElement(id) && !hasElementUpdatedSinceLastInspected;
    } // Track the intersection of currently inspected paths,
    // so that we can send their data along if the element is re-rendered.
  
  
    function mergeInspectedPaths(path) {
      let current = currentlyInspectedPaths;
      path.forEach(key => {
        if (!current[key]) {
          current[key] = {};
        }
  
        current = current[key];
      });
    }
  
    function createIsPathAllowed(key, secondaryCategory) {
      // This function helps prevent previously-inspected paths from being dehydrated in updates.
      // This is important to avoid a bad user experience where expanded toggles collapse on update.
      return function isPathAllowed(path) {
        switch (secondaryCategory) {
          case 'hooks':
            if (path.length === 1) {
              // Never dehydrate the "hooks" object at the top levels.
              return true;
            }
  
            if (path[path.length - 2] === 'hookSource' && path[path.length - 1] === 'fileName') {
              // It's important to preserve the full file name (URL) for hook sources
              // in case the user has enabled the named hooks feature.
              // Otherwise the frontend may end up with a partial URL which it can't load.
              return true;
            }
  
            if (path[path.length - 1] === 'subHooks' || path[path.length - 2] === 'subHooks') {
              // Dehydrating the 'subHooks' property makes the HooksTree UI a lot more complicated,
              // so it's easiest for now if we just don't break on this boundary.
              // We can always dehydrate a level deeper (in the value object).
              return true;
            }
  
            break;
  
          default:
            break;
        }
  
        let current = key === null ? currentlyInspectedPaths : currentlyInspectedPaths[key];
  
        if (!current) {
          return false;
        }
  
        for (let i = 0; i < path.length; i++) {
          current = current[path[i]];
  
          if (!current) {
            return false;
          }
        }
  
        return true;
      };
    }
  
    function updateSelectedElement(inspectedElement) {
      const {
        hooks,
        id,
        props
      } = inspectedElement;
      const fiber = idToArbitraryFiberMap.get(id);
  
      if (fiber == null) {
        console.warn(`Could not find Fiber with id "${id}"`);
        return;
      }
  
      const {
        elementType,
        stateNode,
        tag,
        type
      } = fiber;
  
      switch (tag) {
        case ClassComponent:
        case IncompleteClassComponent:
        case IndeterminateComponent:
          global.$r = stateNode;
          break;
  
        case FunctionComponent:
          global.$r = {
            hooks,
            props,
            type
          };
          break;
  
        case ForwardRef:
          global.$r = {
            hooks,
            props,
            type: type.render
          };
          break;
  
        case MemoComponent:
        case SimpleMemoComponent:
          global.$r = {
            hooks,
            props,
            type: elementType != null && elementType.type != null ? elementType.type : type
          };
          break;
  
        default:
          global.$r = null;
          break;
      }
    }
  
    function storeAsGlobal(id, path, count) {
      if (isMostRecentlyInspectedElement(id)) {
        const value = Object(utils["j" /* getInObject */])(mostRecentlyInspectedElement, path);
        const key = `$reactTemp${count}`;
        window[key] = value;
        console.log(key);
        console.log(value);
      }
    }
  
    function copyElementPath(id, path) {
      if (isMostRecentlyInspectedElement(id)) {
        Object(backend_utils["b" /* copyToClipboard */])(Object(utils["j" /* getInObject */])(mostRecentlyInspectedElement, path));
      }
    }
  
    function inspectElement(requestID, id, path, forceFullData) {
      if (path !== null) {
        mergeInspectedPaths(path);
      }
  
      if (isMostRecentlyInspectedElement(id) && !forceFullData) {
        if (!hasElementUpdatedSinceLastInspected) {
          if (path !== null) {
            let secondaryCategory = null;
  
            if (path[0] === 'hooks') {
              secondaryCategory = 'hooks';
            } // If this element has not been updated since it was last inspected,
            // we can just return the subset of data in the newly-inspected path.
  
  
            return {
              id,
              responseID: requestID,
              type: 'hydrated-path',
              path,
              value: Object(backend_utils["a" /* cleanForBridge */])(Object(utils["j" /* getInObject */])(mostRecentlyInspectedElement, path), createIsPathAllowed(null, secondaryCategory), path)
            };
          } else {
            // If this element has not been updated since it was last inspected, we don't need to return it.
            // Instead we can just return the ID to indicate that it has not changed.
            return {
              id,
              responseID: requestID,
              type: 'no-change'
            };
          }
        }
      } else {
        currentlyInspectedPaths = {};
      }
  
      hasElementUpdatedSinceLastInspected = false;
  
      try {
        mostRecentlyInspectedElement = inspectElementRaw(id);
      } catch (error) {
        // the error name is synced with ReactDebugHooks
        if (error.name === 'ReactDebugToolsRenderError') {
          let message = 'Error rendering inspected element.';
          let stack; // Log error & cause for user to debug
  
          console.error(message + '\n\n', error);
  
          if (error.cause != null) {
            const fiber = findCurrentFiberUsingSlowPathById(id);
            const componentName = fiber != null ? getDisplayNameForFiber(fiber) : null;
            console.error('React DevTools encountered an error while trying to inspect hooks. ' + 'This is most likely caused by an error in current inspected component' + (componentName != null ? `: "${componentName}".` : '.') + '\nThe error thrown in the component is: \n\n', error.cause);
  
            if (error.cause instanceof Error) {
              message = error.cause.message || message;
              stack = error.cause.stack;
            }
          }
  
          return {
            type: 'error',
            errorType: 'user',
            id,
            responseID: requestID,
            message,
            stack
          };
        } // the error name is synced with ReactDebugHooks
  
  
        if (error.name === 'ReactDebugToolsUnsupportedHookError') {
          return {
            type: 'error',
            errorType: 'unknown-hook',
            id,
            responseID: requestID,
            message: 'Unsupported hook in the react-debug-tools package: ' + error.message
          };
        } // Log Uncaught Error
  
  
        console.error('Error inspecting element.\n\n', error);
        return {
          type: 'error',
          errorType: 'uncaught',
          id,
          responseID: requestID,
          message: error.message,
          stack: error.stack
        };
      }
  
      if (mostRecentlyInspectedElement === null) {
        return {
          id,
          responseID: requestID,
          type: 'not-found'
        };
      } // Any time an inspected element has an update,
      // we should update the selected $r value as wel.
      // Do this before dehydration (cleanForBridge).
  
  
      updateSelectedElement(mostRecentlyInspectedElement); // Clone before cleaning so that we preserve the full data.
      // This will enable us to send patches without re-inspecting if hydrated paths are requested.
      // (Reducing how often we shallow-render is a better DX for function components that use hooks.)
  
      const cleanedInspectedElement = { ...mostRecentlyInspectedElement
      }; // $FlowFixMe[prop-missing] found when upgrading Flow
  
      cleanedInspectedElement.context = Object(backend_utils["a" /* cleanForBridge */])(cleanedInspectedElement.context, createIsPathAllowed('context', null)); // $FlowFixMe[prop-missing] found when upgrading Flow
  
      cleanedInspectedElement.hooks = Object(backend_utils["a" /* cleanForBridge */])(cleanedInspectedElement.hooks, createIsPathAllowed('hooks', 'hooks')); // $FlowFixMe[prop-missing] found when upgrading Flow
  
      cleanedInspectedElement.props = Object(backend_utils["a" /* cleanForBridge */])(cleanedInspectedElement.props, createIsPathAllowed('props', null)); // $FlowFixMe[prop-missing] found when upgrading Flow
  
      cleanedInspectedElement.state = Object(backend_utils["a" /* cleanForBridge */])(cleanedInspectedElement.state, createIsPathAllowed('state', null));
      return {
        id,
        responseID: requestID,
        type: 'full-data',
        // $FlowFixMe[prop-missing] found when upgrading Flow
        value: cleanedInspectedElement
      };
    }
  
    function logElementToConsole(id) {
      const result = isMostRecentlyInspectedElementCurrent(id) ? mostRecentlyInspectedElement : inspectElementRaw(id);
  
      if (result === null) {
        console.warn(`Could not find Fiber with id "${id}"`);
        return;
      }
  
      const supportsGroup = typeof console.groupCollapsed === 'function';
  
      if (supportsGroup) {
        console.groupCollapsed(`[Click to expand] %c<${result.displayName || 'Component'} />`, // --dom-tag-name-color is the CSS variable Chrome styles HTML elements with in the console.
        'color: var(--dom-tag-name-color); font-weight: normal;');
      }
  
      if (result.props !== null) {
        console.log('Props:', result.props);
      }
  
      if (result.state !== null) {
        console.log('State:', result.state);
      }
  
      if (result.hooks !== null) {
        console.log('Hooks:', result.hooks);
      }
  
      const nativeNodes = findNativeNodesForFiberID(id);
  
      if (nativeNodes !== null) {
        console.log('Nodes:', nativeNodes);
      }
  
      if (result.source !== null) {
        console.log('Location:', result.source);
      }
  
      if (window.chrome || /firefox/i.test(navigator.userAgent)) {
        console.log('Right-click any value to save it as a global variable for further inspection.');
      }
  
      if (supportsGroup) {
        console.groupEnd();
      }
    }
  
    function deletePath(type, id, hookID, path) {
      const fiber = findCurrentFiberUsingSlowPathById(id);
  
      if (fiber !== null) {
        const instance = fiber.stateNode;
  
        switch (type) {
          case 'context':
            // To simplify hydration and display of primitive context values (e.g. number, string)
            // the inspectElement() method wraps context in a {value: ...} object.
            // We need to remove the first part of the path (the "value") before continuing.
            path = path.slice(1);
  
            switch (fiber.tag) {
              case ClassComponent:
                if (path.length === 0) {// Simple context value (noop)
                } else {
                  Object(utils["c" /* deletePathInObject */])(instance.context, path);
                }
  
                instance.forceUpdate();
                break;
  
              case FunctionComponent:
                // Function components using legacy context are not editable
                // because there's no instance on which to create a cloned, mutated context.
                break;
            }
  
            break;
  
          case 'hooks':
            if (typeof overrideHookStateDeletePath === 'function') {
              overrideHookStateDeletePath(fiber, hookID, path);
            }
  
            break;
  
          case 'props':
            if (instance === null) {
              if (typeof overridePropsDeletePath === 'function') {
                overridePropsDeletePath(fiber, path);
              }
            } else {
              fiber.pendingProps = Object(backend_utils["c" /* copyWithDelete */])(instance.props, path);
              instance.forceUpdate();
            }
  
            break;
  
          case 'state':
            Object(utils["c" /* deletePathInObject */])(instance.state, path);
            instance.forceUpdate();
            break;
        }
      }
    }
  
    function renamePath(type, id, hookID, oldPath, newPath) {
      const fiber = findCurrentFiberUsingSlowPathById(id);
  
      if (fiber !== null) {
        const instance = fiber.stateNode;
  
        switch (type) {
          case 'context':
            // To simplify hydration and display of primitive context values (e.g. number, string)
            // the inspectElement() method wraps context in a {value: ...} object.
            // We need to remove the first part of the path (the "value") before continuing.
            oldPath = oldPath.slice(1);
            newPath = newPath.slice(1);
  
            switch (fiber.tag) {
              case ClassComponent:
                if (oldPath.length === 0) {// Simple context value (noop)
                } else {
                  Object(utils["n" /* renamePathInObject */])(instance.context, oldPath, newPath);
                }
  
                instance.forceUpdate();
                break;
  
              case FunctionComponent:
                // Function components using legacy context are not editable
                // because there's no instance on which to create a cloned, mutated context.
                break;
            }
  
            break;
  
          case 'hooks':
            if (typeof overrideHookStateRenamePath === 'function') {
              overrideHookStateRenamePath(fiber, hookID, oldPath, newPath);
            }
  
            break;
  
          case 'props':
            if (instance === null) {
              if (typeof overridePropsRenamePath === 'function') {
                overridePropsRenamePath(fiber, oldPath, newPath);
              }
            } else {
              fiber.pendingProps = Object(backend_utils["d" /* copyWithRename */])(instance.props, oldPath, newPath);
              instance.forceUpdate();
            }
  
            break;
  
          case 'state':
            Object(utils["n" /* renamePathInObject */])(instance.state, oldPath, newPath);
            instance.forceUpdate();
            break;
        }
      }
    }
  
    function overrideValueAtPath(type, id, hookID, path, value) {
      const fiber = findCurrentFiberUsingSlowPathById(id);
  
      if (fiber !== null) {
        const instance = fiber.stateNode;
  
        switch (type) {
          case 'context':
            // To simplify hydration and display of primitive context values (e.g. number, string)
            // the inspectElement() method wraps context in a {value: ...} object.
            // We need to remove the first part of the path (the "value") before continuing.
            path = path.slice(1);
  
            switch (fiber.tag) {
              case ClassComponent:
                if (path.length === 0) {
                  // Simple context value
                  instance.context = value;
                } else {
                  Object(utils["o" /* setInObject */])(instance.context, path, value);
                }
  
                instance.forceUpdate();
                break;
  
              case FunctionComponent:
                // Function components using legacy context are not editable
                // because there's no instance on which to create a cloned, mutated context.
                break;
            }
  
            break;
  
          case 'hooks':
            if (typeof overrideHookState === 'function') {
              overrideHookState(fiber, hookID, path, value);
            }
  
            break;
  
          case 'props':
            switch (fiber.tag) {
              case ClassComponent:
                fiber.pendingProps = Object(backend_utils["e" /* copyWithSet */])(instance.props, path, value);
                instance.forceUpdate();
                break;
  
              default:
                if (typeof overrideProps === 'function') {
                  overrideProps(fiber, path, value);
                }
  
                break;
            }
  
            break;
  
          case 'state':
            switch (fiber.tag) {
              case ClassComponent:
                Object(utils["o" /* setInObject */])(instance.state, path, value);
                instance.forceUpdate();
                break;
            }
  
            break;
        }
      }
    }
  
    let currentCommitProfilingMetadata = null;
    let displayNamesByRootID = null;
    let idToContextsMap = null;
    let initialTreeBaseDurationsMap = null;
    let initialIDToRootMap = null;
    let isProfiling = false;
    let profilingStartTime = 0;
    let recordChangeDescriptions = false;
    let rootToCommitProfilingMetadataMap = null;
  
    function getProfilingData() {
      const dataForRoots = [];
  
      if (rootToCommitProfilingMetadataMap === null) {
        throw Error('getProfilingData() called before any profiling data was recorded');
      }
  
      rootToCommitProfilingMetadataMap.forEach((commitProfilingMetadata, rootID) => {
        const commitData = [];
        const initialTreeBaseDurations = [];
        const displayName = displayNamesByRootID !== null && displayNamesByRootID.get(rootID) || 'Unknown';
  
        if (initialTreeBaseDurationsMap != null) {
          initialTreeBaseDurationsMap.forEach((treeBaseDuration, id) => {
            if (initialIDToRootMap != null && initialIDToRootMap.get(id) === rootID) {
              // We don't need to convert milliseconds to microseconds in this case,
              // because the profiling summary is JSON serialized.
              initialTreeBaseDurations.push([id, treeBaseDuration]);
            }
          });
        }
  
        commitProfilingMetadata.forEach((commitProfilingData, commitIndex) => {
          const {
            changeDescriptions,
            durations,
            effectDuration,
            maxActualDuration,
            passiveEffectDuration,
            priorityLevel,
            commitTime,
            updaters
          } = commitProfilingData;
          const fiberActualDurations = [];
          const fiberSelfDurations = [];
  
          for (let i = 0; i < durations.length; i += 3) {
            const fiberID = durations[i];
            fiberActualDurations.push([fiberID, durations[i + 1]]);
            fiberSelfDurations.push([fiberID, durations[i + 2]]);
          }
  
          commitData.push({
            changeDescriptions: changeDescriptions !== null ? Array.from(changeDescriptions.entries()) : null,
            duration: maxActualDuration,
            effectDuration,
            fiberActualDurations,
            fiberSelfDurations,
            passiveEffectDuration,
            priorityLevel,
            timestamp: commitTime,
            updaters
          });
        });
        dataForRoots.push({
          commitData,
          displayName,
          initialTreeBaseDurations,
          rootID
        });
      });
      let timelineData = null;
  
      if (typeof getTimelineData === 'function') {
        const currentTimelineData = getTimelineData();
  
        if (currentTimelineData) {
          const {
            batchUIDToMeasuresMap,
            internalModuleSourceToRanges,
            laneToLabelMap,
            laneToReactMeasureMap,
            ...rest
          } = currentTimelineData;
          timelineData = { ...rest,
            // Most of the data is safe to parse as-is,
            // but we need to convert the nested Arrays back to Maps.
            // Most of the data is safe to serialize as-is,
            // but we need to convert the Maps to nested Arrays.
            batchUIDToMeasuresKeyValueArray: Array.from(batchUIDToMeasuresMap.entries()),
            internalModuleSourceToRanges: Array.from(internalModuleSourceToRanges.entries()),
            laneToLabelKeyValueArray: Array.from(laneToLabelMap.entries()),
            laneToReactMeasureKeyValueArray: Array.from(laneToReactMeasureMap.entries())
          };
        }
      }
  
      return {
        dataForRoots,
        rendererID,
        timelineData
      };
    }
  
    function startProfiling(shouldRecordChangeDescriptions) {
      if (isProfiling) {
        return;
      }
  
      recordChangeDescriptions = shouldRecordChangeDescriptions; // Capture initial values as of the time profiling starts.
      // It's important we snapshot both the durations and the id-to-root map,
      // since either of these may change during the profiling session
      // (e.g. when a fiber is re-rendered or when a fiber gets removed).
  
      displayNamesByRootID = new Map();
      initialTreeBaseDurationsMap = new Map(idToTreeBaseDurationMap);
      initialIDToRootMap = new Map(idToRootMap);
      idToContextsMap = new Map();
      hook.getFiberRoots(rendererID).forEach(root => {
        const rootID = getFiberIDThrows(root.current);
        displayNamesByRootID.set(rootID, getDisplayNameForRoot(root.current));
  
        if (shouldRecordChangeDescriptions) {
          // Record all contexts at the time profiling is started.
          // Fibers only store the current context value,
          // so we need to track them separately in order to determine changed keys.
          crawlToInitializeContextsMap(root.current);
        }
      });
      isProfiling = true;
      profilingStartTime = renderer_getCurrentTime();
      rootToCommitProfilingMetadataMap = new Map();
  
      if (toggleProfilingStatus !== null) {
        toggleProfilingStatus(true);
      }
    }
  
    function stopProfiling() {
      isProfiling = false;
      recordChangeDescriptions = false;
  
      if (toggleProfilingStatus !== null) {
        toggleProfilingStatus(false);
      }
    } // React will switch between these implementations depending on whether
    // we have any manually suspended/errored-out Fibers or not.
  
  
    function shouldErrorFiberAlwaysNull() {
      return null;
    } // Map of id and its force error status: true (error), false (toggled off),
    // null (do nothing)
  
  
    const forceErrorForFiberIDs = new Map();
  
    function shouldErrorFiberAccordingToMap(fiber) {
      if (typeof setErrorHandler !== 'function') {
        throw new Error('Expected overrideError() to not get called for earlier React versions.');
      }
  
      const id = getFiberIDUnsafe(fiber);
  
      if (id === null) {
        return null;
      }
  
      let status = null;
  
      if (forceErrorForFiberIDs.has(id)) {
        status = forceErrorForFiberIDs.get(id);
  
        if (status === false) {
          // TRICKY overrideError adds entries to this Map,
          // so ideally it would be the method that clears them too,
          // but that would break the functionality of the feature,
          // since DevTools needs to tell React to act differently than it normally would
          // (don't just re-render the failed boundary, but reset its errored state too).
          // So we can only clear it after telling React to reset the state.
          // Technically this is premature and we should schedule it for later,
          // since the render could always fail without committing the updated error boundary,
          // but since this is a DEV-only feature, the simplicity is worth the trade off.
          forceErrorForFiberIDs.delete(id);
  
          if (forceErrorForFiberIDs.size === 0) {
            // Last override is gone. Switch React back to fast path.
            setErrorHandler(shouldErrorFiberAlwaysNull);
          }
        }
      }
  
      return status;
    }
  
    function overrideError(id, forceError) {
      if (typeof setErrorHandler !== 'function' || typeof scheduleUpdate !== 'function') {
        throw new Error('Expected overrideError() to not get called for earlier React versions.');
      }
  
      forceErrorForFiberIDs.set(id, forceError);
  
      if (forceErrorForFiberIDs.size === 1) {
        // First override is added. Switch React to slower path.
        setErrorHandler(shouldErrorFiberAccordingToMap);
      }
  
      const fiber = idToArbitraryFiberMap.get(id);
  
      if (fiber != null) {
        scheduleUpdate(fiber);
      }
    }
  
    function shouldSuspendFiberAlwaysFalse() {
      return false;
    }
  
    const forceFallbackForSuspenseIDs = new Set();
  
    function shouldSuspendFiberAccordingToSet(fiber) {
      const maybeID = getFiberIDUnsafe(fiber);
      return maybeID !== null && forceFallbackForSuspenseIDs.has(maybeID);
    }
  
    function overrideSuspense(id, forceFallback) {
      if (typeof setSuspenseHandler !== 'function' || typeof scheduleUpdate !== 'function') {
        throw new Error('Expected overrideSuspense() to not get called for earlier React versions.');
      }
  
      if (forceFallback) {
        forceFallbackForSuspenseIDs.add(id);
  
        if (forceFallbackForSuspenseIDs.size === 1) {
          // First override is added. Switch React to slower path.
          setSuspenseHandler(shouldSuspendFiberAccordingToSet);
        }
      } else {
        forceFallbackForSuspenseIDs.delete(id);
  
        if (forceFallbackForSuspenseIDs.size === 0) {
          // Last override is gone. Switch React back to fast path.
          setSuspenseHandler(shouldSuspendFiberAlwaysFalse);
        }
      }
  
      const fiber = idToArbitraryFiberMap.get(id);
  
      if (fiber != null) {
        scheduleUpdate(fiber);
      }
    } // Remember if we're trying to restore the selection after reload.
    // In that case, we'll do some extra checks for matching mounts.
  
  
    let trackedPath = null;
    let trackedPathMatchFiber = null;
    let trackedPathMatchDepth = -1;
    let mightBeOnTrackedPath = false;
  
    function setTrackedPath(path) {
      if (path === null) {
        trackedPathMatchFiber = null;
        trackedPathMatchDepth = -1;
        mightBeOnTrackedPath = false;
      }
  
      trackedPath = path;
    } // We call this before traversing a new mount.
    // It remembers whether this Fiber is the next best match for tracked path.
    // The return value signals whether we should keep matching siblings or not.
  
  
    function updateTrackedPathStateBeforeMount(fiber) {
      if (trackedPath === null || !mightBeOnTrackedPath) {
        // Fast path: there's nothing to track so do nothing and ignore siblings.
        return false;
      }
  
      const returnFiber = fiber.return;
      const returnAlternate = returnFiber !== null ? returnFiber.alternate : null; // By now we know there's some selection to restore, and this is a new Fiber.
      // Is this newly mounted Fiber a direct child of the current best match?
      // (This will also be true for new roots if we haven't matched anything yet.)
  
      if (trackedPathMatchFiber === returnFiber || trackedPathMatchFiber === returnAlternate && returnAlternate !== null) {
        // Is this the next Fiber we should select? Let's compare the frames.
        const actualFrame = getPathFrame(fiber); // $FlowFixMe[incompatible-use] found when upgrading Flow
  
        const expectedFrame = trackedPath[trackedPathMatchDepth + 1];
  
        if (expectedFrame === undefined) {
          throw new Error('Expected to see a frame at the next depth.');
        }
  
        if (actualFrame.index === expectedFrame.index && actualFrame.key === expectedFrame.key && actualFrame.displayName === expectedFrame.displayName) {
          // We have our next match.
          trackedPathMatchFiber = fiber;
          trackedPathMatchDepth++; // Are we out of frames to match?
          // $FlowFixMe[incompatible-use] found when upgrading Flow
  
          if (trackedPathMatchDepth === trackedPath.length - 1) {
            // There's nothing that can possibly match afterwards.
            // Don't check the children.
            mightBeOnTrackedPath = false;
          } else {
            // Check the children, as they might reveal the next match.
            mightBeOnTrackedPath = true;
          } // In either case, since we have a match, we don't need
          // to check the siblings. They'll never match.
  
  
          return false;
        }
      } // This Fiber's parent is on the path, but this Fiber itself isn't.
      // There's no need to check its children--they won't be on the path either.
  
  
      mightBeOnTrackedPath = false; // However, one of its siblings may be on the path so keep searching.
  
      return true;
    }
  
    function updateTrackedPathStateAfterMount(mightSiblingsBeOnTrackedPath) {
      // updateTrackedPathStateBeforeMount() told us whether to match siblings.
      // Now that we're entering siblings, let's use that information.
      mightBeOnTrackedPath = mightSiblingsBeOnTrackedPath;
    } // Roots don't have a real persistent identity.
    // A root's "pseudo key" is "childDisplayName:indexWithThatName".
    // For example, "App:0" or, in case of similar roots, "Story:0", "Story:1", etc.
    // We will use this to try to disambiguate roots when restoring selection between reloads.
  
  
    const rootPseudoKeys = new Map();
    const rootDisplayNameCounter = new Map();
  
    function setRootPseudoKey(id, fiber) {
      const name = getDisplayNameForRoot(fiber);
      const counter = rootDisplayNameCounter.get(name) || 0;
      rootDisplayNameCounter.set(name, counter + 1);
      const pseudoKey = `${name}:${counter}`;
      rootPseudoKeys.set(id, pseudoKey);
    }
  
    function removeRootPseudoKey(id) {
      const pseudoKey = rootPseudoKeys.get(id);
  
      if (pseudoKey === undefined) {
        throw new Error('Expected root pseudo key to be known.');
      }
  
      const name = pseudoKey.substring(0, pseudoKey.lastIndexOf(':'));
      const counter = rootDisplayNameCounter.get(name);
  
      if (counter === undefined) {
        throw new Error('Expected counter to be known.');
      }
  
      if (counter > 1) {
        rootDisplayNameCounter.set(name, counter - 1);
      } else {
        rootDisplayNameCounter.delete(name);
      }
  
      rootPseudoKeys.delete(id);
    }
  
    function getDisplayNameForRoot(fiber) {
      let preferredDisplayName = null;
      let fallbackDisplayName = null;
      let child = fiber.child; // Go at most three levels deep into direct children
      // while searching for a child that has a displayName.
  
      for (let i = 0; i < 3; i++) {
        if (child === null) {
          break;
        }
  
        const displayName = getDisplayNameForFiber(child);
  
        if (displayName !== null) {
          // Prefer display names that we get from user-defined components.
          // We want to avoid using e.g. 'Suspense' unless we find nothing else.
          if (typeof child.type === 'function') {
            // There's a few user-defined tags, but we'll prefer the ones
            // that are usually explicitly named (function or class components).
            preferredDisplayName = displayName;
          } else if (fallbackDisplayName === null) {
            fallbackDisplayName = displayName;
          }
        }
  
        if (preferredDisplayName !== null) {
          break;
        }
  
        child = child.child;
      }
  
      return preferredDisplayName || fallbackDisplayName || 'Anonymous';
    }
  
    function getPathFrame(fiber) {
      const {
        key
      } = fiber;
      let displayName = getDisplayNameForFiber(fiber);
      const index = fiber.index;
  
      switch (fiber.tag) {
        case HostRoot:
          // Roots don't have a real displayName, index, or key.
          // Instead, we'll use the pseudo key (childDisplayName:indexWithThatName).
          const id = getFiberIDThrows(fiber);
          const pseudoKey = rootPseudoKeys.get(id);
  
          if (pseudoKey === undefined) {
            throw new Error('Expected mounted root to have known pseudo key.');
          }
  
          displayName = pseudoKey;
          break;
  
        case HostComponent:
          displayName = fiber.type;
          break;
  
        default:
          break;
      }
  
      return {
        displayName,
        key,
        index
      };
    } // Produces a serializable representation that does a best effort
    // of identifying a particular Fiber between page reloads.
    // The return path will contain Fibers that are "invisible" to the store
    // because their keys and indexes are important to restoring the selection.
  
  
    function getPathForElement(id) {
      let fiber = idToArbitraryFiberMap.get(id);
  
      if (fiber == null) {
        return null;
      }
  
      const keyPath = [];
  
      while (fiber !== null) {
        // $FlowFixMe[incompatible-call] found when upgrading Flow
        keyPath.push(getPathFrame(fiber)); // $FlowFixMe[incompatible-use] found when upgrading Flow
  
        fiber = fiber.return;
      }
  
      keyPath.reverse();
      return keyPath;
    }
  
    function getBestMatchForTrackedPath() {
      if (trackedPath === null) {
        // Nothing to match.
        return null;
      }
  
      if (trackedPathMatchFiber === null) {
        // We didn't find anything.
        return null;
      } // Find the closest Fiber store is aware of.
  
  
      let fiber = trackedPathMatchFiber;
  
      while (fiber !== null && shouldFilterFiber(fiber)) {
        fiber = fiber.return;
      }
  
      if (fiber === null) {
        return null;
      }
  
      return {
        id: getFiberIDThrows(fiber),
        // $FlowFixMe[incompatible-use] found when upgrading Flow
        isFullMatch: trackedPathMatchDepth === trackedPath.length - 1
      };
    }
  
    const formatPriorityLevel = priorityLevel => {
      if (priorityLevel == null) {
        return 'Unknown';
      }
  
      switch (priorityLevel) {
        case ImmediatePriority:
          return 'Immediate';
  
        case UserBlockingPriority:
          return 'User-Blocking';
  
        case NormalPriority:
          return 'Normal';
  
        case LowPriority:
          return 'Low';
  
        case IdlePriority:
          return 'Idle';
  
        case NoPriority:
        default:
          return 'Unknown';
      }
    };
  
    function setTraceUpdatesEnabled(isEnabled) {
      traceUpdatesEnabled = isEnabled;
    }
  
    return {
      cleanup,
      clearErrorsAndWarnings,
      clearErrorsForFiberID,
      clearWarningsForFiberID,
      copyElementPath,
      deletePath,
      findNativeNodesForFiberID,
      flushInitialOperations,
      flushPendingEvents,
      getBestMatchForTrackedPath,
      getDisplayNameForFiberID,
      getFiberForNative,
      getFiberIDForNative,
      getInstanceAndStyle,
      getOwnersList,
      getPathForElement,
      getProfilingData,
      handleCommitFiberRoot,
      handleCommitFiberUnmount,
      handlePostCommitFiberRoot,
      inspectElement,
      logElementToConsole,
      patchConsoleForStrictMode: backend_console["c" /* patchForStrictMode */],
      prepareViewAttributeSource,
      prepareViewElementSource,
      overrideError,
      overrideSuspense,
      overrideValueAtPath,
      renamePath,
      renderer,
      setTraceUpdatesEnabled,
      setTrackedPath,
      startProfiling,
      stopProfiling,
      storeAsGlobal,
      unpatchConsoleForStrictMode: backend_console["e" /* unpatchForStrictMode */],
      updateComponentFilters
    };
  }
  
  /***/ }),
  /* 14 */
  /***/ (function(module, __webpack_exports__, __webpack_require__) {
  
  "use strict";
  
  // EXPORTS
  __webpack_require__.d(__webpack_exports__, "a", function() { return /* binding */ describeFiber; });
  __webpack_require__.d(__webpack_exports__, "b", function() { return /* binding */ getStackByFiberInDevAndProd; });
  
  // EXTERNAL MODULE: ../react-devtools-shared/src/backend/ReactSymbols.js
  var ReactSymbols = __webpack_require__(2);
  
  // CONCATENATED MODULE: ../react-devtools-shared/src/backend/DevToolsConsolePatching.js
  /**
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  // This is a DevTools fork of shared/ConsolePatchingDev.
  // The shared console patching code is DEV-only.
  // We can't use it since DevTools only ships production builds.
  // Helpers to patch console.logs to avoid logging during side-effect free
  // replaying on render function. This currently only patches the object
  // lazily which won't cover if the log function was extracted eagerly.
  // We could also eagerly patch the method.
  let disabledDepth = 0;
  let prevLog;
  let prevInfo;
  let prevWarn;
  let prevError;
  let prevGroup;
  let prevGroupCollapsed;
  let prevGroupEnd;
  
  function disabledLog() {}
  
  disabledLog.__reactDisabledLog = true;
  function disableLogs() {
    if (disabledDepth === 0) {
      /* eslint-disable react-internal/no-production-logging */
      prevLog = console.log;
      prevInfo = console.info;
      prevWarn = console.warn;
      prevError = console.error;
      prevGroup = console.group;
      prevGroupCollapsed = console.groupCollapsed;
      prevGroupEnd = console.groupEnd; // https://github.com/facebook/react/issues/19099
  
      const props = {
        configurable: true,
        enumerable: true,
        value: disabledLog,
        writable: true
      }; // $FlowFixMe Flow thinks console is immutable.
  
      Object.defineProperties(console, {
        info: props,
        log: props,
        warn: props,
        error: props,
        group: props,
        groupCollapsed: props,
        groupEnd: props
      });
      /* eslint-enable react-internal/no-production-logging */
    }
  
    disabledDepth++;
  }
  function reenableLogs() {
    disabledDepth--;
  
    if (disabledDepth === 0) {
      /* eslint-disable react-internal/no-production-logging */
      const props = {
        configurable: true,
        enumerable: true,
        writable: true
      }; // $FlowFixMe Flow thinks console is immutable.
  
      Object.defineProperties(console, {
        log: { ...props,
          value: prevLog
        },
        info: { ...props,
          value: prevInfo
        },
        warn: { ...props,
          value: prevWarn
        },
        error: { ...props,
          value: prevError
        },
        group: { ...props,
          value: prevGroup
        },
        groupCollapsed: { ...props,
          value: prevGroupCollapsed
        },
        groupEnd: { ...props,
          value: prevGroupEnd
        }
      });
      /* eslint-enable react-internal/no-production-logging */
    }
  
    if (disabledDepth < 0) {
      console.error('disabledDepth fell below zero. ' + 'This is a bug in React. Please file an issue.');
    }
  }
  // CONCATENATED MODULE: ../react-devtools-shared/src/backend/DevToolsComponentStackFrame.js
  /**
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  // This is a DevTools fork of ReactComponentStackFrame.
  // This fork enables DevTools to use the same "native" component stack format,
  // while still maintaining support for multiple renderer versions
  // (which use different values for ReactTypeOfWork).
   // The shared console patching code is DEV-only.
  // We can't use it since DevTools only ships production builds.
  
  
  let prefix;
  function describeBuiltInComponentFrame(name, ownerFn) {
    if (prefix === undefined) {
      // Extract the VM specific prefix used by each line.
      try {
        throw Error();
      } catch (x) {
        const match = x.stack.trim().match(/\n( *(at )?)/);
        prefix = match && match[1] || '';
      }
    } // We use the prefix to ensure our stacks line up with native stack frames.
  
  
    return '\n' + prefix + name;
  }
  let reentry = false;
  let componentFrameCache;
  
  if (true) {
    const PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map;
    componentFrameCache = new PossiblyWeakMap();
  }
  
  function describeNativeComponentFrame(fn, construct, currentDispatcherRef) {
    // If something asked for a stack inside a fake render, it should get ignored.
    if (!fn || reentry) {
      return '';
    }
  
    if (true) {
      const frame = componentFrameCache.get(fn);
  
      if (frame !== undefined) {
        return frame;
      }
    }
  
    let control;
    const previousPrepareStackTrace = Error.prepareStackTrace; // $FlowFixMe It does accept undefined.
  
    Error.prepareStackTrace = undefined;
    reentry = true; // Override the dispatcher so effects scheduled by this shallow render are thrown away.
    //
    // Note that unlike the code this was forked from (in ReactComponentStackFrame)
    // DevTools should override the dispatcher even when DevTools is compiled in production mode,
    // because the app itself may be in development mode and log errors/warnings.
  
    const previousDispatcher = currentDispatcherRef.current;
    currentDispatcherRef.current = null;
    disableLogs();
  
    try {
      // This should throw.
      if (construct) {
        // Something should be setting the props in the constructor.
        const Fake = function () {
          throw Error();
        }; // $FlowFixMe
  
  
        Object.defineProperty(Fake.prototype, 'props', {
          set: function () {
            // We use a throwing setter instead of frozen or non-writable props
            // because that won't throw in a non-strict mode function.
            throw Error();
          }
        });
  
        if (typeof Reflect === 'object' && Reflect.construct) {
          // We construct a different control for this case to include any extra
          // frames added by the construct call.
          try {
            Reflect.construct(Fake, []);
          } catch (x) {
            control = x;
          }
  
          Reflect.construct(fn, [], Fake);
        } else {
          try {
            Fake.call();
          } catch (x) {
            control = x;
          } // $FlowFixMe[prop-missing] found when upgrading Flow
  
  
          fn.call(Fake.prototype);
        }
      } else {
        try {
          throw Error();
        } catch (x) {
          control = x;
        }
  
        fn();
      }
    } catch (sample) {
      // This is inlined manually because closure doesn't do it for us.
      if (sample && control && typeof sample.stack === 'string') {
        // This extracts the first frame from the sample that isn't also in the control.
        // Skipping one frame that we assume is the frame that calls the two.
        const sampleLines = sample.stack.split('\n');
        const controlLines = control.stack.split('\n');
        let s = sampleLines.length - 1;
        let c = controlLines.length - 1;
  
        while (s >= 1 && c >= 0 && sampleLines[s] !== controlLines[c]) {
          // We expect at least one stack frame to be shared.
          // Typically this will be the root most one. However, stack frames may be
          // cut off due to maximum stack limits. In this case, one maybe cut off
          // earlier than the other. We assume that the sample is longer or the same
          // and there for cut off earlier. So we should find the root most frame in
          // the sample somewhere in the control.
          c--;
        }
  
        for (; s >= 1 && c >= 0; s--, c--) {
          // Next we find the first one that isn't the same which should be the
          // frame that called our sample function and the control.
          if (sampleLines[s] !== controlLines[c]) {
            // In V8, the first line is describing the message but other VMs don't.
            // If we're about to return the first line, and the control is also on the same
            // line, that's a pretty good indicator that our sample threw at same line as
            // the control. I.e. before we entered the sample frame. So we ignore this result.
            // This can happen if you passed a class to function component, or non-function.
            if (s !== 1 || c !== 1) {
              do {
                s--;
                c--; // We may still have similar intermediate frames from the construct call.
                // The next one that isn't the same should be our match though.
  
                if (c < 0 || sampleLines[s] !== controlLines[c]) {
                  // V8 adds a "new" prefix for native classes. Let's remove it to make it prettier.
                  const frame = '\n' + sampleLines[s].replace(' at new ', ' at ');
  
                  if (true) {
                    if (typeof fn === 'function') {
                      componentFrameCache.set(fn, frame);
                    }
                  } // Return the line we found.
  
  
                  return frame;
                }
              } while (s >= 1 && c >= 0);
            }
  
            break;
          }
        }
      }
    } finally {
      reentry = false;
      Error.prepareStackTrace = previousPrepareStackTrace;
      currentDispatcherRef.current = previousDispatcher;
      reenableLogs();
    } // Fallback to just using the name if we couldn't make it throw.
  
  
    const name = fn ? fn.displayName || fn.name : '';
    const syntheticFrame = name ? describeBuiltInComponentFrame(name) : '';
  
    if (true) {
      if (typeof fn === 'function') {
        componentFrameCache.set(fn, syntheticFrame);
      }
    }
  
    return syntheticFrame;
  }
  function describeClassComponentFrame(ctor, ownerFn, currentDispatcherRef) {
    return describeNativeComponentFrame(ctor, true, currentDispatcherRef);
  }
  function describeFunctionComponentFrame(fn, ownerFn, currentDispatcherRef) {
    return describeNativeComponentFrame(fn, false, currentDispatcherRef);
  }
  
  function shouldConstruct(Component) {
    const prototype = Component.prototype;
    return !!(prototype && prototype.isReactComponent);
  }
  
  function describeUnknownElementTypeFrameInDEV(type, ownerFn, currentDispatcherRef) {
    if (false) {}
  
    if (type == null) {
      return '';
    }
  
    if (typeof type === 'function') {
      return describeNativeComponentFrame(type, shouldConstruct(type), currentDispatcherRef);
    }
  
    if (typeof type === 'string') {
      return describeBuiltInComponentFrame(type, ownerFn);
    }
  
    switch (type) {
      case ReactSymbols["w" /* SUSPENSE_NUMBER */]:
      case ReactSymbols["x" /* SUSPENSE_SYMBOL_STRING */]:
        return describeBuiltInComponentFrame('Suspense', ownerFn);
  
      case ReactSymbols["u" /* SUSPENSE_LIST_NUMBER */]:
      case ReactSymbols["v" /* SUSPENSE_LIST_SYMBOL_STRING */]:
        return describeBuiltInComponentFrame('SuspenseList', ownerFn);
    }
  
    if (typeof type === 'object') {
      switch (type.$$typeof) {
        case ReactSymbols["f" /* FORWARD_REF_NUMBER */]:
        case ReactSymbols["g" /* FORWARD_REF_SYMBOL_STRING */]:
          return describeFunctionComponentFrame(type.render, ownerFn, currentDispatcherRef);
  
        case ReactSymbols["j" /* MEMO_NUMBER */]:
        case ReactSymbols["k" /* MEMO_SYMBOL_STRING */]:
          // Memo may contain any component type so we recursively resolve it.
          return describeUnknownElementTypeFrameInDEV(type.type, ownerFn, currentDispatcherRef);
  
        case ReactSymbols["h" /* LAZY_NUMBER */]:
        case ReactSymbols["i" /* LAZY_SYMBOL_STRING */]:
          {
            const lazyComponent = type;
            const payload = lazyComponent._payload;
            const init = lazyComponent._init;
  
            try {
              // Lazy may contain any component type so we recursively resolve it.
              return describeUnknownElementTypeFrameInDEV(init(payload), ownerFn, currentDispatcherRef);
            } catch (x) {}
          }
      }
    }
  
    return '';
  }
  // CONCATENATED MODULE: ../react-devtools-shared/src/backend/DevToolsFiberComponentStack.js
  /**
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  // This is a DevTools fork of ReactFiberComponentStack.
  // This fork enables DevTools to use the same "native" component stack format,
  // while still maintaining support for multiple renderer versions
  // (which use different values for ReactTypeOfWork).
  
  function describeFiber(workTagMap, workInProgress, currentDispatcherRef) {
    const {
      HostComponent,
      LazyComponent,
      SuspenseComponent,
      SuspenseListComponent,
      FunctionComponent,
      IndeterminateComponent,
      SimpleMemoComponent,
      ForwardRef,
      ClassComponent
    } = workTagMap;
    const owner =  true ? workInProgress._debugOwner ? workInProgress._debugOwner.type : null : undefined;
  
    switch (workInProgress.tag) {
      case HostComponent:
        return describeBuiltInComponentFrame(workInProgress.type, owner);
  
      case LazyComponent:
        return describeBuiltInComponentFrame('Lazy', owner);
  
      case SuspenseComponent:
        return describeBuiltInComponentFrame('Suspense', owner);
  
      case SuspenseListComponent:
        return describeBuiltInComponentFrame('SuspenseList', owner);
  
      case FunctionComponent:
      case IndeterminateComponent:
      case SimpleMemoComponent:
        return describeFunctionComponentFrame(workInProgress.type, owner, currentDispatcherRef);
  
      case ForwardRef:
        return describeFunctionComponentFrame(workInProgress.type.render, owner, currentDispatcherRef);
  
      case ClassComponent:
        return describeClassComponentFrame(workInProgress.type, owner, currentDispatcherRef);
  
      default:
        return '';
    }
  }
  function getStackByFiberInDevAndProd(workTagMap, workInProgress, currentDispatcherRef) {
    try {
      let info = '';
      let node = workInProgress;
  
      do {
        info += describeFiber(workTagMap, node, currentDispatcherRef); // $FlowFixMe[incompatible-type] we bail out when we get a null
  
        node = node.return;
      } while (node);
  
      return info;
    } catch (x) {
      return '\nError generating stack: ' + x.message + '\n' + x.stack;
    }
  }
  
  /***/ }),
  /* 15 */
  /***/ (function(module, __webpack_exports__, __webpack_require__) {
  
  "use strict";
  // ESM COMPAT FLAG
  __webpack_require__.r(__webpack_exports__);
  
  // EXPORTS
  __webpack_require__.d(__webpack_exports__, "default", function() { return /* binding */ agent_Agent; });
  
  // EXTERNAL MODULE: ../react-devtools-shared/src/events.js
  var events = __webpack_require__(11);
  
  // EXTERNAL MODULE: ../react-devtools-shared/src/constants.js
  var constants = __webpack_require__(3);
  
  // CONCATENATED MODULE: ../react-devtools-shared/src/backend/views/TraceUpdates/canvas.js
  /**
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  const OUTLINE_COLOR = '#f0f0f0'; // Note these colors are in sync with DevTools Profiler chart colors.
  
  const COLORS = ['#37afa9', '#63b19e', '#80b393', '#97b488', '#abb67d', '#beb771', '#cfb965', '#dfba57', '#efbb49', '#febc38'];
  let canvas = null;
  function draw(nodeToData) {
    if (canvas === null) {
      initialize();
    }
  
    const canvasFlow = canvas;
    canvasFlow.width = window.innerWidth;
    canvasFlow.height = window.innerHeight;
    const context = canvasFlow.getContext('2d');
    context.clearRect(0, 0, canvasFlow.width, canvasFlow.height);
    nodeToData.forEach(({
      count,
      rect
    }) => {
      if (rect !== null) {
        const colorIndex = Math.min(COLORS.length - 1, count - 1);
        const color = COLORS[colorIndex];
        drawBorder(context, rect, color);
      }
    });
  }
  
  function drawBorder(context, rect, color) {
    const {
      height,
      left,
      top,
      width
    } = rect; // outline
  
    context.lineWidth = 1;
    context.strokeStyle = OUTLINE_COLOR;
    context.strokeRect(left - 1, top - 1, width + 2, height + 2); // inset
  
    context.lineWidth = 1;
    context.strokeStyle = OUTLINE_COLOR;
    context.strokeRect(left + 1, top + 1, width - 1, height - 1);
    context.strokeStyle = color;
    context.setLineDash([0]); // border
  
    context.lineWidth = 1;
    context.strokeRect(left, top, width - 1, height - 1);
    context.setLineDash([0]);
  }
  
  function destroy() {
    if (canvas !== null) {
      if (canvas.parentNode != null) {
        canvas.parentNode.removeChild(canvas);
      }
  
      canvas = null;
    }
  }
  
  function initialize() {
    canvas = window.document.createElement('canvas');
    canvas.style.cssText = `
      xx-background-color: red;
      xx-opacity: 0.5;
      bottom: 0;
      left: 0;
      pointer-events: none;
      position: fixed;
      right: 0;
      top: 0;
      z-index: 1000000000;
    `;
    const root = window.document.documentElement;
    root.insertBefore(canvas, root.firstChild);
  }
  // CONCATENATED MODULE: ../react-devtools-shared/src/backend/views/utils.js
  /**
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  // Get the window object for the document that a node belongs to,
  // or return null if it cannot be found (node not attached to DOM,
  // etc).
  function getOwnerWindow(node) {
    if (!node.ownerDocument) {
      return null;
    }
  
    return node.ownerDocument.defaultView;
  } // Get the iframe containing a node, or return null if it cannot
  // be found (node not within iframe, etc).
  
  function getOwnerIframe(node) {
    const nodeWindow = getOwnerWindow(node);
  
    if (nodeWindow) {
      return nodeWindow.frameElement;
    }
  
    return null;
  } // Get a bounding client rect for a node, with an
  // offset added to compensate for its border.
  
  function getBoundingClientRectWithBorderOffset(node) {
    const dimensions = getElementDimensions(node);
    return mergeRectOffsets([node.getBoundingClientRect(), {
      top: dimensions.borderTop,
      left: dimensions.borderLeft,
      bottom: dimensions.borderBottom,
      right: dimensions.borderRight,
      // This width and height won't get used by mergeRectOffsets (since this
      // is not the first rect in the array), but we set them so that this
      // object type checks as a ClientRect.
      width: 0,
      height: 0
    }]);
  } // Add together the top, left, bottom, and right properties of
  // each ClientRect, but keep the width and height of the first one.
  
  function mergeRectOffsets(rects) {
    return rects.reduce((previousRect, rect) => {
      if (previousRect == null) {
        return rect;
      }
  
      return {
        top: previousRect.top + rect.top,
        left: previousRect.left + rect.left,
        width: previousRect.width,
        height: previousRect.height,
        bottom: previousRect.bottom + rect.bottom,
        right: previousRect.right + rect.right
      };
    });
  } // Calculate a boundingClientRect for a node relative to boundaryWindow,
  // taking into account any offsets caused by intermediate iframes.
  
  function getNestedBoundingClientRect(node, boundaryWindow) {
    const ownerIframe = getOwnerIframe(node);
  
    if (ownerIframe && ownerIframe !== boundaryWindow) {
      const rects = [node.getBoundingClientRect()];
      let currentIframe = ownerIframe;
      let onlyOneMore = false;
  
      while (currentIframe) {
        const rect = getBoundingClientRectWithBorderOffset(currentIframe);
        rects.push(rect);
        currentIframe = getOwnerIframe(currentIframe);
  
        if (onlyOneMore) {
          break;
        } // We don't want to calculate iframe offsets upwards beyond
        // the iframe containing the boundaryWindow, but we
        // need to calculate the offset relative to the boundaryWindow.
  
  
        if (currentIframe && getOwnerWindow(currentIframe) === boundaryWindow) {
          onlyOneMore = true;
        }
      }
  
      return mergeRectOffsets(rects);
    } else {
      return node.getBoundingClientRect();
    }
  }
  function getElementDimensions(domElement) {
    const calculatedStyle = window.getComputedStyle(domElement);
    return {
      borderLeft: parseInt(calculatedStyle.borderLeftWidth, 10),
      borderRight: parseInt(calculatedStyle.borderRightWidth, 10),
      borderTop: parseInt(calculatedStyle.borderTopWidth, 10),
      borderBottom: parseInt(calculatedStyle.borderBottomWidth, 10),
      marginLeft: parseInt(calculatedStyle.marginLeft, 10),
      marginRight: parseInt(calculatedStyle.marginRight, 10),
      marginTop: parseInt(calculatedStyle.marginTop, 10),
      marginBottom: parseInt(calculatedStyle.marginBottom, 10),
      paddingLeft: parseInt(calculatedStyle.paddingLeft, 10),
      paddingRight: parseInt(calculatedStyle.paddingRight, 10),
      paddingTop: parseInt(calculatedStyle.paddingTop, 10),
      paddingBottom: parseInt(calculatedStyle.paddingBottom, 10)
    };
  }
  // CONCATENATED MODULE: ../react-devtools-shared/src/backend/views/TraceUpdates/index.js
  /**
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  
  
  
  // How long the rect should be shown for?
  const DISPLAY_DURATION = 250; // What's the longest we are willing to show the overlay for?
  // This can be important if we're getting a flurry of events (e.g. scroll update).
  
  const MAX_DISPLAY_DURATION = 3000; // How long should a rect be considered valid for?
  
  const REMEASUREMENT_AFTER_DURATION = 250; // Some environments (e.g. React Native / Hermes) don't support the performance API yet.
  
  const getCurrentTime = // $FlowFixMe[method-unbinding]
  typeof performance === 'object' && typeof performance.now === 'function' ? () => performance.now() : () => Date.now();
  const nodeToData = new Map();
  let agent = null;
  let drawAnimationFrameID = null;
  let isEnabled = false;
  let redrawTimeoutID = null;
  function TraceUpdates_initialize(injectedAgent) {
    agent = injectedAgent;
    agent.addListener('traceUpdates', traceUpdates);
  }
  function toggleEnabled(value) {
    isEnabled = value;
  
    if (!isEnabled) {
      nodeToData.clear();
  
      if (drawAnimationFrameID !== null) {
        cancelAnimationFrame(drawAnimationFrameID);
        drawAnimationFrameID = null;
      }
  
      if (redrawTimeoutID !== null) {
        clearTimeout(redrawTimeoutID);
        redrawTimeoutID = null;
      }
  
      destroy();
    }
  }
  
  function traceUpdates(nodes) {
    if (!isEnabled) {
      return;
    }
  
    nodes.forEach(node => {
      const data = nodeToData.get(node);
      const now = getCurrentTime();
      let lastMeasuredAt = data != null ? data.lastMeasuredAt : 0;
      let rect = data != null ? data.rect : null;
  
      if (rect === null || lastMeasuredAt + REMEASUREMENT_AFTER_DURATION < now) {
        lastMeasuredAt = now;
        rect = measureNode(node);
      }
  
      nodeToData.set(node, {
        count: data != null ? data.count + 1 : 1,
        expirationTime: data != null ? Math.min(now + MAX_DISPLAY_DURATION, data.expirationTime + DISPLAY_DURATION) : now + DISPLAY_DURATION,
        lastMeasuredAt,
        rect
      });
    });
  
    if (redrawTimeoutID !== null) {
      clearTimeout(redrawTimeoutID);
      redrawTimeoutID = null;
    }
  
    if (drawAnimationFrameID === null) {
      drawAnimationFrameID = requestAnimationFrame(prepareToDraw);
    }
  }
  
  function prepareToDraw() {
    drawAnimationFrameID = null;
    redrawTimeoutID = null;
    const now = getCurrentTime();
    let earliestExpiration = Number.MAX_VALUE; // Remove any items that have already expired.
  
    nodeToData.forEach((data, node) => {
      if (data.expirationTime < now) {
        nodeToData.delete(node);
      } else {
        earliestExpiration = Math.min(earliestExpiration, data.expirationTime);
      }
    });
    draw(nodeToData);
  
    if (earliestExpiration !== Number.MAX_VALUE) {
      redrawTimeoutID = setTimeout(prepareToDraw, earliestExpiration - now);
    }
  }
  
  function measureNode(node) {
    if (!node || typeof node.getBoundingClientRect !== 'function') {
      return null;
    }
  
    const currentWindow = window.__REACT_DEVTOOLS_TARGET_WINDOW__ || window;
    return getNestedBoundingClientRect(node, currentWindow);
  }
  // EXTERNAL MODULE: ../react-devtools-shared/src/backend/console.js
  var backend_console = __webpack_require__(9);
  
  // EXTERNAL MODULE: ../react-devtools-shared/src/bridge.js
  var src_bridge = __webpack_require__(12);
  
  // EXTERNAL MODULE: ../react-devtools-shared/src/backend/utils.js
  var utils = __webpack_require__(4);
  
  // CONCATENATED MODULE: ../react-devtools-shared/src/backend/agent.js
  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
  
  /**
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  
  
  
  
  
  
  
  const debug = (methodName, ...args) => {
    if (constants["j" /* __DEBUG__ */]) {
      console.log(`%cAgent %c${methodName}`, 'color: purple; font-weight: bold;', 'font-weight: bold;', ...args);
    }
  };
  
  class agent_Agent extends events["a" /* default */] {
    constructor(bridge) {
      super();
  
      _defineProperty(this, "_isProfiling", false);
  
      _defineProperty(this, "_recordChangeDescriptions", false);
  
      _defineProperty(this, "_rendererInterfaces", {});
  
      _defineProperty(this, "_persistedSelection", null);
  
      _defineProperty(this, "_persistedSelectionMatch", null);
  
      _defineProperty(this, "_traceUpdatesEnabled", false);
  
      _defineProperty(this, "clearErrorsAndWarnings", ({
        rendererID
      }) => {
        const renderer = this._rendererInterfaces[rendererID];
  
        if (renderer == null) {
          console.warn(`Invalid renderer id "${rendererID}"`);
        } else {
          renderer.clearErrorsAndWarnings();
        }
      });
  
      _defineProperty(this, "clearErrorsForFiberID", ({
        id,
        rendererID
      }) => {
        const renderer = this._rendererInterfaces[rendererID];
  
        if (renderer == null) {
          console.warn(`Invalid renderer id "${rendererID}"`);
        } else {
          renderer.clearErrorsForFiberID(id);
        }
      });
  
      _defineProperty(this, "clearWarningsForFiberID", ({
        id,
        rendererID
      }) => {
        const renderer = this._rendererInterfaces[rendererID];
  
        if (renderer == null) {
          console.warn(`Invalid renderer id "${rendererID}"`);
        } else {
          renderer.clearWarningsForFiberID(id);
        }
      });
  
      _defineProperty(this, "copyElementPath", ({
        id,
        path,
        rendererID
      }) => {
        const renderer = this._rendererInterfaces[rendererID];
  
        if (renderer == null) {
          console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
        } else {
          renderer.copyElementPath(id, path);
        }
      });
  
      _defineProperty(this, "deletePath", ({
        hookID,
        id,
        path,
        rendererID,
        type
      }) => {
        const renderer = this._rendererInterfaces[rendererID];
  
        if (renderer == null) {
          console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
        } else {
          renderer.deletePath(type, id, hookID, path);
        }
      });
  
      _defineProperty(this, "getBackendVersion", () => {
        const version = "4.27.1-da0585015";
  
        if (version) {
          this._bridge.send('backendVersion', version);
        }
      });
  
      _defineProperty(this, "getBridgeProtocol", () => {
        this._bridge.send('bridgeProtocol', src_bridge["currentBridgeProtocol"]);
      });
  
      _defineProperty(this, "getProfilingData", ({
        rendererID
      }) => {
        const renderer = this._rendererInterfaces[rendererID];
  
        if (renderer == null) {
          console.warn(`Invalid renderer id "${rendererID}"`);
        }
  
        this._bridge.send('profilingData', renderer.getProfilingData());
      });
  
      _defineProperty(this, "getProfilingStatus", () => {
        this._bridge.send('profilingStatus', this._isProfiling);
      });
  
      _defineProperty(this, "getOwnersList", ({
        id,
        rendererID
      }) => {
        const renderer = this._rendererInterfaces[rendererID];
  
        if (renderer == null) {
          console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
        } else {
          const owners = renderer.getOwnersList(id);
  
          this._bridge.send('ownersList', {
            id,
            owners
          });
        }
      });
  
      _defineProperty(this, "inspectElement", ({
        forceFullData,
        id,
        path,
        rendererID,
        requestID
      }) => {
        const renderer = this._rendererInterfaces[rendererID];
  
        if (renderer == null) {
          console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
        } else {
          this._bridge.send('inspectedElement', renderer.inspectElement(requestID, id, path, forceFullData)); // When user selects an element, stop trying to restore the selection,
          // and instead remember the current selection for the next reload.
  
  
          if (this._persistedSelectionMatch === null || this._persistedSelectionMatch.id !== id) {
            this._persistedSelection = null;
            this._persistedSelectionMatch = null;
            renderer.setTrackedPath(null);
          } // TODO: If there was a way to change the selected DOM element
          // in native Elements tab without forcing a switch to it, we'd do it here.
          // For now, it doesn't seem like there is a way to do that:
          // https://github.com/bvaughn/react-devtools-experimental/issues/102
          // (Setting $0 doesn't work, and calling inspect() switches the tab.)
  
        }
      });
  
      _defineProperty(this, "logElementToConsole", ({
        id,
        rendererID
      }) => {
        const renderer = this._rendererInterfaces[rendererID];
  
        if (renderer == null) {
          console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
        } else {
          renderer.logElementToConsole(id);
        }
      });
  
      _defineProperty(this, "overrideError", ({
        id,
        rendererID,
        forceError
      }) => {
        const renderer = this._rendererInterfaces[rendererID];
  
        if (renderer == null) {
          console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
        } else {
          renderer.overrideError(id, forceError);
        }
      });
  
      _defineProperty(this, "overrideSuspense", ({
        id,
        rendererID,
        forceFallback
      }) => {
        const renderer = this._rendererInterfaces[rendererID];
  
        if (renderer == null) {
          console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
        } else {
          renderer.overrideSuspense(id, forceFallback);
        }
      });
  
      _defineProperty(this, "overrideValueAtPath", ({
        hookID,
        id,
        path,
        rendererID,
        type,
        value
      }) => {
        const renderer = this._rendererInterfaces[rendererID];
  
        if (renderer == null) {
          console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
        } else {
          renderer.overrideValueAtPath(type, id, hookID, path, value);
        }
      });
  
      _defineProperty(this, "overrideContext", ({
        id,
        path,
        rendererID,
        wasForwarded,
        value
      }) => {
        // Don't forward a message that's already been forwarded by the front-end Bridge.
        // We only need to process the override command once!
        if (!wasForwarded) {
          this.overrideValueAtPath({
            id,
            path,
            rendererID,
            type: 'context',
            value
          });
        }
      });
  
      _defineProperty(this, "overrideHookState", ({
        id,
        hookID,
        path,
        rendererID,
        wasForwarded,
        value
      }) => {
        // Don't forward a message that's already been forwarded by the front-end Bridge.
        // We only need to process the override command once!
        if (!wasForwarded) {
          this.overrideValueAtPath({
            id,
            path,
            rendererID,
            type: 'hooks',
            value
          });
        }
      });
  
      _defineProperty(this, "overrideProps", ({
        id,
        path,
        rendererID,
        wasForwarded,
        value
      }) => {
        // Don't forward a message that's already been forwarded by the front-end Bridge.
        // We only need to process the override command once!
        if (!wasForwarded) {
          this.overrideValueAtPath({
            id,
            path,
            rendererID,
            type: 'props',
            value
          });
        }
      });
  
      _defineProperty(this, "overrideState", ({
        id,
        path,
        rendererID,
        wasForwarded,
        value
      }) => {
        // Don't forward a message that's already been forwarded by the front-end Bridge.
        // We only need to process the override command once!
        if (!wasForwarded) {
          this.overrideValueAtPath({
            id,
            path,
            rendererID,
            type: 'state',
            value
          });
        }
      });
  
      _defineProperty(this, "renamePath", ({
        hookID,
        id,
        newPath,
        oldPath,
        rendererID,
        type
      }) => {
        const renderer = this._rendererInterfaces[rendererID];
  
        if (renderer == null) {
          console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
        } else {
          renderer.renamePath(type, id, hookID, oldPath, newPath);
        }
      });
  
      _defineProperty(this, "setTraceUpdatesEnabled", traceUpdatesEnabled => {
        this._traceUpdatesEnabled = traceUpdatesEnabled;
        toggleEnabled(traceUpdatesEnabled);
  
        for (const rendererID in this._rendererInterfaces) {
          const renderer = this._rendererInterfaces[rendererID];
          renderer.setTraceUpdatesEnabled(traceUpdatesEnabled);
        }
      });
  
      _defineProperty(this, "syncSelectionFromNativeElementsPanel", () => {
        const target = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.$0;
  
        if (target == null) {
          return;
        }
  
        this.selectNode(target);
      });
  
      _defineProperty(this, "shutdown", () => {
        // Clean up the overlay if visible, and associated events.
        this.emit('shutdown');
      });
  
      _defineProperty(this, "startProfiling", recordChangeDescriptions => {
        this._recordChangeDescriptions = recordChangeDescriptions;
        this._isProfiling = true;
  
        for (const rendererID in this._rendererInterfaces) {
          const renderer = this._rendererInterfaces[rendererID];
          renderer.startProfiling(recordChangeDescriptions);
        }
  
        this._bridge.send('profilingStatus', this._isProfiling);
      });
  
      _defineProperty(this, "stopProfiling", () => {
        this._isProfiling = false;
        this._recordChangeDescriptions = false;
  
        for (const rendererID in this._rendererInterfaces) {
          const renderer = this._rendererInterfaces[rendererID];
          renderer.stopProfiling();
        }
  
        this._bridge.send('profilingStatus', this._isProfiling);
      });
  
      _defineProperty(this, "stopInspectingNative", selected => {
        this._bridge.send('stopInspectingNative', selected);
      });
  
      _defineProperty(this, "storeAsGlobal", ({
        count,
        id,
        path,
        rendererID
      }) => {
        const renderer = this._rendererInterfaces[rendererID];
  
        if (renderer == null) {
          console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
        } else {
          renderer.storeAsGlobal(id, path, count);
        }
      });
  
      _defineProperty(this, "updateConsolePatchSettings", ({
        appendComponentStack,
        breakOnConsoleErrors,
        showInlineWarningsAndErrors,
        hideConsoleLogsInStrictMode,
        browserTheme
      }) => {
        // If the frontend preferences have changed,
        // or in the case of React Native- if the backend is just finding out the preferences-
        // then reinstall the console overrides.
        // It's safe to call `patchConsole` multiple times.
        Object(backend_console["a" /* patch */])({
          appendComponentStack,
          breakOnConsoleErrors,
          showInlineWarningsAndErrors,
          hideConsoleLogsInStrictMode,
          browserTheme
        });
      });
  
      _defineProperty(this, "updateComponentFilters", componentFilters => {
        for (const rendererID in this._rendererInterfaces) {
          const renderer = this._rendererInterfaces[rendererID];
          renderer.updateComponentFilters(componentFilters);
        }
      });
  
      _defineProperty(this, "viewAttributeSource", ({
        id,
        path,
        rendererID
      }) => {
        const renderer = this._rendererInterfaces[rendererID];
  
        if (renderer == null) {
          console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
        } else {
          renderer.prepareViewAttributeSource(id, path);
        }
      });
  
      _defineProperty(this, "viewElementSource", ({
        id,
        rendererID
      }) => {
        const renderer = this._rendererInterfaces[rendererID];
  
        if (renderer == null) {
          console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
        } else {
          renderer.prepareViewElementSource(id);
        }
      });
  
      _defineProperty(this, "onTraceUpdates", nodes => {
        this.emit('traceUpdates', nodes);
      });
  
      _defineProperty(this, "onFastRefreshScheduled", () => {
        if (constants["j" /* __DEBUG__ */]) {
          debug('onFastRefreshScheduled');
        }
  
        this._bridge.send('fastRefreshScheduled');
      });
  
      _defineProperty(this, "onHookOperations", operations => {
        if (constants["j" /* __DEBUG__ */]) {
          debug('onHookOperations', `(${operations.length}) [${operations.join(', ')}]`);
        } // TODO:
        // The chrome.runtime does not currently support transferables; it forces JSON serialization.
        // See bug https://bugs.chromium.org/p/chromium/issues/detail?id=927134
        //
        // Regarding transferables, the postMessage doc states:
        // If the ownership of an object is transferred, it becomes unusable (neutered)
        // in the context it was sent from and becomes available only to the worker it was sent to.
        //
        // Even though Chrome is eventually JSON serializing the array buffer,
        // using the transferable approach also sometimes causes it to throw:
        //   DOMException: Failed to execute 'postMessage' on 'Window': ArrayBuffer at index 0 is already neutered.
        //
        // See bug https://github.com/bvaughn/react-devtools-experimental/issues/25
        //
        // The Store has a fallback in place that parses the message as JSON if the type isn't an array.
        // For now the simplest fix seems to be to not transfer the array.
        // This will negatively impact performance on Firefox so it's unfortunate,
        // but until we're able to fix the Chrome error mentioned above, it seems necessary.
        //
        // this._bridge.send('operations', operations, [operations.buffer]);
  
  
        this._bridge.send('operations', operations);
  
        if (this._persistedSelection !== null) {
          const rendererID = operations[0];
  
          if (this._persistedSelection.rendererID === rendererID) {
            // Check if we can select a deeper match for the persisted selection.
            const renderer = this._rendererInterfaces[rendererID];
  
            if (renderer == null) {
              console.warn(`Invalid renderer id "${rendererID}"`);
            } else {
              const prevMatch = this._persistedSelectionMatch;
              const nextMatch = renderer.getBestMatchForTrackedPath();
              this._persistedSelectionMatch = nextMatch;
              const prevMatchID = prevMatch !== null ? prevMatch.id : null;
              const nextMatchID = nextMatch !== null ? nextMatch.id : null;
  
              if (prevMatchID !== nextMatchID) {
                if (nextMatchID !== null) {
                  // We moved forward, unlocking a deeper node.
                  this._bridge.send('selectFiber', nextMatchID);
                }
              }
  
              if (nextMatch !== null && nextMatch.isFullMatch) {
                // We've just unlocked the innermost selected node.
                // There's no point tracking it further.
                this._persistedSelection = null;
                this._persistedSelectionMatch = null;
                renderer.setTrackedPath(null);
              }
            }
          }
        }
      });
  
      this._bridge = bridge;
      bridge.addListener('clearErrorsAndWarnings', this.clearErrorsAndWarnings);
      bridge.addListener('clearErrorsForFiberID', this.clearErrorsForFiberID);
      bridge.addListener('clearWarningsForFiberID', this.clearWarningsForFiberID);
      bridge.addListener('copyElementPath', this.copyElementPath);
      bridge.addListener('deletePath', this.deletePath);
      bridge.addListener('getBackendVersion', this.getBackendVersion);
      bridge.addListener('getBridgeProtocol', this.getBridgeProtocol);
      bridge.addListener('getProfilingData', this.getProfilingData);
      bridge.addListener('getProfilingStatus', this.getProfilingStatus);
      bridge.addListener('getOwnersList', this.getOwnersList);
      bridge.addListener('inspectElement', this.inspectElement);
      bridge.addListener('logElementToConsole', this.logElementToConsole);
      bridge.addListener('overrideError', this.overrideError);
      bridge.addListener('overrideSuspense', this.overrideSuspense);
      bridge.addListener('overrideValueAtPath', this.overrideValueAtPath);
      bridge.addListener('renamePath', this.renamePath);
      bridge.addListener('setTraceUpdatesEnabled', this.setTraceUpdatesEnabled);
      bridge.addListener('startProfiling', this.startProfiling);
      bridge.addListener('stopProfiling', this.stopProfiling);
      bridge.addListener('storeAsGlobal', this.storeAsGlobal);
      bridge.addListener('syncSelectionFromNativeElementsPanel', this.syncSelectionFromNativeElementsPanel);
      bridge.addListener('shutdown', this.shutdown);
      bridge.addListener('updateConsolePatchSettings', this.updateConsolePatchSettings);
      bridge.addListener('updateComponentFilters', this.updateComponentFilters);
      bridge.addListener('viewAttributeSource', this.viewAttributeSource);
      bridge.addListener('viewElementSource', this.viewElementSource); // Temporarily support older standalone front-ends sending commands to newer embedded backends.
      // We do this because React Native embeds the React DevTools backend,
      // but cannot control which version of the frontend users use.
  
      bridge.addListener('overrideContext', this.overrideContext);
      bridge.addListener('overrideHookState', this.overrideHookState);
      bridge.addListener('overrideProps', this.overrideProps);
      bridge.addListener('overrideState', this.overrideState);
  
      if (this._isProfiling) {
        bridge.send('profilingStatus', true);
      } // Send the Bridge protocol and backend versions, after initialization, in case the frontend has already requested it.
      // The Store may be instantiated beore the agent.
  
  
      const _version = "4.27.1-da0585015";
  
      if (_version) {
        this._bridge.send('backendVersion', _version);
      }
  
      this._bridge.send('bridgeProtocol', src_bridge["currentBridgeProtocol"]); // Notify the frontend if the backend supports the Storage API (e.g. localStorage).
      // If not, features like reload-and-profile will not work correctly and must be disabled.
  
  
      let isBackendStorageAPISupported = false;
      bridge.send('isBackendStorageAPISupported', isBackendStorageAPISupported);
      bridge.send('isSynchronousXHRSupported', Object(utils["i" /* isSynchronousXHRSupported */])());
      TraceUpdates_initialize(this);
  
      window.__RECORD_REPLAY_REACT_DEVTOOLS_SEND_MESSAGE__ = (inEvent, inData) => {
        let rv;
        this._bridge = {
          send(event, data) {
            rv = {
              event,
              data
            };
          }
  
        };
  
        try {
          this[inEvent](inData);
        } catch (err) {
          window.logMessage(`Error executing bridge message '${inEvent}': ${err}, ${err.stack}`);
        }
  
        return rv;
      };
    }
  
    get rendererInterfaces() {
      return this._rendererInterfaces;
    }
  
    getInstanceAndStyle({
      id,
      rendererID
    }) {
      const renderer = this._rendererInterfaces[rendererID];
  
      if (renderer == null) {
        console.warn(`Invalid renderer id "${rendererID}"`);
        return null;
      }
  
      return renderer.getInstanceAndStyle(id);
    }
  
    getBestMatchingRendererInterface(node) {
      let bestMatch = null;
  
      for (const rendererID in this._rendererInterfaces) {
        const renderer = this._rendererInterfaces[rendererID];
        const fiber = renderer.getFiberForNative(node);
  
        if (fiber !== null) {
          // check if fiber.stateNode is matching the original hostInstance
          if (fiber.stateNode === node) {
            return renderer;
          } else if (bestMatch === null) {
            bestMatch = renderer;
          }
        }
      } // if an exact match is not found, return the first valid renderer as fallback
  
  
      return bestMatch;
    }
  
    getIDForNode(node) {
      const rendererInterface = this.getBestMatchingRendererInterface(node);
  
      if (rendererInterface != null) {
        try {
          return rendererInterface.getFiberIDForNative(node, true);
        } catch (error) {// Some old React versions might throw if they can't find a match.
          // If so we should ignore it...
        }
      }
  
      return null;
    }
  
    selectNode(target) {
      const id = this.getIDForNode(target);
  
      if (id !== null) {
        this._bridge.send('selectFiber', id);
      }
    }
  
    setRendererInterface(rendererID, rendererInterface) {
      this._rendererInterfaces[rendererID] = rendererInterface;
  
      if (this._isProfiling) {
        rendererInterface.startProfiling(this._recordChangeDescriptions);
      }
  
      rendererInterface.setTraceUpdatesEnabled(this._traceUpdatesEnabled); // When the renderer is attached, we need to tell it whether
      // we remember the previous selection that we'd like to restore.
      // It'll start tracking mounts for matches to the last selection path.
  
      const selection = this._persistedSelection;
  
      if (selection !== null && selection.rendererID === rendererID) {
        rendererInterface.setTrackedPath(selection.path);
      }
    }
  
    onUnsupportedRenderer(rendererID) {
      this._bridge.send('unsupportedRendererVersion', rendererID);
    }
  
  }
  
  /***/ }),
  /* 16 */
  /***/ (function(module, __webpack_exports__, __webpack_require__) {
  
  "use strict";
  /* unused harmony export REACT_ELEMENT_TYPE */
  /* unused harmony export REACT_PORTAL_TYPE */
  /* unused harmony export REACT_FRAGMENT_TYPE */
  /* unused harmony export REACT_STRICT_MODE_TYPE */
  /* unused harmony export REACT_PROFILER_TYPE */
  /* unused harmony export REACT_PROVIDER_TYPE */
  /* unused harmony export REACT_CONTEXT_TYPE */
  /* unused harmony export REACT_SERVER_CONTEXT_TYPE */
  /* unused harmony export REACT_FORWARD_REF_TYPE */
  /* unused harmony export REACT_SUSPENSE_TYPE */
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return REACT_SUSPENSE_LIST_TYPE; });
  /* unused harmony export REACT_MEMO_TYPE */
  /* unused harmony export REACT_LAZY_TYPE */
  /* unused harmony export REACT_SCOPE_TYPE */
  /* unused harmony export REACT_DEBUG_TRACING_MODE_TYPE */
  /* unused harmony export REACT_OFFSCREEN_TYPE */
  /* unused harmony export REACT_LEGACY_HIDDEN_TYPE */
  /* unused harmony export REACT_CACHE_TYPE */
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return REACT_TRACING_MARKER_TYPE; });
  /* unused harmony export REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED */
  /* unused harmony export REACT_MEMO_CACHE_SENTINEL */
  /* unused harmony export getIteratorFn */
  /**
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  // ATTENTION
  // When adding new symbols to this file,
  // Please consider also adding to 'react-devtools-shared/src/backend/ReactSymbols'
  // The Symbol used to tag the ReactElement-like types.
  const REACT_ELEMENT_TYPE = Symbol.for('react.element');
  const REACT_PORTAL_TYPE = Symbol.for('react.portal');
  const REACT_FRAGMENT_TYPE = Symbol.for('react.fragment');
  const REACT_STRICT_MODE_TYPE = Symbol.for('react.strict_mode');
  const REACT_PROFILER_TYPE = Symbol.for('react.profiler');
  const REACT_PROVIDER_TYPE = Symbol.for('react.provider');
  const REACT_CONTEXT_TYPE = Symbol.for('react.context');
  const REACT_SERVER_CONTEXT_TYPE = Symbol.for('react.server_context');
  const REACT_FORWARD_REF_TYPE = Symbol.for('react.forward_ref');
  const REACT_SUSPENSE_TYPE = Symbol.for('react.suspense');
  const REACT_SUSPENSE_LIST_TYPE = Symbol.for('react.suspense_list');
  const REACT_MEMO_TYPE = Symbol.for('react.memo');
  const REACT_LAZY_TYPE = Symbol.for('react.lazy');
  const REACT_SCOPE_TYPE = Symbol.for('react.scope');
  const REACT_DEBUG_TRACING_MODE_TYPE = Symbol.for('react.debug_trace_mode');
  const REACT_OFFSCREEN_TYPE = Symbol.for('react.offscreen');
  const REACT_LEGACY_HIDDEN_TYPE = Symbol.for('react.legacy_hidden');
  const REACT_CACHE_TYPE = Symbol.for('react.cache');
  const REACT_TRACING_MARKER_TYPE = Symbol.for('react.tracing_marker');
  const REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED = Symbol.for('react.default_value');
  const REACT_MEMO_CACHE_SENTINEL = Symbol.for('react.memo_cache_sentinel');
  const MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
  const FAUX_ITERATOR_SYMBOL = '@@iterator';
  function getIteratorFn(maybeIterable) {
    if (maybeIterable === null || typeof maybeIterable !== 'object') {
      return null;
    }
  
    const maybeIterator = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL];
  
    if (typeof maybeIterator === 'function') {
      return maybeIterator;
    }
  
    return null;
  }
  
  /***/ }),
  /* 17 */
  /***/ (function(module, exports, __webpack_require__) {
  
  //  Import support https://stackoverflow.com/questions/13673346/supporting-both-commonjs-and-amd
  (function (name, definition) {
    if (true) {
      module.exports = definition();
    } else {}
  })("clipboard", function () {
    if (typeof document === 'undefined' || !document.addEventListener) {
      return null;
    }
  
    var clipboard = {};
  
    clipboard.copy = function () {
      var _intercept = false;
      var _data = null; // Map from data type (e.g. "text/html") to value.
  
      var _bogusSelection = false;
  
      function cleanup() {
        _intercept = false;
        _data = null;
  
        if (_bogusSelection) {
          window.getSelection().removeAllRanges();
        }
  
        _bogusSelection = false;
      }
  
      document.addEventListener("copy", function (e) {
        if (_intercept) {
          for (var key in _data) {
            e.clipboardData.setData(key, _data[key]);
          }
  
          e.preventDefault();
        }
      }); // Workaround for Safari: https://bugs.webkit.org/show_bug.cgi?id=156529
  
      function bogusSelect() {
        var sel = document.getSelection(); // If "nothing" is selected...
  
        if (!document.queryCommandEnabled("copy") && sel.isCollapsed) {
          // ... temporarily select the entire body.
          //
          // We select the entire body because:
          // - it's guaranteed to exist,
          // - it works (unlike, say, document.head, or phantom element that is
          //   not inserted into the DOM),
          // - it doesn't seem to flicker (due to the synchronous copy event), and
          // - it avoids modifying the DOM (can trigger mutation observers).
          //
          // Because we can't do proper feature detection (we already checked
          // document.queryCommandEnabled("copy") , which actually gives a false
          // negative for Blink when nothing is selected) and UA sniffing is not
          // reliable (a lot of UA strings contain "Safari"), this will also
          // happen for some browsers other than Safari. :-()
          var range = document.createRange();
          range.selectNodeContents(document.body);
          sel.removeAllRanges();
          sel.addRange(range);
          _bogusSelection = true;
        }
      }
  
      ;
      return function (data) {
        return new Promise(function (resolve, reject) {
          _intercept = true;
  
          if (typeof data === "string") {
            _data = {
              "text/plain": data
            };
          } else if (data instanceof Node) {
            _data = {
              "text/html": new XMLSerializer().serializeToString(data)
            };
          } else if (data instanceof Object) {
            _data = data;
          } else {
            reject("Invalid data type. Must be string, DOM node, or an object mapping MIME types to strings.");
          }
  
          function triggerCopy(tryBogusSelect) {
            try {
              if (document.execCommand("copy")) {
                // document.execCommand is synchronous: http://www.w3.org/TR/2015/WD-clipboard-apis-20150421/#integration-with-rich-text-editing-apis
                // So we can call resolve() back here.
                cleanup();
                resolve();
              } else {
                if (!tryBogusSelect) {
                  bogusSelect();
                  triggerCopy(true);
                } else {
                  cleanup();
                  throw new Error("Unable to copy. Perhaps it's not available in your browser?");
                }
              }
            } catch (e) {
              cleanup();
              reject(e);
            }
          }
  
          triggerCopy(false);
        });
      };
    }();
  
    clipboard.paste = function () {
      var _intercept = false;
  
      var _resolve;
  
      var _dataType;
  
      document.addEventListener("paste", function (e) {
        if (_intercept) {
          _intercept = false;
          e.preventDefault();
          var resolve = _resolve;
          _resolve = null;
          resolve(e.clipboardData.getData(_dataType));
        }
      });
      return function (dataType) {
        return new Promise(function (resolve, reject) {
          _intercept = true;
          _resolve = resolve;
          _dataType = dataType || "text/plain";
  
          try {
            if (!document.execCommand("paste")) {
              _intercept = false;
              reject(new Error("Unable to paste. Pasting only works in Internet Explorer at the moment."));
            }
          } catch (e) {
            _intercept = false;
            reject(new Error(e));
          }
        });
      };
    }(); // Handle IE behaviour.
  
  
    if (typeof ClipboardEvent === "undefined" && typeof window.clipboardData !== "undefined" && typeof window.clipboardData.setData !== "undefined") {
      /*! promise-polyfill 2.0.1 */
      (function (a) {
        function b(a, b) {
          return function () {
            a.apply(b, arguments);
          };
        }
  
        function c(a) {
          if ("object" != typeof this) throw new TypeError("Promises must be constructed via new");
          if ("function" != typeof a) throw new TypeError("not a function");
          this._state = null, this._value = null, this._deferreds = [], i(a, b(e, this), b(f, this));
        }
  
        function d(a) {
          var b = this;
          return null === this._state ? void this._deferreds.push(a) : void j(function () {
            var c = b._state ? a.onFulfilled : a.onRejected;
            if (null === c) return void (b._state ? a.resolve : a.reject)(b._value);
            var d;
  
            try {
              d = c(b._value);
            } catch (e) {
              return void a.reject(e);
            }
  
            a.resolve(d);
          });
        }
  
        function e(a) {
          try {
            if (a === this) throw new TypeError("A promise cannot be resolved with itself.");
  
            if (a && ("object" == typeof a || "function" == typeof a)) {
              var c = a.then;
              if ("function" == typeof c) return void i(b(c, a), b(e, this), b(f, this));
            }
  
            this._state = !0, this._value = a, g.call(this);
          } catch (d) {
            f.call(this, d);
          }
        }
  
        function f(a) {
          this._state = !1, this._value = a, g.call(this);
        }
  
        function g() {
          for (var a = 0, b = this._deferreds.length; b > a; a++) d.call(this, this._deferreds[a]);
  
          this._deferreds = null;
        }
  
        function h(a, b, c, d) {
          this.onFulfilled = "function" == typeof a ? a : null, this.onRejected = "function" == typeof b ? b : null, this.resolve = c, this.reject = d;
        }
  
        function i(a, b, c) {
          var d = !1;
  
          try {
            a(function (a) {
              d || (d = !0, b(a));
            }, function (a) {
              d || (d = !0, c(a));
            });
          } catch (e) {
            if (d) return;
            d = !0, c(e);
          }
        }
  
        var j = c.immediateFn || "function" == typeof setImmediate && setImmediate || function (a) {
          setTimeout(a, 1);
        },
            k = Array.isArray || function (a) {
          return "[object Array]" === Object.prototype.toString.call(a);
        };
  
        c.prototype["catch"] = function (a) {
          return this.then(null, a);
        }, c.prototype.then = function (a, b) {
          var e = this;
          return new c(function (c, f) {
            d.call(e, new h(a, b, c, f));
          });
        }, c.all = function () {
          var a = Array.prototype.slice.call(1 === arguments.length && k(arguments[0]) ? arguments[0] : arguments);
          return new c(function (b, c) {
            function d(f, g) {
              try {
                if (g && ("object" == typeof g || "function" == typeof g)) {
                  var h = g.then;
                  if ("function" == typeof h) return void h.call(g, function (a) {
                    d(f, a);
                  }, c);
                }
  
                a[f] = g, 0 === --e && b(a);
              } catch (i) {
                c(i);
              }
            }
  
            if (0 === a.length) return b([]);
  
            for (var e = a.length, f = 0; f < a.length; f++) d(f, a[f]);
          });
        }, c.resolve = function (a) {
          return a && "object" == typeof a && a.constructor === c ? a : new c(function (b) {
            b(a);
          });
        }, c.reject = function (a) {
          return new c(function (b, c) {
            c(a);
          });
        }, c.race = function (a) {
          return new c(function (b, c) {
            for (var d = 0, e = a.length; e > d; d++) a[d].then(b, c);
          });
        },  true && module.exports ? module.exports = c : a.Promise || (a.Promise = c);
      })(this);
  
      clipboard.copy = function (data) {
        return new Promise(function (resolve, reject) {
          // IE supports string and URL types: https://msdn.microsoft.com/en-us/library/ms536744(v=vs.85).aspx
          // We only support the string type for now.
          if (typeof data !== "string" && !("text/plain" in data)) {
            throw new Error("You must provide a text/plain type.");
          }
  
          var strData = typeof data === "string" ? data : data["text/plain"];
          var copySucceeded = window.clipboardData.setData("Text", strData);
  
          if (copySucceeded) {
            resolve();
          } else {
            reject(new Error("Copying was rejected."));
          }
        });
      };
  
      clipboard.paste = function () {
        return new Promise(function (resolve, reject) {
          var strData = window.clipboardData.getData("Text");
  
          if (strData) {
            resolve(strData);
          } else {
            // The user rejected the paste request.
            reject(new Error("Pasting was rejected."));
          }
        });
      };
    }
  
    return clipboard;
  });
  
  /***/ }),
  /* 18 */
  /***/ (function(module, exports, __webpack_require__) {
  
  "use strict";
   // A linked list to keep track of recently-used-ness
  
  const Yallist = __webpack_require__(23);
  
  const MAX = Symbol('max');
  const LENGTH = Symbol('length');
  const LENGTH_CALCULATOR = Symbol('lengthCalculator');
  const ALLOW_STALE = Symbol('allowStale');
  const MAX_AGE = Symbol('maxAge');
  const DISPOSE = Symbol('dispose');
  const NO_DISPOSE_ON_SET = Symbol('noDisposeOnSet');
  const LRU_LIST = Symbol('lruList');
  const CACHE = Symbol('cache');
  const UPDATE_AGE_ON_GET = Symbol('updateAgeOnGet');
  
  const naiveLength = () => 1; // lruList is a yallist where the head is the youngest
  // item, and the tail is the oldest.  the list contains the Hit
  // objects as the entries.
  // Each Hit object has a reference to its Yallist.Node.  This
  // never changes.
  //
  // cache is a Map (or PseudoMap) that matches the keys to
  // the Yallist.Node object.
  
  
  class LRUCache {
    constructor(options) {
      if (typeof options === 'number') options = {
        max: options
      };
      if (!options) options = {};
      if (options.max && (typeof options.max !== 'number' || options.max < 0)) throw new TypeError('max must be a non-negative number'); // Kind of weird to have a default max of Infinity, but oh well.
  
      const max = this[MAX] = options.max || Infinity;
      const lc = options.length || naiveLength;
      this[LENGTH_CALCULATOR] = typeof lc !== 'function' ? naiveLength : lc;
      this[ALLOW_STALE] = options.stale || false;
      if (options.maxAge && typeof options.maxAge !== 'number') throw new TypeError('maxAge must be a number');
      this[MAX_AGE] = options.maxAge || 0;
      this[DISPOSE] = options.dispose;
      this[NO_DISPOSE_ON_SET] = options.noDisposeOnSet || false;
      this[UPDATE_AGE_ON_GET] = options.updateAgeOnGet || false;
      this.reset();
    } // resize the cache when the max changes.
  
  
    set max(mL) {
      if (typeof mL !== 'number' || mL < 0) throw new TypeError('max must be a non-negative number');
      this[MAX] = mL || Infinity;
      trim(this);
    }
  
    get max() {
      return this[MAX];
    }
  
    set allowStale(allowStale) {
      this[ALLOW_STALE] = !!allowStale;
    }
  
    get allowStale() {
      return this[ALLOW_STALE];
    }
  
    set maxAge(mA) {
      if (typeof mA !== 'number') throw new TypeError('maxAge must be a non-negative number');
      this[MAX_AGE] = mA;
      trim(this);
    }
  
    get maxAge() {
      return this[MAX_AGE];
    } // resize the cache when the lengthCalculator changes.
  
  
    set lengthCalculator(lC) {
      if (typeof lC !== 'function') lC = naiveLength;
  
      if (lC !== this[LENGTH_CALCULATOR]) {
        this[LENGTH_CALCULATOR] = lC;
        this[LENGTH] = 0;
        this[LRU_LIST].forEach(hit => {
          hit.length = this[LENGTH_CALCULATOR](hit.value, hit.key);
          this[LENGTH] += hit.length;
        });
      }
  
      trim(this);
    }
  
    get lengthCalculator() {
      return this[LENGTH_CALCULATOR];
    }
  
    get length() {
      return this[LENGTH];
    }
  
    get itemCount() {
      return this[LRU_LIST].length;
    }
  
    rforEach(fn, thisp) {
      thisp = thisp || this;
  
      for (let walker = this[LRU_LIST].tail; walker !== null;) {
        const prev = walker.prev;
        forEachStep(this, fn, walker, thisp);
        walker = prev;
      }
    }
  
    forEach(fn, thisp) {
      thisp = thisp || this;
  
      for (let walker = this[LRU_LIST].head; walker !== null;) {
        const next = walker.next;
        forEachStep(this, fn, walker, thisp);
        walker = next;
      }
    }
  
    keys() {
      return this[LRU_LIST].toArray().map(k => k.key);
    }
  
    values() {
      return this[LRU_LIST].toArray().map(k => k.value);
    }
  
    reset() {
      if (this[DISPOSE] && this[LRU_LIST] && this[LRU_LIST].length) {
        this[LRU_LIST].forEach(hit => this[DISPOSE](hit.key, hit.value));
      }
  
      this[CACHE] = new Map(); // hash of items by key
  
      this[LRU_LIST] = new Yallist(); // list of items in order of use recency
  
      this[LENGTH] = 0; // length of items in the list
    }
  
    dump() {
      return this[LRU_LIST].map(hit => isStale(this, hit) ? false : {
        k: hit.key,
        v: hit.value,
        e: hit.now + (hit.maxAge || 0)
      }).toArray().filter(h => h);
    }
  
    dumpLru() {
      return this[LRU_LIST];
    }
  
    set(key, value, maxAge) {
      maxAge = maxAge || this[MAX_AGE];
      if (maxAge && typeof maxAge !== 'number') throw new TypeError('maxAge must be a number');
      const now = maxAge ? Date.now() : 0;
      const len = this[LENGTH_CALCULATOR](value, key);
  
      if (this[CACHE].has(key)) {
        if (len > this[MAX]) {
          del(this, this[CACHE].get(key));
          return false;
        }
  
        const node = this[CACHE].get(key);
        const item = node.value; // dispose of the old one before overwriting
        // split out into 2 ifs for better coverage tracking
  
        if (this[DISPOSE]) {
          if (!this[NO_DISPOSE_ON_SET]) this[DISPOSE](key, item.value);
        }
  
        item.now = now;
        item.maxAge = maxAge;
        item.value = value;
        this[LENGTH] += len - item.length;
        item.length = len;
        this.get(key);
        trim(this);
        return true;
      }
  
      const hit = new Entry(key, value, len, now, maxAge); // oversized objects fall out of cache automatically.
  
      if (hit.length > this[MAX]) {
        if (this[DISPOSE]) this[DISPOSE](key, value);
        return false;
      }
  
      this[LENGTH] += hit.length;
      this[LRU_LIST].unshift(hit);
      this[CACHE].set(key, this[LRU_LIST].head);
      trim(this);
      return true;
    }
  
    has(key) {
      if (!this[CACHE].has(key)) return false;
      const hit = this[CACHE].get(key).value;
      return !isStale(this, hit);
    }
  
    get(key) {
      return get(this, key, true);
    }
  
    peek(key) {
      return get(this, key, false);
    }
  
    pop() {
      const node = this[LRU_LIST].tail;
      if (!node) return null;
      del(this, node);
      return node.value;
    }
  
    del(key) {
      del(this, this[CACHE].get(key));
    }
  
    load(arr) {
      // reset the cache
      this.reset();
      const now = Date.now(); // A previous serialized cache has the most recent items first
  
      for (let l = arr.length - 1; l >= 0; l--) {
        const hit = arr[l];
        const expiresAt = hit.e || 0;
        if (expiresAt === 0) // the item was created without expiration in a non aged cache
          this.set(hit.k, hit.v);else {
          const maxAge = expiresAt - now; // dont add already expired items
  
          if (maxAge > 0) {
            this.set(hit.k, hit.v, maxAge);
          }
        }
      }
    }
  
    prune() {
      this[CACHE].forEach((value, key) => get(this, key, false));
    }
  
  }
  
  const get = (self, key, doUse) => {
    const node = self[CACHE].get(key);
  
    if (node) {
      const hit = node.value;
  
      if (isStale(self, hit)) {
        del(self, node);
        if (!self[ALLOW_STALE]) return undefined;
      } else {
        if (doUse) {
          if (self[UPDATE_AGE_ON_GET]) node.value.now = Date.now();
          self[LRU_LIST].unshiftNode(node);
        }
      }
  
      return hit.value;
    }
  };
  
  const isStale = (self, hit) => {
    if (!hit || !hit.maxAge && !self[MAX_AGE]) return false;
    const diff = Date.now() - hit.now;
    return hit.maxAge ? diff > hit.maxAge : self[MAX_AGE] && diff > self[MAX_AGE];
  };
  
  const trim = self => {
    if (self[LENGTH] > self[MAX]) {
      for (let walker = self[LRU_LIST].tail; self[LENGTH] > self[MAX] && walker !== null;) {
        // We know that we're about to delete this one, and also
        // what the next least recently used key will be, so just
        // go ahead and set it now.
        const prev = walker.prev;
        del(self, walker);
        walker = prev;
      }
    }
  };
  
  const del = (self, node) => {
    if (node) {
      const hit = node.value;
      if (self[DISPOSE]) self[DISPOSE](hit.key, hit.value);
      self[LENGTH] -= hit.length;
      self[CACHE].delete(hit.key);
      self[LRU_LIST].removeNode(node);
    }
  };
  
  class Entry {
    constructor(key, value, length, now, maxAge) {
      this.key = key;
      this.value = value;
      this.length = length;
      this.now = now;
      this.maxAge = maxAge || 0;
    }
  
  }
  
  const forEachStep = (self, fn, node, thisp) => {
    let hit = node.value;
  
    if (isStale(self, hit)) {
      del(self, node);
      if (!self[ALLOW_STALE]) hit = undefined;
    }
  
    if (hit) fn.call(thisp, hit.value, hit.key, self);
  };
  
  module.exports = LRUCache;
  
  /***/ }),
  /* 19 */
  /***/ (function(module, exports, __webpack_require__) {
  
  "use strict";
  
  
  if (true) {
    module.exports = __webpack_require__(26);
  } else {}
  
  /***/ }),
  /* 20 */
  /***/ (function(module, exports, __webpack_require__) {
  
  "use strict";
  // Do not use imports or top-level requires here!
  // Running module factories is intentionally delayed until we know the hook exists.
  // This is to avoid issues like: https://github.com/facebook/react-devtools/issues/1039
  
  
  let welcomeHasInitialized = false;
  
  function welcome(event) {
    if (event.source !== window || event.data.source !== 'react-devtools-content-script') {
      return;
    } // In some circumstances, this method is called more than once for a single welcome message.
    // The exact circumstances of this are unclear, though it seems related to 3rd party event batching code.
    //
    // Regardless, call this method multiple times can cause DevTools to add duplicate elements to the Store
    // (and throw an error) or worse yet, choke up entirely and freeze the browser.
    //
    // The simplest solution is to ignore the duplicate events.
    // To be clear, this SHOULD NOT BE NECESSARY, since we remove the event handler below.
    //
    // See https://github.com/facebook/react/issues/24162
  
  
    if (welcomeHasInitialized) {
      console.warn('React DevTools detected duplicate welcome "message" events from the content script.');
      return;
    }
  
    welcomeHasInitialized = true;
    window.removeEventListener('message', welcome);
    setup(window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
  }
  
  window.addEventListener('message', welcome);
  window.logMessage('RDT initializing');
  setup(window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
  window.logMessage('RDT setup complete');
  
  function setup(hook) {
    if (hook == null) {
      // DevTools didn't get injected into this page (maybe b'c of the contentType).
      return;
    }
  
    const Agent = __webpack_require__(15).default;
  
    const Bridge = __webpack_require__(12).default;
  
    const {
      initBackend
    } = __webpack_require__(31);
  
    const setupNativeStyleEditor = __webpack_require__(32).default;
  
    const bridge = new Bridge({
      listen(fn) {
        const listener = event => {
          if (event.source !== window || !event.data || event.data.source !== 'react-devtools-content-script' || !event.data.payload) {
            return;
          }
  
          fn(event.data.payload);
        };
  
        window.addEventListener('message', listener);
        return () => {
          window.removeEventListener('message', listener);
        };
      },
  
      send(event, payload, transferable) {
        window.postMessage({
          source: 'react-devtools-bridge',
          payload: {
            event,
            payload
          }
        }, '*', transferable);
      }
  
    });
    const agent = new Agent(bridge);
    agent.addListener('shutdown', () => {
      // If we received 'shutdown' from `agent`, we assume the `bridge` is already shutting down,
      // and that caused the 'shutdown' event on the `agent`, so we don't need to call `bridge.shutdown()` here.
      hook.emit('shutdown');
    });
    initBackend(hook, agent, window); // Let the frontend know that the backend has attached listeners and is ready for messages.
    // This covers the case of syncing saved values after reloading/navigating while DevTools remain open.
  
    bridge.send('extensionBackendInitialized'); // Setup React Native style editor if a renderer like react-native-web has injected it.
  
    if (hook.resolveRNStyle) {
      setupNativeStyleEditor(bridge, agent, hook.resolveRNStyle, hook.nativeStyleEditorValidAttributes);
    }
  }
  
  /***/ }),
  /* 21 */
  /***/ (function(module, exports) {
  
  var g; // This works in non-strict mode
  
  g = function () {
    return this;
  }();
  
  try {
    // This works if eval is allowed (see CSP)
    g = g || new Function("return this")();
  } catch (e) {
    // This works if the window reference is available
    if (typeof window === "object") g = window;
  } // g can still be undefined, but nothing to do about it...
  // We return undefined, instead of nothing here, so it's
  // easier to handle this case. if(!global) { ...}
  
  
  module.exports = g;
  
  /***/ }),
  /* 22 */
  /***/ (function(module, exports) {
  
  // shim for using process in browser
  var process = module.exports = {}; // cached from whatever global is present so that test runners that stub it
  // don't break things.  But we need to wrap it in a try catch in case it is
  // wrapped in strict mode code which doesn't define any globals.  It's inside a
  // function because try/catches deoptimize in certain engines.
  
  var cachedSetTimeout;
  var cachedClearTimeout;
  
  function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
  }
  
  function defaultClearTimeout() {
    throw new Error('clearTimeout has not been defined');
  }
  
  (function () {
    try {
      if (typeof setTimeout === 'function') {
        cachedSetTimeout = setTimeout;
      } else {
        cachedSetTimeout = defaultSetTimout;
      }
    } catch (e) {
      cachedSetTimeout = defaultSetTimout;
    }
  
    try {
      if (typeof clearTimeout === 'function') {
        cachedClearTimeout = clearTimeout;
      } else {
        cachedClearTimeout = defaultClearTimeout;
      }
    } catch (e) {
      cachedClearTimeout = defaultClearTimeout;
    }
  })();
  
  function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
      //normal enviroments in sane situations
      return setTimeout(fun, 0);
    } // if setTimeout wasn't available but was latter defined
  
  
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
      cachedSetTimeout = setTimeout;
      return setTimeout(fun, 0);
    }
  
    try {
      // when when somebody has screwed with setTimeout but no I.E. maddness
      return cachedSetTimeout(fun, 0);
    } catch (e) {
      try {
        // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
        return cachedSetTimeout.call(null, fun, 0);
      } catch (e) {
        // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
        return cachedSetTimeout.call(this, fun, 0);
      }
    }
  }
  
  function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
      //normal enviroments in sane situations
      return clearTimeout(marker);
    } // if clearTimeout wasn't available but was latter defined
  
  
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
      cachedClearTimeout = clearTimeout;
      return clearTimeout(marker);
    }
  
    try {
      // when when somebody has screwed with setTimeout but no I.E. maddness
      return cachedClearTimeout(marker);
    } catch (e) {
      try {
        // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
        return cachedClearTimeout.call(null, marker);
      } catch (e) {
        // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
        // Some versions of I.E. have different rules for clearTimeout vs setTimeout
        return cachedClearTimeout.call(this, marker);
      }
    }
  }
  
  var queue = [];
  var draining = false;
  var currentQueue;
  var queueIndex = -1;
  
  function cleanUpNextTick() {
    if (!draining || !currentQueue) {
      return;
    }
  
    draining = false;
  
    if (currentQueue.length) {
      queue = currentQueue.concat(queue);
    } else {
      queueIndex = -1;
    }
  
    if (queue.length) {
      drainQueue();
    }
  }
  
  function drainQueue() {
    if (draining) {
      return;
    }
  
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;
    var len = queue.length;
  
    while (len) {
      currentQueue = queue;
      queue = [];
  
      while (++queueIndex < len) {
        if (currentQueue) {
          currentQueue[queueIndex].run();
        }
      }
  
      queueIndex = -1;
      len = queue.length;
    }
  
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
  }
  
  process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
  
    if (arguments.length > 1) {
      for (var i = 1; i < arguments.length; i++) {
        args[i - 1] = arguments[i];
      }
    }
  
    queue.push(new Item(fun, args));
  
    if (queue.length === 1 && !draining) {
      runTimeout(drainQueue);
    }
  }; // v8 likes predictible objects
  
  
  function Item(fun, array) {
    this.fun = fun;
    this.array = array;
  }
  
  Item.prototype.run = function () {
    this.fun.apply(null, this.array);
  };
  
  process.title = 'browser';
  process.browser = true;
  process.env = {};
  process.argv = [];
  process.version = ''; // empty string to avoid regexp issues
  
  process.versions = {};
  
  function noop() {}
  
  process.on = noop;
  process.addListener = noop;
  process.once = noop;
  process.off = noop;
  process.removeListener = noop;
  process.removeAllListeners = noop;
  process.emit = noop;
  process.prependListener = noop;
  process.prependOnceListener = noop;
  
  process.listeners = function (name) {
    return [];
  };
  
  process.binding = function (name) {
    throw new Error('process.binding is not supported');
  };
  
  process.cwd = function () {
    return '/';
  };
  
  process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
  };
  
  process.umask = function () {
    return 0;
  };
  
  /***/ }),
  /* 23 */
  /***/ (function(module, exports, __webpack_require__) {
  
  "use strict";
  
  
  module.exports = Yallist;
  Yallist.Node = Node;
  Yallist.create = Yallist;
  
  function Yallist(list) {
    var self = this;
  
    if (!(self instanceof Yallist)) {
      self = new Yallist();
    }
  
    self.tail = null;
    self.head = null;
    self.length = 0;
  
    if (list && typeof list.forEach === 'function') {
      list.forEach(function (item) {
        self.push(item);
      });
    } else if (arguments.length > 0) {
      for (var i = 0, l = arguments.length; i < l; i++) {
        self.push(arguments[i]);
      }
    }
  
    return self;
  }
  
  Yallist.prototype.removeNode = function (node) {
    if (node.list !== this) {
      throw new Error('removing node which does not belong to this list');
    }
  
    var next = node.next;
    var prev = node.prev;
  
    if (next) {
      next.prev = prev;
    }
  
    if (prev) {
      prev.next = next;
    }
  
    if (node === this.head) {
      this.head = next;
    }
  
    if (node === this.tail) {
      this.tail = prev;
    }
  
    node.list.length--;
    node.next = null;
    node.prev = null;
    node.list = null;
    return next;
  };
  
  Yallist.prototype.unshiftNode = function (node) {
    if (node === this.head) {
      return;
    }
  
    if (node.list) {
      node.list.removeNode(node);
    }
  
    var head = this.head;
    node.list = this;
    node.next = head;
  
    if (head) {
      head.prev = node;
    }
  
    this.head = node;
  
    if (!this.tail) {
      this.tail = node;
    }
  
    this.length++;
  };
  
  Yallist.prototype.pushNode = function (node) {
    if (node === this.tail) {
      return;
    }
  
    if (node.list) {
      node.list.removeNode(node);
    }
  
    var tail = this.tail;
    node.list = this;
    node.prev = tail;
  
    if (tail) {
      tail.next = node;
    }
  
    this.tail = node;
  
    if (!this.head) {
      this.head = node;
    }
  
    this.length++;
  };
  
  Yallist.prototype.push = function () {
    for (var i = 0, l = arguments.length; i < l; i++) {
      push(this, arguments[i]);
    }
  
    return this.length;
  };
  
  Yallist.prototype.unshift = function () {
    for (var i = 0, l = arguments.length; i < l; i++) {
      unshift(this, arguments[i]);
    }
  
    return this.length;
  };
  
  Yallist.prototype.pop = function () {
    if (!this.tail) {
      return undefined;
    }
  
    var res = this.tail.value;
    this.tail = this.tail.prev;
  
    if (this.tail) {
      this.tail.next = null;
    } else {
      this.head = null;
    }
  
    this.length--;
    return res;
  };
  
  Yallist.prototype.shift = function () {
    if (!this.head) {
      return undefined;
    }
  
    var res = this.head.value;
    this.head = this.head.next;
  
    if (this.head) {
      this.head.prev = null;
    } else {
      this.tail = null;
    }
  
    this.length--;
    return res;
  };
  
  Yallist.prototype.forEach = function (fn, thisp) {
    thisp = thisp || this;
  
    for (var walker = this.head, i = 0; walker !== null; i++) {
      fn.call(thisp, walker.value, i, this);
      walker = walker.next;
    }
  };
  
  Yallist.prototype.forEachReverse = function (fn, thisp) {
    thisp = thisp || this;
  
    for (var walker = this.tail, i = this.length - 1; walker !== null; i--) {
      fn.call(thisp, walker.value, i, this);
      walker = walker.prev;
    }
  };
  
  Yallist.prototype.get = function (n) {
    for (var i = 0, walker = this.head; walker !== null && i < n; i++) {
      // abort out of the list early if we hit a cycle
      walker = walker.next;
    }
  
    if (i === n && walker !== null) {
      return walker.value;
    }
  };
  
  Yallist.prototype.getReverse = function (n) {
    for (var i = 0, walker = this.tail; walker !== null && i < n; i++) {
      // abort out of the list early if we hit a cycle
      walker = walker.prev;
    }
  
    if (i === n && walker !== null) {
      return walker.value;
    }
  };
  
  Yallist.prototype.map = function (fn, thisp) {
    thisp = thisp || this;
    var res = new Yallist();
  
    for (var walker = this.head; walker !== null;) {
      res.push(fn.call(thisp, walker.value, this));
      walker = walker.next;
    }
  
    return res;
  };
  
  Yallist.prototype.mapReverse = function (fn, thisp) {
    thisp = thisp || this;
    var res = new Yallist();
  
    for (var walker = this.tail; walker !== null;) {
      res.push(fn.call(thisp, walker.value, this));
      walker = walker.prev;
    }
  
    return res;
  };
  
  Yallist.prototype.reduce = function (fn, initial) {
    var acc;
    var walker = this.head;
  
    if (arguments.length > 1) {
      acc = initial;
    } else if (this.head) {
      walker = this.head.next;
      acc = this.head.value;
    } else {
      throw new TypeError('Reduce of empty list with no initial value');
    }
  
    for (var i = 0; walker !== null; i++) {
      acc = fn(acc, walker.value, i);
      walker = walker.next;
    }
  
    return acc;
  };
  
  Yallist.prototype.reduceReverse = function (fn, initial) {
    var acc;
    var walker = this.tail;
  
    if (arguments.length > 1) {
      acc = initial;
    } else if (this.tail) {
      walker = this.tail.prev;
      acc = this.tail.value;
    } else {
      throw new TypeError('Reduce of empty list with no initial value');
    }
  
    for (var i = this.length - 1; walker !== null; i--) {
      acc = fn(acc, walker.value, i);
      walker = walker.prev;
    }
  
    return acc;
  };
  
  Yallist.prototype.toArray = function () {
    var arr = new Array(this.length);
  
    for (var i = 0, walker = this.head; walker !== null; i++) {
      arr[i] = walker.value;
      walker = walker.next;
    }
  
    return arr;
  };
  
  Yallist.prototype.toArrayReverse = function () {
    var arr = new Array(this.length);
  
    for (var i = 0, walker = this.tail; walker !== null; i++) {
      arr[i] = walker.value;
      walker = walker.prev;
    }
  
    return arr;
  };
  
  Yallist.prototype.slice = function (from, to) {
    to = to || this.length;
  
    if (to < 0) {
      to += this.length;
    }
  
    from = from || 0;
  
    if (from < 0) {
      from += this.length;
    }
  
    var ret = new Yallist();
  
    if (to < from || to < 0) {
      return ret;
    }
  
    if (from < 0) {
      from = 0;
    }
  
    if (to > this.length) {
      to = this.length;
    }
  
    for (var i = 0, walker = this.head; walker !== null && i < from; i++) {
      walker = walker.next;
    }
  
    for (; walker !== null && i < to; i++, walker = walker.next) {
      ret.push(walker.value);
    }
  
    return ret;
  };
  
  Yallist.prototype.sliceReverse = function (from, to) {
    to = to || this.length;
  
    if (to < 0) {
      to += this.length;
    }
  
    from = from || 0;
  
    if (from < 0) {
      from += this.length;
    }
  
    var ret = new Yallist();
  
    if (to < from || to < 0) {
      return ret;
    }
  
    if (from < 0) {
      from = 0;
    }
  
    if (to > this.length) {
      to = this.length;
    }
  
    for (var i = this.length, walker = this.tail; walker !== null && i > to; i--) {
      walker = walker.prev;
    }
  
    for (; walker !== null && i > from; i--, walker = walker.prev) {
      ret.push(walker.value);
    }
  
    return ret;
  };
  
  Yallist.prototype.splice = function (start, deleteCount
  /*, ...nodes */
  ) {
    if (start > this.length) {
      start = this.length - 1;
    }
  
    if (start < 0) {
      start = this.length + start;
    }
  
    for (var i = 0, walker = this.head; walker !== null && i < start; i++) {
      walker = walker.next;
    }
  
    var ret = [];
  
    for (var i = 0; walker && i < deleteCount; i++) {
      ret.push(walker.value);
      walker = this.removeNode(walker);
    }
  
    if (walker === null) {
      walker = this.tail;
    }
  
    if (walker !== this.head && walker !== this.tail) {
      walker = walker.prev;
    }
  
    for (var i = 2; i < arguments.length; i++) {
      walker = insert(this, walker, arguments[i]);
    }
  
    return ret;
  };
  
  Yallist.prototype.reverse = function () {
    var head = this.head;
    var tail = this.tail;
  
    for (var walker = head; walker !== null; walker = walker.prev) {
      var p = walker.prev;
      walker.prev = walker.next;
      walker.next = p;
    }
  
    this.head = tail;
    this.tail = head;
    return this;
  };
  
  function insert(self, node, value) {
    var inserted = node === self.head ? new Node(value, null, node, self) : new Node(value, node, node.next, self);
  
    if (inserted.next === null) {
      self.tail = inserted;
    }
  
    if (inserted.prev === null) {
      self.head = inserted;
    }
  
    self.length++;
    return inserted;
  }
  
  function push(self, item) {
    self.tail = new Node(item, self.tail, null, self);
  
    if (!self.head) {
      self.head = self.tail;
    }
  
    self.length++;
  }
  
  function unshift(self, item) {
    self.head = new Node(item, null, self.head, self);
  
    if (!self.tail) {
      self.tail = self.head;
    }
  
    self.length++;
  }
  
  function Node(value, prev, next, list) {
    if (!(this instanceof Node)) {
      return new Node(value, prev, next, list);
    }
  
    this.list = list;
    this.value = value;
  
    if (prev) {
      prev.next = this;
      this.prev = prev;
    } else {
      this.prev = null;
    }
  
    if (next) {
      next.prev = this;
      this.next = next;
    } else {
      this.next = null;
    }
  }
  
  try {
    // add if support for Symbol.iterator is present
    __webpack_require__(24)(Yallist);
  } catch (er) {}
  
  /***/ }),
  /* 24 */
  /***/ (function(module, exports, __webpack_require__) {
  
  "use strict";
  
  
  module.exports = function (Yallist) {
    Yallist.prototype[Symbol.iterator] = function* () {
      for (let walker = this.head; walker; walker = walker.next) {
        yield walker.value;
      }
    };
  };
  
  /***/ }),
  /* 25 */
  /***/ (function(module, exports, __webpack_require__) {
  
  "use strict";
  /**
   * @license React
   * react-is.production.min.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */
  
  
  var b = Symbol.for("react.element"),
      c = Symbol.for("react.portal"),
      d = Symbol.for("react.fragment"),
      e = Symbol.for("react.strict_mode"),
      f = Symbol.for("react.profiler"),
      g = Symbol.for("react.provider"),
      h = Symbol.for("react.context"),
      k = Symbol.for("react.server_context"),
      l = Symbol.for("react.forward_ref"),
      m = Symbol.for("react.suspense"),
      n = Symbol.for("react.suspense_list"),
      p = Symbol.for("react.memo"),
      q = Symbol.for("react.lazy"),
      t = Symbol.for("react.offscreen"),
      u = Symbol.for("react.cache"),
      v = Symbol.for("react.module.reference");
  
  function w(a) {
    if ("object" === typeof a && null !== a) {
      var r = a.$$typeof;
  
      switch (r) {
        case b:
          switch (a = a.type, a) {
            case d:
            case f:
            case e:
            case m:
            case n:
              return a;
  
            default:
              switch (a = a && a.$$typeof, a) {
                case k:
                case h:
                case l:
                case q:
                case p:
                case g:
                  return a;
  
                default:
                  return r;
              }
  
          }
  
        case c:
          return r;
      }
    }
  }
  
  exports.ContextConsumer = h;
  exports.ContextProvider = g;
  exports.Element = b;
  exports.ForwardRef = l;
  exports.Fragment = d;
  exports.Lazy = q;
  exports.Memo = p;
  exports.Portal = c;
  exports.Profiler = f;
  exports.StrictMode = e;
  exports.Suspense = m;
  exports.SuspenseList = n;
  
  exports.isAsyncMode = function () {
    return !1;
  };
  
  exports.isConcurrentMode = function () {
    return !1;
  };
  
  exports.isContextConsumer = function (a) {
    return w(a) === h;
  };
  
  exports.isContextProvider = function (a) {
    return w(a) === g;
  };
  
  exports.isElement = function (a) {
    return "object" === typeof a && null !== a && a.$$typeof === b;
  };
  
  exports.isForwardRef = function (a) {
    return w(a) === l;
  };
  
  exports.isFragment = function (a) {
    return w(a) === d;
  };
  
  exports.isLazy = function (a) {
    return w(a) === q;
  };
  
  exports.isMemo = function (a) {
    return w(a) === p;
  };
  
  exports.isPortal = function (a) {
    return w(a) === c;
  };
  
  exports.isProfiler = function (a) {
    return w(a) === f;
  };
  
  exports.isStrictMode = function (a) {
    return w(a) === e;
  };
  
  exports.isSuspense = function (a) {
    return w(a) === m;
  };
  
  exports.isSuspenseList = function (a) {
    return w(a) === n;
  };
  
  exports.isValidElementType = function (a) {
    return "string" === typeof a || "function" === typeof a || a === d || a === f || a === e || a === m || a === n || a === t || a === u || "object" === typeof a && null !== a && (a.$$typeof === q || a.$$typeof === p || a.$$typeof === g || a.$$typeof === h || a.$$typeof === l || a.$$typeof === v || void 0 !== a.getModuleId) ? !0 : !1;
  };
  
  exports.typeOf = w;
  
  /***/ }),
  /* 26 */
  /***/ (function(module, exports, __webpack_require__) {
  
  "use strict";
  /**
   * @license React
   * react-debug-tools.production.min.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */
  
  
  var h = __webpack_require__(27),
      p = __webpack_require__(29),
      q = Object.assign,
      w = p.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
      x = [],
      y = null;
  
  function z() {
    if (null === y) {
      var a = new Map();
  
      try {
        A.useContext({
          _currentValue: null
        }), A.useState(null), A.useReducer(function (a) {
          return a;
        }, null), A.useRef(null), "function" === typeof A.useCacheRefresh && A.useCacheRefresh(), A.useLayoutEffect(function () {}), A.useInsertionEffect(function () {}), A.useEffect(function () {}), A.useImperativeHandle(void 0, function () {
          return null;
        }), A.useDebugValue(null), A.useCallback(function () {}), A.useMemo(function () {
          return null;
        });
      } finally {
        var b = x;
        x = [];
      }
  
      for (var e = 0; e < b.length; e++) {
        var g = b[e];
        a.set(g.primitive, h.parse(g.stackError));
      }
  
      y = a;
    }
  
    return y;
  }
  
  var B = null;
  
  function C() {
    var a = B;
    null !== a && (B = a.next);
    return a;
  }
  
  var A = {
    readContext: function (a) {
      return a._currentValue;
    },
    useCacheRefresh: function () {
      var a = C();
      x.push({
        primitive: "CacheRefresh",
        stackError: Error(),
        value: null !== a ? a.memoizedState : function () {}
      });
      return function () {};
    },
    useCallback: function (a) {
      var b = C();
      x.push({
        primitive: "Callback",
        stackError: Error(),
        value: null !== b ? b.memoizedState[0] : a
      });
      return a;
    },
    useContext: function (a) {
      x.push({
        primitive: "Context",
        stackError: Error(),
        value: a._currentValue
      });
      return a._currentValue;
    },
    useEffect: function (a) {
      C();
      x.push({
        primitive: "Effect",
        stackError: Error(),
        value: a
      });
    },
    useImperativeHandle: function (a) {
      C();
      var b = void 0;
      null !== a && "object" === typeof a && (b = a.current);
      x.push({
        primitive: "ImperativeHandle",
        stackError: Error(),
        value: b
      });
    },
    useDebugValue: function (a, b) {
      x.push({
        primitive: "DebugValue",
        stackError: Error(),
        value: "function" === typeof b ? b(a) : a
      });
    },
    useLayoutEffect: function (a) {
      C();
      x.push({
        primitive: "LayoutEffect",
        stackError: Error(),
        value: a
      });
    },
    useInsertionEffect: function (a) {
      C();
      x.push({
        primitive: "InsertionEffect",
        stackError: Error(),
        value: a
      });
    },
    useMemo: function (a) {
      var b = C();
      a = null !== b ? b.memoizedState[0] : a();
      x.push({
        primitive: "Memo",
        stackError: Error(),
        value: a
      });
      return a;
    },
    useReducer: function (a, b, e) {
      a = C();
      b = null !== a ? a.memoizedState : void 0 !== e ? e(b) : b;
      x.push({
        primitive: "Reducer",
        stackError: Error(),
        value: b
      });
      return [b, function () {}];
    },
    useRef: function (a) {
      var b = C();
      a = null !== b ? b.memoizedState : {
        current: a
      };
      x.push({
        primitive: "Ref",
        stackError: Error(),
        value: a.current
      });
      return a;
    },
    useState: function (a) {
      var b = C();
      a = null !== b ? b.memoizedState : "function" === typeof a ? a() : a;
      x.push({
        primitive: "State",
        stackError: Error(),
        value: a
      });
      return [a, function () {}];
    },
    useTransition: function () {
      C();
      C();
      x.push({
        primitive: "Transition",
        stackError: Error(),
        value: void 0
      });
      return [!1, function () {}];
    },
    useMutableSource: function (a, b) {
      C();
      C();
      C();
      C();
      a = b(a._source);
      x.push({
        primitive: "MutableSource",
        stackError: Error(),
        value: a
      });
      return a;
    },
    useSyncExternalStore: function (a, b) {
      C();
      C();
      a = b();
      x.push({
        primitive: "SyncExternalStore",
        stackError: Error(),
        value: a
      });
      return a;
    },
    useDeferredValue: function (a) {
      var b = C();
      x.push({
        primitive: "DeferredValue",
        stackError: Error(),
        value: null !== b ? b.memoizedState : a
      });
      return a;
    },
    useId: function () {
      var a = C();
      a = null !== a ? a.memoizedState : "";
      x.push({
        primitive: "Id",
        stackError: Error(),
        value: a
      });
      return a;
    }
  },
      D = {
    get: function (a, b) {
      if (a.hasOwnProperty(b)) return a[b];
      a = Error("Missing method in Dispatcher: " + b);
      a.name = "ReactDebugToolsUnsupportedHookError";
      throw a;
    }
  },
      E = "undefined" === typeof Proxy ? A : new Proxy(A, D),
      F = 0;
  
  function G(a, b, e) {
    var g = b[e].source,
        c = 0;
  
    a: for (; c < a.length; c++) if (a[c].source === g) {
      for (var l = e + 1, r = c + 1; l < b.length && r < a.length; l++, r++) if (a[r].source !== b[l].source) continue a;
  
      return c;
    }
  
    return -1;
  }
  
  function H(a, b) {
    if (!a) return !1;
    b = "use" + b;
    return a.length < b.length ? !1 : a.lastIndexOf(b) === a.length - b.length;
  }
  
  function I(a, b, e) {
    for (var g = [], c = null, l = g, r = 0, t = [], v = 0; v < b.length; v++) {
      var u = b[v];
      var d = a;
      var k = h.parse(u.stackError);
  
      b: {
        var m = k,
            n = G(m, d, F);
        if (-1 !== n) d = n;else {
          for (var f = 0; f < d.length && 5 > f; f++) if (n = G(m, d, f), -1 !== n) {
            F = f;
            d = n;
            break b;
          }
  
          d = -1;
        }
      }
  
      b: {
        m = k;
        n = z().get(u.primitive);
        if (void 0 !== n) for (f = 0; f < n.length && f < m.length; f++) if (n[f].source !== m[f].source) {
          f < m.length - 1 && H(m[f].functionName, u.primitive) && f++;
          f < m.length - 1 && H(m[f].functionName, u.primitive) && f++;
          m = f;
          break b;
        }
        m = -1;
      }
  
      k = -1 === d || -1 === m || 2 > d - m ? null : k.slice(m, d - 1);
  
      if (null !== k) {
        d = 0;
  
        if (null !== c) {
          for (; d < k.length && d < c.length && k[k.length - d - 1].source === c[c.length - d - 1].source;) d++;
  
          for (c = c.length - 1; c > d; c--) l = t.pop();
        }
  
        for (c = k.length - d - 1; 1 <= c; c--) d = [], m = k[c], (n = k[c - 1].functionName) ? (f = n.lastIndexOf("."), -1 === f && (f = 0), "use" === n.substr(f, 3) && (f += 3), n = n.substr(f)) : n = "", n = {
          id: null,
          isStateEditable: !1,
          name: n,
          value: void 0,
          subHooks: d
        }, e && (n.hookSource = {
          lineNumber: m.lineNumber,
          columnNumber: m.columnNumber,
          functionName: m.functionName,
          fileName: m.fileName
        }), l.push(n), t.push(l), l = d;
  
        c = k;
      }
  
      d = u.primitive;
      u = {
        id: "Context" === d || "DebugValue" === d ? null : r++,
        isStateEditable: "Reducer" === d || "State" === d,
        name: d,
        value: u.value,
        subHooks: []
      };
      e && (d = {
        lineNumber: null,
        functionName: null,
        fileName: null,
        columnNumber: null
      }, k && 1 <= k.length && (k = k[0], d.lineNumber = k.lineNumber, d.functionName = k.functionName, d.fileName = k.fileName, d.columnNumber = k.columnNumber), u.hookSource = d);
      l.push(u);
    }
  
    J(g, null);
    return g;
  }
  
  function J(a, b) {
    for (var e = [], g = 0; g < a.length; g++) {
      var c = a[g];
      "DebugValue" === c.name && 0 === c.subHooks.length ? (a.splice(g, 1), g--, e.push(c)) : J(c.subHooks, c);
    }
  
    null !== b && (1 === e.length ? b.value = e[0].value : 1 < e.length && (b.value = e.map(function (a) {
      return a.value;
    })));
  }
  
  function K(a) {
    if (a instanceof Error && "ReactDebugToolsUnsupportedHookError" === a.name) throw a;
    var b = Error("Error rendering inspected component", {
      cause: a
    });
    b.name = "ReactDebugToolsRenderError";
    b.cause = a;
    throw b;
  }
  
  function L(a, b, e) {
    var g = 3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : !1;
    null == e && (e = w.ReactCurrentDispatcher);
    var c = e.current;
    e.current = E;
  
    try {
      var l = Error();
      a(b);
    } catch (t) {
      K(t);
    } finally {
      var r = x;
      x = [];
      e.current = c;
    }
  
    c = h.parse(l);
    return I(c, r, g);
  }
  
  function M(a) {
    a.forEach(function (a, e) {
      return e._currentValue = a;
    });
  }
  
  exports.inspectHooks = L;
  
  exports.inspectHooksOfFiber = function (a, b) {
    var e = 2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : !1;
    null == b && (b = w.ReactCurrentDispatcher);
    if (0 !== a.tag && 15 !== a.tag && 11 !== a.tag) throw Error("Unknown Fiber. Needs to be a function component to inspect hooks.");
    z();
    var g = a.type,
        c = a.memoizedProps;
  
    if (g !== a.elementType && g && g.defaultProps) {
      c = q({}, c);
      var l = g.defaultProps;
  
      for (r in l) void 0 === c[r] && (c[r] = l[r]);
    }
  
    B = a.memoizedState;
    var r = new Map();
  
    try {
      for (l = a; l;) {
        if (10 === l.tag) {
          var t = l.type._context;
          r.has(t) || (r.set(t, t._currentValue), t._currentValue = l.memoizedProps.value);
        }
  
        l = l.return;
      }
  
      if (11 === a.tag) {
        var v = g.render;
        g = c;
        var u = a.ref;
        t = b;
        var d = t.current;
        t.current = E;
  
        try {
          var k = Error();
          v(g, u);
        } catch (f) {
          K(f);
        } finally {
          var m = x;
          x = [];
          t.current = d;
        }
  
        var n = h.parse(k);
        return I(n, m, e);
      }
  
      return L(g, c, b, e);
    } finally {
      B = null, M(r);
    }
  };
  
  /***/ }),
  /* 27 */
  /***/ (function(module, exports, __webpack_require__) {
  
  var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (root, factory) {
    'use strict'; // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.
  
    /* istanbul ignore next */
  
    if (true) {
      !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(28)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
          __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
          (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
          __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
    } else {}
  })(this, function ErrorStackParser(StackFrame) {
    'use strict';
  
    var FIREFOX_SAFARI_STACK_REGEXP = /(^|@)\S+:\d+/;
    var CHROME_IE_STACK_REGEXP = /^\s*at .*(\S+:\d+|\(native\))/m;
    var SAFARI_NATIVE_CODE_REGEXP = /^(eval@)?(\[native code])?$/;
    return {
      /**
       * Given an Error object, extract the most information from it.
       *
       * @param {Error} error object
       * @return {Array} of StackFrames
       */
      parse: function ErrorStackParser$$parse(error) {
        if (typeof error.stacktrace !== 'undefined' || typeof error['opera#sourceloc'] !== 'undefined') {
          return this.parseOpera(error);
        } else if (error.stack && error.stack.match(CHROME_IE_STACK_REGEXP)) {
          return this.parseV8OrIE(error);
        } else if (error.stack) {
          return this.parseFFOrSafari(error);
        } else {
          throw new Error('Cannot parse given Error object');
        }
      },
      // Separate line and column numbers from a string of the form: (URI:Line:Column)
      extractLocation: function ErrorStackParser$$extractLocation(urlLike) {
        // Fail-fast but return locations like "(native)"
        if (urlLike.indexOf(':') === -1) {
          return [urlLike];
        }
  
        var regExp = /(.+?)(?::(\d+))?(?::(\d+))?$/;
        var parts = regExp.exec(urlLike.replace(/[()]/g, ''));
        return [parts[1], parts[2] || undefined, parts[3] || undefined];
      },
      parseV8OrIE: function ErrorStackParser$$parseV8OrIE(error) {
        var filtered = error.stack.split('\n').filter(function (line) {
          return !!line.match(CHROME_IE_STACK_REGEXP);
        }, this);
        return filtered.map(function (line) {
          if (line.indexOf('(eval ') > -1) {
            // Throw away eval information until we implement stacktrace.js/stackframe#8
            line = line.replace(/eval code/g, 'eval').replace(/(\(eval at [^()]*)|(\),.*$)/g, '');
          }
  
          var sanitizedLine = line.replace(/^\s+/, '').replace(/\(eval code/g, '('); // capture and preseve the parenthesized location "(/foo/my bar.js:12:87)" in
          // case it has spaces in it, as the string is split on \s+ later on
  
          var location = sanitizedLine.match(/ (\((.+):(\d+):(\d+)\)$)/); // remove the parenthesized location from the line, if it was matched
  
          sanitizedLine = location ? sanitizedLine.replace(location[0], '') : sanitizedLine;
          var tokens = sanitizedLine.split(/\s+/).slice(1); // if a location was matched, pass it to extractLocation() otherwise pop the last token
  
          var locationParts = this.extractLocation(location ? location[1] : tokens.pop());
          var functionName = tokens.join(' ') || undefined;
          var fileName = ['eval', '<anonymous>'].indexOf(locationParts[0]) > -1 ? undefined : locationParts[0];
          return new StackFrame({
            functionName: functionName,
            fileName: fileName,
            lineNumber: locationParts[1],
            columnNumber: locationParts[2],
            source: line
          });
        }, this);
      },
      parseFFOrSafari: function ErrorStackParser$$parseFFOrSafari(error) {
        var filtered = error.stack.split('\n').filter(function (line) {
          return !line.match(SAFARI_NATIVE_CODE_REGEXP);
        }, this);
        return filtered.map(function (line) {
          // Throw away eval information until we implement stacktrace.js/stackframe#8
          if (line.indexOf(' > eval') > -1) {
            line = line.replace(/ line (\d+)(?: > eval line \d+)* > eval:\d+:\d+/g, ':$1');
          }
  
          if (line.indexOf('@') === -1 && line.indexOf(':') === -1) {
            // Safari eval frames only have function names and nothing else
            return new StackFrame({
              functionName: line
            });
          } else {
            var functionNameRegex = /((.*".+"[^@]*)?[^@]*)(?:@)/;
            var matches = line.match(functionNameRegex);
            var functionName = matches && matches[1] ? matches[1] : undefined;
            var locationParts = this.extractLocation(line.replace(functionNameRegex, ''));
            return new StackFrame({
              functionName: functionName,
              fileName: locationParts[0],
              lineNumber: locationParts[1],
              columnNumber: locationParts[2],
              source: line
            });
          }
        }, this);
      },
      parseOpera: function ErrorStackParser$$parseOpera(e) {
        if (!e.stacktrace || e.message.indexOf('\n') > -1 && e.message.split('\n').length > e.stacktrace.split('\n').length) {
          return this.parseOpera9(e);
        } else if (!e.stack) {
          return this.parseOpera10(e);
        } else {
          return this.parseOpera11(e);
        }
      },
      parseOpera9: function ErrorStackParser$$parseOpera9(e) {
        var lineRE = /Line (\d+).*script (?:in )?(\S+)/i;
        var lines = e.message.split('\n');
        var result = [];
  
        for (var i = 2, len = lines.length; i < len; i += 2) {
          var match = lineRE.exec(lines[i]);
  
          if (match) {
            result.push(new StackFrame({
              fileName: match[2],
              lineNumber: match[1],
              source: lines[i]
            }));
          }
        }
  
        return result;
      },
      parseOpera10: function ErrorStackParser$$parseOpera10(e) {
        var lineRE = /Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i;
        var lines = e.stacktrace.split('\n');
        var result = [];
  
        for (var i = 0, len = lines.length; i < len; i += 2) {
          var match = lineRE.exec(lines[i]);
  
          if (match) {
            result.push(new StackFrame({
              functionName: match[3] || undefined,
              fileName: match[2],
              lineNumber: match[1],
              source: lines[i]
            }));
          }
        }
  
        return result;
      },
      // Opera 10.65+ Error.stack very similar to FF/Safari
      parseOpera11: function ErrorStackParser$$parseOpera11(error) {
        var filtered = error.stack.split('\n').filter(function (line) {
          return !!line.match(FIREFOX_SAFARI_STACK_REGEXP) && !line.match(/^Error created at/);
        }, this);
        return filtered.map(function (line) {
          var tokens = line.split('@');
          var locationParts = this.extractLocation(tokens.pop());
          var functionCall = tokens.shift() || '';
          var functionName = functionCall.replace(/<anonymous function(: (\w+))?>/, '$2').replace(/\([^)]*\)/g, '') || undefined;
          var argsRaw;
  
          if (functionCall.match(/\(([^)]*)\)/)) {
            argsRaw = functionCall.replace(/^[^(]+\(([^)]*)\)$/, '$1');
          }
  
          var args = argsRaw === undefined || argsRaw === '[arguments not available]' ? undefined : argsRaw.split(',');
          return new StackFrame({
            functionName: functionName,
            args: args,
            fileName: locationParts[0],
            lineNumber: locationParts[1],
            columnNumber: locationParts[2],
            source: line
          });
        }, this);
      }
    };
  });
  
  /***/ }),
  /* 28 */
  /***/ (function(module, exports, __webpack_require__) {
  
  var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (root, factory) {
    'use strict'; // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.
  
    /* istanbul ignore next */
  
    if (true) {
      !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
          __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
          (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
          __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
    } else {}
  })(this, function () {
    'use strict';
  
    function _isNumber(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    }
  
    function _capitalize(str) {
      return str.charAt(0).toUpperCase() + str.substring(1);
    }
  
    function _getter(p) {
      return function () {
        return this[p];
      };
    }
  
    var booleanProps = ['isConstructor', 'isEval', 'isNative', 'isToplevel'];
    var numericProps = ['columnNumber', 'lineNumber'];
    var stringProps = ['fileName', 'functionName', 'source'];
    var arrayProps = ['args'];
    var props = booleanProps.concat(numericProps, stringProps, arrayProps);
  
    function StackFrame(obj) {
      if (!obj) return;
  
      for (var i = 0; i < props.length; i++) {
        if (obj[props[i]] !== undefined) {
          this['set' + _capitalize(props[i])](obj[props[i]]);
        }
      }
    }
  
    StackFrame.prototype = {
      getArgs: function () {
        return this.args;
      },
      setArgs: function (v) {
        if (Object.prototype.toString.call(v) !== '[object Array]') {
          throw new TypeError('Args must be an Array');
        }
  
        this.args = v;
      },
      getEvalOrigin: function () {
        return this.evalOrigin;
      },
      setEvalOrigin: function (v) {
        if (v instanceof StackFrame) {
          this.evalOrigin = v;
        } else if (v instanceof Object) {
          this.evalOrigin = new StackFrame(v);
        } else {
          throw new TypeError('Eval Origin must be an Object or StackFrame');
        }
      },
      toString: function () {
        var fileName = this.getFileName() || '';
        var lineNumber = this.getLineNumber() || '';
        var columnNumber = this.getColumnNumber() || '';
        var functionName = this.getFunctionName() || '';
  
        if (this.getIsEval()) {
          if (fileName) {
            return '[eval] (' + fileName + ':' + lineNumber + ':' + columnNumber + ')';
          }
  
          return '[eval]:' + lineNumber + ':' + columnNumber;
        }
  
        if (functionName) {
          return functionName + ' (' + fileName + ':' + lineNumber + ':' + columnNumber + ')';
        }
  
        return fileName + ':' + lineNumber + ':' + columnNumber;
      }
    };
  
    StackFrame.fromString = function StackFrame$$fromString(str) {
      var argsStartIndex = str.indexOf('(');
      var argsEndIndex = str.lastIndexOf(')');
      var functionName = str.substring(0, argsStartIndex);
      var args = str.substring(argsStartIndex + 1, argsEndIndex).split(',');
      var locationString = str.substring(argsEndIndex + 1);
  
      if (locationString.indexOf('@') === 0) {
        var parts = /@(.+?)(?::(\d+))?(?::(\d+))?$/.exec(locationString, '');
        var fileName = parts[1];
        var lineNumber = parts[2];
        var columnNumber = parts[3];
      }
  
      return new StackFrame({
        functionName: functionName,
        args: args || undefined,
        fileName: fileName,
        lineNumber: lineNumber || undefined,
        columnNumber: columnNumber || undefined
      });
    };
  
    for (var i = 0; i < booleanProps.length; i++) {
      StackFrame.prototype['get' + _capitalize(booleanProps[i])] = _getter(booleanProps[i]);
  
      StackFrame.prototype['set' + _capitalize(booleanProps[i])] = function (p) {
        return function (v) {
          this[p] = Boolean(v);
        };
      }(booleanProps[i]);
    }
  
    for (var j = 0; j < numericProps.length; j++) {
      StackFrame.prototype['get' + _capitalize(numericProps[j])] = _getter(numericProps[j]);
  
      StackFrame.prototype['set' + _capitalize(numericProps[j])] = function (p) {
        return function (v) {
          if (!_isNumber(v)) {
            throw new TypeError(p + ' must be a Number');
          }
  
          this[p] = Number(v);
        };
      }(numericProps[j]);
    }
  
    for (var k = 0; k < stringProps.length; k++) {
      StackFrame.prototype['get' + _capitalize(stringProps[k])] = _getter(stringProps[k]);
  
      StackFrame.prototype['set' + _capitalize(stringProps[k])] = function (p) {
        return function (v) {
          this[p] = String(v);
        };
      }(stringProps[k]);
    }
  
    return StackFrame;
  });
  
  /***/ }),
  /* 29 */
  /***/ (function(module, exports, __webpack_require__) {
  
  "use strict";
  
  
  if (true) {
    module.exports = __webpack_require__(30);
  } else {}
  
  /***/ }),
  /* 30 */
  /***/ (function(module, exports, __webpack_require__) {
  
  "use strict";
  /**
   * @license React
   * react.production.min.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */
  
  
  var l = Symbol.for("react.element"),
      n = Symbol.for("react.portal"),
      p = Symbol.for("react.fragment"),
      q = Symbol.for("react.strict_mode"),
      r = Symbol.for("react.profiler"),
      t = Symbol.for("react.provider"),
      u = Symbol.for("react.context"),
      v = Symbol.for("react.server_context"),
      w = Symbol.for("react.forward_ref"),
      x = Symbol.for("react.suspense"),
      y = Symbol.for("react.suspense_list"),
      z = Symbol.for("react.memo"),
      A = Symbol.for("react.lazy"),
      aa = Symbol.for("react.debug_trace_mode"),
      ba = Symbol.for("react.offscreen"),
      ca = Symbol.for("react.cache"),
      B = Symbol.for("react.default_value"),
      C = Symbol.iterator;
  
  function da(a) {
    if (null === a || "object" !== typeof a) return null;
    a = C && a[C] || a["@@iterator"];
    return "function" === typeof a ? a : null;
  }
  
  var D = {
    isMounted: function () {
      return !1;
    },
    enqueueForceUpdate: function () {},
    enqueueReplaceState: function () {},
    enqueueSetState: function () {}
  },
      E = Object.assign,
      F = {};
  
  function G(a, b, d) {
    this.props = a;
    this.context = b;
    this.refs = F;
    this.updater = d || D;
  }
  
  G.prototype.isReactComponent = {};
  
  G.prototype.setState = function (a, b) {
    if ("object" !== typeof a && "function" !== typeof a && null != a) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
    this.updater.enqueueSetState(this, a, b, "setState");
  };
  
  G.prototype.forceUpdate = function (a) {
    this.updater.enqueueForceUpdate(this, a, "forceUpdate");
  };
  
  function H() {}
  
  H.prototype = G.prototype;
  
  function I(a, b, d) {
    this.props = a;
    this.context = b;
    this.refs = F;
    this.updater = d || D;
  }
  
  var J = I.prototype = new H();
  J.constructor = I;
  E(J, G.prototype);
  J.isPureReactComponent = !0;
  var K = Array.isArray,
      L = Object.prototype.hasOwnProperty,
      M = {
    current: null
  },
      N = {
    key: !0,
    ref: !0,
    __self: !0,
    __source: !0
  };
  
  function O(a, b, d) {
    var c,
        e = {},
        f = null,
        g = null;
    if (null != b) for (c in void 0 !== b.ref && (g = b.ref), void 0 !== b.key && (f = "" + b.key), b) L.call(b, c) && !N.hasOwnProperty(c) && (e[c] = b[c]);
    var h = arguments.length - 2;
    if (1 === h) e.children = d;else if (1 < h) {
      for (var k = Array(h), m = 0; m < h; m++) k[m] = arguments[m + 2];
  
      e.children = k;
    }
    if (a && a.defaultProps) for (c in h = a.defaultProps, h) void 0 === e[c] && (e[c] = h[c]);
    return {
      $$typeof: l,
      type: a,
      key: f,
      ref: g,
      props: e,
      _owner: M.current
    };
  }
  
  function ea(a, b) {
    return {
      $$typeof: l,
      type: a.type,
      key: b,
      ref: a.ref,
      props: a.props,
      _owner: a._owner
    };
  }
  
  function P(a) {
    return "object" === typeof a && null !== a && a.$$typeof === l;
  }
  
  function escape(a) {
    var b = {
      "=": "=0",
      ":": "=2"
    };
    return "$" + a.replace(/[=:]/g, function (a) {
      return b[a];
    });
  }
  
  var Q = /\/+/g;
  
  function R(a, b) {
    return "object" === typeof a && null !== a && null != a.key ? escape("" + a.key) : b.toString(36);
  }
  
  function S(a, b, d, c, e) {
    var f = typeof a;
    if ("undefined" === f || "boolean" === f) a = null;
    var g = !1;
    if (null === a) g = !0;else switch (f) {
      case "string":
      case "number":
        g = !0;
        break;
  
      case "object":
        switch (a.$$typeof) {
          case l:
          case n:
            g = !0;
        }
  
    }
    if (g) return g = a, e = e(g), a = "" === c ? "." + R(g, 0) : c, K(e) ? (d = "", null != a && (d = a.replace(Q, "$&/") + "/"), S(e, b, d, "", function (a) {
      return a;
    })) : null != e && (P(e) && (e = ea(e, d + (!e.key || g && g.key === e.key ? "" : ("" + e.key).replace(Q, "$&/") + "/") + a)), b.push(e)), 1;
    g = 0;
    c = "" === c ? "." : c + ":";
    if (K(a)) for (var h = 0; h < a.length; h++) {
      f = a[h];
      var k = c + R(f, h);
      g += S(f, b, d, k, e);
    } else if (k = da(a), "function" === typeof k) for (a = k.call(a), h = 0; !(f = a.next()).done;) f = f.value, k = c + R(f, h++), g += S(f, b, d, k, e);else if ("object" === f) throw b = String(a), Error("Objects are not valid as a React child (found: " + ("[object Object]" === b ? "object with keys {" + Object.keys(a).join(", ") + "}" : b) + "). If you meant to render a collection of children, use an array instead.");
    return g;
  }
  
  function T(a, b, d) {
    if (null == a) return a;
    var c = [],
        e = 0;
    S(a, c, "", "", function (a) {
      return b.call(d, a, e++);
    });
    return c;
  }
  
  function fa(a) {
    if (-1 === a._status) {
      var b = a._result;
      b = b();
      b.then(function (b) {
        if (0 === a._status || -1 === a._status) a._status = 1, a._result = b;
      }, function (b) {
        if (0 === a._status || -1 === a._status) a._status = 2, a._result = b;
      });
      -1 === a._status && (a._status = 0, a._result = b);
    }
  
    if (1 === a._status) return a._result.default;
    throw a._result;
  }
  
  var U = {
    current: null
  };
  
  function ha() {
    return new WeakMap();
  }
  
  function V() {
    return {
      s: 0,
      v: void 0,
      o: null,
      p: null
    };
  }
  
  var W = {
    current: null
  },
      X = {
    transition: null
  },
      Y = {
    ReactCurrentDispatcher: W,
    ReactCurrentCache: U,
    ReactCurrentBatchConfig: X,
    ReactCurrentOwner: M,
    ContextRegistry: {}
  },
      Z = Y.ContextRegistry;
  exports.Children = {
    map: T,
    forEach: function (a, b, d) {
      T(a, function () {
        b.apply(this, arguments);
      }, d);
    },
    count: function (a) {
      var b = 0;
      T(a, function () {
        b++;
      });
      return b;
    },
    toArray: function (a) {
      return T(a, function (a) {
        return a;
      }) || [];
    },
    only: function (a) {
      if (!P(a)) throw Error("React.Children.only expected to receive a single React element child.");
      return a;
    }
  };
  exports.Component = G;
  exports.Fragment = p;
  exports.Profiler = r;
  exports.PureComponent = I;
  exports.StrictMode = q;
  exports.Suspense = x;
  exports.SuspenseList = y;
  exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Y;
  
  exports.cache = function (a) {
    return function () {
      var b = U.current;
      if (!b) return a.apply(null, arguments);
      var d = b.getCacheForType(ha);
      b = d.get(a);
      void 0 === b && (b = V(), d.set(a, b));
      d = 0;
  
      for (var c = arguments.length; d < c; d++) {
        var e = arguments[d];
  
        if ("function" === typeof e || "object" === typeof e && null !== e) {
          var f = b.o;
          null === f && (b.o = f = new WeakMap());
          b = f.get(e);
          void 0 === b && (b = V(), f.set(e, b));
        } else f = b.p, null === f && (b.p = f = new Map()), b = f.get(e), void 0 === b && (b = V(), f.set(e, b));
      }
  
      if (1 === b.s) return b.v;
      if (2 === b.s) throw b.v;
  
      try {
        var g = a.apply(null, arguments);
        d = b;
        d.s = 1;
        return d.v = g;
      } catch (h) {
        throw g = b, g.s = 2, g.v = h, h;
      }
    };
  };
  
  exports.cloneElement = function (a, b, d) {
    if (null === a || void 0 === a) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + a + ".");
    var c = E({}, a.props),
        e = a.key,
        f = a.ref,
        g = a._owner;
  
    if (null != b) {
      void 0 !== b.ref && (f = b.ref, g = M.current);
      void 0 !== b.key && (e = "" + b.key);
      if (a.type && a.type.defaultProps) var h = a.type.defaultProps;
  
      for (k in b) L.call(b, k) && !N.hasOwnProperty(k) && (c[k] = void 0 === b[k] && void 0 !== h ? h[k] : b[k]);
    }
  
    var k = arguments.length - 2;
    if (1 === k) c.children = d;else if (1 < k) {
      h = Array(k);
  
      for (var m = 0; m < k; m++) h[m] = arguments[m + 2];
  
      c.children = h;
    }
    return {
      $$typeof: l,
      type: a.type,
      key: e,
      ref: f,
      props: c,
      _owner: g
    };
  };
  
  exports.createContext = function (a) {
    a = {
      $$typeof: u,
      _currentValue: a,
      _currentValue2: a,
      _threadCount: 0,
      Provider: null,
      Consumer: null,
      _defaultValue: null,
      _globalName: null
    };
    a.Provider = {
      $$typeof: t,
      _context: a
    };
    return a.Consumer = a;
  };
  
  exports.createElement = O;
  
  exports.createFactory = function (a) {
    var b = O.bind(null, a);
    b.type = a;
    return b;
  };
  
  exports.createRef = function () {
    return {
      current: null
    };
  };
  
  exports.createServerContext = function (a, b) {
    var d = !0;
  
    if (!Z[a]) {
      d = !1;
      var c = {
        $$typeof: v,
        _currentValue: b,
        _currentValue2: b,
        _defaultValue: b,
        _threadCount: 0,
        Provider: null,
        Consumer: null,
        _globalName: a
      };
      c.Provider = {
        $$typeof: t,
        _context: c
      };
      Z[a] = c;
    }
  
    c = Z[a];
    if (c._defaultValue === B) c._defaultValue = b, c._currentValue === B && (c._currentValue = b), c._currentValue2 === B && (c._currentValue2 = b);else if (d) throw Error("ServerContext: " + a + " already defined");
    return c;
  };
  
  exports.experimental_useEffectEvent = function (a) {
    return W.current.useEffectEvent(a);
  };
  
  exports.forwardRef = function (a) {
    return {
      $$typeof: w,
      render: a
    };
  };
  
  exports.isValidElement = P;
  
  exports.lazy = function (a) {
    return {
      $$typeof: A,
      _payload: {
        _status: -1,
        _result: a
      },
      _init: fa
    };
  };
  
  exports.memo = function (a, b) {
    return {
      $$typeof: z,
      type: a,
      compare: void 0 === b ? null : b
    };
  };
  
  exports.startTransition = function (a) {
    var b = X.transition;
    X.transition = {};
  
    try {
      a();
    } finally {
      X.transition = b;
    }
  };
  
  exports.unstable_Cache = ca;
  exports.unstable_DebugTracingMode = aa;
  exports.unstable_Offscreen = ba;
  
  exports.unstable_act = function () {
    throw Error("act(...) is not supported in production builds of React.");
  };
  
  exports.unstable_getCacheForType = function (a) {
    var b = U.current;
    return b ? b.getCacheForType(a) : a();
  };
  
  exports.unstable_getCacheSignal = function () {
    var a = U.current;
    return a ? a.getCacheSignal() : (a = new AbortController(), a.abort(Error("This CacheSignal was requested outside React which means that it is immediately aborted.")), a.signal);
  };
  
  exports.unstable_useCacheRefresh = function () {
    return W.current.useCacheRefresh();
  };
  
  exports.unstable_useMemoCache = function (a) {
    return W.current.useMemoCache(a);
  };
  
  exports.use = function (a) {
    return W.current.use(a);
  };
  
  exports.useCallback = function (a, b) {
    return W.current.useCallback(a, b);
  };
  
  exports.useContext = function (a) {
    return W.current.useContext(a);
  };
  
  exports.useDebugValue = function () {};
  
  exports.useDeferredValue = function (a) {
    return W.current.useDeferredValue(a);
  };
  
  exports.useEffect = function (a, b) {
    return W.current.useEffect(a, b);
  };
  
  exports.useId = function () {
    return W.current.useId();
  };
  
  exports.useImperativeHandle = function (a, b, d) {
    return W.current.useImperativeHandle(a, b, d);
  };
  
  exports.useInsertionEffect = function (a, b) {
    return W.current.useInsertionEffect(a, b);
  };
  
  exports.useLayoutEffect = function (a, b) {
    return W.current.useLayoutEffect(a, b);
  };
  
  exports.useMemo = function (a, b) {
    return W.current.useMemo(a, b);
  };
  
  exports.useReducer = function (a, b, d) {
    return W.current.useReducer(a, b, d);
  };
  
  exports.useRef = function (a) {
    return W.current.useRef(a);
  };
  
  exports.useState = function (a) {
    return W.current.useState(a);
  };
  
  exports.useSyncExternalStore = function (a, b, d) {
    return W.current.useSyncExternalStore(a, b, d);
  };
  
  exports.useTransition = function () {
    return W.current.useTransition();
  };
  
  exports.version = "18.2.0";
  
  /***/ }),
  /* 31 */
  /***/ (function(module, __webpack_exports__, __webpack_require__) {
  
  "use strict";
  // ESM COMPAT FLAG
  __webpack_require__.r(__webpack_exports__);
  
  // EXPORTS
  __webpack_require__.d(__webpack_exports__, "initBackend", function() { return /* binding */ initBackend; });
  
  // EXTERNAL MODULE: ../react-devtools-shared/src/backend/agent.js + 3 modules
  var backend_agent = __webpack_require__(15);
  
  // EXTERNAL MODULE: ../react-devtools-shared/src/backend/renderer.js + 6 modules
  var backend_renderer = __webpack_require__(13);
  
  // EXTERNAL MODULE: ../react-devtools-shared/src/types.js
  var types = __webpack_require__(0);
  
  // EXTERNAL MODULE: ../react-devtools-shared/src/utils.js
  var utils = __webpack_require__(1);
  
  // EXTERNAL MODULE: ../react-devtools-shared/src/backend/utils.js
  var backend_utils = __webpack_require__(4);
  
  // EXTERNAL MODULE: ../react-devtools-shared/src/constants.js
  var constants = __webpack_require__(3);
  
  // CONCATENATED MODULE: ../react-devtools-shared/src/backend/legacy/utils.js
  /**
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  function decorate(object, attr, fn) {
    const old = object[attr];
  
    object[attr] = function (instance) {
      return fn.call(this, old, arguments);
    };
  
    return old;
  }
  function decorateMany(source, fns) {
    const olds = {};
  
    for (const name in fns) {
      olds[name] = decorate(source, name, fns[name]);
    }
  
    return olds;
  }
  function restoreMany(source, olds) {
    for (const name in olds) {
      source[name] = olds[name];
    }
  }
  function forceUpdate(instance) {
    if (typeof instance.forceUpdate === 'function') {
      instance.forceUpdate();
    } else if (instance.updater != null && typeof instance.updater.enqueueForceUpdate === 'function') {
      instance.updater.enqueueForceUpdate(this, () => {}, 'forceUpdate');
    }
  }
  // CONCATENATED MODULE: ../react-devtools-shared/src/backend/legacy/renderer.js
  /**
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  
  
  
  
  
  
  
  function getData(internalInstance) {
    let displayName = null;
    let key = null; // != used deliberately here to catch undefined and null
  
    if (internalInstance._currentElement != null) {
      if (internalInstance._currentElement.key) {
        key = String(internalInstance._currentElement.key);
      }
  
      const elementType = internalInstance._currentElement.type;
  
      if (typeof elementType === 'string') {
        displayName = elementType;
      } else if (typeof elementType === 'function') {
        displayName = Object(utils["h" /* getDisplayName */])(elementType);
      }
    }
  
    return {
      displayName,
      key
    };
  }
  
  function getElementType(internalInstance) {
    // != used deliberately here to catch undefined and null
    if (internalInstance._currentElement != null) {
      const elementType = internalInstance._currentElement.type;
  
      if (typeof elementType === 'function') {
        const publicInstance = internalInstance.getPublicInstance();
  
        if (publicInstance !== null) {
          return types["e" /* ElementTypeClass */];
        } else {
          return types["h" /* ElementTypeFunction */];
        }
      } else if (typeof elementType === 'string') {
        return types["i" /* ElementTypeHostComponent */];
      }
    }
  
    return types["k" /* ElementTypeOtherOrUnknown */];
  }
  
  function getChildren(internalInstance) {
    const children = []; // If the parent is a native node without rendered children, but with
    // multiple string children, then the `element` that gets passed in here is
    // a plain value -- a string or number.
  
    if (typeof internalInstance !== 'object') {// No children
    } else if (internalInstance._currentElement === null || internalInstance._currentElement === false) {// No children
    } else if (internalInstance._renderedComponent) {
      const child = internalInstance._renderedComponent;
  
      if (getElementType(child) !== types["k" /* ElementTypeOtherOrUnknown */]) {
        children.push(child);
      }
    } else if (internalInstance._renderedChildren) {
      const renderedChildren = internalInstance._renderedChildren;
  
      for (const name in renderedChildren) {
        const child = renderedChildren[name];
  
        if (getElementType(child) !== types["k" /* ElementTypeOtherOrUnknown */]) {
          children.push(child);
        }
      }
    } // Note: we skip the case where children are just strings or numbers
    // because the new DevTools skips over host text nodes anyway.
  
  
    return children;
  }
  
  function attach(hook, rendererID, renderer, global) {
    const idToInternalInstanceMap = new Map();
    const internalInstanceToIDMap = new WeakMap();
    const internalInstanceToRootIDMap = new WeakMap();
    let getInternalIDForNative = null;
    let findNativeNodeForInternalID;
  
    let getFiberForNative = node => {
      // Not implemented.
      return null;
    };
  
    if (renderer.ComponentTree) {
      getInternalIDForNative = (node, findNearestUnfilteredAncestor) => {
        const internalInstance = renderer.ComponentTree.getClosestInstanceFromNode(node);
        return internalInstanceToIDMap.get(internalInstance) || null;
      };
  
      findNativeNodeForInternalID = id => {
        const internalInstance = idToInternalInstanceMap.get(id);
        return renderer.ComponentTree.getNodeFromInstance(internalInstance);
      };
  
      getFiberForNative = node => {
        return renderer.ComponentTree.getClosestInstanceFromNode(node);
      };
    } else if (renderer.Mount.getID && renderer.Mount.getNode) {
      getInternalIDForNative = (node, findNearestUnfilteredAncestor) => {
        // Not implemented.
        return null;
      };
  
      findNativeNodeForInternalID = id => {
        // Not implemented.
        return null;
      };
    }
  
    function getDisplayNameForFiberID(id) {
      const internalInstance = idToInternalInstanceMap.get(id);
      return internalInstance ? getData(internalInstance).displayName : null;
    }
  
    function getID(internalInstance) {
      if (typeof internalInstance !== 'object' || internalInstance === null) {
        throw new Error('Invalid internal instance: ' + internalInstance);
      }
  
      if (!internalInstanceToIDMap.has(internalInstance)) {
        const id = Object(utils["k" /* getUID */])();
        internalInstanceToIDMap.set(internalInstance, id);
        idToInternalInstanceMap.set(id, internalInstance);
      }
  
      return internalInstanceToIDMap.get(internalInstance);
    }
  
    function areEqualArrays(a, b) {
      if (a.length !== b.length) {
        return false;
      }
  
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
          return false;
        }
      }
  
      return true;
    } // This is shared mutable state that lets us keep track of where we are.
  
  
    let parentIDStack = [];
    let oldReconcilerMethods = null;
  
    if (renderer.Reconciler) {
      // React 15
      oldReconcilerMethods = decorateMany(renderer.Reconciler, {
        mountComponent(fn, args) {
          const internalInstance = args[0];
          const hostContainerInfo = args[3];
  
          if (getElementType(internalInstance) === types["k" /* ElementTypeOtherOrUnknown */]) {
            // $FlowFixMe[object-this-reference] found when upgrading Flow
            return fn.apply(this, args);
          }
  
          if (hostContainerInfo._topLevelWrapper === undefined) {
            // SSR
            // $FlowFixMe[object-this-reference] found when upgrading Flow
            return fn.apply(this, args);
          }
  
          const id = getID(internalInstance); // Push the operation.
  
          const parentID = parentIDStack.length > 0 ? parentIDStack[parentIDStack.length - 1] : 0;
          recordMount(internalInstance, id, parentID);
          parentIDStack.push(id); // Remember the root.
  
          internalInstanceToRootIDMap.set(internalInstance, getID(hostContainerInfo._topLevelWrapper));
  
          try {
            // $FlowFixMe[object-this-reference] found when upgrading Flow
            const result = fn.apply(this, args);
            parentIDStack.pop();
            return result;
          } catch (err) {
            // $FlowFixMe[incompatible-type] found when upgrading Flow
            parentIDStack = [];
            throw err;
          } finally {
            if (parentIDStack.length === 0) {
              const rootID = internalInstanceToRootIDMap.get(internalInstance);
  
              if (rootID === undefined) {
                throw new Error('Expected to find root ID.');
              }
  
              flushPendingEvents(rootID);
            }
          }
        },
  
        performUpdateIfNecessary(fn, args) {
          const internalInstance = args[0];
  
          if (getElementType(internalInstance) === types["k" /* ElementTypeOtherOrUnknown */]) {
            // $FlowFixMe[object-this-reference] found when upgrading Flow
            return fn.apply(this, args);
          }
  
          const id = getID(internalInstance);
          parentIDStack.push(id);
          const prevChildren = getChildren(internalInstance);
  
          try {
            // $FlowFixMe[object-this-reference] found when upgrading Flow
            const result = fn.apply(this, args);
            const nextChildren = getChildren(internalInstance);
  
            if (!areEqualArrays(prevChildren, nextChildren)) {
              // Push the operation
              recordReorder(internalInstance, id, nextChildren);
            }
  
            parentIDStack.pop();
            return result;
          } catch (err) {
            // $FlowFixMe[incompatible-type] found when upgrading Flow
            parentIDStack = [];
            throw err;
          } finally {
            if (parentIDStack.length === 0) {
              const rootID = internalInstanceToRootIDMap.get(internalInstance);
  
              if (rootID === undefined) {
                throw new Error('Expected to find root ID.');
              }
  
              flushPendingEvents(rootID);
            }
          }
        },
  
        receiveComponent(fn, args) {
          const internalInstance = args[0];
  
          if (getElementType(internalInstance) === types["k" /* ElementTypeOtherOrUnknown */]) {
            // $FlowFixMe[object-this-reference] found when upgrading Flow
            return fn.apply(this, args);
          }
  
          const id = getID(internalInstance);
          parentIDStack.push(id);
          const prevChildren = getChildren(internalInstance);
  
          try {
            // $FlowFixMe[object-this-reference] found when upgrading Flow
            const result = fn.apply(this, args);
            const nextChildren = getChildren(internalInstance);
  
            if (!areEqualArrays(prevChildren, nextChildren)) {
              // Push the operation
              recordReorder(internalInstance, id, nextChildren);
            }
  
            parentIDStack.pop();
            return result;
          } catch (err) {
            // $FlowFixMe[incompatible-type] found when upgrading Flow
            parentIDStack = [];
            throw err;
          } finally {
            if (parentIDStack.length === 0) {
              const rootID = internalInstanceToRootIDMap.get(internalInstance);
  
              if (rootID === undefined) {
                throw new Error('Expected to find root ID.');
              }
  
              flushPendingEvents(rootID);
            }
          }
        },
  
        unmountComponent(fn, args) {
          const internalInstance = args[0];
  
          if (getElementType(internalInstance) === types["k" /* ElementTypeOtherOrUnknown */]) {
            // $FlowFixMe[object-this-reference] found when upgrading Flow
            return fn.apply(this, args);
          }
  
          const id = getID(internalInstance);
          parentIDStack.push(id);
  
          try {
            // $FlowFixMe[object-this-reference] found when upgrading Flow
            const result = fn.apply(this, args);
            parentIDStack.pop(); // Push the operation.
  
            recordUnmount(internalInstance, id);
            return result;
          } catch (err) {
            // $FlowFixMe[incompatible-type] found when upgrading Flow
            parentIDStack = [];
            throw err;
          } finally {
            if (parentIDStack.length === 0) {
              const rootID = internalInstanceToRootIDMap.get(internalInstance);
  
              if (rootID === undefined) {
                throw new Error('Expected to find root ID.');
              }
  
              flushPendingEvents(rootID);
            }
          }
        }
  
      });
    }
  
    function cleanup() {
      if (oldReconcilerMethods !== null) {
        if (renderer.Component) {
          restoreMany(renderer.Component.Mixin, oldReconcilerMethods);
        } else {
          restoreMany(renderer.Reconciler, oldReconcilerMethods);
        }
      }
  
      oldReconcilerMethods = null;
    }
  
    function recordMount(internalInstance, id, parentID) {
      const isRoot = parentID === 0;
  
      if (constants["j" /* __DEBUG__ */]) {
        console.log('%crecordMount()', 'color: green; font-weight: bold;', id, getData(internalInstance).displayName);
      }
  
      if (isRoot) {
        // TODO Is this right? For all versions?
        const hasOwnerMetadata = internalInstance._currentElement != null && internalInstance._currentElement._owner != null;
        pushOperation(constants["c" /* TREE_OPERATION_ADD */]);
        pushOperation(id);
        pushOperation(types["m" /* ElementTypeRoot */]);
        pushOperation(0); // StrictMode compliant?
  
        pushOperation(0); // Profiling flag
  
        pushOperation(0); // StrictMode supported?
  
        pushOperation(hasOwnerMetadata ? 1 : 0);
      } else {
        const type = getElementType(internalInstance);
        const {
          displayName,
          key
        } = getData(internalInstance);
        const ownerID = internalInstance._currentElement != null && internalInstance._currentElement._owner != null ? getID(internalInstance._currentElement._owner) : 0;
        const displayNameStringID = getStringID(displayName);
        const keyStringID = getStringID(key);
        pushOperation(constants["c" /* TREE_OPERATION_ADD */]);
        pushOperation(id);
        pushOperation(type);
        pushOperation(parentID);
        pushOperation(ownerID);
        pushOperation(displayNameStringID);
        pushOperation(keyStringID);
      }
    }
  
    function recordReorder(internalInstance, id, nextChildren) {
      pushOperation(constants["f" /* TREE_OPERATION_REORDER_CHILDREN */]);
      pushOperation(id);
      const nextChildIDs = nextChildren.map(getID);
      pushOperation(nextChildIDs.length);
  
      for (let i = 0; i < nextChildIDs.length; i++) {
        pushOperation(nextChildIDs[i]);
      }
    }
  
    function recordUnmount(internalInstance, id) {
      pendingUnmountedIDs.push(id);
      idToInternalInstanceMap.delete(id);
    }
  
    function crawlAndRecordInitialMounts(id, parentID, rootID) {
      if (constants["j" /* __DEBUG__ */]) {
        console.group('crawlAndRecordInitialMounts() id:', id);
      }
  
      const internalInstance = idToInternalInstanceMap.get(id);
  
      if (internalInstance != null) {
        internalInstanceToRootIDMap.set(internalInstance, rootID);
        recordMount(internalInstance, id, parentID);
        getChildren(internalInstance).forEach(child => crawlAndRecordInitialMounts(getID(child), id, rootID));
      }
  
      if (constants["j" /* __DEBUG__ */]) {
        console.groupEnd();
      }
    }
  
    function flushInitialOperations() {
      // Crawl roots though and register any nodes that mounted before we were injected.
      const roots = renderer.Mount._instancesByReactRootID || renderer.Mount._instancesByContainerID;
  
      for (const key in roots) {
        const internalInstance = roots[key];
        const id = getID(internalInstance);
        crawlAndRecordInitialMounts(id, 0, id);
        flushPendingEvents(id);
      }
    }
  
    const pendingOperations = [];
    const pendingStringTable = new Map();
    let pendingUnmountedIDs = [];
    let pendingStringTableLength = 0;
    let pendingUnmountedRootID = null;
  
    function flushPendingEvents(rootID) {
      if (pendingOperations.length === 0 && pendingUnmountedIDs.length === 0 && pendingUnmountedRootID === null) {
        return;
      }
  
      const numUnmountIDs = pendingUnmountedIDs.length + (pendingUnmountedRootID === null ? 0 : 1);
      const operations = new Array( // Identify which renderer this update is coming from.
      2 + // [rendererID, rootFiberID]
      // How big is the string table?
      1 + // [stringTableLength]
      // Then goes the actual string table.
      pendingStringTableLength + ( // All unmounts are batched in a single message.
      // [TREE_OPERATION_REMOVE, removedIDLength, ...ids]
      numUnmountIDs > 0 ? 2 + numUnmountIDs : 0) + // Mount operations
      pendingOperations.length); // Identify which renderer this update is coming from.
      // This enables roots to be mapped to renderers,
      // Which in turn enables fiber properations, states, and hooks to be inspected.
  
      let i = 0;
      operations[i++] = rendererID;
      operations[i++] = rootID; // Now fill in the string table.
      // [stringTableLength, str1Length, ...str1, str2Length, ...str2, ...]
  
      operations[i++] = pendingStringTableLength;
      pendingStringTable.forEach((value, key) => {
        operations[i++] = key.length;
        const encodedKey = Object(utils["p" /* utfEncodeString */])(key);
  
        for (let j = 0; j < encodedKey.length; j++) {
          operations[i + j] = encodedKey[j];
        }
  
        i += key.length;
      });
  
      if (numUnmountIDs > 0) {
        // All unmounts except roots are batched in a single message.
        operations[i++] = constants["d" /* TREE_OPERATION_REMOVE */]; // The first number is how many unmounted IDs we're gonna send.
  
        operations[i++] = numUnmountIDs; // Fill in the unmounts
  
        for (let j = 0; j < pendingUnmountedIDs.length; j++) {
          operations[i++] = pendingUnmountedIDs[j];
        } // The root ID should always be unmounted last.
  
  
        if (pendingUnmountedRootID !== null) {
          operations[i] = pendingUnmountedRootID;
          i++;
        }
      } // Fill in the rest of the operations.
  
  
      for (let j = 0; j < pendingOperations.length; j++) {
        operations[i + j] = pendingOperations[j];
      }
  
      i += pendingOperations.length;
  
      if (constants["j" /* __DEBUG__ */]) {
        Object(utils["m" /* printOperationsArray */])(operations);
      } // If we've already connected to the frontend, just pass the operations through.
  
  
      hook.emit('operations', operations);
      pendingOperations.length = 0;
      pendingUnmountedIDs = [];
      pendingUnmountedRootID = null;
      pendingStringTable.clear();
      pendingStringTableLength = 0;
    }
  
    function pushOperation(op) {
      if (true) {
        if (!Number.isInteger(op)) {
          console.error('pushOperation() was called but the value is not an integer.', op);
        }
      }
  
      pendingOperations.push(op);
    }
  
    function getStringID(str) {
      if (str === null) {
        return 0;
      }
  
      const existingID = pendingStringTable.get(str);
  
      if (existingID !== undefined) {
        return existingID;
      }
  
      const stringID = pendingStringTable.size + 1;
      pendingStringTable.set(str, stringID); // The string table total length needs to account
      // both for the string length, and for the array item
      // that contains the length itself. Hence + 1.
  
      pendingStringTableLength += str.length + 1;
      return stringID;
    }
  
    let currentlyInspectedElementID = null;
    let currentlyInspectedPaths = {}; // Track the intersection of currently inspected paths,
    // so that we can send their data along if the element is re-rendered.
  
    function mergeInspectedPaths(path) {
      let current = currentlyInspectedPaths;
      path.forEach(key => {
        if (!current[key]) {
          current[key] = {};
        }
  
        current = current[key];
      });
    }
  
    function createIsPathAllowed(key) {
      // This function helps prevent previously-inspected paths from being dehydrated in updates.
      // This is important to avoid a bad user experience where expanded toggles collapse on update.
      return function isPathAllowed(path) {
        let current = currentlyInspectedPaths[key];
  
        if (!current) {
          return false;
        }
  
        for (let i = 0; i < path.length; i++) {
          current = current[path[i]];
  
          if (!current) {
            return false;
          }
        }
  
        return true;
      };
    } // Fast path props lookup for React Native style editor.
  
  
    function getInstanceAndStyle(id) {
      let instance = null;
      let style = null;
      const internalInstance = idToInternalInstanceMap.get(id);
  
      if (internalInstance != null) {
        instance = internalInstance._instance || null;
        const element = internalInstance._currentElement;
  
        if (element != null && element.props != null) {
          style = element.props.style || null;
        }
      }
  
      return {
        instance,
        style
      };
    }
  
    function updateSelectedElement(id) {
      const internalInstance = idToInternalInstanceMap.get(id);
  
      if (internalInstance == null) {
        console.warn(`Could not find instance with id "${id}"`);
        return;
      }
  
      switch (getElementType(internalInstance)) {
        case types["e" /* ElementTypeClass */]:
          global.$r = internalInstance._instance;
          break;
  
        case types["h" /* ElementTypeFunction */]:
          const element = internalInstance._currentElement;
  
          if (element == null) {
            console.warn(`Could not find element with id "${id}"`);
            return;
          }
  
          global.$r = {
            props: element.props,
            type: element.type
          };
          break;
  
        default:
          global.$r = null;
          break;
      }
    }
  
    function storeAsGlobal(id, path, count) {
      const inspectedElement = inspectElementRaw(id);
  
      if (inspectedElement !== null) {
        const value = Object(utils["j" /* getInObject */])(inspectedElement, path);
        const key = `$reactTemp${count}`;
        window[key] = value;
        console.log(key);
        console.log(value);
      }
    }
  
    function copyElementPath(id, path) {
      const inspectedElement = inspectElementRaw(id);
  
      if (inspectedElement !== null) {
        Object(backend_utils["b" /* copyToClipboard */])(Object(utils["j" /* getInObject */])(inspectedElement, path));
      }
    }
  
    function inspectElement(requestID, id, path, forceFullData) {
      if (forceFullData || currentlyInspectedElementID !== id) {
        currentlyInspectedElementID = id;
        currentlyInspectedPaths = {};
      }
  
      const inspectedElement = inspectElementRaw(id);
  
      if (inspectedElement === null) {
        return {
          id,
          responseID: requestID,
          type: 'not-found'
        };
      }
  
      if (path !== null) {
        mergeInspectedPaths(path);
      } // Any time an inspected element has an update,
      // we should update the selected $r value as wel.
      // Do this before dehydration (cleanForBridge).
  
  
      updateSelectedElement(id);
      inspectedElement.context = Object(backend_utils["a" /* cleanForBridge */])(inspectedElement.context, createIsPathAllowed('context'));
      inspectedElement.props = Object(backend_utils["a" /* cleanForBridge */])(inspectedElement.props, createIsPathAllowed('props'));
      inspectedElement.state = Object(backend_utils["a" /* cleanForBridge */])(inspectedElement.state, createIsPathAllowed('state'));
      return {
        id,
        responseID: requestID,
        type: 'full-data',
        value: inspectedElement
      };
    }
  
    function inspectElementRaw(id) {
      const internalInstance = idToInternalInstanceMap.get(id);
  
      if (internalInstance == null) {
        return null;
      }
  
      const {
        displayName,
        key
      } = getData(internalInstance);
      const type = getElementType(internalInstance);
      let context = null;
      let owners = null;
      let props = null;
      let state = null;
      let source = null;
      const element = internalInstance._currentElement;
  
      if (element !== null) {
        props = element.props;
        source = element._source != null ? element._source : null;
        let owner = element._owner;
  
        if (owner) {
          owners = [];
  
          while (owner != null) {
            owners.push({
              displayName: getData(owner).displayName || 'Unknown',
              id: getID(owner),
              key: element.key,
              type: getElementType(owner)
            });
  
            if (owner._currentElement) {
              owner = owner._currentElement._owner;
            }
          }
        }
      }
  
      const publicInstance = internalInstance._instance;
  
      if (publicInstance != null) {
        context = publicInstance.context || null;
        state = publicInstance.state || null;
      } // Not implemented
  
  
      const errors = [];
      const warnings = [];
      return {
        id,
        // Does the current renderer support editable hooks and function props?
        canEditHooks: false,
        canEditFunctionProps: false,
        // Does the current renderer support advanced editing interface?
        canEditHooksAndDeletePaths: false,
        canEditHooksAndRenamePaths: false,
        canEditFunctionPropsDeletePaths: false,
        canEditFunctionPropsRenamePaths: false,
        // Toggle error boundary did not exist in legacy versions
        canToggleError: false,
        isErrored: false,
        targetErrorBoundaryID: null,
        // Suspense did not exist in legacy versions
        canToggleSuspense: false,
        // Can view component source location.
        canViewSource: type === types["e" /* ElementTypeClass */] || type === types["h" /* ElementTypeFunction */],
        // Only legacy context exists in legacy versions.
        hasLegacyContext: true,
        displayName: displayName,
        type: type,
        key: key != null ? key : null,
        // Inspectable properties.
        context,
        hooks: null,
        props,
        state,
        errors,
        warnings,
        // List of owners
        owners,
        // Location of component in source code.
        source,
        rootType: null,
        rendererPackageName: null,
        rendererVersion: null,
        plugins: {
          stylex: null
        }
      };
    }
  
    function logElementToConsole(id) {
      const result = inspectElementRaw(id);
  
      if (result === null) {
        console.warn(`Could not find element with id "${id}"`);
        return;
      }
  
      const supportsGroup = typeof console.groupCollapsed === 'function';
  
      if (supportsGroup) {
        console.groupCollapsed(`[Click to expand] %c<${result.displayName || 'Component'} />`, // --dom-tag-name-color is the CSS variable Chrome styles HTML elements with in the console.
        'color: var(--dom-tag-name-color); font-weight: normal;');
      }
  
      if (result.props !== null) {
        console.log('Props:', result.props);
      }
  
      if (result.state !== null) {
        console.log('State:', result.state);
      }
  
      if (result.context !== null) {
        console.log('Context:', result.context);
      }
  
      const nativeNode = findNativeNodeForInternalID(id);
  
      if (nativeNode !== null) {
        console.log('Node:', nativeNode);
      }
  
      if (window.chrome || /firefox/i.test(navigator.userAgent)) {
        console.log('Right-click any value to save it as a global variable for further inspection.');
      }
  
      if (supportsGroup) {
        console.groupEnd();
      }
    }
  
    function prepareViewAttributeSource(id, path) {
      const inspectedElement = inspectElementRaw(id);
  
      if (inspectedElement !== null) {
        window.$attribute = Object(utils["j" /* getInObject */])(inspectedElement, path);
      }
    }
  
    function prepareViewElementSource(id) {
      const internalInstance = idToInternalInstanceMap.get(id);
  
      if (internalInstance == null) {
        console.warn(`Could not find instance with id "${id}"`);
        return;
      }
  
      const element = internalInstance._currentElement;
  
      if (element == null) {
        console.warn(`Could not find element with id "${id}"`);
        return;
      }
  
      global.$type = element.type;
    }
  
    function deletePath(type, id, hookID, path) {
      const internalInstance = idToInternalInstanceMap.get(id);
  
      if (internalInstance != null) {
        const publicInstance = internalInstance._instance;
  
        if (publicInstance != null) {
          switch (type) {
            case 'context':
              Object(utils["c" /* deletePathInObject */])(publicInstance.context, path);
              forceUpdate(publicInstance);
              break;
  
            case 'hooks':
              throw new Error('Hooks not supported by this renderer');
  
            case 'props':
              const element = internalInstance._currentElement;
              internalInstance._currentElement = { ...element,
                props: Object(backend_utils["c" /* copyWithDelete */])(element.props, path)
              };
              forceUpdate(publicInstance);
              break;
  
            case 'state':
              Object(utils["c" /* deletePathInObject */])(publicInstance.state, path);
              forceUpdate(publicInstance);
              break;
          }
        }
      }
    }
  
    function renamePath(type, id, hookID, oldPath, newPath) {
      const internalInstance = idToInternalInstanceMap.get(id);
  
      if (internalInstance != null) {
        const publicInstance = internalInstance._instance;
  
        if (publicInstance != null) {
          switch (type) {
            case 'context':
              Object(utils["n" /* renamePathInObject */])(publicInstance.context, oldPath, newPath);
              forceUpdate(publicInstance);
              break;
  
            case 'hooks':
              throw new Error('Hooks not supported by this renderer');
  
            case 'props':
              const element = internalInstance._currentElement;
              internalInstance._currentElement = { ...element,
                props: Object(backend_utils["d" /* copyWithRename */])(element.props, oldPath, newPath)
              };
              forceUpdate(publicInstance);
              break;
  
            case 'state':
              Object(utils["n" /* renamePathInObject */])(publicInstance.state, oldPath, newPath);
              forceUpdate(publicInstance);
              break;
          }
        }
      }
    }
  
    function overrideValueAtPath(type, id, hookID, path, value) {
      const internalInstance = idToInternalInstanceMap.get(id);
  
      if (internalInstance != null) {
        const publicInstance = internalInstance._instance;
  
        if (publicInstance != null) {
          switch (type) {
            case 'context':
              Object(utils["o" /* setInObject */])(publicInstance.context, path, value);
              forceUpdate(publicInstance);
              break;
  
            case 'hooks':
              throw new Error('Hooks not supported by this renderer');
  
            case 'props':
              const element = internalInstance._currentElement;
              internalInstance._currentElement = { ...element,
                props: Object(backend_utils["e" /* copyWithSet */])(element.props, path, value)
              };
              forceUpdate(publicInstance);
              break;
  
            case 'state':
              Object(utils["o" /* setInObject */])(publicInstance.state, path, value);
              forceUpdate(publicInstance);
              break;
          }
        }
      }
    } // v16+ only features
  
  
    const getProfilingData = () => {
      throw new Error('getProfilingData not supported by this renderer');
    };
  
    const handleCommitFiberRoot = () => {
      throw new Error('handleCommitFiberRoot not supported by this renderer');
    };
  
    const handleCommitFiberUnmount = () => {
      throw new Error('handleCommitFiberUnmount not supported by this renderer');
    };
  
    const handlePostCommitFiberRoot = () => {
      throw new Error('handlePostCommitFiberRoot not supported by this renderer');
    };
  
    const overrideError = () => {
      throw new Error('overrideError not supported by this renderer');
    };
  
    const overrideSuspense = () => {
      throw new Error('overrideSuspense not supported by this renderer');
    };
  
    const startProfiling = () => {// Do not throw, since this would break a multi-root scenario where v15 and v16 were both present.
    };
  
    const stopProfiling = () => {// Do not throw, since this would break a multi-root scenario where v15 and v16 were both present.
    };
  
    function getBestMatchForTrackedPath() {
      // Not implemented.
      return null;
    }
  
    function getPathForElement(id) {
      // Not implemented.
      return null;
    }
  
    function updateComponentFilters(componentFilters) {// Not implemented.
    }
  
    function setTraceUpdatesEnabled(enabled) {// Not implemented.
    }
  
    function setTrackedPath(path) {// Not implemented.
    }
  
    function getOwnersList(id) {
      // Not implemented.
      return null;
    }
  
    function clearErrorsAndWarnings() {// Not implemented
    }
  
    function clearErrorsForFiberID(id) {// Not implemented
    }
  
    function clearWarningsForFiberID(id) {// Not implemented
    }
  
    function patchConsoleForStrictMode() {}
  
    function unpatchConsoleForStrictMode() {}
  
    return {
      clearErrorsAndWarnings,
      clearErrorsForFiberID,
      clearWarningsForFiberID,
      cleanup,
      copyElementPath,
      deletePath,
      flushInitialOperations,
      flushPendingEvents,
      getBestMatchForTrackedPath,
      getDisplayNameForFiberID,
      getFiberForNative,
      getFiberIDForNative: getInternalIDForNative,
      getInstanceAndStyle,
      findNativeNodesForFiberID: id => {
        const nativeNode = findNativeNodeForInternalID(id);
        return nativeNode == null ? null : [nativeNode];
      },
      getOwnersList,
      getPathForElement,
      getProfilingData,
      handleCommitFiberRoot,
      handleCommitFiberUnmount,
      handlePostCommitFiberRoot,
      inspectElement,
      logElementToConsole,
      overrideError,
      overrideSuspense,
      overrideValueAtPath,
      renamePath,
      patchConsoleForStrictMode,
      prepareViewAttributeSource,
      prepareViewElementSource,
      renderer,
      setTraceUpdatesEnabled,
      setTrackedPath,
      startProfiling,
      stopProfiling,
      storeAsGlobal,
      unpatchConsoleForStrictMode,
      updateComponentFilters
    };
  }
  // CONCATENATED MODULE: ../react-devtools-shared/src/backend/index.js
  /**
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  
  
  
  function initBackend(hook, agent, global) {
    if (hook == null) {
      // DevTools didn't get injected into this page (maybe b'c of the contentType).
      return () => {};
    }
  
    const subs = [hook.sub('renderer-attached', ({
      id,
      renderer,
      rendererInterface
    }) => {
      agent.setRendererInterface(id, rendererInterface); // Now that the Store and the renderer interface are connected,
      // it's time to flush the pending operation codes to the frontend.
  
      rendererInterface.flushInitialOperations();
    }), hook.sub('unsupported-renderer-version', id => {
      agent.onUnsupportedRenderer(id);
    }), hook.sub('fastRefreshScheduled', agent.onFastRefreshScheduled), hook.sub('operations', agent.onHookOperations), hook.sub('traceUpdates', agent.onTraceUpdates) // TODO Add additional subscriptions required for profiling mode
    ];
  
    const attachRenderer = (id, renderer) => {
      let rendererInterface = hook.rendererInterfaces.get(id); // Inject any not-yet-injected renderers (if we didn't reload-and-profile)
  
      if (rendererInterface == null) {
        if (typeof renderer.findFiberByHostInstance === 'function') {
          // react-reconciler v16+
          rendererInterface = Object(backend_renderer["a" /* attach */])(hook, id, renderer, global);
        } else if (renderer.ComponentTree) {
          // react-dom v15
          rendererInterface = attach(hook, id, renderer, global);
        } else {// Older react-dom or other unsupported renderer version
        }
  
        if (rendererInterface != null) {
          hook.rendererInterfaces.set(id, rendererInterface);
        }
      } // Notify the DevTools frontend about new renderers.
      // This includes any that were attached early (via __REACT_DEVTOOLS_ATTACH__).
  
  
      if (rendererInterface != null) {
        hook.emit('renderer-attached', {
          id,
          renderer,
          rendererInterface
        });
      } else {
        hook.emit('unsupported-renderer-version', id);
      }
    }; // Connect renderers that have already injected themselves.
  
  
    hook.renderers.forEach((renderer, id) => {
      attachRenderer(id, renderer);
    }); // Connect any new renderers that injected themselves.
  
    subs.push(hook.sub('renderer', ({
      id,
      renderer
    }) => {
      attachRenderer(id, renderer);
    }));
    hook.emit('react-devtools', agent);
    hook.reactDevtoolsAgent = agent;
  
    const onAgentShutdown = () => {
      subs.forEach(fn => fn());
      hook.rendererInterfaces.forEach(rendererInterface => {
        rendererInterface.cleanup();
      });
      hook.reactDevtoolsAgent = null;
    };
  
    agent.addListener('shutdown', onAgentShutdown);
    subs.push(() => {
      agent.removeListener('shutdown', onAgentShutdown);
    });
    return () => {
      subs.forEach(fn => fn());
    };
  }
  
  /***/ }),
  /* 32 */
  /***/ (function(module, __webpack_exports__, __webpack_require__) {
  
  "use strict";
  // ESM COMPAT FLAG
  __webpack_require__.r(__webpack_exports__);
  
  // EXPORTS
  __webpack_require__.d(__webpack_exports__, "default", function() { return /* binding */ setupNativeStyleEditor; });
  
  // EXTERNAL MODULE: ../react-devtools-shared/src/backend/agent.js + 3 modules
  var backend_agent = __webpack_require__(15);
  
  // CONCATENATED MODULE: ../react-devtools-shared/src/backend/NativeStyleEditor/resolveBoxStyle.js
  /**
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  
  /**
   * This mirrors react-native/Libraries/Inspector/resolveBoxStyle.js (but without RTL support).
   *
   * Resolve a style property into it's component parts, e.g.
   *
   * resolveBoxStyle('margin', {margin: 5, marginBottom: 10})
   * -> {top: 5, left: 5, right: 5, bottom: 10}
   */
  function resolveBoxStyle(prefix, style) {
    let hasParts = false;
    const result = {
      bottom: 0,
      left: 0,
      right: 0,
      top: 0
    };
    const styleForAll = style[prefix];
  
    if (styleForAll != null) {
      // eslint-disable-next-line no-for-of-loops/no-for-of-loops
      for (const key of Object.keys(result)) {
        result[key] = styleForAll;
      }
  
      hasParts = true;
    }
  
    const styleForHorizontal = style[prefix + 'Horizontal'];
  
    if (styleForHorizontal != null) {
      result.left = styleForHorizontal;
      result.right = styleForHorizontal;
      hasParts = true;
    } else {
      const styleForLeft = style[prefix + 'Left'];
  
      if (styleForLeft != null) {
        result.left = styleForLeft;
        hasParts = true;
      }
  
      const styleForRight = style[prefix + 'Right'];
  
      if (styleForRight != null) {
        result.right = styleForRight;
        hasParts = true;
      }
  
      const styleForEnd = style[prefix + 'End'];
  
      if (styleForEnd != null) {
        // TODO RTL support
        result.right = styleForEnd;
        hasParts = true;
      }
  
      const styleForStart = style[prefix + 'Start'];
  
      if (styleForStart != null) {
        // TODO RTL support
        result.left = styleForStart;
        hasParts = true;
      }
    }
  
    const styleForVertical = style[prefix + 'Vertical'];
  
    if (styleForVertical != null) {
      result.bottom = styleForVertical;
      result.top = styleForVertical;
      hasParts = true;
    } else {
      const styleForBottom = style[prefix + 'Bottom'];
  
      if (styleForBottom != null) {
        result.bottom = styleForBottom;
        hasParts = true;
      }
  
      const styleForTop = style[prefix + 'Top'];
  
      if (styleForTop != null) {
        result.top = styleForTop;
        hasParts = true;
      }
    }
  
    return hasParts ? result : null;
  }
  // EXTERNAL MODULE: ../react-devtools-shared/src/isArray.js
  var isArray = __webpack_require__(5);
  
  // CONCATENATED MODULE: ../react-devtools-shared/src/backend/NativeStyleEditor/setupNativeStyleEditor.js
  /**
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  
  
  
  function setupNativeStyleEditor(bridge, agent, resolveNativeStyle, validAttributes) {
    bridge.addListener('NativeStyleEditor_measure', ({
      id,
      rendererID
    }) => {
      measureStyle(agent, bridge, resolveNativeStyle, id, rendererID);
    });
    bridge.addListener('NativeStyleEditor_renameAttribute', ({
      id,
      rendererID,
      oldName,
      newName,
      value
    }) => {
      renameStyle(agent, id, rendererID, oldName, newName, value);
      setTimeout(() => measureStyle(agent, bridge, resolveNativeStyle, id, rendererID));
    });
    bridge.addListener('NativeStyleEditor_setValue', ({
      id,
      rendererID,
      name,
      value
    }) => {
      setStyle(agent, id, rendererID, name, value);
      setTimeout(() => measureStyle(agent, bridge, resolveNativeStyle, id, rendererID));
    });
    bridge.send('isNativeStyleEditorSupported', {
      isSupported: true,
      validAttributes
    });
  }
  const EMPTY_BOX_STYLE = {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  };
  const componentIDToStyleOverrides = new Map();
  
  function measureStyle(agent, bridge, resolveNativeStyle, id, rendererID) {
    const data = agent.getInstanceAndStyle({
      id,
      rendererID
    });
  
    if (!data || !data.style) {
      bridge.send('NativeStyleEditor_styleAndLayout', {
        id,
        layout: null,
        style: null
      });
      return;
    }
  
    const {
      instance,
      style
    } = data;
    let resolvedStyle = resolveNativeStyle(style); // If it's a host component we edited before, amend styles.
  
    const styleOverrides = componentIDToStyleOverrides.get(id);
  
    if (styleOverrides != null) {
      resolvedStyle = Object.assign({}, resolvedStyle, styleOverrides);
    }
  
    if (!instance || typeof instance.measure !== 'function') {
      bridge.send('NativeStyleEditor_styleAndLayout', {
        id,
        layout: null,
        style: resolvedStyle || null
      });
      return;
    }
  
    instance.measure((x, y, width, height, left, top) => {
      // RN Android sometimes returns undefined here. Don't send measurements in this case.
      // https://github.com/jhen0409/react-native-debugger/issues/84#issuecomment-304611817
      if (typeof x !== 'number') {
        bridge.send('NativeStyleEditor_styleAndLayout', {
          id,
          layout: null,
          style: resolvedStyle || null
        });
        return;
      }
  
      const margin = resolvedStyle != null && resolveBoxStyle('margin', resolvedStyle) || EMPTY_BOX_STYLE;
      const padding = resolvedStyle != null && resolveBoxStyle('padding', resolvedStyle) || EMPTY_BOX_STYLE;
      bridge.send('NativeStyleEditor_styleAndLayout', {
        id,
        layout: {
          x,
          y,
          width,
          height,
          left,
          top,
          margin,
          padding
        },
        style: resolvedStyle || null
      });
    });
  }
  
  function shallowClone(object) {
    const cloned = {};
  
    for (const n in object) {
      cloned[n] = object[n];
    }
  
    return cloned;
  }
  
  function renameStyle(agent, id, rendererID, oldName, newName, value) {
    const data = agent.getInstanceAndStyle({
      id,
      rendererID
    });
  
    if (!data || !data.style) {
      return;
    }
  
    const {
      instance,
      style
    } = data;
    const newStyle = newName ? {
      [oldName]: undefined,
      [newName]: value
    } : {
      [oldName]: undefined
    };
    let customStyle; // TODO It would be nice if the renderer interface abstracted this away somehow.
  
    if (instance !== null && typeof instance.setNativeProps === 'function') {
      // In the case of a host component, we need to use setNativeProps().
      // Remember to "correct" resolved styles when we read them next time.
      const styleOverrides = componentIDToStyleOverrides.get(id);
  
      if (!styleOverrides) {
        componentIDToStyleOverrides.set(id, newStyle);
      } else {
        Object.assign(styleOverrides, newStyle);
      } // TODO Fabric does not support setNativeProps; chat with Sebastian or Eli
  
  
      instance.setNativeProps({
        style: newStyle
      });
    } else if (Object(isArray["a" /* default */])(style)) {
      const lastIndex = style.length - 1;
  
      if (typeof style[lastIndex] === 'object' && !Object(isArray["a" /* default */])(style[lastIndex])) {
        customStyle = shallowClone(style[lastIndex]);
        delete customStyle[oldName];
  
        if (newName) {
          customStyle[newName] = value;
        } else {
          customStyle[oldName] = undefined;
        }
  
        agent.overrideValueAtPath({
          type: 'props',
          id,
          rendererID,
          path: ['style', lastIndex],
          value: customStyle
        });
      } else {
        agent.overrideValueAtPath({
          type: 'props',
          id,
          rendererID,
          path: ['style'],
          value: style.concat([newStyle])
        });
      }
    } else if (typeof style === 'object') {
      customStyle = shallowClone(style);
      delete customStyle[oldName];
  
      if (newName) {
        customStyle[newName] = value;
      } else {
        customStyle[oldName] = undefined;
      }
  
      agent.overrideValueAtPath({
        type: 'props',
        id,
        rendererID,
        path: ['style'],
        value: customStyle
      });
    } else {
      agent.overrideValueAtPath({
        type: 'props',
        id,
        rendererID,
        path: ['style'],
        value: [style, newStyle]
      });
    }
  
    agent.emit('hideNativeHighlight');
  }
  
  function setStyle(agent, id, rendererID, name, value) {
    const data = agent.getInstanceAndStyle({
      id,
      rendererID
    });
  
    if (!data || !data.style) {
      return;
    }
  
    const {
      instance,
      style
    } = data;
    const newStyle = {
      [name]: value
    }; // TODO It would be nice if the renderer interface abstracted this away somehow.
  
    if (instance !== null && typeof instance.setNativeProps === 'function') {
      // In the case of a host component, we need to use setNativeProps().
      // Remember to "correct" resolved styles when we read them next time.
      const styleOverrides = componentIDToStyleOverrides.get(id);
  
      if (!styleOverrides) {
        componentIDToStyleOverrides.set(id, newStyle);
      } else {
        Object.assign(styleOverrides, newStyle);
      } // TODO Fabric does not support setNativeProps; chat with Sebastian or Eli
  
  
      instance.setNativeProps({
        style: newStyle
      });
    } else if (Object(isArray["a" /* default */])(style)) {
      const lastLength = style.length - 1;
  
      if (typeof style[lastLength] === 'object' && !Object(isArray["a" /* default */])(style[lastLength])) {
        agent.overrideValueAtPath({
          type: 'props',
          id,
          rendererID,
          path: ['style', lastLength, name],
          value
        });
      } else {
        agent.overrideValueAtPath({
          type: 'props',
          id,
          rendererID,
          path: ['style'],
          value: style.concat([newStyle])
        });
      }
    } else {
      agent.overrideValueAtPath({
        type: 'props',
        id,
        rendererID,
        path: ['style'],
        value: [style, newStyle]
      });
    }
  
    agent.emit('hideNativeHighlight');
  }
  
  /***/ })
  /******/ ]);