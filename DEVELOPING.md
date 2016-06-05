You're thinking about adding a feature to VSCodeVim? That's awesome! Here's a basic guide to get you started. Feel free to drop by [our slack channel](https://vscodevim.slack.com/messages/general/) if you want to ask us questions directly.

### First time setup

1. Clone the repository: `git clone https://github.com/VSCodeVim/Vim.git`
2. `cd Vim`
3. Install the dependencies: `npm install`
4. You probably want to install Typescript globally: `npm install typescript -g`

### Developing

1. Watch for changes and recompile Typescript files. Run this in the `Vim` directory: `tsc --watch`
2. Open up Visual Studio code and add the `Vim` directory as a folder. 
3. Click on the debugger. You now have two options - Launch Extension (to play around with the extension) and Launch Tests (to run the tests). 

### Submitting a PR

1. Run all the tests and ensure they pass.
2. If you added a new feature, add at least one more test to test it.
3. If you've fixed a bug, add at least one test to ensure the bug stays away.
4. Submit the PR. Pour yourself a glass of champagne and feel good about making contributing to open source!
