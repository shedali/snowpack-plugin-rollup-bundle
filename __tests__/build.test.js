const process = require("process");
const path = require("path");
const fs = require("fs");

import { shellRun } from "../src/utils"

const exampleDir = path.resolve("__tests__", "example_dir");
const buildDir = path.join(exampleDir, "build");


beforeAll(() => {
  // Remove and Rebuild the build directory
  shellRun(`rm -rf ${buildDir}`);
  process.chdir(exampleDir);
  shellRun("yarn build")
});

test("Should produce entrypoints and manifest.json", () => {
  const buildFiles = ["entrypoints", "manifest.json"].map((file) =>
    path.join(buildDir, file)
  );

  buildFiles.forEach((file) => {
    expect(fs.existsSync(file)).toBe(true);
  });
});

test("Should produce css files, including module.css files", () => {
  const cssFile = path.resolve(buildDir, "css", "stylesheet.css");
  expect(fs.existsSync(cssFile)).toBe(true);
});

test("Should create an assets directory for all non-css and non-js files", () => {
  const files = fs.readdirSync(path.join(buildDir, "assets"));

  expect(files).not.toHaveLength(0);
});
