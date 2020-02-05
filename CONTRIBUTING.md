# Contributing

This repository is a fork of the [`github-semantic-version` module](https://github.com/ericclemmons/github-semantic-version) authored by Eric Clemmons. 
At the time this file was written, the most recent commit was March 12, 2018 (version 7.6.0). 
We forked it so that we could update dependencies to more modern versions, and so that we 
could customize some of the module's features (namely the ability to configure whether or not 
to fail a PR if a semver label is missing).

## Development Process

1. Pull the repo.
2. Make changes and test.
3. Create a PR and include a label indicating how to update the version.
   
## Testing

1. Simply run `npm test`.
   
## Publishing

1. Make sure you've configured npm for publishing to our internal registry. The steps can be
   found at the top of [our registry's web interface](http://npm-registry.prod.zaius/)
2. Run `npm run dist` to create a distribution for this code.
3. Run `npm publish` to publish the distribution to our npm registry.
   
## Use in Other Projects

1. See installation and configuration instructions in the [README](README.md)
