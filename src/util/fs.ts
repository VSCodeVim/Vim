import * as vscode from 'vscode';

export async function exists(path: string): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(vscode.Uri.parse(path));
    return true;
  } catch (_e) {
    return false;
  }
}

export async function unlink(path): Promise<void> {
  await vscode.workspace.fs.delete(vscode.Uri.parse(path));
}

export async function readFile(path: string, encoding: string): Promise<string> {
  await vscode.workspace.fs.readFile(vscode.Uri.parse(path));
  return '';
}

export async function mkdir(path: string, options: any): Promise<void> {
  await vscode.workspace.fs.createDirectory(vscode.Uri.parse(path));
  return;
}

export async function writeFile(path: string, content: string, encoding: string): Promise<void> {
  await vscode.workspace.fs.writeFile(vscode.Uri.parse(path), Buffer.from(content));
  return;
}

