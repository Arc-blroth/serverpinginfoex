// Config file handling
const fs = require("node:fs");

const CONFIG_FILE = "config.json";
const DEFAULT_CONFIG = {};

let config;

try {
  config = JSON.parse(fs.readFileSync(CONFIG_FILE));
} catch (e) {
  if (e.code === "ENOENT") {
    console.log("Initializing config...");
    fs.writeFileSync(
      CONFIG_FILE,
      JSON.stringify(DEFAULT_CONFIG, null, 4) + "\n"
    );
    config = DEFAULT_CONFIG;
  } else if (e instanceof SyntaxError) {
    const ERROR_MSG = "The config file has syntax errors, exiting!";
    const SEPARATOR = "=".repeat(ERROR_MSG.length);
    console.error(`${SEPARATOR}\n${ERROR_MSG}\n${SEPARATOR}\n`);
    throw e;
  } else {
    throw e;
  }
}

module.exports = config;
