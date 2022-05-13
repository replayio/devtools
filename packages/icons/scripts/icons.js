const fs = require("fs");
const path = require("path");

const { pascalCase } = require("case-anything");
const dotenv = require("dotenv");
const { fetchImages } = require("figma-tools");
const prettier = require("prettier");
const svgtojsx = require("svg-to-jsx");

dotenv.config({ path: "../../.env" });

const pretterOptions = JSON.parse(fs.readFileSync("../../.prettierrc", "utf-8"));

console.log("Fetching icons...");

fetchImages({
  fileId: "ASas6u2DMihEEzw8jPT1XC",
  format: "svg",
  filter: component => component.pageName === "0.3 Icons",
}).then(async svgs => {
  console.log("Building icons...");

  const jsx = await Promise.all(svgs.map(svg => svgtojsx(svg.buffer)));
  const data = svgs
    .map((svg, index) => `export const ${pascalCase(svg.name)} = () => ${jsx[index]}\n`)
    .join("\n");

  prettier.resolveConfig;

  fs.writeFileSync(
    path.resolve("index.js"),
    prettier.format(data, { parser: "babel", ...pretterOptions })
  );

  console.log("Icons built ✨");
});
