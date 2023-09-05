/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import React from "react";

import type { Layout } from "ui/suspense/styleCaches";

import BoxModelMain from "./BoxModelMain";
import { BoxModelProperties } from "./BoxModelProperties";

function BoxModelInfo({ layout }: { layout: Layout }) {
  const { height = "-", position, width = "-" } = layout;

  const dimensions = `${width}\u00D7${height}`;
  return (
    <div className="boxmodel-info">
      <span className="boxmodel-element-size">{dimensions}</span>
      <section className="boxmodel-position-group">
        <span className="boxmodel-element-position">{position}</span>
      </section>
    </div>
  );
}

interface BMProps {
  boxModel: { layout: Layout };
}

export function BoxModel({ boxModel }: BMProps) {
  const { layout } = boxModel;

  return (
    <div className="boxmodel-container" tabIndex={0}>
      <BoxModelMain layout={layout} />
      <BoxModelInfo layout={layout} />
      <BoxModelProperties layout={layout} />
    </div>
  );
}
