/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const DevToolsUtils = require("devtools/shared/DevToolsUtils");
const EventEmitter = require("devtools/shared/event-emitter");
const { getCurrentZoom } = require("devtools/shared/layout/utils");

/**
 * A partial implementation of the Menu API provided by electron:
 * https://github.com/electron/electron/blob/master/docs/api/menu.md.
 *
 * Extra features:
 *  - Emits an 'open' and 'close' event when the menu is opened/closed

 * @param String id (non standard)
 *        Needed so tests can confirm the XUL implementation is working
 */
function Menu({ id = null } = {}) {
  this.menuitems = [];
  this.id = id;

  Object.defineProperty(this, "items", {
    get() {
      return this.menuitems;
    },
  });

  EventEmitter.decorate(this);
}

/**
 * Add an item to the end of the Menu
 *
 * @param {MenuItem} menuItem
 */
Menu.prototype.append = function (menuItem) {
  this.menuitems.push(menuItem);
};

/**
 * Remove all items from the Menu
 */
Menu.prototype.clear = function () {
  this.menuitems = [];
};

/**
 * Add an item to a specified position in the menu
 *
 * @param {int} pos
 * @param {MenuItem} menuItem
 */
Menu.prototype.insert = function (pos, menuItem) {
  throw Error("Not implemented");
};

/**
 * Show the Menu next to the provided target. Anchor point is bottom-left.
 *
 * @param {Element} target
 *        The element to use as anchor.
 * @param {Document} doc
 *        The document that should own the popup.
 */
Menu.prototype.popupAtTarget = function (target, doc) {
  const zoom = getCurrentZoom(doc);

  const rect = target.getBoundingClientRect();
  const defaultView = target.ownerDocument.defaultView;
  const x = rect.left + defaultView.mozInnerScreenX;
  const y = rect.bottom + defaultView.mozInnerScreenY;

  this.popup(x * zoom, y * zoom, doc);
};

// No matter what, only allow one context menu to exist at a time.
let gMenuPopup;

/**
 * Show the Menu at a specified location on the screen
 *
 * Missing features:
 *   - browserWindow - BrowserWindow (optional) - Default is null.
 *   - positioningItem Number - (optional) OS X
 *
 * @param {int} screenX
 * @param {int} screenY
 */
Menu.prototype.popup = function (screenX, screenY) {
  // The context-menu will be created in the topmost window to preserve keyboard
  // navigation (see Bug 1543940).
  // Keep a reference on the window owning the menu to hide the popup on unload.
  const win = window;
  const doc = document;

  const popup = doc.createElement("div");
  popup.className = "context-menu";
  popup.style.position = "absolute";
  popup.style.top = "0px";
  popup.style.left = "0px";

  popup.setAttribute("menu-api", "true");
  popup.setAttribute("consumeoutsideclicks", "false");
  popup.setAttribute("incontentshell", "false");

  if (this.id) {
    popup.id = this.id;
  }
  this._createMenuItems(popup);

  // Remove the menu from the DOM once it's hidden.
  popup.addEventListener("popuphidden", e => {
    if (e.target === popup) {
      win.removeEventListener("unload", onWindowUnload);
      popup.remove();
      this.emit("close");
    }
  });

  popup.addEventListener("popupshown", e => {
    if (e.target === popup) {
      this.emit("open");
    }
  });

  if (gMenuPopup) {
    try {
      document.body.removeChild(gMenuPopup);
    } catch (e) {}
  }
  gMenuPopup = popup;

  document.body.appendChild(popup);

  const { width, height } = popup.getBoundingClientRect();
  const top = Math.min(screenY, window.innerHeight - height - 2);
  const left = Math.min(screenX, window.innerWidth - width - 2);

  popup.style.top = `${top}px`;
  popup.style.left = `${left}px`;

  const listener = () => {
    if (popup) {
      document.body.removeChild(popup);
    }
    gMenuPopup = null;
    document.removeEventListener("mousedown", listener);
    document.body.removeEventListener("contextmenu", listener);
  };

  document.addEventListener("mousedown", listener);
  document.body.addEventListener("contextmenu", listener);
};

Menu.prototype._createMenuItems = function (parent) {
  const doc = parent.ownerDocument;
  this.menuitems.forEach(item => {
    if (!item.visible) {
      return;
    }

    if (item.submenu) {
      const menupopup = doc.createElement("div");
      menupopup.className = "context-submenu";
      menupopup.setAttribute("incontentshell", "false");

      item.submenu._createMenuItems(menupopup);

      const menu = doc.createElement("div");
      menu.className = "context-menu-item";
      menu.appendChild(menupopup);
      applyItemAttributesToNode(item, menu);
      parent.appendChild(menu);
    } else if (item.type === "separator") {
      const menusep = doc.createElement("div");
      menusep.className = "context-menu-separator";
      parent.appendChild(menusep);
    } else {
      const menuitem = doc.createElement("div");
      menuitem.className = "context-menu-item";
      applyItemAttributesToNode(item, menuitem);
      menuitem.addEventListener("mousedown", () => item.click());
      menuitem.addEventListener("mouseenter", () => item.hover());

      parent.appendChild(menuitem);
    }
  });
};

Menu.getMenuElementById = function (id, doc) {
  const menuDoc = DevToolsUtils.getTopWindow(doc.defaultView).document;
  return menuDoc.getElementById(id);
};

Menu.setApplicationMenu = () => {
  throw Error("Not implemented");
};

Menu.sendActionToFirstResponder = () => {
  throw Error("Not implemented");
};

Menu.buildFromTemplate = () => {
  throw Error("Not implemented");
};

function applyItemAttributesToNode(item, node) {
  if (item.l10nID) {
    node.setAttribute("data-l10n-id", item.l10nID);
  } else {
    node.innerText = item.label;
    node.setAttribute("label", item.label);
    if (item.accelerator) {
      node.setAttribute("acceltext", item.accelerator);
    }
    if (item.accesskey) {
      node.setAttribute("accesskey", item.accesskey);
    }
  }
  if (item.type === "checkbox") {
    node.setAttribute("type", "checkbox");
  }
  if (item.type === "radio") {
    node.setAttribute("type", "radio");
  }
  if (item.disabled) {
    node.className += " disabled";
  }
  if (item.checked) {
    node.setAttribute("checked", "true");
  }
  if (item.image) {
    node.setAttribute("image", item.image);
  }
  if (item.id) {
    node.id = item.id;
  }
}

module.exports = Menu;
