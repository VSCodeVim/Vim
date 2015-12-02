**You want to help? Awesome!**

VSCode is really easy to create extensions for. You can find out everything you need to know from
[Extending Visual Studio Code](https://code.visualstudio.com/docs/extensions/overview) on the VSCode
website. The debugging experience is pretty cool, BTW.

## How to be a Really Useful Contributor:**

Vim has, like, hundreds of commands, shortcuts, modes and stuff that can be added to VSCode/Vim.
It's an *embarrassingly-parallel* development project: lots of people working on lots of different
features at the same time.

Of course, you don't want to be working on something that is already done, or that somebody else
has nearly finished.

### You will need

1. The latest version of [VSCode](https://code.visualstudio.com/), obviously.
1. Node.js installed on your development machine.
1. The NPM packages `gulp` and `tsd` installed globally:
  * `npm install -g gulp tsd`
  * Remember `sudo` if you're on Linux :smile:

### Before you start

1. Familiarize yourself with the existing code, so you know how things are done and what useful utility functions or classes might already exist.
1. Search through Issues and Pull Requests to see if anyone else is doing what you're planning to do.
  * If somebody is, maybe ask if they could use any help.
1. If you find no mention of the feature you want to add, then open an Issue describing the feature and saying you're working on it.

### When you start
1. Fork the repo and clone from your fork.
  * If you already have a fork, make sure you've added the VSCodeVim/Vim repo as an upstream remote:
    * `git remote add upstream git@github.com:VSCodeVim/Vim.git`
    * Then `git pull upstream master`
1. Run `npm install` to install the development dependencies.
1. Run `gulp init` to run any other prep jobs.
1. `git checkout -b sensible-feature-branch-name`
1. Hack on your feature and get it working.
  * If any of the code is testable, add tests for it.
1. Commit, push and create a Pull Request.
1. Engage in a friendly and polite manner with any feedback on your PR.

### Extra tips
1. You might add a bunch of `console.log("Work, you ******")` calls while working on your feature. You should probably remove these before opening a Pull Request.
2. You might find that the VSCode Extensions API doesn't provide the functionality you need to make a feature work. If that happens, try heading to the [VSCode Issues](https://github.com/microsoft/vscode/issues) page and asking nicely if anyone knows of a way to do whatever it is, and if not, whether perhaps the necessary extension point might be added.
