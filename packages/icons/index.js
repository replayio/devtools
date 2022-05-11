const fs = require("fs");
const path = require("path");

const { pascalCase } = require("case-anything");
const dotenv = require("dotenv");
const { fetchImages } = require("figma-tools");
const svgtojsx = require("svg-to-jsx");

dotenv.config();

console.log("Fetching icons...");

fetchImages({
  fileId: "mAotNZRv6M5X0zHIFKPzFY",
  format: "svg",
}).then(async svgs => {
  console.log(svgs);
  // const jsx = await Promise.all(svgs.map(svg => svgtojsx(svg.buffer)));
  // const data = svgs
  //   .map((svg, index) => `export const ${pascalCase(svg.name)} = () => ${jsx[index]}`)
  //   .join("\n");

  // fs.writeFileSync(path.resolve("icons.js"), data);
});
