import type { Quads } from "@replayio/protocol";
import React from "react";

import { assert } from "protocol/utils";
import { getCanvas } from "ui/reducers/app";
import { useAppSelector } from "ui/setup/hooks";

import { getNodeBoxModelById } from "../reducers/markup";

// Note that the order of items in this array is important because it is used
// for drawing the BoxModelHighlighter's path elements correctly.
export const BOX_MODEL_REGIONS = ["margin", "border", "padding", "content"] as const;
export const QUADS_PROPS = ["p1", "p2", "p3", "p4"] as const;

type BoxModelKeys = (typeof BOX_MODEL_REGIONS)[number];
type BoxModelQuads = Record<BoxModelKeys, DOMQuad[]>;

function nodeNeedsHighlighting(quads: BoxModelQuads) {
  return quads.margin.length || quads.border.length || quads.padding.length || quads.content.length;
}

interface Point {
  x: number;
  y: number;
}

interface QuadWithBounds {
  p1: Point;
  p2: Point;
  p3: Point;
  p4: Point;
  bounds: {
    bottom: number;
    height: number;
    left: number;
    right: number;
    top: number;
    width: number;
    x: number;
    y: number;
  };
}

export function buildBoxQuads(array: Quads) {
  assert(array.length % 8 == 0, "quads length must be a multiple of 8");
  array = [...array];
  const rv = [];
  while (array.length) {
    const [x1, y1, x2, y2, x3, y3, x4, y4] = array.splice(0, 8);
    rv.push(
      DOMQuad.fromQuad({
        p1: { x: x1, y: y1 },
        p2: { x: x2, y: y2 },
        p3: { x: x3, y: y3 },
        p4: { x: x4, y: y4 },
      })
    );
  }
  return rv;
}

function getOuterQuad(region: BoxModelKeys, boxModelQuads: BoxModelQuads): QuadWithBounds | null {
  const quads = boxModelQuads[region];
  if (!quads || !quads.length) {
    return null;
  }

  const quad = {
    p1: { x: Infinity, y: Infinity },
    p2: { x: -Infinity, y: Infinity },
    p3: { x: -Infinity, y: -Infinity },
    p4: { x: Infinity, y: -Infinity },
    bounds: {
      bottom: -Infinity,
      height: 0,
      left: Infinity,
      right: -Infinity,
      top: Infinity,
      width: 0,
      x: 0,
      y: 0,
    },
  };

  for (const q of quads) {
    quad.p1.x = Math.min(quad.p1.x, q.p1.x);
    quad.p1.y = Math.min(quad.p1.y, q.p1.y);
    quad.p2.x = Math.max(quad.p2.x, q.p2.x);
    quad.p2.y = Math.min(quad.p2.y, q.p2.y);
    quad.p3.x = Math.max(quad.p3.x, q.p3.x);
    quad.p3.y = Math.max(quad.p3.y, q.p3.y);
    quad.p4.x = Math.min(quad.p4.x, q.p4.x);
    quad.p4.y = Math.max(quad.p4.y, q.p4.y);

    const qBounds = q.getBounds();

    quad.bounds.bottom = Math.max(quad.bounds.bottom, qBounds.bottom);
    quad.bounds.top = Math.min(quad.bounds.top, qBounds.top);
    quad.bounds.left = Math.min(quad.bounds.left, qBounds.left);
    quad.bounds.right = Math.max(quad.bounds.right, qBounds.right);
  }
  quad.bounds.x = quad.bounds.left;
  quad.bounds.y = quad.bounds.top;
  quad.bounds.width = quad.bounds.right - quad.bounds.left;
  quad.bounds.height = quad.bounds.bottom - quad.bounds.top;

  return quad;
}

function getOuterBounds(boxModelQuads: BoxModelQuads) {
  for (const region of BOX_MODEL_REGIONS) {
    const quad = getOuterQuad(region, boxModelQuads);

    if (!quad) {
      // Invisible element such as a script tag.
      break;
    }

    const { bottom, height, left, right, top, width, x, y } = quad.bounds;

    if (width > 0 || height > 0) {
      return { bottom, height, left, right, top, width, x, y };
    }
  }

  return {
    bottom: 0,
    height: 0,
    left: 0,
    right: 0,
    top: 0,
    width: 0,
    x: 0,
    y: 0,
  };
}

export function PreviewNodeHighlighter({ nodeId }: { nodeId: string }) {
  const highlightedNodeBoxModel = useAppSelector(state => getNodeBoxModelById(state, nodeId));
  const canvas = useAppSelector(getCanvas);

  if (!highlightedNodeBoxModel || !canvas) {
    return null;
  }

  // Convert the raw numeric box model data from the server into DOMQuad instances
  const boxModelQuads = BOX_MODEL_REGIONS.reduce((obj, region) => {
    obj[region] = buildBoxQuads(highlightedNodeBoxModel[region]);
    return obj;
  }, {} as BoxModelQuads);

  if (!nodeNeedsHighlighting(boxModelQuads)) {
    return null;
  }

  // The various content boxes are rendered as `<path>` elements with drawing instructions
  // for the four corners
  const renderedBoxPaths = BOX_MODEL_REGIONS.map(region => {
    const quads = boxModelQuads[region];

    const pathCoords = quads.map(quad => {
      const { p1, p2, p3, p4 } = quad;
      return `M${p1.x},${p1.y} L${p2.x},${p2.y} L${p3.x},${p3.y} L${p4.x},${p4.y}`;
    });

    return (
      <path
        key={region}
        className={`box-model-${region}`}
        id={`box-model-${region}`}
        role="presentation"
        d={pathCoords.join(" ")}
      />
    );
  });

  let containerStyle: React.CSSProperties = {};

  if (canvas) {
    // Transform the contents of the highlighter DOM node so that it
    // correctly matches the scale of the preview canvas area, in order
    // to get the highlight overlaid over the correct DOM node.
    const { left, top, width, height, scale, gDevicePixelRatio } = canvas;

    if (gDevicePixelRatio) {
      containerStyle = {
        transform: `scale(${scale * gDevicePixelRatio})`,
        left: `${left}px`,
        top: `${top}px`,
        width: `${width / gDevicePixelRatio}px`,
        height: `${height / gDevicePixelRatio}px`,
      };
    }
  }

  // The original highlighter logic supported showing guides for all regions,
  // but as of 2022-09, only seems to show them for the content area.
  // Mimicking that behavior here.
  const guideRegionsToShow = ["content"] as const;

  // Guides are rendered as SVG `<line>` tags, extending vertically or horizontally,
  // aligned with the outer edge of a given box model side.
  const renderedGuides = guideRegionsToShow.map(region => {
    const quad = getOuterQuad(region, boxModelQuads);

    if (!quad) {
      return null;
    }

    const { p1, p2, p3, p4 } = quad;

    // Sort x and y values so that we can figure out sides from min/max values
    const allX = [p1.x, p2.x, p3.x, p4.x].sort((a, b) => a - b);
    const allY = [p1.y, p2.y, p3.y, p4.y].sort((a, b) => a - b);

    const sides = {
      left: allX[0],
      right: allX[3] - 1,
      top: allY[0],
      bottom: allY[3] - 1,
    } as const;

    return Object.entries(sides).map(([side, coord]) => {
      if (coord <= 0) {
        return null;
      }
      const isHorizontal = side === "top" || side === "bottom";
      const coordString = `${coord}`;

      const coords = isHorizontal
        ? {
            x1: "0",
            y1: coordString,
            x2: "100%",
            y2: coordString,
          }
        : {
            x1: coordString,
            y1: "0",
            x2: coordString,
            y2: "100%",
          };
      return <line key={side} className={`box-model-guide-${side}`} {...coords} />;
    });
  });

  return (
    <div className="highlighter-container" aria-hidden="true" style={containerStyle}>
      <div id="box-model-root" className="box-model-root" style={{ position: "relative" }}>
        <svg className="box-model-elements" style={{ width: "100%", height: "100%" }}>
          <g className="box-model-regions">{renderedBoxPaths}</g>
          {renderedGuides}
        </svg>
      </div>
    </div>
  );
}
