import rollup from "rollup";
import fs from "fs";
import path from "path";
import glob from "glob";
import os from "os";

import { defaultInputOptions, defaultOutputOptions } from "./options";
import { shellRun } from "./utils";
import { proxyImportResolver } from "./proxyImportResolver";
import { addToManifest } from "./manifestUtils";
import { emitHtmlFile } from "./emitHtmlFile";

const TMP_BUILD_DIRECTORY = path.join(os.tmpdir(), "build");

async function rollupBuild({ debug, inputOptions, outputOptions }) {
  const TMP_DEBUG_DIRECTORY = path.join(os.tmpdir(), "_debug_");

  const buildDirectory = outputOptions.dir;
  outputOptions.dir = TMP_BUILD_DIRECTORY;

  const bundle = await rollup.rollup(inputOptions);
  const { output } = await bundle.generate(outputOptions);

  const manifest = {};

  for (const chunkOrAsset of output) {
    if (chunkOrAsset.isEntry || chunkOrAsset.type === "asset") {
      addToManifest({ manifest, chunkOrAsset, assignTo: "entrypoints" });
      continue;
    }

    addToManifest({ manifest, chunkOrAsset, assignTo: "chunks" });
  }

  await bundle.write(outputOptions);

  shellRun(`mv ${buildDirectory} ${TMP_DEBUG_DIRECTORY}`);
  shellRun(`mv ${TMP_BUILD_DIRECTORY} ${buildDirectory}`);

  if (debug === true) {
    const buildDebugDir = path.join(buildDirectory, "_debug_");
    shellRun(`mv ${TMP_DEBUG_DIRECTORY}/ ${buildDebugDir}`);
  }

  // Add assets to manifest, use path.relative to fix minor issues
  glob.sync(`${buildDirectory}/assets/**/*.*`).forEach((fileName) => {
    fileName = path.relative(buildDirectory, fileName);
    const chunkOrAsset = { fileName, map: null };
    addToManifest({
      manifest,
      chunkOrAsset,
      assignTo: "assets",
      useFileType: false,
    });
  });

  const manifestJSON = JSON.stringify(manifest, null, 2);
  fs.writeFileSync(path.join(buildDirectory, "manifest.json"), manifestJSON);
}

const plugin = (snowpackConfig, pluginOptions = {}) => {
  snowpackConfig.buildOptions.minify = false; // Let rollup handle this
  snowpackConfig.buildOptions.clean = true;
  return {
    name: "snowpack-plugin-rollup-bundle",
    async optimize({ buildDirectory }) {
      const inputOptions = defaultInputOptions({
        buildDirectory,
        tmpDir: TMP_BUILD_DIRECTORY,
      });
      const outputOptions = defaultOutputOptions(buildDirectory);

      let extendConfig = (cfg) => cfg;
      if (typeof pluginOptions.extendConfig === "function") {
        extendConfig = pluginOptions.extendConfig;
      } else if (typeof pluginOptions.extendConfig === "object") {
        extendConfig = (cfg) => ({ ...cfg, ...pluginOptions.extendConfig });
      }

      const extendedConfig = await extendConfig({
        debug: pluginOptions.debug,
        inputOptions: {
          ...inputOptions,
        },
        outputOptions: {
          ...outputOptions,
        },
      });

      // Rewrite "proxy.js" imports prior to building
      glob.sync(buildDirectory + "/**/*.js").forEach((file) => {
        const resolvedImports = proxyImportResolver(
          fs.readFileSync(file, "utf8")
        );
        fs.writeFileSync(file, resolvedImports, "utf8");
      });

      await rollupBuild(extendedConfig);

      // *****
      // THIS IS PURELY FOR TESTING PURPOSES
      const manifest = JSON.parse(
        fs.readFileSync(path.join(buildDirectory, "manifest.json"))
      );

      const file = path.join("src", "index.html");

      if (extendedConfig.testing === true) {
        emitHtmlFile({ manifest, file });
      }
      // ****
    },
  };
};

export default plugin;
