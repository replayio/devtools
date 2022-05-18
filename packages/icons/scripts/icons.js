const fs = require("fs");

const { pascalCase } = require("case-anything");
const dotenv = require("dotenv");
const { fetchImages } = require("figma-tools");
const prettier = require("prettier");
const svgToJsx = require("svg-to-jsx");
const { optimize } = require("svgo");

dotenv.config({ path: "../../.env" });

console.log("Fetching icons...");

fetchImages({
  fileId: "ASas6u2DMihEEzw8jPT1XC",
  format: "svg",
  onEvent: event => console.log(`${event.type}: ${event.status}`),
  filter: component => component.pageName.toLowerCase().includes("icons"),
}).then(async svgs => {
  console.log("Building icons...");

  const optimizedSvgs = await Promise.all(
    svgs.map(svg =>
      optimize(svg.buffer.toString(), {
        plugins: [
          {
            name: "removeAttrs",
            params: {
              attrs: "(fill|stroke)",
            },
          },
        ],
      })
    )
  );
  const jsxSvgs = await Promise.all(optimizedSvgs.map(svg => svgToJsx(svg.data)));
  const allIconExports = [
    'import { SVGProps } from "react"',
    `export type IconNames = ${svgs.map(svg => `"${svg.name}"`).join(" | ")}`,
  ]
    .concat(
      svgs.map((svg, index) => {
        const name = `${pascalCase(svg.name)}Icon`;
        const jsx = jsxSvgs[index]
          /** Spread props for controlling the svg element. */
          .replace('">\n', '" {...props}>\n');

        return `export const ${name} = (props: SVGProps<SVGSVGElement>) => ${jsx};`;
      })
    )
    .join("\n");
  const prettierConfig = await prettier.resolveConfig(process.cwd());
  const formattedCodeString = prettier.format(allIconExports, {
    parser: "typescript",
    ...prettierConfig,
  });

  fs.writeFileSync("icons.tsx", formattedCodeString);

  console.log("Icons built ✨");
});
