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
<body>
  <pre>
            VsCodeVim - Main Help

      This is the main help file for the Vim emulator for Visual Studio Code.
      You can find more information at: <a href="https://github.com/VSCodeVim/Vim" target="_blank">https://github.com/VSCodeVim/Vim</a>
									 k
      Move around:  Use the cursor keys, or "h" to go left,	       h   l
		    "j" to go down, "k" to go up, "l" to go right.	 j
      Close this window:  Use ":q &lt;ESC&gt; ".

     Modes:
        Normal mode:    Press &lt;ESC&gt; to enter. Navigate and run commands.
        Insert mode:    Press "i" to insert text. Press &lt;ESC&gt; to return to Normal mode.
        Visual mode:    Press "v" to select text. Use movement keys to expand the selection.

      Basic Commands:
        :q        Quit
        :w        Save
        :wq       Save and quit
        :qa!      Quit all without saving

      Editing:
        dd        Delete line
        yy        Yank (copy) line
        p         Paste below
        u         Undo
        Ctrl+r    Redo
        x         Delete character under cursor
        r&lt;char&gt;   Replace character under cursor
        cw        Change word
        ci&quot;       Change inside quotes
        caw       Change a word (including whitespace)
        .         Repeat last change

      Navigation:
        gg        Go to the first line
        G         Go to the last line
        0         Go to the start of the line
        $         Go to the end of the line
        w         Jump to the start of the next word
        b         Jump to the start of the previous word
        Ctrl+d    Scroll down half a page
        Ctrl+u    Scroll up half a page

      Visual Mode:
        v         Start visual mode (characterwise)
        V         Start visual line mode
        Ctrl+v    Start visual block mode

      Registers &amp; Macros:
        &quot;*p       Paste from system clipboard
        q&lt;letter&gt;  Start recording a macro
        @&lt;letter&gt;  Play macro

      Buffers &amp; Tabs:
        :bn       Next buffer
        :bp       Previous buffer
        :bd       Delete buffer
        :tabnew   Open new tab
        gt        Next tab
        gT        Previous tab

      Search:
        /pattern  Search forward for a pattern
        ?pattern  Search backward for a pattern
        n         Repeat search in the same direction
        N         Repeat search in the opposite direction
        :noh      Clear search highlighting

      Miscellaneous:
        :%s/old/new/g             Replace all occurrences in file
        :set number               Show line numbers
        :set relativenumber       Show relative line numbers
        :help &lt;command&gt;           Show help for a command

      Note:
        You can replace or customize most keybinds.
        For instructions, see: https://github.com/VSCodeVim/Vim#Settings

      For more help, see the <a href="https://github.com/VSCodeVim/Vim" target="_blank">project repository</a> or the <a href="https://vimhelp.org/" target="_blank">official Vim guide</a>.
      </pre>
</body>
</html>
    `;
  }
}
