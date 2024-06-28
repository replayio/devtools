/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import flatten from "lodash/flatten";
import times from "lodash/times";
import zip from "lodash/zip";
import { Component } from "react";

export default class PreviewFunction extends Component {
  renderFunctionName(func) {
    const name = (func.functionName ? func.functionName() : func.name) || "<anonymous>";
    return <span className="function-name">{name}</span>;
  }

  renderParams(func) {
    const parameterNames =
      (func.functionParameterNames ? func.functionParameterNames() : func.parameterNames) || [];

    const params = parameterNames
      .filter(i => i)
      .map(param => (
        <span className="param" key={param}>
          {param}
        </span>
      ));

    const commas = times(params.length - 1).map((_, i) => (
      <span className="delimiter" key={i}>
        {", "}
      </span>
    ));

    return flatten(zip(params, commas));
  }

  render() {
    const { func } = this.props;
    return (
      <span className="function-signature">
        {this.renderFunctionName(func)}
        <span className="paren">(</span>
        {this.renderParams(func)}
        <span className="paren">)</span>
      </span>
    );
  }
}
