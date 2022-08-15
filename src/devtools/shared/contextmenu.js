const Menu = require("devtools/client/framework/menu");
const MenuItem = require("devtools/client/framework/menu-item");

function inToolbox() {
  try {
    return window.parent.document.documentURI.startsWith("about:devtools-toolbox");
  } catch (e) {
    // If `window` is not available, it's very likely that we are in the toolbox.
    return true;
  }
}

function onShown(menu, popup) {
  popup.childNodes.forEach((menuItemNode, i) => {
    let item = menu.items[i];

    if (!item.disabled && item.visible) {
      menuItemNode.onclick = () => {
        item.click();
        popup.hidePopup();
      };

      showSubMenu(item.submenu, menuItemNode, popup);
    }
  });
}

function showMenu(evt, items) {
  if (items.length === 0) {
    return;
  }

  let menu = new Menu();
  items
    .filter(item => item.visible === undefined || item.visible === true)
    .forEach(item => {
      let menuItem = new MenuItem(item);
      menuItem.submenu = createSubMenu(item.submenu);
      menu.append(menuItem);
    });

  if (inToolbox()) {
    menu.popup(evt.screenX, evt.screenY, window.parent.document);
    return;
  }

  menu.on("open", (_, popup) => onShown(menu, popup));
  menu.popup(evt.clientX, evt.clientY, document);
}

function createSubMenu(subItems) {
  if (subItems) {
    let subMenu = new Menu();
    subItems.forEach(subItem => {
      subMenu.append(new MenuItem(subItem));
    });
    return subMenu;
  }

  return null;
}

function showSubMenu(subMenu, menuItemNode, popup) {
  if (subMenu) {
    let subMenuNode = menuItemNode.querySelector("menupopup");
    let { top } = menuItemNode.getBoundingClientRect();
    let { left, width } = popup.getBoundingClientRect();
    subMenuNode.style.setProperty("left", `${left + width - 1}px`);
    subMenuNode.style.setProperty("top", `${top}px`);
    let subMenuItemNodes = menuItemNode.querySelector("menupopup:not(.landing-popup)").childNodes;
    subMenuItemNodes.forEach((subMenuItemNode, j) => {
      let subMenuItem = subMenu.items.filter(
        item => item.visible === undefined || item.visible === true
      )[j];

      if (!subMenuItem.disabled && subMenuItem.visible) {
        subMenuItemNode.onclick = () => {
          subMenuItem.click();
          popup.hidePopup();
        };
      }
    });
  }
}

function buildMenu(items) {
  return items
    .map(itm => {
      const hide = typeof itm.hidden === "function" ? itm.hidden() : itm.hidden;
      return hide ? null : itm.item;
    })
    .filter(itm => itm !== null);
}

module.exports = {
  showMenu,
  buildMenu,
};
