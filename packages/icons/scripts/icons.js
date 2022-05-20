const fs = require("fs");
const path = require("path");

const { kebabCase, pascalCase } = require("case-anything");
const dotenv = require("dotenv");
const { fetchImages } = require("figma-tools");
const prettier = require("prettier");
const svgToJsx = require("svg-to-jsx");
const { optimize } = require("svgo");

dotenv.config({ path: "../../.env" });

async function fetch() {
  console.log("Fetching icons...");

  const svgs = await fetchImages({
    fileId: "ASas6u2DMihEEzw8jPT1XC",
    format: "svg",
    onEvent: event => console.log(`${event.type}: ${event.status}`),
    filter: component => component.pageName.toLowerCase().includes("icons"),
  });

  console.log("Saving svgs...");

  if (!fs.existsSync("svgs")) {
    fs.mkdirSync("svgs");
  }

  svgs.forEach(svg => {
    fs.writeFileSync(path.resolve(`svgs/${kebabCase(svg.name)}.svg`), svg.buffer);
  });

  console.log("Icon svgs saved ✨");

  return svgs.map(svg => ({
    name: svg.name,
    contents: svg.buffer.toString(),
  }));
}

async function start() {
  let svgs;

  /**
   * This flag is used in case the Figma API is down and we instead need to export
   * from Figma directly into the svgs directory.
   */
  if (process.argv.slice(2).includes("--fetch")) {
    svgs = await fetch();
  } else {
    const svgPaths = fs.readdirSync("svgs");
    const svgContents = svgPaths.map(svgPath => fs.readFileSync(`svgs/${svgPath}`, "utf-8"));

    svgs = svgPaths.map((svgPath, index) => ({
      name: svgPath.replace(".svg", ""),
      contents: svgContents[index],
    }));
  }

  console.log("Building icon components...");

  const optimizedSvgs = await Promise.all(
    svgs.map(svg =>
      optimize(svg.contents, {
        plugins: [
          {
            name: "removeAttrs",
            params: { attrs: "(fill|stroke)" },
          },
        ],
      })
    )
  );
  const jsxSvgs = await Promise.all(optimizedSvgs.map(svg => svgToJsx(svg.data)));
  const iconMap = Object.fromEntries(
    svgs.map(svg => [kebabCase(svg.name), `${pascalCase(svg.name)}Icon`])
  );
  const allIconExports = [
    'import { SVGProps } from "react"',
    `export const iconMap = ${JSON.stringify(iconMap)} as const`,
    `export type IconNames = keyof typeof iconMap`,
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
    .join("\n\n");
  const prettierConfig = await prettier.resolveConfig(process.cwd());
  const formattedCodeString = prettier.format(allIconExports, {
    parser: "typescript",
    ...prettierConfig,
  });

  fs.writeFileSync("index.tsx", formattedCodeString);

  console.log("Icon components built ✨");
}

start();
