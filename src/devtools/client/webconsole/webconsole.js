/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import EventEmitter from "devtools/shared/event-emitter";

import { createElement, createFactory } from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import actions from "devtools/client/webconsole/actions/index";
import * as selectors from "devtools/client/webconsole/selectors/index";
import { configureStore } from "devtools/client/webconsole/store";
import { setupConsoleHelper } from "ui/utils/bootstrap/helpers";
import { setupMessages } from "devtools/client/webconsole/actions/messages";

const App = createFactory(require("devtools/client/webconsole/components/App"));

function renderApp({ app, store, root }) {
  return ReactDOM.render(createElement(Provider, { store }, app), root);
}

function initOutputSyntaxHighlighting() {
  // Given a DOM node, we syntax highlight identically to how the input field
  // looks. See https://codemirror.net/demo/runmode.html;
  const syntaxHighlightNode = node => {
    const editor = window.jsterm.editor;
    if (node && editor) {
      node.classList.add("cm-s-mozilla");
      editor.CodeMirror.runMode(node.textContent, "application/javascript", node);
    }
  };

  // Use a Custom Element to handle syntax highlighting to avoid
  // dealing with refs or innerHTML from React.
  customElements.define(
    "syntax-highlighted",
    class extends HTMLElement {
      connectedCallback() {
        if (!this.connected) {
          this.connected = true;
          syntaxHighlightNode(this);
        }
      }
    }
  );
}

export class WebConsole {
  constructor(toolbox) {
    this.toolbox = toolbox;
    this.document = document;
    EventEmitter.decorate(this);
  }

  async init() {
    const store = configureStore(this, {
      thunkArgs: {
        hud: this,
        toolbox: this.toolbox,
      },
    });

    setupMessages(store);
    renderApp({
      app: App(),
      store,
      root: document.getElementById("toolbox-content-console"),
    });

    setupConsoleHelper({ store, selectors, actions });
    initOutputSyntaxHighlighting();
    return { store };
  }
}
