/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const promise = Promise;
const { KeyCodes } = require("devtools/client/shared/keycodes");

const EventEmitter = require("devtools/shared/event-emitter");
const Services = require("devtools/shared/services");
const { ThreadFront } = require("protocol/thread");
import { selection } from "devtools/client/framework/selection";

/**
 * Converts any input field into a document search box.
 *
 * @param {InspectorPanel} inspector
 *        The InspectorPanel whose `walker` attribute should be used for
 *        document traversal.
 * @param {DOMNode} input
 *        The input element to which the panel will be attached and from where
 *        search input will be taken.
 *
 * Emits the following events:
 * - search-cleared: when the search box is emptied
 * - search-result: when a search is made and a result is selected
 */
function InspectorSearch(input) {
  this.searchBox = input;
  this._lastSearched = null;
  this._lastSearchedResults = null;

  this._onKeyDown = this._onKeyDown.bind(this);
  this._onInput = this._onInput.bind(this);
  this._onClearSearch = this._onClearSearch.bind(this);

  this.searchBox.addEventListener("keydown", this._onKeyDown, true);
  this.searchBox.addEventListener("input", this._onInput, true);

  // For testing, we need to be able to wait for the most recent node request
  // to finish.  Tests can watch this promise for that.
  this._lastQuery = promise.resolve(null);

  EventEmitter.decorate(this);
}

const exports = module.exports;
exports.InspectorSearch = InspectorSearch;

InspectorSearch.prototype = {
  destroy: function () {
    this.searchBox.removeEventListener("keydown", this._onKeyDown, true);
    this.searchBox.removeEventListener("input", this._onInput, true);
    this.searchBox = null;
  },

  _onSearch: function (reverse = false) {
    this.doFullTextSearch(this.searchBox.value, reverse).catch(console.error);
  },

  async doFullTextSearch(query, reverse) {
    const lastSearched = this._lastSearched;
    this._lastSearched = query;

    if (lastSearched != query) {
      this._lastSearchedResult = null;
    }

    const searchContainer = this.searchBox.parentNode;

    if (query.length === 0) {
      searchContainer.classList.remove("devtools-searchbox-no-match");
      if (!lastSearched || lastSearched.length > 0) {
        this.emit("search-cleared");
      }
      return;
    }

    if (!this._lastSearchedResult) {
      this._lastSearchedResult = ThreadFront.searchDOM(query);
    }
    const lastSearchedResult = this._lastSearchedResult;
    const nodes = await lastSearchedResult;

    // Value has changed since we started this request, we're done.
    if (lastSearchedResult !== this._lastSearchedResult) {
      return;
    }

    if (nodes.length) {
      const currentNode = selection.nodeFront;
      const currentIndex = currentNode ? nodes.indexOf(currentNode) : -1;
      let index;
      if (currentIndex == -1) {
        index = 0;
      } else if (reverse) {
        index = currentIndex ? currentIndex - 1 : nodes.length - 1;
      } else {
        index = currentIndex != nodes.length - 1 ? currentIndex + 1 : 0;
      }

      const node = nodes[index];
      selection.setNodeFront(node, {
        reason: "inspectorsearch",
      });
      searchContainer.classList.remove("devtools-searchbox-no-match");

      this.emit("search-result", { query, resultsIndex: index, resultsLength: nodes.length });
    } else {
      searchContainer.classList.add("devtools-searchbox-no-match");
      this.emit("search-result");
    }
  },

  _onInput: function () {
    if (this.searchBox.value.length === 0) {
      this._onSearch();
    }
  },

  _onKeyDown: function (event) {
    if (event.key == "Enter") {
      this._onSearch(event.shiftKey);
    }

    const modifierKey = Services.appinfo.OS === "Darwin" ? event.metaKey : event.ctrlKey;
    if (event.key === "g" && modifierKey) {
      this._onSearch(event.shiftKey);
      event.preventDefault();
    }
  },

  _onClearSearch: function () {
    this.searchBox.parentNode.classList.remove("devtools-searchbox-no-match");
    this.searchBox.value = "";
    this.emit("search-cleared");
  },
};
