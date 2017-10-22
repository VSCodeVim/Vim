import * as vscode from 'vscode';
import { Vim } from '../extension';
import { NvUtil } from './nvUtil';

export class RpcRequest {
  static rpcFunctions: { [method: string]: Function } = {};

  static async openBuf(args: any, resp: any) {
    const filePath = vscode.Uri.file(args[1]);
    console.log(filePath);
    await vscode.commands.executeCommand('vscode.open', filePath);
    resp.send('success');
  }

  static async writeBuf(args: Array<any>, resp: any) {
    const filePath = vscode.Uri.file(args[1]);
    await vscode.commands.executeCommand('workbench.action.files.save', filePath);
    // nvim.command('e!');
    await resp.send('success');
  }

  static async closeBuf(args: Array<any>, resp: any) {
    const buffers = await Vim.nv.buffers;
    const bufId = parseInt(args[0], 10) - 1;
    console.log('buffers and args');
    console.log(buffers, args);
    if (bufId >= buffers.length || bufId < 0) {
      resp.send("buffer doesn't exist");
      return;
    }
    const filePath = vscode.Uri.file(await buffers[bufId].name);
    console.log('filepath: ', filePath);
    if (args[1] !== vscode.window.activeTextEditor!.document.fileName) {
      await vscode.commands.executeCommand('vscode.open', filePath);
    }
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    resp.send('success');
  }

  static async goToDefinition(args: Array<any>, resp: any) {
    await vscode.commands.executeCommand('editor.action.goToDeclaration');
    await Vim.nv.command("normal! m'");
    await NvUtil.setCursorPos(vscode.window.activeTextEditor!.selection.active);
    resp.send('success');
  }

  static async leaveInsert(args: Array<any>, resp: any) {
    console.log('HEY');
    resp.send('success');
    const mode = await Vim.nv.mode;
    Vim.mode = mode;
    await NvUtil.changeSelectionFromMode(mode.mode);
    await NvUtil.copyTextFromNeovim();
  }
}
