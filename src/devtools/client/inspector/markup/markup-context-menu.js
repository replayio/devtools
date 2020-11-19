/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const Services = require("Services");
const promise = require("promise");
const { PSEUDO_CLASSES } = require("devtools/shared/css/constants");
const { LocalizationHelper } = require("devtools/shared/l10n");

loader.lazyRequireGetter(this, "Menu", "devtools/client/framework/menu");
loader.lazyRequireGetter(this, "MenuItem", "devtools/client/framework/menu-item");
loader.lazyRequireGetter(this, "clipboardHelper", "devtools/shared/platform/clipboard");

loader.lazyGetter(this, "TOOLBOX_L10N", function () {
  return new LocalizationHelper("devtools/client/locales/toolbox.properties");
});

const INSPECTOR_L10N = new LocalizationHelper("devtools/client/locales/inspector.properties");

/**
 * Context menu for the Markup view.
 */
class MarkupContextMenu {
  constructor(markup) {
    this.markup = markup;
    this.inspector = markup.inspector;
    this.selection = this.inspector.selection;
    this.target = this.inspector.currentTarget;
    this.telemetry = this.inspector.telemetry;
    this.toolbox = this.inspector.toolbox;
    this.walker = this.inspector.walker;
  }

  destroy() {
    this.markup = null;
    this.inspector = null;
    this.selection = null;
    this.target = null;
    this.telemetry = null;
    this.toolbox = null;
    this.walker = null;
  }

  show(event) {
    if (
      !(event.originalTarget instanceof Element) ||
      event.originalTarget.closest("input[type=text]") ||
      event.originalTarget.closest("input:not([type])") ||
      event.originalTarget.closest("textarea")
    ) {
      return;
    }

    event.stopPropagation();
    event.preventDefault();

    this._openMenu({
      screenX: event.screenX,
      screenY: event.screenY,
      target: event.target,
    });
  }

  /**
   * This method is here for the benefit of copying links.
   */
  _copyAttributeLink(link) {
    this.inspector.inspectorFront.resolveRelativeURL(link, this.selection.nodeFront).then(url => {
      clipboardHelper.copyString(url);
    }, console.error);
  }

  /**
   * Copy the full CSS Path of the selected Node to the clipboard.
   */
  _copyCssPath() {
    if (!this.selection.isNode()) {
      return;
    }

    this.telemetry.scalarSet("devtools.copy.full.css.selector.opened", 1);
    this.selection.nodeFront
      .getCssPath()
      .then(path => {
        clipboardHelper.copyString(path);
      })
      .catch(console.error);
  }

  /**
   * Copy the data-uri for the currently selected image in the clipboard.
   */
  _copyImageDataUri() {
    const container = this.markup.getContainer(this.selection.nodeFront);
    if (container && container.isPreviewable()) {
      container.copyImageDataUri();
    }
  }

  /**
   * Copy the innerHTML of the selected Node to the clipboard.
   */
  _copyInnerHTML() {
    this.markup.copyInnerHTML();
  }

  /**
   * Copy the outerHTML of the selected Node to the clipboard.
   */
  _copyOuterHTML() {
    this.markup.copyOuterHTML();
  }

  /**
   * Copy a unique selector of the selected Node to the clipboard.
   */
  _copyUniqueSelector() {
    if (!this.selection.isNode()) {
      return;
    }

    this.telemetry.scalarSet("devtools.copy.unique.css.selector.opened", 1);
    this.selection.nodeFront
      .getUniqueSelector()
      .then(selector => {
        clipboardHelper.copyString(selector);
      })
      .catch(console.error);
  }

  /**
   * Copy the XPath of the selected Node to the clipboard.
   */
  _copyXPath() {
    if (!this.selection.isNode()) {
      return;
    }

    this.telemetry.scalarSet("devtools.copy.xpath.opened", 1);
    this.selection.nodeFront
      .getXPath()
      .then(path => {
        clipboardHelper.copyString(path);
      })
      .catch(console.error);
  }

  /**
   * Delete the selected node.
   */
  _deleteNode() {
    if (!this.selection.isNode() || this.selection.isRoot()) {
      return;
    }

    const nodeFront = this.selection.nodeFront;

    // If the markup panel is active, use the markup panel to delete
    // the node, making this an undoable action.
    if (this.markup) {
      this.markup.deleteNode(nodeFront);
    } else {
      // remove the node from content
      nodeFront.walkerFront.removeNode(nodeFront);
    }
  }

  /**
   * Duplicate the selected node
   */
  _duplicateNode() {
    if (
      !this.selection.isElementNode() ||
      this.selection.isRoot() ||
      this.selection.isAnonymousNode() ||
      this.selection.isPseudoElementNode()
    ) {
      return;
    }

    const nodeFront = this.selection.nodeFront;
    nodeFront.walkerFront.duplicateNode(nodeFront).catch(console.error);
  }

  /**
   * Edit the outerHTML of the selected Node.
   */
  _editHTML() {
    if (!this.selection.isNode()) {
      return;
    }
    this.markup.beginEditingHTML(this.selection.nodeFront);
  }

  /**
   * Jumps to the custom element definition in the debugger.
   */
  _jumpToCustomElementDefinition() {
    const { url, line, column } = this.selection.nodeFront.customElementLocation;
    this.toolbox.viewSourceInDebugger(url, line, column, null, "show_custom_element");
  }

  /**
   * Add attribute to node.
   * Used for node context menu and shouldn't be called directly.
   */
  _onAddAttribute() {
    const container = this.markup.getContainer(this.selection.nodeFront);
    container.addAttribute();
  }

  /**
   * Copy attribute value for node.
   * Used for node context menu and shouldn't be called directly.
   */
  _onCopyAttributeValue() {
    clipboardHelper.copyString(this.nodeMenuTriggerInfo.value);
  }

  /**
   * This method is here for the benefit of the node-menu-link-copy menu item
   * in the inspector contextual-menu.
   */
  _onCopyLink() {
    this._copyAttributeLink(this.contextMenuTarget.dataset.link);
  }

  /**
   * Edit attribute for node.
   * Used for node context menu and shouldn't be called directly.
   */
  _onEditAttribute() {
    const container = this.markup.getContainer(this.selection.nodeFront);
    container.editAttribute(this.nodeMenuTriggerInfo.name);
  }

  /**
   * This method is here for the benefit of the node-menu-link-follow menu item
   * in the inspector contextual-menu.
   */
  _onFollowLink() {
    const type = this.contextMenuTarget.dataset.type;
    const link = this.contextMenuTarget.dataset.link;
    this.markup.followAttributeLink(type, link);
  }

  /**
   * Remove attribute from node.
   * Used for node context menu and shouldn't be called directly.
   */
  _onRemoveAttribute() {
    const container = this.markup.getContainer(this.selection.nodeFront);
    container.removeAttribute(this.nodeMenuTriggerInfo.name);
  }

  /**
   * Paste the contents of the clipboard as adjacent HTML to the selected Node.
   *
   * @param  {String} position
   *         The position as specified for Element.insertAdjacentHTML
   *         (i.e. "beforeBegin", "afterBegin", "beforeEnd", "afterEnd").
   */
  _pasteAdjacentHTML(position) {
    const content = this._getClipboardContentForPaste();
    if (!content) {
      return promise.reject("No clipboard content for paste");
    }

    const node = this.selection.nodeFront;
    return this.markup.insertAdjacentHTMLToNode(node, position, content);
  }

  /**
   * Paste the contents of the clipboard into the selected Node's inner HTML.
   */
  _pasteInnerHTML() {
    const content = this._getClipboardContentForPaste();
    if (!content) {
      return promise.reject("No clipboard content for paste");
    }

    const node = this.selection.nodeFront;
    return this.markup.getNodeInnerHTML(node).then(oldContent => {
      this.markup.updateNodeInnerHTML(node, content, oldContent);
    });
  }

  /**
   * Paste the contents of the clipboard into the selected Node's outer HTML.
   */
  _pasteOuterHTML() {
    const content = this._getClipboardContentForPaste();
    if (!content) {
      return promise.reject("No clipboard content for paste");
    }

    const node = this.selection.nodeFront;
    return this.markup.getNodeOuterHTML(node).then(oldContent => {
      this.markup.updateNodeOuterHTML(node, content, oldContent);
    });
  }

  /**
   * Show Accessibility properties for currently selected node
   */
  async _showAccessibilityProperties() {
    const a11yPanel = await this.toolbox.selectTool("accessibility");
    // Select the accessible object in the panel and wait for the event that
    // tells us it has been done.
    const onSelected = a11yPanel.once("new-accessible-front-selected");
    a11yPanel.selectAccessibleForNode(this.selection.nodeFront, "inspector-context-menu");
    await onSelected;
  }

  /**
   * Show DOM properties
   */
  _showDOMProperties() {
    this.toolbox.openSplitConsole().then(() => {
      const consolePanel = this.toolbox.getPanel("webconsole");
      consolePanel.evaluateExpression("inspect($0, true)");
    });
  }

  /**
   * Use in Console.
   *
   * Takes the currently selected node in the inspector and assigns it to a
   * temp variable on the content window.  Also opens the split console and
   * autofills it with the temp variable.
   */
  async _useInConsole() {
    return;
    await this.toolbox.openSplitConsole();
    const { hud } = this.toolbox.getPanel("webconsole");

    const evalString = `{ let i = 0;
      while (window.hasOwnProperty("temp" + i) && i < 1000) {
        i++;
      }
      window["temp" + i] = $0;
      "temp" + i;
    }`;

    const options = {
      selectedNodeActor: this.selection.nodeFront.actorID,
    };
    const res = await hud.evaluateJSAsync(evalString, options);
    hud.setInputValue(res.result);
    this.inspector.emit("console-var-ready");
  }

  _buildA11YMenuItem(menu) {
    if (
      !(this.selection.isElementNode() || this.selection.isTextNode()) ||
      !Services.prefs.getBoolPref("devtools.accessibility.enabled")
    ) {
      return;
    }

    const showA11YPropsItem = new MenuItem({
      id: "node-menu-showaccessibilityproperties",
      label: "Show Accessibility Properties",
      click: () => this._showAccessibilityProperties(),
      disabled: true,
    });

    // Only attempt to determine if a11y props menu item needs to be enabled if
    // AccessibilityFront is enabled.
    if (this.inspector.accessibilityFront.enabled) {
      this._updateA11YMenuItem(showA11YPropsItem);
    }

    menu.append(showA11YPropsItem);
  }

  _getAttributesSubmenu(isEditableElement) {
    const attributesSubmenu = new Menu();
    const nodeInfo = this.nodeMenuTriggerInfo;
    const isAttributeClicked = isEditableElement && nodeInfo && nodeInfo.type === "attribute";

    attributesSubmenu.append(
      new MenuItem({
        id: "node-menu-add-attribute",
        label: "Add Attribute",
        accesskey: "A",
        disabled: !isEditableElement,
        click: () => this._onAddAttribute(),
      })
    );
    attributesSubmenu.append(
      new MenuItem({
        id: "node-menu-copy-attribute",
        label: L10N.getFormatStr(
          "inspectorCopyAttributeValue.label",
          isAttributeClicked ? `${nodeInfo.value}` : ""
        ),
        accesskey: "V",
        disabled: !isAttributeClicked,
        click: () => this._onCopyAttributeValue(),
      })
    );
    attributesSubmenu.append(
      new MenuItem({
        id: "node-menu-edit-attribute",
        label: L10N.getFormatStr(
          "inspectorEditAttribute.label",
          isAttributeClicked ? `${nodeInfo.name}` : ""
        ),
        accesskey: "E",
        disabled: !isAttributeClicked,
        click: () => this._onEditAttribute(),
      })
    );
    attributesSubmenu.append(
      new MenuItem({
        id: "node-menu-remove-attribute",
        label: L10N.getFormatStr(
          "inspectorRemoveAttribute.label",
          isAttributeClicked ? `${nodeInfo.name}` : ""
        ),
        accesskey: "R",
        disabled: !isAttributeClicked,
        click: () => this._onRemoveAttribute(),
      })
    );

    return attributesSubmenu;
  }

  /**
   * Returns the clipboard content if it is appropriate for pasting
   * into the current node's outer HTML, otherwise returns null.
   */
  _getClipboardContentForPaste() {
    const content = clipboardHelper.getText();
    if (content && content.trim().length > 0) {
      return content;
    }
    return null;
  }

  _getCopySubmenu(markupContainer, isElement, isFragment) {
    const copySubmenu = new Menu();
    copySubmenu.append(
      new MenuItem({
        id: "node-menu-copyinner",
        label: "Inner HTML",
        accesskey: "I",
        disabled: !isElement && !isFragment,
        click: () => this._copyInnerHTML(),
      })
    );
    copySubmenu.append(
      new MenuItem({
        id: "node-menu-copyouter",
        label: "Outer HTML",
        accesskey: "O",
        disabled: !isElement,
        click: () => this._copyOuterHTML(),
      })
    );
    copySubmenu.append(
      new MenuItem({
        id: "node-menu-copyuniqueselector",
        label: "CSS Selector",
        accesskey: "S",
        disabled: !isElement,
        click: () => this._copyUniqueSelector(),
      })
    );
    copySubmenu.append(
      new MenuItem({
        id: "node-menu-copycsspath",
        label: "CSS Path",
        accesskey: "P",
        disabled: !isElement,
        click: () => this._copyCssPath(),
      })
    );
    copySubmenu.append(
      new MenuItem({
        id: "node-menu-copyxpath",
        label: "XPath",
        accesskey: "X",
        disabled: !isElement,
        click: () => this._copyXPath(),
      })
    );
    copySubmenu.append(
      new MenuItem({
        id: "node-menu-copyimagedatauri",
        label: "Image Data-URL",
        disabled: !isElement || !markupContainer || !markupContainer.isPreviewable(),
        click: () => this._copyImageDataUri(),
      })
    );

    return copySubmenu;
  }

  _getDOMBreakpointSubmenu(isElement) {
    const menu = new Menu();
    const mutationBreakpoints = this.selection.nodeFront.mutationBreakpoints;

    menu.append(
      new MenuItem({
        id: "node-menu-mutation-breakpoint-subtree",
        checked: mutationBreakpoints.subtree,
        click: () => this.markup.toggleMutationBreakpoint("subtree"),
        disabled: !isElement,
        label: "Subtree Modification",
        type: "checkbox",
      })
    );

    menu.append(
      new MenuItem({
        id: "node-menu-mutation-breakpoint-attribute",
        checked: mutationBreakpoints.attribute,
        click: () => this.markup.toggleMutationBreakpoint("attribute"),
        disabled: !isElement,
        label: "Attribute Modification",
        type: "checkbox",
      })
    );

    menu.append(
      new MenuItem({
        checked: mutationBreakpoints.removal,
        click: () => this.markup.toggleMutationBreakpoint("removal"),
        disabled: !isElement,
        label: "Node Removal",
        type: "checkbox",
      })
    );

    return menu;
  }

  /**
   * Link menu items can be shown or hidden depending on the context and
   * selected node, and their labels can vary.
   *
   * @return {Array} list of visible menu items related to links.
   */
  _getNodeLinkMenuItems() {
    const linkFollow = new MenuItem({
      id: "node-menu-link-follow",
      visible: false,
      click: () => this._onFollowLink(),
    });
    const linkCopy = new MenuItem({
      id: "node-menu-link-copy",
      visible: false,
      click: () => this._onCopyLink(),
    });

    // Get information about the right-clicked node.
    const popupNode = this.contextMenuTarget;
    if (!popupNode || !popupNode.classList.contains("link")) {
      return [linkFollow, linkCopy];
    }

    const type = popupNode.dataset.type;
    if (type === "uri" || type === "cssresource" || type === "jsresource") {
      // Links can't be opened in new tabs in the browser toolbox.
      if (type === "uri" && !this.target.chrome) {
        linkFollow.visible = true;
        linkFollow.label = "Open Link in New Tab";
      } else if (type === "cssresource") {
        linkFollow.visible = true;
        linkFollow.label = "Open File in Style-Editor";
      } else if (type === "jsresource") {
        linkFollow.visible = true;
        linkFollow.label = "Open File in Debugger";
      }

      linkCopy.visible = true;
      linkCopy.label = "Copy Link Address";
    } else if (type === "idref") {
      linkFollow.visible = true;
      linkFollow.label = INSPECTOR_L10N.getFormatStr(
        "inspector.menu.selectElement.label",
        popupNode.dataset.link
      );
    }

    return [linkFollow, linkCopy];
  }

  _getPasteSubmenu(isElement, isFragment, isAnonymous) {
    const isPasteable =
      !isAnonymous && (isFragment || isElement) && this._getClipboardContentForPaste();
    const disableAdjacentPaste =
      !isPasteable ||
      !isElement ||
      this.selection.isRoot() ||
      this.selection.isBodyNode() ||
      this.selection.isHeadNode();
    const disableFirstLastPaste =
      !isPasteable || !isElement || (this.selection.isHTMLNode() && this.selection.isRoot());

    const pasteSubmenu = new Menu();
    pasteSubmenu.append(
      new MenuItem({
        id: "node-menu-pasteinnerhtml",
        label: "Inner HTML",
        accesskey: "I",
        disabled: !isPasteable,
        click: () => this._pasteInnerHTML(),
      })
    );
    pasteSubmenu.append(
      new MenuItem({
        id: "node-menu-pasteouterhtml",
        label: "Outer HTML",
        accesskey: "O",
        disabled: !isPasteable || !isElement,
        click: () => this._pasteOuterHTML(),
      })
    );
    pasteSubmenu.append(
      new MenuItem({
        id: "node-menu-pastebefore",
        label: "Before",
        accesskey: "B",
        disabled: disableAdjacentPaste,
        click: () => this._pasteAdjacentHTML("beforeBegin"),
      })
    );
    pasteSubmenu.append(
      new MenuItem({
        id: "node-menu-pasteafter",
        label: "After",
        accesskey: "A",
        disabled: disableAdjacentPaste,
        click: () => this._pasteAdjacentHTML("afterEnd"),
      })
    );
    pasteSubmenu.append(
      new MenuItem({
        id: "node-menu-pastefirstchild",
        label: "As First Child",
        accesskey: "F",
        disabled: disableFirstLastPaste,
        click: () => this._pasteAdjacentHTML("afterBegin"),
      })
    );
    pasteSubmenu.append(
      new MenuItem({
        id: "node-menu-pastelastchild",
        label: "As Last Child",
        accesskey: "L",
        disabled: disableFirstLastPaste,
        click: () => this._pasteAdjacentHTML("beforeEnd"),
      })
    );

    return pasteSubmenu;
  }

  _getPseudoClassSubmenu(isElement) {
    const menu = new Menu();

    // Set the pseudo classes
    for (const name of PSEUDO_CLASSES) {
      const menuitem = new MenuItem({
        id: "node-menu-pseudo-" + name.substr(1),
        label: name.substr(1),
        type: "checkbox",
        click: () => this.inspector.togglePseudoClass(name),
      });

      if (isElement) {
        const checked = this.selection.nodeFront.hasPseudoClassLock(name);
        menuitem.checked = checked;
      } else {
        menuitem.disabled = true;
      }

      menu.append(menuitem);
    }

    return menu;
  }

  _openMenu({ target, screenX = 0, screenY = 0 } = {}) {
    if (this.selection.isSlotted()) {
      // Slotted elements should not show any context menu.
      return null;
    }

    const markupContainer = this.markup.getContainer(this.selection.nodeFront);

    this.contextMenuTarget = target;
    this.nodeMenuTriggerInfo = markupContainer && markupContainer.editor.getInfoAtNode(target);

    const isFragment = this.selection.isDocumentFragmentNode();
    const isAnonymous = this.selection.isAnonymousNode();
    const isElement = this.selection.isElementNode() && !this.selection.isPseudoElementNode();
    const isDuplicatableElement = isElement && !isAnonymous && !this.selection.isRoot();
    const isScreenshotable = isElement && this.selection.nodeFront.isTreeDisplayed;

    const menu = new Menu();
    menu.append(
      new MenuItem({
        id: "node-menu-edithtml",
        label: "Edit As HTML",
        accesskey: "E",
        disabled: isAnonymous || (!isElement && !isFragment),
        click: () => this._editHTML(),
      })
    );
    menu.append(
      new MenuItem({
        id: "node-menu-add",
        label: "Create New Node",
        accesskey: "C",
        disabled: !this.inspector.canAddHTMLChild(),
        click: () => this.inspector.addNode(),
      })
    );
    menu.append(
      new MenuItem({
        id: "node-menu-duplicatenode",
        label: "Duplicate Node",
        disabled: !isDuplicatableElement,
        click: () => this._duplicateNode(),
      })
    );
    menu.append(
      new MenuItem({
        id: "node-menu-delete",
        label: "Delete Node",
        accesskey: "D",
        disabled: !this.markup.isDeletable(this.selection.nodeFront),
        click: () => this._deleteNode(),
      })
    );

    menu.append(
      new MenuItem({
        label: "Attributes",
        accesskey: "A",
        submenu: this._getAttributesSubmenu(isElement && !isAnonymous),
      })
    );

    menu.append(
      new MenuItem({
        type: "separator",
      })
    );

    if (
      Services.prefs.getBoolPref("devtools.markup.mutationBreakpoints.enabled") &&
      this.selection.nodeFront.mutationBreakpoints
    ) {
      menu.append(
        new MenuItem({
          label: "Break on…",
          // FIXME(bug 1598952): This doesn't work in shadow trees at all, but
          // we still display the active menu. Also, this should probably be
          // enabled for ShadowRoot, at least the non-attribute breakpoints.
          submenu: this._getDOMBreakpointSubmenu(isElement),
          id: "node-menu-mutation-breakpoint",
        })
      );
    }

    menu.append(
      new MenuItem({
        id: "node-menu-useinconsole",
        label: "Use in Console",
        click: () => this._useInConsole(),
      })
    );

    menu.append(
      new MenuItem({
        id: "node-menu-showdomproperties",
        label: "Show DOM Properties",
        click: () => this._showDOMProperties(),
      })
    );

    this._buildA11YMenuItem(menu);

    if (this.selection.nodeFront.customElementLocation) {
      menu.append(
        new MenuItem({
          id: "node-menu-jumptodefinition",
          label: "Show Custom Element",
          click: () => this._jumpToCustomElementDefinition(),
        })
      );
    }

    menu.append(
      new MenuItem({
        type: "separator",
      })
    );

    menu.append(
      new MenuItem({
        label: "Change Pseudo-class",
        submenu: this._getPseudoClassSubmenu(isElement),
      })
    );

    menu.append(
      new MenuItem({
        id: "node-menu-screenshotnode",
        label: "Screenshot Node",
        disabled: !isScreenshotable,
        click: () => this.inspector.screenshotNode().catch(console.error),
      })
    );

    menu.append(
      new MenuItem({
        id: "node-menu-scrollnodeintoview",
        label: "Scroll Into View",
        accesskey: "S",
        disabled: !isElement,
        click: () => this.markup.scrollNodeIntoView(),
      })
    );

    menu.append(
      new MenuItem({
        type: "separator",
      })
    );

    menu.append(
      new MenuItem({
        label: "Copy",
        submenu: this._getCopySubmenu(markupContainer, isElement, isFragment),
      })
    );

    menu.append(
      new MenuItem({
        label: "Paste",
        submenu: this._getPasteSubmenu(isElement, isFragment, isAnonymous),
      })
    );

    menu.append(
      new MenuItem({
        type: "separator",
      })
    );

    const isNodeWithChildren = this.selection.isNode() && markupContainer.hasChildren;
    menu.append(
      new MenuItem({
        id: "node-menu-expand",
        label: "Expand All",
        disabled: !isNodeWithChildren,
        click: () => this.markup.expandAll(this.selection.nodeFront),
      })
    );
    menu.append(
      new MenuItem({
        id: "node-menu-collapse",
        label: "Collapse All",
        disabled: !isNodeWithChildren || !markupContainer.expanded,
        click: () => this.markup.collapseAll(this.selection.nodeFront),
      })
    );

    const nodeLinkMenuItems = this._getNodeLinkMenuItems();
    if (nodeLinkMenuItems.filter(item => item.visible).length > 0) {
      menu.append(
        new MenuItem({
          id: "node-menu-link-separator",
          type: "separator",
        })
      );
    }

    for (const menuitem of nodeLinkMenuItems) {
      menu.append(menuitem);
    }

    menu.popup(screenX, screenY, this.toolbox.doc);
    return menu;
  }

  async _updateA11YMenuItem(menuItem) {
    const hasA11YProps = await this.walker.hasAccessibilityProperties(this.selection.nodeFront);
    if (hasA11YProps) {
      const menuItemEl = Menu.getMenuElementById(menuItem.id, this.toolbox.doc);
      menuItemEl.disabled = menuItem.disabled = false;
    }

    this.inspector.emit("node-menu-updated");
  }
}

module.exports = MarkupContextMenu;
