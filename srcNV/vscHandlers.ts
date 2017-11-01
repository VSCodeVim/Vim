import { NvUtil } from './nvUtil';
import { Vim } from '../extension';
import { Position } from '../src/common/motion/position';
import * as vscode from 'vscode';
import { TextEditor } from '../src/textEditor';
import { VimSettings } from './vimSettings';

export class VscHandlers {
  // tslint:disable-next-line:no-unused-variable
  static async handleSimple(key: string) {
    await Vim.nv.input(key);
  }

  static async handleKeyEventNV(key: string) {
    const prevMode = Vim.mode.mode;
    const prevBlocking = Vim.mode.blocking;
    async function input(k: string) {
      await Vim.nv.input(k === '<' ? '<lt>' : k);
      await NvUtil.updateMode();
      if (Vim.mode.mode === 'r') {
        await Vim.nv.input('<CR>');
      }
      // Optimization that makes movement very smooth. However, occasionally
      // makes it more difficult to debug so it's turned off for now.
      // const curTick = await Vim.nv.buffer.changedtick;
      // if (curTick === Vim.prevState.bufferTick) {
      //   await NvUtil.changeSelectionFromMode(Vim.mode.mode);
      //   return;
      // }
      // Vim.prevState.bufferTick = curTick;

      const curPos = await NvUtil.getCursorPos();
      const startPos = await NvUtil.getSelectionStartPos();
      const curWant = await NvUtil.getCurWant();
      NvUtil.changeSelectionFromModeSync(Vim.mode.mode, curPos, startPos, curWant);
      await NvUtil.copyTextFromNeovim();
      NvUtil.changeSelectionFromModeSync(Vim.mode.mode, curPos, startPos, curWant);
    }
    if (prevMode !== 'i') {
      await input(key);
    } else {
      if (key.length > 1) {
        await input(key);
      } else {
        await vscode.commands.executeCommand('default:type', { text: key });
      }
    }

    await vscode.commands.executeCommand('setContext', 'vim.mode', Vim.mode.mode);
  }

  static async handleTextDocumentChange(e: vscode.TextDocumentChangeEvent) {
    if (e.contentChanges.length === 0) {
      return;
    }
    const change = e.contentChanges[0];
    const changeBegin = Position.FromVSCodePosition(change.range.start);
    const changeEnd = Position.FromVSCodePosition(change.range.end);
    const curPos = Position.FromVSCodePosition(vscode.window.activeTextEditor!.selection.active);
    const curSel = vscode.window.activeTextEditor!.selection;
    const docEnd = new Position(0, 0).getDocumentEnd();
    // This ugly if statement is to differentiate the "real" vscode changes that
    // should be included in dot repeat(like autocomplete, auto-close parens,
    // all regular typing, etc.) from the vscode changes that should not be
    // included (the entire buffer syncing, autoformatting, etc.)

    const isInsertModeChange = () => {
      if (e.contentChanges.length > 1 || vscode.window.activeTextEditor!.selections.length > 1) {
        return false;
      }
      if (Vim.mode.mode !== 'i') {
        return false;
      }
      // Handles the case where we press backsapce at the beginning of a line.
      if (change.text === '' && changeEnd.character === 0 && change.rangeLength === 1) {
        return true;
      }
      // If the change is spanning multiple lines then it's almost definitely
      // not an insert mode change (except for a couple of special cases.)
      if (!(changeBegin.line === curPos.line && changeBegin.line === changeEnd.line)) {
        return false;
      }
      // Mainly for mouse cursor selection/multicursor stuff.
      if (
        curSel.active.line !== curSel.anchor.line ||
        curSel.active.character !== curSel.anchor.character
      ) {
        return false;
      }
      // Tries to handle the case about editing on the first line.
      if (changeBegin.line === 0 && changeBegin.character === 0 && change.rangeLength !== 0) {
        if (change.text[change.text.length - 1] === '\n') {
          return false;
        } else if (TextEditor.getLineCount() === 1) {
          return false;
        }
      }
      return true;
    };
    await NvUtil.updateMode();
    if (isInsertModeChange()) {
      if (!Vim.mode.blocking) {
        const nvPos = await NvUtil.getCursorPos();
        if (nvPos.line !== curPos.line) {
          await NvUtil.setCursorPos(curPos);
        } else {
          // Is necessary for parentheses autocompletion but causes issues
          // when non-atomic with fast text.
          await NvUtil.ctrlGMove(nvPos.character, changeEnd.character);
        }
      }
      await Vim.nv.input('<BS>'.repeat(change.rangeLength));
      await Vim.nv.input(change.text);
    } else {
      // Should handle race conditions. If we have more than one Vim copy to
      // VSCode that we haven't processed, then we don't copy back to neovim.
      // NVM. This doesn't actually work as is.
      Vim.numVimChangesToApply--;
      if (Vim.numVimChangesToApply !== 0) {
        return;
      }
      // todo: Optimize this to only replace relevant lines. Probably not worth
      // doing until diffs come in from the neovim side though, since that's the
      // real blocking factor.
      // todo(chilli):  Tests if change is a change that replaces the entire text (ie: the copy
      // from neovim buffer to vscode buffer). It's a hack. Won't work if your
      // change (refactor) for example, doesn't modify the length of the file
      const isRealChange = change.text.length !== change.rangeLength;
      if (isRealChange || true) {
        // todo(chilli): Doesn't work if there was just an undo command (undojoin
        // fails and prevents the following command from executing)

        const startTime = new Date().getTime();
        const newPos = vscode.window.activeTextEditor!.selection.active;
        let t = await Vim.nv.lua('return _vscode_copy_text(...)', [
          TextEditor.getText().split('\n'),
          newPos.line + 1,
          newPos.character + 1,
        ]);
        console.log(`timeTaken: ${new Date().getTime() - startTime}`);
        // const newPos = vscode.window.activeTextEditor!.selection.active;
        // await nvim.command('undojoin');
        // await nvim.buffer.setLines(TextEditor.getText().split('\n'), {
        //   start: 0,
        //   end: -1,
        //   strictIndexing: false,
        // });
        // await NvUtil.setCursorPos(newPos);
      }
    }
  }

  static async handleActiveTextEditorChange() {
    if (vscode.window.activeTextEditor === undefined) {
      return;
    }
    const active_editor_file = vscode.window.activeTextEditor!.document.fileName;
    await Vim.nv.command(`edit! ${active_editor_file}`);
    await NvUtil.copyTextFromNeovim();
    await NvUtil.setCursorPos(vscode.window.activeTextEditor!.selection.active);
    await NvUtil.setSettings(await VimSettings.enterFileSettings());
    await NvUtil.changeSelectionFromMode(Vim.mode.mode);
  }
}
