import { ExCommand } from '../../vimscript/exCommand';
import { VimState } from '../../state/vimState';
import { window, ViewColumn } from 'vscode';

export class HelpCommand extends ExCommand {
  async execute(_vimState: VimState): Promise<void> {
    const panel = window.createWebviewPanel('vimHelp', 'Help Vim', ViewColumn.Active, {
      enableScripts: false,
    });

    panel.webview.html = `
      <html>
        <body style="font-family: sans-serif; padding: 2em;">
          <h2>Vim Help for VSCode</h2>
          <b>Basic Commands:</b><br>
          <code>:w</code> Save file<br>
          <code>:q</code> Quit editor<br>
          <code>:wq</code> Save and quit<br>
          <code>:help</code> Show this help<br>
          <br>
          <b>Movement:</b><br>
          <code>h, j, k, l</code> Move cursor<br>
          <code>gg</code> Go to start of file<br>
          <code>G</code> Go to end of file<br>
          <br>
          And much more! See the documentation for details.
        </body>
      </html>
    `;
  }
}
