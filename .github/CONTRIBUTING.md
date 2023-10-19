# Contribution Guide

This document offers a set of guidelines for contributing to VSCodeVim.
These are just guidelines, not rules; use your best judgment and feel free to propose changes to this document.
If you need help, drop by on [Slack](https://vscodevim.herokuapp.com/).

Thanks for helping us in making VSCodeVim better! :clap:

## Submitting Issues

The [GitHub issue tracker](https://github.com/VSCodeVim/Vim/issues) is the preferred channel for tracking bugs and enhancement suggestions.
When creating a new bug report do:

- Search against existing issues to check if somebody else has already reported your problem or requested your idea
- Fill out the issue template.

### Improve Existing Issues

- Try to replicate bugs and describe the method if you're able to.
- Search for [duplicate issues](https://github.com/VSCodeVim/Vim/issues?q=is%3Aissue+is%3Aopen+cursor). See which thread(s) are more mature, and recommend the duplicate be closed, or just provide links to related issues.
- Find [old issues](https://github.com/VSCodeVim/Vim/issues?page=25&q=is%3Aissue+is%3Aopen) and test them in the latest version of VSCodeVim. If the issue has been resolved, comment & recommend OP to close (or provide more information if not resolved).
- Give thumbs up / thumbs down to existing issues, to indicate your support (or not)

## Submitting Pull Requests

Pull requests are _awesome_.
If you're looking to raise a PR for something which doesn't have an open issue, consider creating an issue first.

When submitting a PR, please fill out the template that is presented by GitHub when a PR is opened.

## First Time Setup

1. Install prerequisites:

   - [Visual Studio Code](https://code.visualstudio.com/), latest stable or insiders
   - [Node.js](https://nodejs.org/) v18.x or higher
   - [Yarn](https://classic.yarnpkg.com/) v1.x
   - _Optional_: [Docker Community Edition](https://store.docker.com/search?type=edition&offering=community) 🐋

2. Fork and clone repository:

   ```bash
   git clone git@github.com:<YOUR-FORK>/Vim.git
   cd Vim
   ```

3. Build extension:

   ```bash
   # Install the dependencies
   yarn install

   # Open in VS Code
   code .

   # Build with one of these...
   yarn build-dev # Fast build for development
   yarn build     # Slow build for release
   yarn watch     # Fast build whenever a file changes
   ```

4. Run extension using VS Code's "Run and Debug" menu

5. Run tests:

   ```bash
   # If Docker is installed and running:
   npx gulp test                 # Run tests inside Docker container
   npx gulp test --grep <REGEX>  # Run only tests/suites matching <REGEX> inside Docker container

   # Otherwise, build and run the tests locally:
   yarn build                    # Build
   yarn build-test               # Build tests
   yarn test                     # Test (must close all instances of VS Code)
   ```

6. Package and install extension:

   ```bash
   # Package extension into `vim-<MAJOR>.<MINOR>.<PATCH>.vsix`
   # (This can be opened and inspected like a .zip file)
   yarn package

   # Install packaged extension to your local VS Code installation
   code --install-extension vim-<MAJOR>.<MINOR>.<PATCH>.vsix --force
   ```

## Code Architecture

The code is split into two parts:

- ModeHandler - Vim state machine
- Actions - 'actions' which modify the state

### Actions

Actions are all currently stuffed into actions.ts (sorry!). There are:

- `BaseAction` - the base Action type that all Actions derive from.
- `BaseMovement` - A movement (e.g.`w`, `h`, `{`, etc.) _ONLY_ updates the cursor position or returns an `IMovement`, which indicates a start and stop. This is used for movements like `aw` which may actually start before the cursor.
- `BaseCommand` - Anything which is not just a movement is a Command. That includes motions which also update the state of Vim in some way, like `*`.

At one point, I wanted to have actions.ts be completely pure (no side effects whatsoever), so commands would just return objects indicating what side effects on the editor they would have. This explains the giant switch in handleCommand in ModeHandler. I now believe this to be a dumb idea and someone should get rid of it.

### The Vim State Machine

Consists of two data structures:

- `VimState` - this is the state of Vim. It's what actions update.
- `RecordedState` - this is temporary state that will reset at the end of a change.

#### How it works

1. `handleKeyEventHelper` is called with the most recent keypress.
2. `Actions.getRelevantAction` determines if all the keys pressed so far uniquely specify any action in actions.ts. If not, we continue waiting for keypresses.
3. `runAction` runs the action that was matched. Movements, Commands and Operators all have separate functions that dictate how to run them - `executeMovement`, `handleCommand`, and `executeOperator` respectively.
4. Now that we've updated `VimState`, we run `updateView` with the new VimState to "redraw" VS Code to the new state.

#### `vscode.window.onDidChangeTextEditorSelection`

This is my hack to simulate a click event based API in an IDE that doesn't have them (yet?). I check the selection that just came in to see if it's the same as what I thought I previously set the selection to the last time the state machine updated. If it's not, the user _probably_ clicked. (But she also could have tab completed!)

## Release

Before you push a release, be sure to make sure the changelog is updated!

To push a release:

```bash
npx gulp release --semver [SEMVER]
git push --follow-tags
```

The above Gulp command will:

1. Bump the package version based off the semver supplied. Supported values: patch, minor, major.
2. Create a Git commit with the above changes.
3. Create a Git tag using the new package version.

In addition to building and testing the extension, when a tag is applied to the commit, the CI server will also create a GitHub release and publish the new version to the Visual Studio marketplace.

## Troubleshooting

### VS Code Slowdown

If you notice a slowdown and have ever run `yarn test` in the past instead of running tests through VSCode, you might find a `.vscode-test/` folder, which VSCode is continually consuming CPU cycles to index. Long story short, you can speed up VSCode by:

```bash
rm -rf .vscode-test/
```

## Style Guide

Please try your best to adhere to our [style guidelines](https://github.com/VSCodeVim/Vim/blob/master/STYLE.md).
