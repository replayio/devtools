/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const React = require("react");
const dom = require("react-dom-factories");
const PropTypes = require("prop-types");
const { KeyCodes } = require("devtools/client/shared/keycodes");
const { LocalizationHelper } = require("devtools/shared/l10n");

const BoxModelEditable = require("devtools/client/inspector/boxmodel/components/BoxModelEditable");

const Types = require("devtools/client/inspector/boxmodel/types");

const SHARED_STRINGS_URI = "devtools/client/locales/shared.properties";
const SHARED_L10N = new LocalizationHelper(SHARED_STRINGS_URI);

class BoxModelMain extends React.PureComponent {
  static get propTypes() {
    return {
      boxModel: PropTypes.shape(Types.boxModel).isRequired,
      boxModelContainer: PropTypes.object,
      onHideBoxModelHighlighter: PropTypes.func.isRequired,
      onShowBoxModelEditor: PropTypes.func.isRequired,
      onShowBoxModelHighlighter: PropTypes.func.isRequired,
    };
  }

  constructor(props) {
    super(props);

    this.state = {
      activeDescendant: null,
      focusable: false,
    };

    this.getAriaActiveDescendant = this.getAriaActiveDescendant.bind(this);
    this.getBorderOrPaddingValue = this.getBorderOrPaddingValue.bind(this);
    this.getContextBox = this.getContextBox.bind(this);
    this.getDisplayPosition = this.getDisplayPosition.bind(this);
    this.getHeightValue = this.getHeightValue.bind(this);
    this.getMarginValue = this.getMarginValue.bind(this);
    this.getPositionValue = this.getPositionValue.bind(this);
    this.getWidthValue = this.getWidthValue.bind(this);
    this.moveFocus = this.moveFocus.bind(this);
    this.onHighlightMouseOver = this.onHighlightMouseOver.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onLevelClick = this.onLevelClick.bind(this);
    this.setAriaActive = this.setAriaActive.bind(this);
  }

  componentDidMount() {
    this.updateLayouts();
  }

  componentDidUpdate() {
    this.updateLayouts();
  }

  updateLayouts() {
    const displayPosition = this.getDisplayPosition();
    const isContentBox = this.getContextBox();

    this.layouts = {
      position: new Map([
        [KeyCodes.DOM_VK_ESCAPE, this.positionLayout],
        [KeyCodes.DOM_VK_DOWN, this.marginLayout],
        [KeyCodes.DOM_VK_RETURN, this.positionEditable],
        [KeyCodes.DOM_VK_UP, null],
        ["click", this.positionLayout],
      ]),
      margin: new Map([
        [KeyCodes.DOM_VK_ESCAPE, this.marginLayout],
        [KeyCodes.DOM_VK_DOWN, this.borderLayout],
        [KeyCodes.DOM_VK_RETURN, this.marginEditable],
        [KeyCodes.DOM_VK_UP, displayPosition ? this.positionLayout : null],
        ["click", this.marginLayout],
      ]),
      border: new Map([
        [KeyCodes.DOM_VK_ESCAPE, this.borderLayout],
        [KeyCodes.DOM_VK_DOWN, this.paddingLayout],
        [KeyCodes.DOM_VK_RETURN, this.borderEditable],
        [KeyCodes.DOM_VK_UP, this.marginLayout],
        ["click", this.borderLayout],
      ]),
      padding: new Map([
        [KeyCodes.DOM_VK_ESCAPE, this.paddingLayout],
        [KeyCodes.DOM_VK_DOWN, isContentBox ? this.contentLayout : null],
        [KeyCodes.DOM_VK_RETURN, this.paddingEditable],
        [KeyCodes.DOM_VK_UP, this.borderLayout],
        ["click", this.paddingLayout],
      ]),
      content: new Map([
        [KeyCodes.DOM_VK_ESCAPE, this.contentLayout],
        [KeyCodes.DOM_VK_DOWN, null],
        [KeyCodes.DOM_VK_RETURN, this.contentEditable],
        [KeyCodes.DOM_VK_UP, this.paddingLayout],
        ["click", this.contentLayout],
      ]),
    };
  }

  getAriaActiveDescendant() {
    let { activeDescendant } = this.state;

    if (!activeDescendant) {
      const displayPosition = this.getDisplayPosition();
      const nextLayout = displayPosition ? this.positionLayout : this.marginLayout;
      activeDescendant = nextLayout.getAttribute("data-box");
      this.setAriaActive(nextLayout);
    }

    return activeDescendant;
  }

  getBorderOrPaddingValue(property) {
    const { layout } = this.props.boxModel;
    return layout[property] ? parseFloat(layout[property]) : "-";
  }

  /**
   * Returns true if the layout box sizing is context box and false otherwise.
   */
  getContextBox() {
    const { layout } = this.props.boxModel;
    return layout["box-sizing"] == "content-box";
  }

  /**
   * Returns true if the position is displayed and false otherwise.
   */
  getDisplayPosition() {
    const { layout } = this.props.boxModel;
    return layout.position && layout.position != "static";
  }

  getHeightValue(property) {
    if (property == undefined) {
      return "-";
    }

    const { layout } = this.props.boxModel;

    property -=
      parseFloat(layout["border-top-width"] || 0) +
      parseFloat(layout["border-bottom-width"] || 0) +
      parseFloat(layout["padding-top"] || 0) +
      parseFloat(layout["padding-bottom"] || 0);
    property = parseFloat(property.toPrecision(6));

    return property;
  }

  getMarginValue(property, direction) {
    const { layout } = this.props.boxModel;
    const autoMargins = layout.autoMargins || {};
    let value = "-";

    if (direction in autoMargins) {
      value = autoMargins[direction];
    } else if (layout[property]) {
      const parsedValue = parseFloat(layout[property]);

      if (Number.isNaN(parsedValue)) {
        // Not a number. We use the raw string.
        // Useful for pseudo-elements with auto margins since they
        // don't appear in autoMargins.
        value = layout[property];
      } else {
        value = parsedValue;
      }
    }

    return value;
  }

  getPositionValue(property) {
    const { layout } = this.props.boxModel;
    let value = "-";

    if (!layout[property]) {
      return value;
    }

    const parsedValue = parseFloat(layout[property]);

    if (Number.isNaN(parsedValue)) {
      // Not a number. We use the raw string.
      value = layout[property];
    } else {
      value = parsedValue;
    }

    return value;
  }

  getWidthValue(property) {
    if (property == undefined) {
      return "-";
    }

    const { layout } = this.props.boxModel;

    property -=
      parseFloat(layout["border-left-width"] || 0) +
      parseFloat(layout["border-right-width"] || 0) +
      parseFloat(layout["padding-left"] || 0) +
      parseFloat(layout["padding-right"] || 0);
    property = parseFloat(property.toPrecision(6));

    return property;
  }

  /**
   * Move the focus to the next/previous editable element of the current layout.
   *
   * @param  {Element} target
   *         Node to be observed
   * @param  {Boolean} shiftKey
   *         Determines if shiftKey was pressed
   * @param  {String} level
   *         Current active layout
   */
  moveFocus({ target, shiftKey }, level) {
    const editBoxes = [
      ...this.positionLayout.querySelectorAll(`[data-box="${level}"].boxmodel-editable`),
    ];
    const editingMode = target.tagName === "input";
    // target.nextSibling is input field
    let position = editingMode ? editBoxes.indexOf(target.nextSibling) : editBoxes.indexOf(target);

    if (position === editBoxes.length - 1 && !shiftKey) {
      position = 0;
    } else if (position === 0 && shiftKey) {
      position = editBoxes.length - 1;
    } else {
      shiftKey ? position-- : position++;
    }

    const editBox = editBoxes[position];
    editBox.focus();

    if (editingMode) {
      editBox.click();
    }
  }

  /**
   * Active aria-level set to current layout.
   *
   * @param  {Element} nextLayout
   *         Element of next layout that user has navigated to
   */
  setAriaActive(nextLayout) {
    const { boxModelContainer } = this.props;

    // We set this attribute for testing purposes.
    if (boxModelContainer) {
      boxModelContainer.setAttribute("activedescendant", nextLayout.className);
    }

    this.setState({
      activeDescendant: nextLayout.getAttribute("data-box"),
    });
  }

  onHighlightMouseOver(event) {
    let region = event.target.getAttribute("data-box");

    if (!region) {
      let el = event.target;

      do {
        el = el.parentNode;

        if (el && el.getAttribute("data-box")) {
          region = el.getAttribute("data-box");
          break;
        }
      } while (el.parentNode);

      this.props.onHideBoxModelHighlighter();
    }

    this.props.onShowBoxModelHighlighter({
      region,
      showOnly: region,
      onlyRegionArea: true,
    });

    event.preventDefault();
  }

  /**
   * Handle keyboard navigation and focus for box model layouts.
   *
   * Updates active layout on arrow key navigation
   * Focuses next layout's editboxes on enter key
   * Unfocuses current layout's editboxes when active layout changes
   * Controls tabbing between editBoxes
   *
   * @param  {Event} event
   *         The event triggered by a keypress on the box model
   */
  onKeyDown(event) {
    const { target, keyCode } = event;
    const isEditable = target._editable || target.editor;

    const level = this.getAriaActiveDescendant();
    const editingMode = target.tagName === "input";

    switch (keyCode) {
      case KeyCodes.DOM_VK_RETURN:
        if (!isEditable) {
          this.setState({ focusable: true }, () => {
            const editableBox = this.layouts[level].get(keyCode);
            if (editableBox) {
              editableBox.boxModelEditable.focus();
            }
          });
        }
        break;
      case KeyCodes.DOM_VK_DOWN:
      case KeyCodes.DOM_VK_UP:
        if (!editingMode) {
          event.preventDefault();
          event.stopPropagation();
          this.setState({ focusable: false }, () => {
            const nextLayout = this.layouts[level].get(keyCode);

            if (!nextLayout) {
              return;
            }

            this.setAriaActive(nextLayout);

            if (target && target._editable) {
              target.blur();
            }

            this.props.boxModelContainer.focus();
          });
        }
        break;
      case KeyCodes.DOM_VK_TAB:
        if (isEditable) {
          event.preventDefault();
          this.moveFocus(event, level);
        }
        break;
      case KeyCodes.DOM_VK_ESCAPE:
        if (target._editable) {
          event.preventDefault();
          event.stopPropagation();
          this.setState({ focusable: false }, () => {
            this.props.boxModelContainer.focus();
          });
        }
        break;
      default:
        break;
    }
  }

  /**
   * Update aria-active on mouse click.
   *
   * @param  {Event} event
   *         The event triggered by a mouse click on the box model
   */
  onLevelClick(event) {
    const { target } = event;
    const displayPosition = this.getDisplayPosition();
    const isContentBox = this.getContextBox();

    // Avoid switching the aria active descendant to the position or content layout
    // if those are not editable.
    if (
      (!displayPosition && target == this.positionLayout) ||
      (!isContentBox && target == this.contentLayout)
    ) {
      return;
    }

    const nextLayout = this.layouts[target.getAttribute("data-box")].get("click");
    this.setAriaActive(nextLayout);

    if (target && target._editable) {
      target.blur();
    }
  }

  render() {
    const { boxModel, onShowBoxModelEditor, onShowRulePreviewTooltip } = this.props;
    const { layout } = boxModel;
    let { height, width } = layout;
    const { activeDescendant: level, focusable } = this.state;

    const borderTop = this.getBorderOrPaddingValue("border-top-width");
    const borderRight = this.getBorderOrPaddingValue("border-right-width");
    const borderBottom = this.getBorderOrPaddingValue("border-bottom-width");
    const borderLeft = this.getBorderOrPaddingValue("border-left-width");

    const paddingTop = this.getBorderOrPaddingValue("padding-top");
    const paddingRight = this.getBorderOrPaddingValue("padding-right");
    const paddingBottom = this.getBorderOrPaddingValue("padding-bottom");
    const paddingLeft = this.getBorderOrPaddingValue("padding-left");

    const displayPosition = this.getDisplayPosition();
    const positionTop = this.getPositionValue("top");
    const positionRight = this.getPositionValue("right");
    const positionBottom = this.getPositionValue("bottom");
    const positionLeft = this.getPositionValue("left");

    const marginTop = this.getMarginValue("margin-top", "top");
    const marginRight = this.getMarginValue("margin-right", "right");
    const marginBottom = this.getMarginValue("margin-bottom", "bottom");
    const marginLeft = this.getMarginValue("margin-left", "left");

    height = this.getHeightValue(height);
    width = this.getWidthValue(width);

    const contentBox =
      layout["box-sizing"] == "content-box"
        ? dom.div(
            { className: "boxmodel-size" },
            React.createElement(BoxModelEditable, {
              box: "content",
              focusable,
              level,
              property: "width",
              ref: editable => {
                this.contentEditable = editable;
              },
              textContent: width,
              onShowBoxModelEditor,
              onShowRulePreviewTooltip,
            }),
            dom.span({}, "\u00D7"),
            React.createElement(BoxModelEditable, {
              box: "content",
              focusable,
              level,
              property: "height",
              textContent: height,
              onShowBoxModelEditor,
              onShowRulePreviewTooltip,
            })
          )
        : dom.p(
            { className: "boxmodel-size" },
            dom.span({ title: "content" }, SHARED_L10N.getFormatStr("dimensions", width, height))
          );

    return dom.div(
      {
        className: "boxmodel-main devtools-monospace",
        "data-box": "position",
        ref: div => {
          this.positionLayout = div;
        },
        onClick: this.onLevelClick,
        onKeyDown: this.onKeyDown,
        onMouseOver: this.onHighlightMouseOver,
        onMouseOut: this.props.onHideBoxModelHighlighter,
      },
      displayPosition
        ? dom.span(
            {
              className: "boxmodel-legend",
              "data-box": "position",
              title: "position",
            },
            "position"
          )
        : null,
      dom.div(
        { className: "boxmodel-box" },
        dom.span(
          {
            className: "boxmodel-legend",
            "data-box": "margin",
            title: "margin",
          },
          "margin"
        ),
        dom.div(
          {
            className: "boxmodel-margins",
            "data-box": "margin",
            title: "margin",
            ref: div => {
              this.marginLayout = div;
            },
          },
          dom.span(
            {
              className: "boxmodel-legend",
              "data-box": "border",
              title: "border",
            },
            "border"
          ),
          dom.div(
            {
              className: "boxmodel-borders",
              "data-box": "border",
              title: "border",
              ref: div => {
                this.borderLayout = div;
              },
            },
            dom.span(
              {
                className: "boxmodel-legend",
                "data-box": "padding",
                title: "padding",
              },
              "padding"
            ),
            dom.div(
              {
                className: "boxmodel-paddings",
                "data-box": "padding",
                title: "padding",
                ref: div => {
                  this.paddingLayout = div;
                },
              },
              dom.div({
                className: "boxmodel-contents",
                "data-box": "content",
                title: "content",
                ref: div => {
                  this.contentLayout = div;
                },
              })
            )
          )
        )
      ),
      displayPosition
        ? React.createElement(BoxModelEditable, {
            box: "position",
            direction: "top",
            focusable,
            level,
            property: "position-top",
            ref: editable => {
              this.positionEditable = editable;
            },
            textContent: positionTop,
            onShowBoxModelEditor,
            onShowRulePreviewTooltip,
          })
        : null,
      displayPosition
        ? React.createElement(BoxModelEditable, {
            box: "position",
            direction: "right",
            focusable,
            level,
            property: "position-right",
            textContent: positionRight,
            onShowBoxModelEditor,
            onShowRulePreviewTooltip,
          })
        : null,
      displayPosition
        ? React.createElement(BoxModelEditable, {
            box: "position",
            direction: "bottom",
            focusable,
            level,
            property: "position-bottom",
            textContent: positionBottom,
            onShowBoxModelEditor,
            onShowRulePreviewTooltip,
          })
        : null,
      displayPosition
        ? React.createElement(BoxModelEditable, {
            box: "position",
            direction: "left",
            focusable,
            level,
            property: "position-left",
            textContent: positionLeft,
            onShowBoxModelEditor,
            onShowRulePreviewTooltip,
          })
        : null,
      React.createElement(BoxModelEditable, {
        box: "margin",
        direction: "top",
        focusable,
        level,
        property: "margin-top",
        ref: editable => {
          this.marginEditable = editable;
        },
        textContent: marginTop,
        onShowBoxModelEditor,
        onShowRulePreviewTooltip,
      }),
      React.createElement(BoxModelEditable, {
        box: "margin",
        direction: "right",
        focusable,
        level,
        property: "margin-right",
        textContent: marginRight,
        onShowBoxModelEditor,
        onShowRulePreviewTooltip,
      }),
      React.createElement(BoxModelEditable, {
        box: "margin",
        direction: "bottom",
        focusable,
        level,
        property: "margin-bottom",
        textContent: marginBottom,
        onShowBoxModelEditor,
        onShowRulePreviewTooltip,
      }),
      React.createElement(BoxModelEditable, {
        box: "margin",
        direction: "left",
        focusable,
        level,
        property: "margin-left",
        textContent: marginLeft,
        onShowBoxModelEditor,
        onShowRulePreviewTooltip,
      }),
      React.createElement(BoxModelEditable, {
        box: "border",
        direction: "top",
        focusable,
        level,
        property: "border-top-width",
        ref: editable => {
          this.borderEditable = editable;
        },
        textContent: borderTop,
        onShowBoxModelEditor,
        onShowRulePreviewTooltip,
      }),
      React.createElement(BoxModelEditable, {
        box: "border",
        direction: "right",
        focusable,
        level,
        property: "border-right-width",
        textContent: borderRight,
        onShowBoxModelEditor,
        onShowRulePreviewTooltip,
      }),
      React.createElement(BoxModelEditable, {
        box: "border",
        direction: "bottom",
        focusable,
        level,
        property: "border-bottom-width",
        textContent: borderBottom,
        onShowBoxModelEditor,
        onShowRulePreviewTooltip,
      }),
      React.createElement(BoxModelEditable, {
        box: "border",
        direction: "left",
        focusable,
        level,
        property: "border-left-width",
        textContent: borderLeft,
        onShowBoxModelEditor,
        onShowRulePreviewTooltip,
      }),
      React.createElement(BoxModelEditable, {
        box: "padding",
        direction: "top",
        focusable,
        level,
        property: "padding-top",
        ref: editable => {
          this.paddingEditable = editable;
        },
        textContent: paddingTop,
        onShowBoxModelEditor,
        onShowRulePreviewTooltip,
      }),
      React.createElement(BoxModelEditable, {
        box: "padding",
        direction: "right",
        focusable,
        level,
        property: "padding-right",
        textContent: paddingRight,
        onShowBoxModelEditor,
        onShowRulePreviewTooltip,
      }),
      React.createElement(BoxModelEditable, {
        box: "padding",
        direction: "bottom",
        focusable,
        level,
        property: "padding-bottom",
        textContent: paddingBottom,
        onShowBoxModelEditor,
        onShowRulePreviewTooltip,
      }),
      React.createElement(BoxModelEditable, {
        box: "padding",
        direction: "left",
        focusable,
        level,
        property: "padding-left",
        textContent: paddingLeft,
        onShowBoxModelEditor,
        onShowRulePreviewTooltip,
      }),
      contentBox
    );
  }
}

module.exports = BoxModelMain;
