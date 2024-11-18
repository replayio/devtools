import React from "react";

import { COLOR, FONT_FAMILY, URI } from "third-party/css/output-parser";

import Color from "./value/Color";
import FontFamily from "./value/FontFamily";
import Url from "./value/Url";

interface DeclarationValueProps {
  colorSpanClassName: string;
  colorSwatchClassName: string;
  fontFamilySpanClassName: string;
  values: (string | Record<string, string>)[];
  important?: boolean;
}

class DeclarationValue extends React.PureComponent<DeclarationValueProps> {
  render() {
    const renderedValues = this.props.values.map(v => {
      if (typeof v === "string") {
        return v;
      }

      const { type, value } = v;

      switch (type) {
        case COLOR:
          return React.createElement(Color, {
            colorSpanClassName: this.props.colorSpanClassName,
            colorSwatchClassName: this.props.colorSwatchClassName,
            key: value,
            value,
          });
        case FONT_FAMILY:
          return React.createElement(FontFamily, {
            fontFamilySpanClassName: this.props.fontFamilySpanClassName,
            key: value,
            value,
          });
        case URI:
          return React.createElement(Url, {
            key: value,
            href: v.href,
            value,
          });
      }

      return value;
    });

    return (
      <React.Fragment>
        {renderedValues}
        {this.props.important && " !important"}
      </React.Fragment>
    );
  }
}

export default DeclarationValue;
