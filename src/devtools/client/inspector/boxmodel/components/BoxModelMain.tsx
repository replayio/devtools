/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from "react";
import { ConnectedProps, connect } from "react-redux";

import { highlightNode, unhighlightNode } from "devtools/client/inspector/markup/actions/markup";
import { UIState } from "ui/state";
import type { Layout, LayoutNumericFields } from "ui/suspense/styleCaches";

import { getSelectedNodeId } from "../../markup/selectors/markup";
import { BoxModelSideLabel } from "./BoxModelSideLabel";

interface BMMProps {
  layout: Layout;
}

const mapState = (state: UIState) => ({
  selectedNodeId: getSelectedNodeId(state),
});

const connector = connect(mapState, { highlightNode, unhighlightNode });
type PropsFromRedux = ConnectedProps<typeof connector>;

type FinalBMMProps = BMMProps & PropsFromRedux;

export class BoxModelMain extends React.PureComponent<FinalBMMProps> {
  getBorderOrPaddingValue = (property: keyof LayoutNumericFields) => {
    const { layout } = this.props;
    return layout[property] ? parseFloat(layout[property]) : "-";
  };

  /**
   * Returns true if the layout box sizing is context box and false otherwise.
   */
  getContextBox = () => {
    const { layout } = this.props;
    return layout["box-sizing"] == "content-box";
  };

  /**
   * Returns true if the position is displayed and false otherwise.
   */
  getDisplayPosition = () => {
    const { layout } = this.props;
    return layout.position && layout.position != "static";
  };

  getHeightValue = (property?: number) => {
    if (property == undefined) {
      return "-";
    }

    const { layout } = this.props;

    property -=
      parseFloat(layout["border-top-width"] || "0") +
      parseFloat(layout["border-bottom-width"] || "0") +
      parseFloat(layout["padding-top"] || "0") +
      parseFloat(layout["padding-bottom"] || "0");
    property = parseFloat(property.toPrecision(6));

    return property;
  };

  getMarginValue = (property: keyof LayoutNumericFields, direction: string) => {
    const { layout } = this.props;
    const autoMargins = layout.autoMargins || {};
    let value: string | number = "-";

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
  };

  getPositionValue = (property: keyof LayoutNumericFields) => {
    const { layout } = this.props;
    let value: string | number = "-";

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
  };

  getWidthValue = (property?: number) => {
    if (property == undefined) {
      return "-";
    }

    const { layout } = this.props;

    property -=
      parseFloat(layout["border-left-width"] || "0") +
      parseFloat(layout["border-right-width"] || "0") +
      parseFloat(layout["padding-left"] || "0") +
      parseFloat(layout["padding-right"] || "0");
    property = parseFloat(property.toPrecision(6));

    return property;
  };

  onHideBoxModelHighlighter = () => {
    this.props.unhighlightNode();
  };

  onShowBoxModelHighlighter = () => {
    const { selectedNodeId, highlightNode } = this.props;
    if (selectedNodeId) {
      // No timer, but use actual box models to show the various sections in the highlight,
      // rather than just the contents from the bounding rect
      highlightNode(selectedNodeId, true);
    }
  };

  onHighlightMouseOver = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    let region = target.getAttribute("data-box");

    if (!region) {
      let el = target;

      do {
        el = el.parentNode! as HTMLElement;

        if (el && el.getAttribute("data-box")) {
          region = el.getAttribute("data-box");
          break;
        }
      } while (el.parentNode);

      this.onHideBoxModelHighlighter();
    }

    this.onShowBoxModelHighlighter();

    event.preventDefault();
  };

  render() {
    const { layout } = this.props;
    let { height, width } = layout;

    const sides = ["top", "right", "bottom", "left"] as const;

    const borderValues = sides.map(side => this.getBorderOrPaddingValue(`border-${side}-width`));
    const paddingValues = sides.map(side => this.getBorderOrPaddingValue(`padding-${side}`));
    const positionValues = sides.map(side => this.getPositionValue(side));
    const marginValues = sides.map(side => this.getMarginValue(`margin-${side}`, side));

    const displayPosition = this.getDisplayPosition();

    const renderValueLabels = (values: (number | string)[], boxName: string) => {
      return sides.map((side, i) => {
        const property = `${boxName}-${side}`;
        return (
          <BoxModelSideLabel
            key={property}
            box={boxName}
            direction={side}
            property={property}
            textContent={values[i]}
          />
        );
      });
    };

    const finalHeight = this.getHeightValue(height);
    const finalWidth = this.getWidthValue(width);

    const dimensions = `${finalWidth}\u00D7${finalHeight}`;

    const contentBox =
      layout["box-sizing"] == "content-box" ? (
        <div className="boxmodel-size">
          <BoxModelSideLabel box="content" property="width" textContent={finalWidth} />
          <span>{"\u00D7"}</span>
          <BoxModelSideLabel box="content" property="height" textContent={finalHeight} />
        </div>
      ) : (
        <p className="boxmodel-size">
          <span title="content">{dimensions}</span>
        </p>
      );

    return (
      <div
        className="boxmodel-main devtools-monospace"
        data-box="position"
        onMouseOver={this.onHighlightMouseOver}
        onMouseOut={this.onHideBoxModelHighlighter}
      >
        {displayPosition ? (
          <span className="boxmodel-legend" data-box="position" title="position">
            position
          </span>
        ) : null}
        <div className="boxmodel-box">
          <span className="boxmodel-legend" data-box="margin" title="margin">
            margin
          </span>
          <div className="boxmodel-margins" data-box="margin" title="margin">
            <span className="boxmodel-legend" data-box="border" title="border">
              border
            </span>
            <div className="boxmodel-borders" data-box="border" title="border">
              <span className="boxmodel-legend" data-box="padding" title="padding">
                padding
              </span>
              <div className="boxmodel-paddings" data-box="padding" title="padding">
                <div className="boxmodel-contents" data-box="content" title="content"></div>
              </div>
            </div>
          </div>
        </div>
        {displayPosition ? renderValueLabels(positionValues, "position") : null}
        {renderValueLabels(marginValues, "margin")}
        {renderValueLabels(borderValues, "border")}
        {renderValueLabels(paddingValues, "padding")}
        {contentBox}
      </div>
    );
  }
}

export default connector(BoxModelMain);
