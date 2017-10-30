import * as vscode from 'vscode';
import { Vim } from '../extension';
import { NvUtil } from './nvUtil';
import { VimSettings } from './vimSettings';
import * as fs from 'fs';

export class RpcRequest {
  static rpcFunctions: { [method: string]: Function } = {};

  static async enterBuf(args: any, resp: any) {
    const filePath = args[1] as string;
    const fileURI = vscode.Uri.file(filePath);
    console.log(filePath);
    if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
      await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(filePath));
      await NvUtil.changeSelectionFromMode(Vim.mode.mode);
    } else {
      console.log('Opening non-existing files currently not implemented (and not working well).');
      // await vscode.window.showTextDocument(t);
      // console.log(t);
    }
    resp.send('success');
  }

  static async newTabEntered(_: any, resp: any) {
    await Vim.nv.command('tabonly');
    await resp.send('success');
  }

  static async writeBuf(args: Array<any>, resp: any) {
    const filePath = vscode.Uri.file(args[1]);
    await vscode.commands.executeCommand('workbench.action.files.save', filePath);
    // nvim.command('e!');
    await resp.send('success');
  }

  static async closeBuf(args: Array<string>, resp: any) {
    const bufName = args[1];
    const filePath = vscode.Uri.file(bufName);
    console.log('filepath: ', filePath);
    if (args[1] !== vscode.window.activeTextEditor!.document.fileName) {
      await vscode.commands.executeCommand('vscode.open', filePath);
    }
    if (args[1] !== vscode.window.activeTextEditor!.document.fileName) {
      resp.send('failure');
      return;
    }
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    resp.send('success');
  }

  static async goToDefinition(args: Array<any>, resp: any) {
    await Vim.nv.command("normal! m'");
    await vscode.commands.executeCommand('editor.action.goToDeclaration');
    await NvUtil.setCursorPos(vscode.window.activeTextEditor!.selection.active);
    resp.send('success');
  }
}
