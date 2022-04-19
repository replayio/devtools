/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import React, { PureComponent } from "react";

import { getSourceClassnames } from "../../utils/source";

import AccessibleImage from "./AccessibleImage";

export default class SourceIcon extends PureComponent {
  render() {
    const { shouldHide, source } = this.props;
    const iconClass = getSourceClassnames(source);

    if (shouldHide && shouldHide(iconClass)) {
      return null;
    }

    return <AccessibleImage className={`source-icon ${iconClass}`} />;
  }
}
