// NOTE: This file has a ton of logic copied from the Redux DevTools packages

import classnames from "classnames";
import React, { Component } from "react";
import type { LabelRenderer, ShouldExpandNodeInitially } from "react-json-tree";
import { JSONTree } from "react-json-tree";

import getItemString from "./getItemString";
import styles from "./JSONDiff.module.css";

export interface Delta {
  [key: string]: any;
  [key: number]: any;
}

interface Styling {
  className?: string;
  style?: React.CSSProperties;
}

interface Base16Theme {
  scheme: string;
  author: string;
  base00: string;
  base01: string;
  base02: string;
  base03: string;
  base04: string;
  base05: string;
  base06: string;
  base07: string;
  base08: string;
  base09: string;
  base0A: string;
  base0B: string;
  base0C: string;
  base0D: string;
  base0E: string;
  base0F: string;
}

export type StylingValueFunction = (styling: Styling, ...rest: unknown[]) => Partial<Styling>;
export type StylingValue = string | React.CSSProperties | StylingValueFunction;
export type StylingConfig = {
  extend?: string | Base16Theme | StylingValue;
} & {
  [name: string]: StylingValue | string | Base16Theme;
};
export type Theme = string | Base16Theme | StylingConfig;

export type StylingFunction = (
  keys: (string | false | undefined) | (string | false | undefined)[],
  ...rest: unknown[]
) => Styling;

export function getJsonTreeTheme(base16Theme: Base16Theme): StylingConfig {
  return {
    extend: base16Theme,
    nestedNode: ({ style }, keyPath, nodeType, expanded) => ({
      style: {
        ...style,
        whiteSpace: expanded ? "inherit" : "nowrap",
      },
    }),
    nestedNodeItemString: ({ style }, keyPath, nodeType, expanded) => ({
      style: {
        ...style,
        display: expanded ? "none" : "inline",
      },
    }),
  };
}

function stringifyAndShrink(val: any, isWideLayout?: boolean) {
  if (val === null) {
    return "null";
  }

  // TODO The original code used `javascript-stringify` for better output here
  const str = JSON.stringify(val);
  if (typeof str === "undefined") {
    return "undefined";
  }

  if (isWideLayout) {
    return str.length > 42 ? str.substr(0, 30) + "…" + str.substr(-10) : str;
  }
  return str.length > 22 ? `${str.substr(0, 15)}…${str.substr(-5)}` : str;
}

const expandFirstLevel: ShouldExpandNodeInitially = (keyName, data, level) => level <= 1;

function prepareDelta(value: any) {
  if (value && value._t === "a") {
    const res: { [key: string]: any } = {};
    for (const key in value) {
      if (key !== "_t") {
        if (key[0] === "_" && !value[key.substr(1)]) {
          res[key.substr(1)] = value[key];
        } else if (value["_" + key]) {
          res[key] = [value["_" + key][0], value[key][0]];
        } else if (!value["_" + key] && key[0] !== "_") {
          res[key] = value[key];
        }
      }
    }
    return res;
  }

  return value;
}

export const labelRenderer: LabelRenderer = ([key, ...rest], nodeType, expanded) => {
  // TODO Use the original styling behavior here?
  const styling = (key: string) => ({});

  return (
    <span>
      <span {...styling("treeItemKey")}>{key}</span>
      {!expanded && ": "}
    </span>
  );
};

interface Props {
  delta: Delta | null | undefined | false;
  styling: StylingFunction;
  base16Theme: any;
  invertTheme: boolean;
  labelRenderer: LabelRenderer;
  isWideLayout: boolean;
  dataTypeKey: string | symbol | undefined;
}

interface State {
  data: any;
}

export class JSONDiff extends Component<Props, State> {
  state: State = { data: {} };

  componentDidMount() {
    this.updateData();
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.delta !== this.props.delta) {
      this.updateData();
    }
  }

  updateData() {
    // this magically fixes weird React error, where it can't find a node in tree
    // if we set `delta` as JSONTree data right away
    // https://github.com/alexkuz/redux-devtools-inspector/issues/17

    this.setState({ data: this.props.delta });
  }

  render() {
    const { styling, base16Theme, ...props } = this.props;

    if (!this.state.data) {
      return <div className={styles.NoDiff}>(states are equal)</div>;
    }

    return (
      <div className={styles.Container}>
        <JSONTree
          {...props}
          theme={getJsonTreeTheme(base16Theme)}
          data={this.state.data}
          getItemString={this.getItemString}
          valueRenderer={this.valueRenderer}
          postprocessValue={prepareDelta}
          isCustomNode={Array.isArray}
          shouldExpandNodeInitially={expandFirstLevel}
          hideRoot
        />
      </div>
    );
  }

  getItemString = (type: string, data: any) =>
    getItemString(
      this.props.styling,
      type,
      data,
      this.props.dataTypeKey,
      this.props.isWideLayout,
      true
    );

  valueRenderer = (raw: any, value: any) => {
    const { isWideLayout } = this.props;

    function renderSpan(name: string, body: string) {
      return (
        <span key={name} className={classnames(styles.diff, styles[name])}>
          {body}
        </span>
      );
    }

    if (Array.isArray(value)) {
      switch (value.length) {
        case 1:
          return (
            <span className={styles.diffWrap}>
              {renderSpan("diffAdd", stringifyAndShrink(value[0], isWideLayout))}
            </span>
          );
        case 2:
          return (
            <span className={styles.diffWrap}>
              {renderSpan("diffUpdateFrom", stringifyAndShrink(value[0], isWideLayout))}
              {renderSpan("diffUpdateArrow", " => ")}
              {renderSpan("diffUpdateTo", stringifyAndShrink(value[1], isWideLayout))}
            </span>
          );
        case 3:
          return (
            <span className={styles.diffWrap}>
              {renderSpan("diffRemove", stringifyAndShrink(value[0]))}
            </span>
          );
      }
    }

    return raw;
  };
}
