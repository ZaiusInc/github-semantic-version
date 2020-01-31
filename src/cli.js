#!/usr/bin/env node

import meow from "meow";
import path from "path";
import Utils from "./Utils";
import Version from "./Version";

const cli = meow(`
  Usage:
    $ github-semantic-version

  Options:
    --init        Generates a new changelog and updates the current version in package.json.
    --bump        Bump the version in package.json based on the last change.
    --changelog   Bump the version in package.json AND append last change to the CHANGELOG.md.
    --push        Commits and pushes the changes (version and CHANGELOG) to the repo.
    --publish     Commits and pushes the changes to the repo, AND publishes the latest to NPM.
    --branch      (Default: master) Release branch, others are ignored.
    --force       By default, --bump and --changelog only work in CI environment. Override this only if you know what you're doing!
    --check       Check and validate a pull request has an associated label.
    --dry-run     Perform a dry-run without writing, commiting, pushing, or publishing.

    debug:        Prepend DEBUG=github-semantic-version:* to the github-semantic-version command.
`, {

  default: Version.defaultOptions,
});

// we really need a GH_TOKEN or GITHUB_TOKEN b/c api request limiting
if (!(process.env.GH_TOKEN || process.env.GITHUB_TOKEN)) {
  console.error(`Either a GITHUB_TOKEN or GH_TOKEN environment variable is required to interact with the Github API.`);
  process.exit(1);
}

// if the user is publishing to NPM, they need an NPM_TOKEN
if (cli.flags.publish && !process.env.NPM_TOKEN) {
  console.error(`If specifying --publish, the NPM_TOKEN environment variable needs to be set.`);
  process.exit(1);
}

const validEnvironment = process.env.CI || cli.flags.force || cli.flags.dryRun;
const hasRequiredFlags = cli.flags.bump || cli.flags.changelog;

const packageOptions = Utils.getOptionsFromFile("./package.json");
const configOptions = packageOptions.gsv || Utils.getOptionsFromFile("./gsv.json") || Utils.getOptionsFromFile("./.gsvrc");

if (!configOptions || !(configOptions.majorLabel && configOptions.minorLabel && configOptions.patchLabel && configOptions.internalLabel)) {
  console.error(`Must specify version label config options in .gsvrc, gsv.json file, or a gsv package.json entry.
    Ex:
    {
      "majorLabel": "Version: Major",
      "minorLabel": "Version: Minor",
      "patchLabel": "Version: Patch",
      "internalLabel": "No version: Internal"
    }
  `);
  process.exit(1);
}

const versionOptions = {
  version: packageOptions.version,
  private: packageOptions.private || false,
  name: packageOptions.name,
  ...configOptions
};

// run release only in CI environment. don't run complete changelog generation in CI.
if (validEnvironment && hasRequiredFlags || cli.flags.init || cli.flags.check) {
  const version = new Version(versionOptions, cli.flags);

  if (cli.flags.init) {
    console.log("Refreshing version...");
    version.refresh();
  } else if (cli.flags.check) {
    console.log("Checkinging version...");
    version.check();
  } else {
    console.log("Releasing version...");
    version.release();
  }
} else if (validEnvironment && !hasRequiredFlags) {
  console.error("Must specify one of the following options: --init, --bump, or --changelog")
  cli.showHelp(1);
} else {
  console.error("Not in CI environment or incorrect usage.");
  cli.showHelp(1);
}
