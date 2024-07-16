import React from "react";

import { COLOR, FONT_FAMILY, URI } from "third-party/css/output-parser";

import { Priority } from "../models/text-property";
import Color from "./value/Color";
import FontFamily from "./value/FontFamily";
import Url from "./value/Url";

interface DeclarationValueProps {
  colorSpanClassName: string;
  colorSwatchClassName: string;
  fontFamilySpanClassName: string;
  priority?: Priority;
  values: (string | Record<string, string>)[];
}

class DeclarationValue extends React.PureComponent<DeclarationValueProps> {
  render() {
    const values = this.props.values.map(v => {
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
      <>
        {values}
        {this.props.priority ? ` !${this.props.priority}` : null}
      </>
    );
  }
}

export default DeclarationValue;
