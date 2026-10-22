const { withAppBuildGradle } = require("expo/config-plugins");

// Hash long C++ object paths so Ninja can build the app on Windows.
module.exports = function withShortCmakePaths(config) {
  return withAppBuildGradle(config, (config) => {
    const marker = "// PRISM: keep Ninja object paths within Windows limits";
    if (!config.modResults.contents.includes(marker)) {
      config.modResults.contents = config.modResults.contents.replace(
        /defaultConfig\s*\{/,
        `defaultConfig {
        ${marker}
        externalNativeBuild {
            cmake { arguments "-DCMAKE_OBJECT_PATH_MAX=240" }
        }`,
      );
    }
    if (!config.modResults.contents.includes("version '3.31.6'")) {
      config.modResults.contents = config.modResults.contents.replace(
        /android\s*\{/,
        `android {
    externalNativeBuild { cmake { version '3.31.6' } }`,
      );
    }
    return config;
  });
};
