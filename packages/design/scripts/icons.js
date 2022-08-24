const fs = require("fs");
const path = require("path");
const { createSpinner } = require("nanospinner");

const { kebabCase } = require("case-anything");
const dotenv = require("dotenv");
const { fetchImages } = require("figma-tools");
const { parse, stringify } = require("svgson");
const { optimize } = require("svgo");
const spinner = createSpinner();

dotenv.config({ path: "../../.env" });

async function fetch() {
  spinner.update({ text: "Fetching svgs from Figma..." });

  const svgs = await fetchImages({
    fileId: "ASas6u2DMihEEzw8jPT1XC",
    format: "svg",
    onEvent: event => spinner.update({ text: `${event.type}: ${event.status}` }),
    filter: component => component.pageName.toLowerCase().includes("icons"),
  });

  if (!svgs) {
    spinner.warn({ text: "No svgs found..." });

    return [];
  }

  if (fs.existsSync("svgs")) {
    fs.rmSync("svgs", { recursive: true });
  }

  fs.mkdirSync("svgs");

  svgs.forEach(svg => {
    fs.writeFileSync(path.resolve(`svgs/${kebabCase(svg.name)}.svg`), svg.buffer);
  });

  spinner.update({ text: "Figma svgs saved to design/svgs" });

  return svgs.map(svg => ({
    name: svg.name,
    contents: svg.buffer.toString(),
  }));
}

async function start() {
  let svgs;

  spinner.start();

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

  spinner.update({ text: "Building icon svg sprite..." });

  const optimizedSvgs = await Promise.all(
    svgs.map(svg =>
      optimize(svg.contents, {
        plugins: [{ name: "removeAttrs", params: { attrs: "(id|fill|stroke)" } }],
      })
    )
  );

  const json = await Promise.all(optimizedSvgs.map(svg => parse(svg.data)));
  const symbolElements = svgs.map((svg, index) => {
    const svgName = kebabCase(svg.name);
    const svgJson = json[index];
    const group = svgJson.children[0];
    const path = stringify(group.children[0]);

    return `<symbol id="${svgName}" width="24" height="24" viewBox="0 0 24 24">${path}</symbol>`;
  });

  /** Create a types file to use in Icon component. */
  fs.writeFileSync(
    "Icon/types.d.ts",
    [
      `/** This file was auto-generated using "yarn workspace design icons" */ \n`,
      `export type IconNames = ${svgs.map(svg => `"${kebabCase(svg.name)}"`).join(" | ")};`,
    ].join("\n")
  );

  /** Create a svg sprite to use in as an external image in NextJS that's targeted through "use" tags. */
  fs.writeFileSync(
    path.resolve("Icon/sprite.svg"),
    [
      `<!-- This file was auto-generated using "yarn workspace design icons" -->`,
      `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">${symbolElements.join(
        ""
      )}</svg>`,
    ].join("\n")
  );

  spinner.success({ text: "Icon sprite built ✨" });
}

start();
