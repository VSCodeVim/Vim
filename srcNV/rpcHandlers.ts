import * as vscode from 'vscode';
import { Vim } from '../extension';
import { NvUtil } from './nvUtil';

function RpcRequestDecorator(nvMethodName: string) {
  return (f: Function, vsMethodName: string) => {
    RpcRequest.rpcFunctions[nvMethodName] = f;
  };
}
export class RpcRequest {
  static rpcFunctions: { [method: string]: Function } = {};

  @RpcRequestDecorator('openBuf')
  static async openBuf(args: any, resp: any) {
    const filePath = vscode.Uri.file(args[1]);
    console.log(filePath);
    await vscode.commands.executeCommand('vscode.open', filePath);
    resp.send('success');
  }

  @RpcRequestDecorator('tab')
  static async tab(args: Array<any>, resp: any) {
    let result: Promise<vscode.TextDocumentContentChangeEvent> = new Promise((resolve, reject) => {
      let handler = vscode.workspace.onDidChangeTextDocument(e => {
        console.log(e);
        handler.dispose();
        resolve(e.contentChanges[0]);
      });
    });
    vscode.commands.executeCommand('acceptSelectedSuggestion');
    vscode.commands.executeCommand('tab');
    if ((await result).rangeLength > 0) {
      // Todo: This is double plus not good
      await Vim.nv.command(`normal! ${'x'.repeat((await result).rangeLength)}`);
    }
    await resp.send((await result).text);
    NvUtil.copyTextFromNeovim();
  }

  @RpcRequestDecorator('writeBuf')
  static async writeBuf(args: Array<any>, resp: any) {
    const filePath = vscode.Uri.file(args[1]);
    await vscode.commands.executeCommand('workbench.action.files.save', filePath);
    // nvim.command('e!');
    await resp.send('success');
  }

  @RpcRequestDecorator('closeTab')
  static async closeTab(args: Array<any>, resp: any) {
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

  @RpcRequestDecorator('goToDefinition')
  static async goToDefinition(args: Array<any>, resp: any) {
    await vscode.commands.executeCommand('editor.action.goToDeclaration');
    await Vim.nv.command("normal! m'");
    await NvUtil.setCursorPos(vscode.window.activeTextEditor!.selection.active);
    resp.send('success');
  }
}
