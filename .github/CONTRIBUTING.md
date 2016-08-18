# Contribution Guide

The following is a set of guidelines for contributing to Vim for VSCode.
These are just guidelines, not rules, use your best judgment and feel free to propose changes to this document in a pull request.
If you need help with Vim for VSCode, come visit our [Slack](https://vscodevim-slackin.azurewebsites.net/) community. 
Thanks for helping us make Vim for VSCode better!

## Submitting Issues

The [GitHub issue tracker](https://github.com/VSCodeVim/Vim/issues) is the preferred channel for tracking bugs and enhancement suggestions.
When creating a new bug report do:

* Search against existing issues to check if somebody else has already reported your problem or requested your idea
* Include as many details as possible. Include screenshots/gifs and repro steps where applicable.

## Submitting Pull Requests

Pull requests are *awesome*. 
If you're looking to raise a PR for something which doesn't have an open issue, consider creating an issue first. 
When submitting a PR, ensure:

1. Run all the tests and ensure they pass.
2. If you added a new feature, add at least one more test to test it.
3. If you've fixed a bug, add at least one test to ensure the bug stays away.
4. Submit the PR. Pour yourself a glass of champagne and feel good about making contributing to open source!

## First Time Setup

1. Install prerequisites:
   * latest [Visual Studio Code](https://code.visualstudio.com/)
   * [Node.js](https://nodejs.org/) v4.0.0 or higher
2. Fork and clone the repository
3. `cd Vim`
4. Install the dependencies:

	```bash
	$ npm install -g gulp-cli
	$ npm install
	```
5. Open the folder in VS Code

## Developing

1. Watch for changes and recompile Typescript files. Run this in the `Vim` directory: `gulp watch`
2. Open up Visual Studio code and add the `Vim` directory as a folder. 
3. Click on the debugger. You now have two options - Launch Extension (to play around with the extension) and Launch Tests (to run the tests). 

## Code Architecture

The code is split into two parts - ModeHandler (which is essentially the Vim state machine), and Actions (which are things that modify the state).

### Actions

Actions are all currently stuffied into actions.ts (sorry!). There are:
* BaseAction - the base Action type that all Actions derive from.
* BaseMovement - A movement, like `w`, `h`, `{`, etc. ONLY updates the cursor position. At worst, might return an IMovement, which indicates a start and stop. This is used for movements like aw which may actually start before the cursor.
* BaseCommand - Anything which is not just a movement is a Command. That includes motions which also update the state of Vim in some way, like `*`. 

At one point, I wanted to have actions.ts be completely pure (no side effects whatsoever), so commands would just return objects indicating what side effects on the editor they would have. This explains the giant switch in handleCommand in ModeHandler. I now believe this to be a dumb idea and someone should get rid of it. 

Probably me. :wink:

### The Vim State Machine

It's contained entirely within modeHandler.ts. It's actually pretty complicated, and I probably won't be able to articulate all of the edge cases it contains.

It consists of two data structures:

* VimState - this is the state of Vim. It's what actions update. 
* RecordedState - this is temporary state that will reset at the end of a change. (RecordedState is a poor name for this; I've been going back and forth on different names).

#### How it works

1. `handleKeyEventHelper` is called with the most recent keypress. 
2. `Actions.getRelevantAction` determines if all the keys pressed so far uniquely specify any action in actions.ts. If not, we continue waiting for keypresses.
3. `runAction` runs the action that was matched. Movements, Commands and Operators all have separate functions that dictate how to run them - `executeMovement`, `handleCommand`, and `executeOperator` respectively. 
4. Now that we've updated VimState, we run `updateView` with the new VimState to "redraw" VSCode to the new state.

#### vscode.window.onDidChangeTextEditorSelection

This is my hack to simulate a click event based API in an IDE that doesn't have them (yet?). I check the selection that just came in to see if it's the same as what I thought I previously set the selection to the last time the state machine updated. If it's not, the user *probably* clicked. (But she also could have tab completed!)

## Troubleshooting 

### Visual Studio Code Slowdown

If your autocomplete, your fuzzy file search, or your _everything_ is suddenly running slower, try to recall if you ever ran `npm test` instead of just running tests through Visual Studio Code. This will add a massive folder called `.vscode-test/` to your project, which Visual Studio Code will happily consume all of your CPU cycles indexing. 

Long story short, you can speed up VSC by doing this:

`$ rm -rf .vscode-test/`

## Styleguides

We are adhering to VSCode's [coding guidelines](https://github.com/Microsoft/vscode/wiki/Coding-Guidelines).
