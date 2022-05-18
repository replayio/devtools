const fs = require("fs");

const { transform } = require("@svgr/core");
const { pascalCase } = require("case-anything");
const dotenv = require("dotenv");
const { fetchImages } = require("figma-tools");
const prettier = require("prettier");

dotenv.config({ path: "../../.env" });

console.log("Fetching icons...");

fetchImages({
  fileId: "ASas6u2DMihEEzw8jPT1XC",
  format: "svg",
  filter: component => component.pageName === "0.3 Icons",
}).then(async svgs => {
  console.log("Building icons...");

  const allIconExports = (
    await Promise.all(
      svgs.map(svg =>
        transform(
          svg.buffer.toString(),
          {
            icon: 20,
            replaceAttrValues: {
              black: "currentColor",
              "#383838": "currentColor",
              "#38383D": "currentColor",
            },
            typescript: true,
          },
          { componentName: pascalCase(svg.name) }
        )
      )
    )
  )
    /**
     * SVGR adds 'import * as React from "react"' and default exports for every
     * component, so we trim the lines and add an explicit named export.
     */
    .map(component => `export ${component.split("\n").slice(2, -2).join("\n")}`)
    .join("\n");

  console.log(allIconExports);

  const prettierConfig = await prettier.resolveConfig(process.cwd());
  const formattedCodeString = prettier.format(allIconExports, {
    parser: "typescript",
    ...prettierConfig,
  });

  fs.writeFileSync("index.tsx", `import { SVGProps } from "react"\n\n${formattedCodeString}`);

  console.log("Icons built ✨");
});
